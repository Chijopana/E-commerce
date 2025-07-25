import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

import Swal from 'sweetalert2';

import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class Products {
  products = [
  {
    id: 1,
    name: 'Auriculares Inalámbricos',
    price: 49.99,
    image: '/images/auriculares.jpg',
    description: 'Auriculares con cancelación de ruido y batería de larga duración.',
    stock: 12,
  },
  {
    id: 2,
    name: 'Smartwatch Deportivo',
    price: 89.99,
    image: '/images/smartwatch.jpg',
    description: 'Monitoriza tu salud y actividad física durante todo el día.',
    stock: 7,
  },
  {
    id: 3,
    name: 'Mochila Antirrobo',
    price: 39.99,
    image: '/images/mochila.jpg',
    description: 'Diseño moderno con compartimentos secretos y USB incorporado.',
    stock: 4,
  },
  {
    id: 4,
    name: 'Altavoz Bluetooth',
    price: 29.99,
    image: '/images/altavoz.jpg',
    description: 'Gran calidad de sonido y resistente al agua.',
    stock: 0,
  },
]

  constructor(private cartService: CartService) {}

  addToCart(product: any) {
    if (product.stock <= 0) {
      Swal.fire('Oops...', 'Producto agotado', 'error');
      return;
    }
    this.cartService.addToCart(product);
    Swal.fire('Añadido', `Añadido al carrito: ${product.name}`, 'success');
  }
}
