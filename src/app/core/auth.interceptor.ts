import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenStore } from './token.store';
import { environment } from '../../environments/environment';

/**
 * Añade el token a las peticiones a nuestra API y gestiona la sesión caducada.
 *
 * Solo toca las llamadas a `environment.apiUrl`: los ficheros de traducción y
 * cualquier recurso externo no deben llevar la credencial pegada.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStore);
  const router = inject(Router);

  const isApiCall = req.url.startsWith(environment.apiUrl);
  const token = tokens.get();

  const request =
    isApiCall && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 con token puesto = el token ha caducado o ya no vale. Se limpia la
      // sesión y se manda al login, en vez de dejar la interfaz mostrando datos
      // de una sesión que el servidor ya no reconoce.
      if (isApiCall && error.status === 401 && token) {
        tokens.clear();
        void router.navigate(['/auth'], {
          queryParams: { returnUrl: router.url, expired: 1 },
        });
      }

      return throwError(() => error);
    }),
  );
};
