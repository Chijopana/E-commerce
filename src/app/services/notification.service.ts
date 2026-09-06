import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/confirm-dialog.component';

type Tone = 'success' | 'error' | 'info' | 'warning';

/**
 * Avisos de la aplicación, en un único sitio.
 *
 * Antes cada componente llamaba a `Swal.fire` con sus propias opciones, así que
 * añadir un producto al carrito abría el mismo modal bloqueante a pantalla
 * completa que confirmar un pedido. Aquí se separan las dos intenciones:
 *
 * - `success` / `error` / `info` / `warning` → aviso breve que no interrumpe.
 * - `confirm` / `dialog`                     → modal, solo cuando hay que decidir.
 *
 * Implementado con Material (snackbar + dialog) en lugar de SweetAlert2: ya era
 * una dependencia del proyecto, hereda el tema oscuro sin overrides y gestiona
 * el foco y el teclado por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  success(message: string): void {
    this.toast(message, 'success');
  }

  error(message: string, detail?: string): void {
    this.toast(detail ? `${message}: ${detail}` : message, 'error', 5000);
  }

  info(message: string): void {
    this.toast(message, 'info');
  }

  warning(message: string): void {
    this.toast(message, 'warning', 4000);
  }

  private toast(message: string, tone: Tone, duration = 3000): void {
    this.snackBar.open(message, '', {
      duration,
      horizontalPosition: 'center',
      // Abajo, para no tapar la barra de navegación ni el carrito.
      verticalPosition: 'bottom',
      panelClass: ['app-snack', `app-snack--${tone}`],
    });
  }

  /** Modal de confirmación. Devuelve `true` si el usuario acepta. */
  async confirm(options: {
    title: string;
    text?: string;
    confirmText: string;
    cancelText: string;
    danger?: boolean;
  }): Promise<boolean> {
    const data: ConfirmDialogData = {
      title: options.title,
      text: options.text,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      danger: options.danger,
      icon: options.danger ? 'warning_amber' : 'help_outline',
      iconTone: options.danger ? 'danger' : 'primary',
    };

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '420px',
      maxWidth: '92vw',
      autoFocus: false,
      restoreFocus: true,
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }

  /** Modal informativo de un solo botón (resumen de pedido, por ejemplo). */
  async dialogInfo(options: {
    title: string;
    html: string;
    confirmText: string;
  }): Promise<void> {
    const data: ConfirmDialogData = {
      title: options.title,
      html: options.html,
      confirmText: options.confirmText,
      icon: 'check_circle',
      iconTone: 'success',
    };

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '420px',
      maxWidth: '92vw',
      // Sin escape ni clic fuera: es la confirmación de una compra y conviene
      // que se cierre con una acción explícita.
      disableClose: true,
    });

    await firstValueFrom(ref.afterClosed());
  }
}
