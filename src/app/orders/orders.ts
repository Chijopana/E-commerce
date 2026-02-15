import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { Order, OrderStatus } from '../models/order.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule
  ],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
})
export class Orders implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    const user = this.authService.getUser();
    if (user) {
      this.orderService.getOrdersByUserId(user.id).subscribe(orders => {
        this.orders = orders;
        this.loading = false;
      });
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'schedule';
      case OrderStatus.PROCESSING:
        return 'sync';
      case OrderStatus.SHIPPED:
        return 'local_shipping';
      case OrderStatus.DELIVERED:
        return 'check_circle';
      case OrderStatus.CANCELLED:
        return 'cancel';
      default:
        return 'info';
    }
  }

  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warn';
      case OrderStatus.PROCESSING:
        return 'primary';
      case OrderStatus.SHIPPED:
        return 'accent';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  }

  cancelOrder(order: Order): void {
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      Swal.fire({
        icon: 'error',
        title: 'No se puede cancelar',
        text: 'Este pedido ya no puede ser cancelado',
      });
      return;
    }

    Swal.fire({
      title: '¿Cancelar pedido?',
      text: '¿Estás seguro de que quieres cancelar este pedido?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderService.cancelOrder(order.id).subscribe(success => {
          if (success) {
            Swal.fire({
              icon: 'success',
              title: 'Pedido cancelado',
              text: 'Tu pedido ha sido cancelado exitosamente',
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadOrders();
          }
        });
      }
    });
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }
}
