import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class Cart {
  cartItems = [
    { id: 1, name: 'Producto 1', price: 49.99, quantity: 2, image: 'https://via.placeholder.com/100' },
    { id: 2, name: 'Producto 2', price: 79.99, quantity: 1, image: 'https://via.placeholder.com/100' },
  ];

  removeItem(id: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== id);
  }

  clearCart() {
    this.cartItems = [];
  }

  get total() {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }
}
