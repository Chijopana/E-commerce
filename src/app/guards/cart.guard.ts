import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../services/cart.service';

/**
 * Impide entrar al checkout con el carrito vacío.
 *
 * Antes esta comprobación vivía dentro del componente, suscrita al estado del
 * carrito, y obligaba a un `orderSubmitted` como bandera para que vaciar el
 * carrito al confirmar no rebotara al usuario fuera de su propio pedido.
 * Como guard, la regla se aplica una sola vez al entrar y el componente se
 * queda solo con su trabajo.
 */
export const cartNotEmptyGuard: CanActivateFn = () => {
  const cartService = inject(CartService);
  const router = inject(Router);

  return cartService.isEmpty() ? router.createUrlTree(['/cart']) : true;
};
