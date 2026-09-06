import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { cartNotEmptyGuard } from './guards/cart.guard';

/**
 * Todas las rutas van con `loadComponent()`. Antes solo tres lo hacían y el
 * resto entraba en el bundle inicial, así que quien solo miraba la home se
 * descargaba también el checkout entero.
 *
 * `title` guarda una clave de traducción, no un texto: la traduce
 * `TranslatedTitleStrategy` al navegar.
 */
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'nav.home',
    loadComponent: () => import('./home/home').then(m => m.Home),
  },
  {
    path: 'auth',
    title: 'nav.login',
    loadComponent: () => import('./auth/auth').then(m => m.Auth),
  },
  {
    path: 'products',
    title: 'nav.products',
    loadComponent: () => import('./products/products').then(m => m.Products),
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./product-detail/product-detail').then(m => m.ProductDetail),
  },
  {
    path: 'cart',
    title: 'nav.cart',
    loadComponent: () => import('./cart/cart').then(m => m.Cart),
  },
  {
    path: 'checkout',
    title: 'checkout.title',
    loadComponent: () => import('./checkout/checkout').then(m => m.Checkout),
    canActivate: [authGuard, cartNotEmptyGuard],
  },
  {
    path: 'wishlist',
    title: 'nav.wishlist',
    loadComponent: () => import('./wishlist/wishlist').then(m => m.Wishlist),
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    title: 'nav.orders',
    loadComponent: () => import('./orders/orders').then(m => m.Orders),
    canActivate: [authGuard],
  },
  {
    // Una URL rota enseña un 404 de verdad. Antes redirigía a la home sin
    // decir nada, así que un enlace mal escrito parecía funcionar.
    path: '**',
    title: 'notFound.title',
    loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
  },
];
