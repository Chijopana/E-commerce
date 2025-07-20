import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { CurrencyPipe } from '@angular/common';
import { CartService, CartItem } from '../services/cart.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    CurrencyPipe
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout {
  form: FormGroup;
  cartItems: CartItem[] = [];

  constructor(private fb: FormBuilder, private cartService: CartService) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      metodoPago: ['', Validators.required],
    });

    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
    });
  }

  get total(): number {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  submitOrder() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    Swal.fire({
      icon: 'success',
      title: '¡Pedido realizado!',
      text: 'Gracias por tu compra. Pronto recibirás tu pedido.',
    });

    this.cartService.clearCart();
    this.form.reset();
  }
}
