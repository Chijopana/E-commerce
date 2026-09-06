import { Component, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';
import { NotificationService } from './services/notification.service';
import { TranslationService, SUPPORTED_LANGS, Lang } from './services/translation.service';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import { SearchBarComponent } from './components/search-bar.component';
import { SupportChatComponent } from './components/support-chat.component';
import { AppFooterComponent } from './components/app-footer.component';
import { TranslatePipe } from './i18n/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    ThemeToggleComponent,
    SearchBarComponent,
    SupportChatComponent,
    AppFooterComponent,
    TranslatePipe,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private notifications = inject(NotificationService);

  readonly authService = inject(AuthService);
  readonly translation = inject(TranslationService);
  readonly languages = SUPPORTED_LANGS;

  readonly cartItemCount = signal(0);
  readonly wishlistCount = signal(0);
  readonly isAuthenticated = signal(false);
  readonly userName = signal('');

  /** Buscador desplegado en móvil, donde no cabe fijo en la barra. */
  readonly searchOpen = signal(false);

  constructor() {
    this.cartService.cartState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.cartItemCount.set(state.itemCount));

    this.wishlistService.wishlist$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(wishlist => this.wishlistCount.set(wishlist.length));

    this.authService.authState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.isAuthenticated.set(state.isAuthenticated);
        this.userName.set(state.user?.name ?? '');
      });
  }

  toggleSearch(): void {
    this.searchOpen.update(open => !open);
  }

  setLang(lang: Lang): void {
    void this.translation.setLang(lang);
  }

  async logout(): Promise<void> {
    const confirmed = await this.notifications.confirm({
      title: this.translation.translate('auth.confirm.logoutTitle'),
      text: this.translation.translate('auth.confirm.logoutText'),
      confirmText: this.translation.translate('nav.logout'),
      cancelText: this.translation.translate('common.cancel'),
    });

    if (!confirmed) return;

    this.authService.logout();
    await this.router.navigate(['/home']);
    this.notifications.success(this.translation.translate('auth.toast.loggedOut'));
  }
}
