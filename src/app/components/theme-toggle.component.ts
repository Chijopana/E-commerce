import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatIconButton, MatIcon, MatTooltip],
  template: `
    <button
      mat-icon-button
      (click)="theme.toggle()"
      [matTooltip]="label()"
      [attr.aria-label]="label()"
      [attr.aria-pressed]="theme.isDark()">
      <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  private translation = inject(TranslationService);

  /** Describe la acción, no el estado: es lo que el botón va a hacer al pulsarlo. */
  label(): string {
    return this.translation.translate(
      this.theme.isDark() ? 'nav.themeToLight' : 'nav.themeToDark',
    );
  }
}
