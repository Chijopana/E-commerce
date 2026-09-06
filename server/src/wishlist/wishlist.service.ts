import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  /**
   * Devuelve solo los identificadores. El frontend ya tiene el catalogo
   * cargado y lo unico que necesita es saber que corazones pintar rellenos;
   * mandar los productos enteros seria repetir datos que ya estan en pantalla.
   */
  async getIds(userId: number): Promise<number[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: { createdAt: 'desc' },
    });

    return items.map(item => item.productId);
  }

  async add(userId: number, productId: number): Promise<number[]> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`No existe el producto ${productId}`);
    }

    // `upsert` en vez de `create`: pulsar dos veces el corazon no debe
    // reventar contra el indice unico.
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return this.getIds(userId);
  }

  async remove(userId: number, productId: number): Promise<number[]> {
    // `deleteMany` no falla si no existe: quitar algo que ya no esta es un
    // resultado correcto, no un error.
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return this.getIds(userId);
  }
}
