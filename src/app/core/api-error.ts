import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error HTTP a algo que se le pueda enseñar a una persona.
 *
 * NestJS devuelve `{ message: string | string[] }`. Cuando falla la validacion
 * viene un array con un error por campo; se coge el primero, que es el que
 * lleva al problema concreto.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;

  // El servidor no responde: es un problema de red, no del formulario.
  if (error.status === 0) return 'errors.network';

  const message = error.error?.message;

  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  if (typeof message === 'string' && message.trim()) return message;

  return fallback;
}

/** Distingue "no hay red / servidor caido" de un error de negocio. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 0;
}
