import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    CurrencyPipe,
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout {
  form: FormGroup;

  cartItems = [
    { id: 1, name: 'Producto 1', price: 49.99, quantity: 2 },
    { id: 2, name: 'Producto 2', price: 79.99, quantity: 1 },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      paymentMethod: ['card', Validators.required],
    });
  }

  get total() {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  submitOrder() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const orderData = {
      customer: this.form.value,
      items: this.cartItems,
      total: this.total,
    };

    console.log('Pedido enviado:', orderData);
    alert('¡Pedido completado con éxito!');
  }
}
