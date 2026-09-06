import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { Order, OrderStatus, PaymentMethod } from '../models/order.model';
import { apiErrorMessage } from '../core/api-error';
import { TranslatePipe } from '../i18n/translate.pipe';
import {
  orderStatusKey,
  orderStatusIcon,
  paymentMethodKey,
  paymentMethodIcon,
} from '../i18n/catalog-labels';

/** Estados desde los que todavía se puede cancelar (el servidor manda). */
const CANCELLABLE: OrderStatus[] = ['PENDING', 'PROCESSING'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    TranslatePipe,
  ],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
})
export class Orders implements OnInit {
  private orderService = inject(OrderService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  /** Fecha localizada según el idioma activo. */
  get locale(): string {
    return this.translation.currentLang();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.loadError.set(false);

    // No se le pasa ningún id: el servidor devuelve los pedidos del dueño del
    // token, así que no hay forma de pedir los de otra persona.
    this.orderService
      .getMyOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: orders => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: () => {
          // La página tiene que salir del estado de carga aunque falle, o se
          // queda con el esqueleto puesto para siempre.
          this.orders.set([]);
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  statusKey(status: OrderStatus): string {
    return orderStatusKey(status);
  }

  statusIcon(status: OrderStatus): string {
    return orderStatusIcon(status);
  }

  paymentKey(method: PaymentMethod): string {
    return paymentMethodKey(method);
  }

  paymentIcon(method: PaymentMethod): string {
    return paymentMethodIcon(method);
  }

  /** Clase CSS del estado; cada una tiene su color en orders.css. */
  statusClass(status: OrderStatus): string {
    return status.toLowerCase();
  }

  isCancellable(order: Order): boolean {
    return CANCELLABLE.includes(order.status);
  }

  itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async cancelOrder(order: Order): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: this.translation.translate('orders.confirm.title'),
      text: this.translation.translate('orders.confirm.text'),
      confirmText: this.translation.translate('orders.cancel'),
      cancelText: this.translation.translate('common.cancel'),
      danger: true,
    });

    if (!confirmed) return;

    this.orderService
      .cancelOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          // Se sustituye solo el pedido afectado en vez de recargar la lista:
          // así los paneles que el usuario tuviera abiertos no se cierran.
          this.orders.update(list => list.map(o => (o.id === updated.id ? updated : o)));
          this.notifications.success(this.translation.translate('orders.toast.cancelled'));
        },
        error: error => {
          this.notifications.error(
            this.translation.translate(apiErrorMessage(error, 'orders.toast.cannotCancel')),
          );
          // El estado real puede haber cambiado por debajo; se recarga.
          this.loadOrders();
        },
      });
  }

  goToProducts(): void {
    void this.router.navigate(['/products']);
  }
}
