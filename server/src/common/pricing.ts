import { percentOf } from './money';

/**
 * Reglas de precio de la tienda. Esta copia es la que MANDA.
 *
 * El frontend tiene las mismas reglas para pintar el resumen del carrito, pero
 * eso es solo una previsualización: al crear un pedido el servidor recalcula
 * todo desde cero a partir de los precios de la base de datos. Confiar en el
 * total que envía el cliente es el fallo clásico que permite comprar por 0.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 10_000; // 100.00
export const STANDARD_SHIPPING_CENTS = 999; // 9.99

export interface OrderTotals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

/**
 * El descuento se aplica ANTES de decidir el envío, que es lo que espera quien
 * ve el total con el cupón ya puesto.
 */
export function calculateTotals(subtotalCents: number, discountPercent = 0): OrderTotals {
  const discountCents = percentOf(subtotalCents, discountPercent);
  const afterDiscount = subtotalCents - discountCents;

  const freeShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS || afterDiscount === 0;
  const shippingCents = freeShipping ? 0 : STANDARD_SHIPPING_CENTS;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
  };
}
