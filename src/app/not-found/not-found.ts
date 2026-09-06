import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="not-found">
      <p class="code" aria-hidden="true">404</p>
      <h1>{{ 'notFound.title' | t }}</h1>
      <p class="subtitle">{{ 'notFound.subtitle' | t }}</p>

      <div class="actions">
        <button mat-flat-button routerLink="/home">
          <mat-icon>home</mat-icon>
          {{ 'notFound.action' | t }}
        </button>
        <button mat-stroked-button routerLink="/products">
          <mat-icon>storefront</mat-icon>
          {{ 'notFound.products' | t }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 20px;
        gap: 12px;
      }

      .code {
        font-size: clamp(96px, 18vw, 160px);
        font-weight: 800;
        line-height: 1;
        letter-spacing: -4px;
        background: var(--brand-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      h1 {
        font-size: clamp(24px, 4vw, 32px);
      }

      .subtitle {
        color: var(--mat-sys-on-surface-variant);
        max-width: 42ch;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
        margin-top: 16px;
      }
    `,
  ],
})
export class NotFound {}
