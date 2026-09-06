import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { calculateTotals } from '../common/pricing';
import { toUnits } from '../common/money';
import { CreateOrderDto } from './dto/orders.dto';

export interface OrderItemView {
  id: number;
  productId: number | null;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderView {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  createdAt: Date;
  estimatedDelivery: Date;
  items: OrderItemView[];
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

const DELIVERY_DAYS = 7;
const CANCELLABLE: string[] = ['PENDING', 'PROCESSING'];

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private coupons: CouponsService,
  ) {}

  /**
   * Crea un pedido.
   *
   * Todo ocurre dentro de una transacción: leer precios y stock, comprobar
   * disponibilidad, descontar unidades y grabar el pedido. Si algo falla a
   * mitad no queda stock descontado sin pedido, ni pedido sin stock.
   */
  async create(userId: number, dto: CreateOrderDto): Promise<OrderView> {
    // Si el cliente manda el mismo producto en dos líneas, se suman en una.
    const requested = new Map<number, number>();
    for (const item of dto.items) {
      requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
    }

    const coupon = dto.couponCode ? await this.coupons.find(dto.couponCode) : null;

    // Un cupón inválido no se ignora en silencio: el usuario está viendo un
    // total con descuento y tiene que enterarse de que no se aplica.
    if (dto.couponCode && !coupon) {
      throw new BadRequestException('El código de descuento no es válido o ha caducado');
    }

    const order = await this.prisma.$transaction(async tx => {
      const products = await tx.product.findMany({
        where: { id: { in: [...requested.keys()], }, active: true },
      });

      if (products.length !== requested.size) {
        throw new NotFoundException('Algún producto del pedido ya no está disponible');
      }

      // Comprobación de stock antes de tocar nada.
      for (const product of products) {
        const quantity = requested.get(product.id)!;
        if (product.stock < quantity) {
          throw new ConflictException(
            `Solo quedan ${product.stock} unidades de "${product.name}"`,
          );
        }
      }

      // Los precios salen de la base de datos, nunca del cliente.
      const subtotalCents = products.reduce(
        (sum, product) => sum + product.priceCents * requested.get(product.id)!,
        0,
      );

      const totals = calculateTotals(subtotalCents, coupon?.discountPercent ?? 0);

      // Descuento de stock condicionado: el `where` incluye `stock >= cantidad`,
      // así que si otra compra se adelanta entre la comprobación y esta línea,
      // el update afecta a 0 filas y la transacción se deshace en vez de dejar
      // el stock en negativo.
      for (const product of products) {
        const quantity = requested.get(product.id)!;
        const updated = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (updated.count === 0) {
          throw new ConflictException(
            `Se ha agotado el stock de "${product.name}" mientras se procesaba el pedido`,
          );
        }
      }

      if (coupon) {
        await tx.coupon.update({
          where: { code: coupon.code },
          data: { uses: { increment: 1 } },
        });
      }

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + DELIVERY_DAYS);

      return tx.order.create({
        data: {
          id: this.generateOrderId(),
          userId,
          status: 'PENDING',
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          shippingCents: totals.shippingCents,
          totalCents: totals.totalCents,
          couponCode: coupon?.code ?? null,
          paymentMethod: dto.paymentMethod,
          shippingName: dto.shippingInfo.name,
          shippingEmail: dto.shippingInfo.email,
          shippingPhone: dto.shippingInfo.phone,
          shippingAddress: dto.shippingInfo.address,
          shippingCity: dto.shippingInfo.city,
          shippingPostalCode: dto.shippingInfo.postalCode,
          estimatedDelivery,
          items: {
            create: products.map(product => ({
              productId: product.id,
              // Foto del producto: el pedido debe seguir mostrando lo que se
              // cobró aunque el catálogo cambie después.
              name: product.name,
              priceCents: product.priceCents,
              image: product.image,
              quantity: requested.get(product.id)!,
            })),
          },
        },
        include: { items: true },
      });
    });

    return this.toView(order);
  }

  async findAllByUser(userId: number): Promise<OrderView[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return orders.map(order => this.toView(order));
  }

  async findOne(id: string, userId: number): Promise<OrderView> {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });

    // Un pedido ajeno se responde como inexistente, no como prohibido: decir
    // "403" confirmaría que ese identificador existe.
    if (!order || order.userId !== userId) {
      throw new NotFoundException('No existe ese pedido');
    }

    return this.toView(order);
  }

  /** Cancela un pedido propio y devuelve las unidades al catálogo. */
  async cancel(id: string, userId: number): Promise<OrderView> {
    const cancelled = await this.prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });

      if (!order || order.userId !== userId) {
        throw new NotFoundException('No existe ese pedido');
      }

      if (!CANCELLABLE.includes(order.status)) {
        throw new ConflictException('Este pedido ya no se puede cancelar');
      }

      for (const item of order.items) {
        // Las líneas de productos ya retirados del catálogo no devuelven stock.
        if (item.productId === null) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode, uses: { gt: 0 } },
          data: { uses: { decrement: 1 } },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { items: true },
      });
    });

    return this.toView(cancelled);
  }

  /**
   * Identificador legible y no adivinable: la parte aleatoria evita que se
   * puedan enumerar pedidos ajenos probando números consecutivos.
   */
  private generateOrderId(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `ORD-${stamp}-${random}`;
  }

  private toView(order: OrderWithItems): OrderView {
    return {
      id: order.id,
      status: order.status,
      subtotal: toUnits(order.subtotalCents),
      discount: toUnits(order.discountCents),
      shippingCost: toUnits(order.shippingCents),
      total: toUnits(order.totalCents),
      couponCode: order.couponCode,
      paymentMethod: order.paymentMethod,
      shippingInfo: {
        name: order.shippingName,
        email: order.shippingEmail,
        phone: order.shippingPhone,
        address: order.shippingAddress,
        city: order.shippingCity,
        postalCode: order.shippingPostalCode,
      },
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: toUnits(item.priceCents),
        quantity: item.quantity,
        image: item.image,
      })),
    };
  }
}
