export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  /**
   * Stock conocido al añadir el producto. Es solo una pista para la interfaz
   * (deshabilitar el boton de sumar): la comprobacion que vale es la del
   * servidor al crear el pedido, porque el stock puede cambiar entre medias.
   */
  stock: number;
}

export interface CartState {
  items: CartItem[];
  /** Unidades totales (no lineas): 2 auriculares + 1 mochila = 3. */
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  /** Cuanto falta para el envio gratis (0 si ya se alcanzo). */
  amountToFreeShipping: number;
  total: number;
}
