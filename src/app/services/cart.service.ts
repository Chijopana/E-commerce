import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, CartState } from '../models/cart.model';
import { calculateTotals, round2 } from '../models/pricing';

/**
 * Resultado de intentar añadir al carrito.
 * Antes `addToCart` hacía `return` en seco al topar con el stock: el usuario
 * pulsaba "Añadir" y no ocurría absolutamente nada, sin explicación.
 */
export type AddToCartResult =
  | { ok: true; quantity: number }
  | { ok: false; reason: 'out-of-stock' | 'stock-limit'; available: number };

/**
 * Carrito del navegador.
 *
 * Es lo único que sigue viviendo en `localStorage`, y a propósito: un carrito
 * sin confirmar no es todavía un dato del negocio, y guardarlo aquí permite
 * llenarlo sin cuenta y conservarlo al recargar.
 *
 * Los importes que calcula son una PREVISUALIZACIÓN. Al confirmar el pedido, el
 * servidor recalcula precio, descuento y envío desde la base de datos y vuelve
 * a comprobar el stock; si algo ha cambiado entre medias, manda él.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'ecommerce_cart';

  private cartStateSubject = new BehaviorSubject<CartState>(this.emptyState());

  public cartState$ = this.cartStateSubject.asObservable();
  /** Alias histórico; se mantiene para no romper llamadas existentes. */
  public cart$ = this.cartState$;

  constructor() {
    this.loadCart();
  }

  // ------------------------------------------------------------------ estado

  private emptyState(): CartState {
    return {
      items: [],
      total: 0,
      itemCount: 0,
      subtotal: 0,
      shippingCost: 0,
      amountToFreeShipping: 0,
    };
  }

  private loadCart(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error('formato inesperado');

      const items = parsed.filter(
        (item: CartItem) =>
          item &&
          typeof item.id === 'number' &&
          typeof item.price === 'number' &&
          item.quantity > 0,
      );

      this.updateCartState(items);
    } catch (error) {
      console.error('Carrito guardado ilegible, se descarta:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin persistencia el carrito sigue vivo en memoria durante la sesión.
    }
    this.updateCartState(items);
  }

  private updateCartState(items: CartItem[]): void {
    const subtotal = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totals = calculateTotals(subtotal);

    this.cartStateSubject.next({
      items,
      itemCount,
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      amountToFreeShipping: totals.amountToFreeShipping,
      total: totals.total,
    });
  }

  // ----------------------------------------------------------------- acciones

  addToCart(
    product: { id: number; name: string; price: number; image: string; stock: number },
    quantity = 1,
  ): AddToCartResult {
    if (product.stock <= 0) {
      return { ok: false, reason: 'out-of-stock', available: 0 };
    }

    const currentItems = this.cartStateSubject.value.items;
    const existingItem = currentItems.find(i => i.id === product.id);
    const alreadyInCart = existingItem?.quantity ?? 0;

    if (alreadyInCart >= product.stock) {
      return { ok: false, reason: 'stock-limit', available: product.stock };
    }

    // Nunca se supera el stock conocido: si piden 5 y solo quedan 3, se añaden 3.
    const toAdd = Math.min(quantity, product.stock - alreadyInCart);
    const newQuantity = alreadyInCart + toAdd;

    const newItems = existingItem
      ? currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, stock: product.stock, price: product.price }
            : item,
        )
      : [...currentItems, { ...product, quantity: toAdd }];

    this.saveCart(newItems);
    return { ok: true, quantity: newQuantity };
  }

  updateQuantity(id: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }

    const newItems = this.cartStateSubject.value.items.map(item =>
      item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item,
    );

    this.saveCart(newItems);
  }

  removeFromCart(id: number): void {
    this.saveCart(this.cartStateSubject.value.items.filter(item => item.id !== id));
  }

  clearCart(): void {
    this.saveCart([]);
  }

  /**
   * Refresca precio y stock con los datos frescos del catálogo y descarta lo
   * que se haya agotado. Se llama al abrir el carrito: el precio pudo cambiar
   * desde que se añadió el producto, y cobrar el viejo sería mentir.
   */
  syncWithCatalog(products: { id: number; price: number; stock: number }[]): void {
    const byId = new Map(products.map(p => [p.id, p]));

    const items = this.cartStateSubject.value.items
      .map(item => {
        const fresh = byId.get(item.id);
        // Producto que no viene en la respuesta: se deja como estaba en vez de
        // borrarlo, porque puede que sencillamente no entrara en esa página.
        if (!fresh) return item;
        if (fresh.stock <= 0) return null;

        return {
          ...item,
          price: fresh.price,
          stock: fresh.stock,
          quantity: Math.min(item.quantity, fresh.stock),
        };
      })
      .filter((item): item is CartItem => item !== null);

    this.saveCart(items);
  }

  /** Convierte el carrito en lo que espera la API: qué y cuánto, sin precios. */
  toOrderItems(): { productId: number; quantity: number }[] {
    return this.cartStateSubject.value.items.map(item => ({
      productId: item.id,
      quantity: item.quantity,
    }));
  }

  // ----------------------------------------------------------------- lecturas

  getCartItems(): CartItem[] {
    return this.cartStateSubject.value.items;
  }

  getState(): CartState {
    return this.cartStateSubject.value;
  }

  getTotal(): number {
    return this.cartStateSubject.value.total;
  }

  getItemCount(): number {
    return this.cartStateSubject.value.itemCount;
  }

  isEmpty(): boolean {
    return this.cartStateSubject.value.items.length === 0;
  }
}
