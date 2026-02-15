import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Products } from './products/products';
import { Cart } from './cart/cart';
import { Checkout } from './checkout/checkout';
import { Auth } from './auth/auth';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'auth', component: Auth },
  { path: 'products', component: Products },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
  { 
    path: 'wishlist', 
    loadComponent: () => import('./wishlist/wishlist').then(m => m.Wishlist),
    canActivate: [authGuard]
  },
  { 
    path: 'orders', 
    loadComponent: () => import('./orders/orders').then(m => m.Orders),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' }
];
