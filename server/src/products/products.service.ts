import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toCents, toUnits } from '../common/money';
import { CreateReviewDto, ProductSort, QueryProductsDto } from './dto/products.dto';

export interface ReviewView {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface ProductView {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  rating: number;
  reviews: ReviewView[];
}

export interface PagedProducts {
  items: ProductView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ProductWithReviews = Prisma.ProductGetPayload<{
  include: { reviews: { include: { user: { select: { id: true; name: true } } } } };
}>;

const DEFAULT_LIMIT = 24;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto): Promise<PagedProducts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const where = this.buildWhere(query);

    // Las dos consultas van juntas: el total tiene que corresponder al mismo
    // filtro que la página, o el paginador miente.
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: this.buildOrderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    return {
      items: products.map(p => this.toView(p)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: number): Promise<ProductView> {
    const product = await this.prisma.product.findFirst({
      where: { id, active: true },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`No existe el producto ${id}`);
    }

    return this.toView(product);
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: { active: true },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });

    return rows.map(r => r.category);
  }

  /**
   * Añade o actualiza la reseña de una persona sobre un producto.
   *
   * Todo va en una transacción porque la media denormalizada del producto
   * (`ratingAvg` / `ratingCount`) tiene que quedar consistente con la tabla de
   * reseñas incluso si dos peticiones entran a la vez.
   */
  async addReview(productId: number, userId: number, dto: CreateReviewDto): Promise<ProductView> {
    const exists = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`No existe el producto ${productId}`);
    }

    await this.prisma.$transaction(async tx => {
      // `upsert`: reseñar dos veces actualiza la opinión en vez de fallar con
      // un error de clave única, que es lo que el usuario espera.
      await tx.review.upsert({
        where: { productId_userId: { productId, userId } },
        create: { productId, userId, rating: dto.rating, comment: dto.comment },
        update: { rating: dto.rating, comment: dto.comment },
      });

      const stats = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          ratingAvg: Math.round((stats._avg.rating ?? 0) * 10) / 10,
          ratingCount: stats._count,
        },
      });
    });

    return this.findOne(productId);
  }

  // ------------------------------------------------------------------ filtros

  private buildWhere(query: QueryProductsDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { active: true };

    if (query.category) {
      where.category = query.category;
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { description: { contains: query.q } },
        { category: { contains: query.q } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.priceCents = {
        ...(query.minPrice !== undefined ? { gte: toCents(query.minPrice) } : {}),
        ...(query.maxPrice !== undefined ? { lte: toCents(query.maxPrice) } : {}),
      };
    }

    if (query.minRating !== undefined) {
      where.ratingAvg = { gte: query.minRating };
    }

    return where;
  }

  private buildOrderBy(sort?: ProductSort): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price-asc':
        return { priceCents: 'asc' };
      case 'price-desc':
        return { priceCents: 'desc' };
      case 'rating':
        return { ratingAvg: 'desc' };
      case 'name':
        return { name: 'asc' };
      default:
        return { id: 'asc' };
    }
  }

  /** Traduce la fila de base de datos a la forma que consume el frontend. */
  private toView(product: ProductWithReviews): ProductView {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: toUnits(product.priceCents),
      image: product.image,
      stock: product.stock,
      category: product.category,
      rating: product.ratingAvg,
      reviews: product.reviews.map(review => ({
        id: review.id,
        userId: review.userId,
        userName: review.user.name,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt,
      })),
    };
  }
}
