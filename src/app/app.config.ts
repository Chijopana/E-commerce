import {
  ApplicationConfig,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, TitleStrategy } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { TranslationService } from './services/translation.service';
import { AuthService } from './services/auth.service';
import { TranslatedTitleStrategy } from './i18n/translated-title.strategy';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // Al navegar se vuelve arriba, salvo al usar atrás/adelante del navegador,
      // donde se restaura la posición anterior. Antes, entrar en un producto
      // desde el final del catálogo dejaba la ficha a media página.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    // Versión asíncrona: las animaciones de Material se cargan en su propio
    // chunk en vez de engordar el bundle inicial.
    provideAnimationsAsync(),

    // El interceptor pone el token en las llamadas a la API y saca al usuario
    // si el servidor responde que la sesión ya no vale.
    provideHttpClient(withInterceptors([authInterceptor])),

    // Antes del primer render se resuelven dos cosas:
    //   1. el diccionario, o la primera pintada enseña claves crudas;
    //   2. la sesión, preguntando al servidor de quién es el token guardado.
    // Sin (2), la barra de navegación parpadea de "Ingresar" al nombre real.
    provideAppInitializer(() => {
      const translation = inject(TranslationService);
      const auth = inject(AuthService);

      return Promise.all([
        translation.init(),
        // Si la API está caída, la aplicación tiene que arrancar igual y
        // enseñar su error; nunca quedarse colgada en la pantalla de carga.
        firstValueFrom(auth.restoreSession()).catch(() => null),
      ]);
    }),

    // El título de la pestaña sale de la clave `title` de cada ruta.
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
  ],
};
