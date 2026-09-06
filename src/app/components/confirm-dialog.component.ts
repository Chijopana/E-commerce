import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  /** Texto plano; se escapa solo al interpolarlo. */
  text?: string;
  /** Contenido HTML de confianza, generado por la propia aplicación. */
  html?: string;
  confirmText: string;
  /** Si falta, el diálogo es informativo y solo muestra el botón de confirmar. */
  cancelText?: string;
  icon?: string;
  iconTone?: 'primary' | 'success' | 'warning' | 'danger';
  danger?: boolean;
}

/**
 * Diálogo de confirmación e información.
 *
 * Sustituye a SweetAlert2, que se usaba para todo. Material ya estaba en el
 * proyecto, así que este diálogo hereda el tema (incluido el oscuro) sin
 * pelearse con estilos ajenos, atrapa el foco correctamente y se cierra con
 * Escape, y de paso ahorra unos 50 kB de dependencia externa.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog">
      @if (data.icon) {
        <span class="dialog__icon" [class]="'dialog__icon--' + (data.iconTone ?? 'primary')">
          <mat-icon>{{ data.icon }}</mat-icon>
        </span>
      }

      <h2 mat-dialog-title>{{ data.title }}</h2>

      <mat-dialog-content>
        @if (data.html) {
          <div [innerHTML]="data.html"></div>
        } @else if (data.text) {
          <p>{{ data.text }}</p>
        }
      </mat-dialog-content>

      <mat-dialog-actions>
        @if (data.cancelText) {
          <button mat-stroked-button (click)="close(false)">{{ data.cancelText }}</button>
        }
        <button
          mat-flat-button
          class="confirm"
          [class.danger]="data.danger"
          cdkFocusInitial
          (click)="close(true)">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog {
        padding: 26px 24px 16px;
        text-align: center;
        max-width: 420px;
      }

      .dialog__icon {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        margin: 0 auto 16px;
        border-radius: 50%;
      }

      .dialog__icon mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .dialog__icon--primary {
        background: color-mix(in srgb, var(--mat-sys-primary) 16%, transparent);
        color: var(--mat-sys-primary);
      }

      .dialog__icon--success {
        background: color-mix(in srgb, var(--state-success) 18%, transparent);
        color: var(--state-success);
      }

      .dialog__icon--warning {
        background: color-mix(in srgb, var(--state-warning) 18%, transparent);
        color: var(--state-warning);
      }

      .dialog__icon--danger {
        background: color-mix(in srgb, var(--state-error) 18%, transparent);
        color: var(--state-error);
      }

      h2 {
        font-size: 20px !important;
        font-weight: 700 !important;
        padding: 0 !important;
        margin-bottom: 8px !important;
      }

      mat-dialog-content {
        padding: 0 !important;
        color: var(--mat-sys-on-surface-variant);
        font-size: 14.5px;
        line-height: 1.6;
      }

      mat-dialog-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 22px 0 0 !important;
        min-height: 0 !important;
      }

      mat-dialog-actions button {
        min-width: 122px;
        height: 42px;
        font-weight: 600;
      }

      .confirm.danger {
        background: var(--state-error);
        color: #fff;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
