import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../services/auth.service';
import { apiErrorMessage } from '../core/api-error';
import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';
import { TranslatePipe } from '../i18n/translate.pipe';

/** Valida a nivel de grupo que las dos contraseñas coincidan. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return !confirm || password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class Auth {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private translation = inject(TranslationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly hidePassword = signal(true);
  readonly submitting = signal(false);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    // Comparar las contraseñas dentro del propio formulario permite marcar el
    // campo en rojo mientras se escribe. Antes se comprobaba al enviar y el
    // error salía en un modal, lejos del campo que había que corregir.
    { validators: passwordsMatch },
  );

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  /** Rellena la cuenta de prueba: ahorra teclear el usuario demo. */
  fillDemo(): void {
    this.loginForm.setValue({ email: 'demo@ecommerce.com', password: 'demo123' });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(this.translation.translate('auth.toast.welcome'));
        void this.redirectAfterAuth();
      },
      error: error => {
        this.submitting.set(false);
        this.notifications.error(this.errorText(error, 'auth.toast.badCredentials'));
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(this.translation.translate('auth.toast.registered'));
        void this.redirectAfterAuth();
      },
      error: error => {
        this.submitting.set(false);
        this.notifications.error(this.errorText(error, 'auth.toast.emailTaken'));
      },
    });
  }

  /**
   * El servidor manda el motivo real del fallo (email repetido, contraseña
   * corta...). Se prefiere ese mensaje al generico; solo si no hay ninguno se
   * cae al texto por defecto.
   */
  private errorText(error: unknown, fallbackKey: string): string {
    // `apiErrorMessage` devuelve o una clave nuestra o el texto del servidor;
    // `translate` deja pasar tal cual lo que no sea una clave conocida, asi que
    // ambos casos se resuelven igual.
    return this.translation.translate(apiErrorMessage(error, fallbackKey));
  }

  /**
   * Vuelve a donde el usuario quería ir (`returnUrl` que deja `authGuard`) o al
   * catálogo.
   *
   * Esto es lo que antes intentaba hacer un `window.dispatchEvent(new
   * CustomEvent('navigate'))` que nadie escuchaba: iniciar sesión no navegaba a
   * ninguna parte y el usuario se quedaba mirando el formulario, sin saber si
   * había entrado.
   */
  private redirectAfterAuth(): Promise<boolean> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return this.router.navigateByUrl(returnUrl || '/products');
  }
}
