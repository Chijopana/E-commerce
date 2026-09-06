/**
 * Estados y metodos de pago viajan como CODIGOS, no como texto en español.
 *
 * Antes el enum guardaba 'Pendiente' o 'Tarjeta de Credito' y eso mismo era lo
 * que se escribia en el pedido: imposible de traducir e imposible de cambiar
 * sin romper el historial. Ahora el codigo es estable y la etiqueta se resuelve
 * al pintarla (ver i18n/catalog-labels.ts).
 */
export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'CASH'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface OrderItem {
  id: number;
  /** `null` si el producto se retiro del catalogo despues de la compra. */
  productId: number | null;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCost: number;
  total: number;
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
  /** ISO 8601 tal y como llega de la API; DatePipe lo entiende. */
  createdAt: string;
  estimatedDelivery: string;
  items: OrderItem[];
}

/** Lo que se envia al crear un pedido: ni precios ni totales. */
export interface CreateOrderRequest {
  items: { productId: number; quantity: number }[];
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}
