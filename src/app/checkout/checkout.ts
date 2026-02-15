import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { CartState } from '../models/cart.model';
import { PaymentMethod } from '../models/order.model';
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
    MatStepperModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout {
  shippingForm: FormGroup;
  paymentForm: FormGroup;
  cartState: CartState = { items: [], total: 0, itemCount: 0 };
  paymentMethods = Object.values(PaymentMethod);

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    // Check if cart is empty
    this.cartService.cartState$.subscribe(state => {
      this.cartState = state;
      if (state.items.length === 0) {
        // Redirect to cart if empty
        this.router.navigate(['/cart']);
      }
    });

    // Get user info if available
    const user = this.authService.getUser();
    
    this.shippingForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(3)]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
    });

    this.paymentForm = this.fb.group({
      paymentMethod: [PaymentMethod.CREDIT_CARD, [Validators.required]],
    });
  }

  submitOrder(): void {
    if (this.shippingForm.invalid || this.paymentForm.invalid) {
      this.shippingForm.markAllAsTouched();
      this.paymentForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    if (this.cartState.items.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Carrito vacío',
        text: 'No hay productos en el carrito',
      });
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'No autenticado',
        text: 'Debes iniciar sesión para completar la compra',
      });
      this.router.navigate(['/auth']);
      return;
    }

    const shippingInfo = this.shippingForm.value;
    const paymentMethod = this.paymentForm.value.paymentMethod;

    this.orderService.createOrder(
      user.id,
      this.cartState.items,
      shippingInfo,
      paymentMethod
    ).subscribe(order => {
      Swal.fire({
        icon: 'success',
        title: '¡Pedido realizado!',
        html: `
          <p>Tu pedido <strong>#${order.id}</strong> ha sido creado exitosamente.</p>
          <p>Recibirás una confirmación por email.</p>
          <p><small>Entrega estimada: ${new Date(order.estimatedDelivery).toLocaleDateString()}</small></p>
        `,
        confirmButtonText: 'Ver mis pedidos',
      }).then(() => {
        this.cartService.clearCart();
        this.router.navigate(['/orders']);
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }
}

