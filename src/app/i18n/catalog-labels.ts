import { OrderStatus, PaymentMethod } from '../models/order.model';

/**
 * Traduce los códigos del dominio a claves de traducción.
 *
 * La API devuelve códigos estables ('PENDING', 'CREDIT_CARD'), no texto. Eso
 * permite traducirlos y, sobre todo, cambiar la etiqueta sin tocar los pedidos
 * ya guardados — que era justo el problema de guardar 'Pendiente' en la base
 * de datos.
 *
 * Las categorías sí son texto libre porque las define el catálogo; se traducen
 * si hay clave y se muestran tal cual si no la hay, para que una categoría
 * nueva en el servidor no salga en pantalla como una clave rota.
 */

const CATEGORY_KEYS: Record<string, string> = {
  'Electrónica': 'category.electronics',
  'Accesorios': 'category.accessories',
  'Deportes': 'category.sports',
  'Hogar': 'category.home',
};

const STATUS_KEYS: Record<OrderStatus, string> = {
  PENDING: 'orderStatus.pending',
  PROCESSING: 'orderStatus.processing',
  SHIPPED: 'orderStatus.shipped',
  DELIVERED: 'orderStatus.delivered',
  CANCELLED: 'orderStatus.cancelled',
};

const PAYMENT_KEYS: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'payment.creditCard',
  DEBIT_CARD: 'payment.debitCard',
  PAYPAL: 'payment.paypal',
  CASH: 'payment.cash',
};

/** Devuelve la clave de traducción, o el propio valor si no hay traducción. */
export function categoryKey(value: string): string {
  return CATEGORY_KEYS[value] ?? value;
}

export function orderStatusKey(value: OrderStatus): string {
  return STATUS_KEYS[value] ?? value;
}

export function paymentMethodKey(value: PaymentMethod): string {
  return PAYMENT_KEYS[value] ?? value;
}

/** Icono de Material para cada método de pago. */
export function paymentMethodIcon(value: PaymentMethod): string {
  switch (value) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return 'credit_card';
    case 'PAYPAL':
      return 'account_balance_wallet';
    case 'CASH':
      return 'payments';
    default:
      return 'payment';
  }
}

/** Icono de Material para cada estado de pedido. */
export function orderStatusIcon(value: OrderStatus): string {
  switch (value) {
    case 'PENDING':
      return 'schedule';
    case 'PROCESSING':
      return 'autorenew';
    case 'SHIPPED':
      return 'local_shipping';
    case 'DELIVERED':
      return 'check_circle';
    case 'CANCELLED':
      return 'cancel';
    default:
      return 'info';
  }
}
