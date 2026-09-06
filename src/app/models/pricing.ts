/**
 * Reglas de precio de la tienda, en un solo sitio.
 *
 * Antes esto estaba repartido: la home prometía "envío gratis en compras
 * mayores a $100", pero el carrito y el checkout mostraban "GRATIS" siempre y
 * el pedido guardado nunca incluía gastos de envío. Un único módulo evita que
 * la promesa comercial y el cobro vuelvan a divergir.
 */

/** A partir de este subtotal (tras descuento) el envío es gratis. */
export const FREE_SHIPPING_THRESHOLD = 100;

/** Coste de envío estándar cuando no se alcanza el umbral. */
export const STANDARD_SHIPPING_COST = 9.99;

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  /** Cuánto falta para el envío gratis (0 si ya se alcanzó). */
  amountToFreeShipping: number;
}

/**
 * Calcula el desglose completo del pedido.
 * El descuento se aplica antes de decidir el envío, que es lo que espera el
 * usuario al ver el total con el cupón ya puesto.
 */
export function calculateTotals(subtotal: number, discountPercent = 0): OrderTotals {
  const discount = round2(subtotal * (discountPercent / 100));
  const afterDiscount = round2(subtotal - discount);

  const freeShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD || afterDiscount === 0;
  const shippingCost = freeShipping ? 0 : STANDARD_SHIPPING_COST;

  return {
    subtotal: round2(subtotal),
    discount,
    shippingCost,
    total: round2(afterDiscount + shippingCost),
    amountToFreeShipping: freeShipping ? 0 : round2(FREE_SHIPPING_THRESHOLD - afterDiscount),
  };
}

/** Redondeo a céntimos: evita totales tipo 129.99000000000001. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
