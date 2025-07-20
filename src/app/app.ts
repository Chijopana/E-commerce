import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common'; // IMPORTANTE para *ngIf

import { Products } from './products/products';
import { Cart } from './cart/cart';
import { Checkout } from './checkout/checkout';
import { Home } from './home/home';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, Home, Products, Cart, Checkout],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  currentView: 'home' | 'products' | 'cart' | 'checkout' = 'home';

  constructor() {
    // Escuchar evento para navegar desde home
    window.addEventListener('navigate', (e: any) => {
      if (e.detail) {
        this.setView(e.detail);
      }
    });
  }

  setView(view: 'home' | 'products' | 'cart' | 'checkout') {
    this.currentView = view;
  }
}
