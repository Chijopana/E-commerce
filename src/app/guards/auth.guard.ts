import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege las rutas que exigen sesión.
 *
 * Guarda la ruta pedida en `returnUrl` para que, tras iniciar sesión, el
 * usuario aterrice donde iba. Antes se le mandaba siempre al catálogo y perdía
 * el hilo (por ejemplo, ir a pagar y acabar de vuelta en la lista de productos).
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth'], {
    queryParams: { returnUrl: state.url },
  });
};
