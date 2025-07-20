import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, CurrencyPipe],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class Products {
  products = [
    {
      id: 1,
      name: 'Auriculares Inalámbricos',
      price: 49.99,
      image: 'https://via.placeholder.com/200x150',
      description: 'Auriculares con cancelación de ruido y batería de larga duración.',
      stock: 12,
    },
    {
      id: 2,
      name: 'Smartwatch Deportivo',
      price: 89.99,
      image: 'https://via.placeholder.com/200x150',
      description: 'Monitoriza tu salud y actividad física durante todo el día.',
      stock: 7,
    },
    {
      id: 3,
      name: 'Mochila Antirrobo',
      price: 39.99,
      image: 'https://via.placeholder.com/200x150',
      description: 'Diseño moderno con compartimentos secretos y USB incorporado.',
      stock: 4,
    },
    {
      id: 4,
      name: 'Altavoz Bluetooth',
      price: 29.99,
      image: 'https://via.placeholder.com/200x150',
      description: 'Gran calidad de sonido y resistente al agua.',
      stock: 10,
    },
  ];

  constructor(private cartService: CartService) {}

  addToCart(product: any) {
    if(product.stock <= 0){
      alert('Producto agotado');
      return;
    }
    this.cartService.addToCart(product);
    alert(`Añadido al carrito: ${product.name}`);
  }
}
