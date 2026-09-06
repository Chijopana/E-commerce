import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

/**
 * Pie de página. La tienda no tenía ninguno: cada página terminaba en un corte
 * seco contra el borde de la ventana, y no había ningún sitio donde poner los
 * enlaces secundarios ni el aviso de que esto es una demo.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <div class="footer__logo">
            <mat-icon>shopping_bag</mat-icon>
            <span>{{ 'nav.brand' | t }}</span>
          </div>
          <p>{{ 'footer.tagline' | t }}</p>
          <p class="footer__demo">
            <mat-icon>info</mat-icon>
            {{ 'footer.demoNotice' | t }}
          </p>
        </div>

        <nav class="footer__col" [attr.aria-label]="'footer.shop' | t">
          <h2>{{ 'footer.shop' | t }}</h2>
          <a routerLink="/products">{{ 'nav.products' | t }}</a>
          <a routerLink="/cart">{{ 'nav.cart' | t }}</a>
          <a routerLink="/wishlist">{{ 'nav.wishlist' | t }}</a>
          <a routerLink="/orders">{{ 'nav.orders' | t }}</a>
        </nav>

        <nav class="footer__col" [attr.aria-label]="'footer.support' | t">
          <h2>{{ 'footer.support' | t }}</h2>
          <!--
            Enlaces sin destino real: son secciones que esta demo no tiene.
            Se marcan como deshabilitados en vez de fingir un href a ninguna
            parte, para no dejar al usuario pulsando algo que no responde.
          -->
          <span class="footer__soon">{{ 'footer.faq' | t }}</span>
          <span class="footer__soon">{{ 'footer.shipping' | t }}</span>
          <span class="footer__soon">{{ 'footer.returns' | t }}</span>
        </nav>

        <nav class="footer__col" [attr.aria-label]="'footer.legal' | t">
          <h2>{{ 'footer.legal' | t }}</h2>
          <span class="footer__soon">{{ 'footer.privacy' | t }}</span>
          <span class="footer__soon">{{ 'footer.terms' | t }}</span>
        </nav>
      </div>

      <div class="footer__bottom">
        <span>© {{ year }} · {{ 'footer.rights' | t }}</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        margin-top: var(--section-gap);
        background: var(--mat-sys-surface-container);
        border-top: 1px solid var(--mat-sys-outline-variant);
        color: var(--mat-sys-on-surface-variant);
      }

      .footer__inner {
        max-width: var(--page-max);
        margin: 0 auto;
        padding: 56px 20px 32px;
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 40px;
      }

      .footer__brand p {
        margin-top: 12px;
        max-width: 42ch;
        line-height: 1.6;
        font-size: 14px;
      }

      .footer__logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
      }

      .footer__logo mat-icon {
        color: var(--mat-sys-primary);
      }

      .footer__demo {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        padding: 10px 14px;
        border-radius: var(--radius-sm);
        background: var(--mat-sys-surface-container-high);
      }

      .footer__demo mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      .footer__col {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .footer__col h2 {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mat-sys-on-surface);
        margin-bottom: 4px;
      }

      .footer__col a {
        font-size: 14px;
        transition: color 0.2s ease;
      }

      .footer__col a:hover {
        color: var(--mat-sys-primary);
      }

      .footer__soon {
        font-size: 14px;
        opacity: 0.55;
        cursor: default;
      }

      .footer__bottom {
        border-top: 1px solid var(--mat-sys-outline-variant);
        padding: 20px;
        text-align: center;
        font-size: 13px;
      }

      @media (max-width: 900px) {
        .footer__inner {
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .footer__brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 520px) {
        .footer__inner {
          grid-template-columns: 1fr;
          padding: 40px 16px 24px;
        }
      }
    `,
  ],
})
export class AppFooterComponent {
  readonly year = new Date().getFullYear();
}
