import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../services/cart.service';
import { CartItem, CartState } from '../models/cart.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class Cart {
  cartState: CartState = {
    items: [],
    total: 0,
    itemCount: 0,
  };

  constructor(
    private cartService: CartService,
    private router: Router
  ) {
    this.cartService.cartState$.subscribe(state => {
      this.cartState = state;
    });
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity < item.stock) {
      this.cartService.updateQuantity(item.id, item.quantity + 1);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${item.stock} unidades disponibles`,
        timer: 2000,
      });
    }
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: CartItem): void {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Quieres eliminar ${item.name} del carrito?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(item.id);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Producto eliminado del carrito',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  clearCart(): void {
    Swal.fire({
      title: '¿Vaciar carrito?',
      text: '¿Estás seguro de que quieres vaciar todo el carrito?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.clearCart();
        Swal.fire({
          icon: 'success',
          title: 'Carrito vaciado',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
