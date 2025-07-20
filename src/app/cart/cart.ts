import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService, CartItem } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class Cart {
  @Input() setCurrentView: (view: 'home' | 'products' | 'cart' | 'checkout') => void = () => {};

  cartItems: CartItem[] = [];

  constructor(private cartService: CartService) {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
    });
  }

  increaseQuantity(item: CartItem) {
    this.cartService.addToCart(item);
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.id);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  getTotal(): number {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  goToCheckout() {
    if (this.setCurrentView) {
      this.setCurrentView('checkout');
    }
  }

  updateQuantity(id: number, quantity: number) {
    const item = this.cartItems.find(i => i.id === id);
    if (!item) return;

    if (quantity <= 0) {
      this.removeItem(item);
    } else {
      this.cartService.updateQuantity(id, quantity);
    }
  }
}
