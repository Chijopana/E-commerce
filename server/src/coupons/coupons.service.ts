import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CouponView {
  code: string;
  discountPercent: number;
}

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca un cupon utilizable. Devuelve `null` en vez de lanzar para que el
   * flujo de pedido pueda decidir que hacer segun el contexto.
   */
  async find(code: string): Promise<CouponView | null> {
    const normalized = code.trim().toUpperCase();

    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });

    if (!coupon || !coupon.active) return null;

    // Caducado.
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return null;

    // Agotado.
    if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) return null;

    return { code: coupon.code, discountPercent: coupon.discountPercent };
  }

  /** Version para el endpoint publico: un codigo invalido es un 404. */
  async validate(code: string): Promise<CouponView> {
    const coupon = await this.find(code);

    if (!coupon) {
      throw new NotFoundException('El código no es válido o ha caducado');
    }

    return coupon;
  }
}
