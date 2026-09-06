import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

/**
 * Uso: `{{ 'nav.home' | t }}` o `{{ 'cart.count' | t: { count: 3 } }}`
 *
 * El pipe es impuro a propósito. Uno puro cachea por argumentos: al cambiar de
 * idioma la clave sigue siendo la misma ('nav.home'), así que Angular
 * devolvería el valor cacheado en español y la interfaz no se traduciría.
 * El coste real es una búsqueda en un objeto por binding y ciclo, despreciable
 * para el tamaño de esta aplicación.
 */
@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private translation = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translation.translate(key, params);
  }
}
