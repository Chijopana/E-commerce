import { Provider, EnvironmentProviders } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

/**
 * Providers mínimos que necesita cualquier componente de página.
 *
 * Los specs originales montaban los componentes con `imports: [Componente]` a
 * secas: fallaban todos porque no había router, ni HttpClient (que necesita
 * `TranslationService`), ni animaciones (que necesitan Material Dialog y
 * Snackbar). Tenerlo en un solo sitio evita repetirlo en cada archivo.
 */
export function testProviders(): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([]),
    provideNoopAnimations(),
    provideHttpClient(),
    provideHttpClientTesting(),
  ];
}

/** Limpia el estado persistido entre pruebas para que no se contaminen. */
export function clearAppStorage(): void {
  localStorage.clear();
}
