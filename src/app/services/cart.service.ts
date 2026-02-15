import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, CartState } from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'ecommerce_cart';
  
  private cartStateSubject = new BehaviorSubject<CartState>({
    items: [],
    total: 0,
    itemCount: 0,
  });

  public cartState$ = this.cartStateSubject.asObservable();
  public cart$ = this.cartStateSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const items: CartItem[] = JSON.parse(saved);
        this.updateCartState(items);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateCartState(items);
  }

  private updateCartState(items: CartItem[]): void {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    this.cartStateSubject.next({
      items,
      total,
      itemCount,
    });
  }

  addToCart(product: { id: number; name: string; price: number; image: string; stock: number }): void {
    const currentItems = this.cartStateSubject.value.items;
    const existingItem = currentItems.find(i => i.id === product.id);
    
    let newItems: CartItem[];
    
    if (existingItem) {
      // Check if we can add more (don't exceed stock)
      if (existingItem.quantity < product.stock) {
        newItems = currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Can't add more, stock limit reached
        return;
      }
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: 1,
      };
      newItems = [...currentItems, newItem];
    }
    
    this.saveCart(newItems);
  }

  updateQuantity(id: number, quantity: number): void {
    const currentItems = this.cartStateSubject.value.items;
    
    if (quantity <= 0) {
      this.removeFromCart(id);
      return;
    }
    
    const newItems = currentItems.map(item =>
      item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item
    );
    
    this.saveCart(newItems);
  }

  removeFromCart(id: number): void {
    const currentItems = this.cartStateSubject.value.items;
    const newItems = currentItems.filter(item => item.id !== id);
    this.saveCart(newItems);
  }

  clearCart(): void {
    this.saveCart([]);
  }

  getCartItems(): CartItem[] {
    return this.cartStateSubject.value.items;
  }

  getTotal(): number {
    return this.cartStateSubject.value.total;
  }

  getItemCount(): number {
    return this.cartStateSubject.value.itemCount;
  }
}
