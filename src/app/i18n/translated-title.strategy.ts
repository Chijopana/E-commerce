import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslationService } from '../services/translation.service';

const SITE_NAME = 'Mi E-Commerce';

/**
 * El `title` de cada ruta es una clave de traducción; aquí se resuelve y se
 * compone el título de la pestaña. Antes todas las páginas compartían el mismo
 * título estático ("MiniEcommerce"), así que con varias pestañas abiertas no
 * había forma de distinguirlas ni el historial del navegador servía de nada.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  private translation = inject(TranslationService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);

    if (!key) {
      this.title.setTitle(SITE_NAME);
      return;
    }

    const translated = this.translation.translate(key);
    this.title.setTitle(`${translated} · ${SITE_NAME}`);
  }
}
