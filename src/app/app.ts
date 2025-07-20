import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';  // <-- Importa CommonModule aquí
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Products } from './products/products';
import { Cart } from './cart/cart';
import { Checkout } from './checkout/checkout';
import { Home } from './home/home';  // si tienes componente home

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,            // <-- Esto es clave
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    Products,
    Cart,
    Checkout,
    Home                     // si tienes home
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  currentView: 'home' | 'products' | 'cart' | 'checkout' = 'products';

  setView(view: 'home' | 'products' | 'cart' | 'checkout') {
    this.currentView = view;
  }
}
