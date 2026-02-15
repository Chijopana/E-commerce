import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
  ],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class Auth {
  loginForm: FormGroup;
  registerForm: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe(success => {
      if (success) {
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión correctamente',
          timer: 2000,
          showConfirmButton: false,
        });
        this.navigateToProducts();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Email o contraseña incorrectos',
        });
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden',
      });
      return;
    }

    this.authService.register(this.registerForm.value).subscribe(success => {
      if (success) {
        Swal.fire({
          icon: 'success',
          title: '¡Registrado!',
          text: 'Tu cuenta ha sido creada exitosamente',
          timer: 2000,
          showConfirmButton: false,
        });
        this.navigateToProducts();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El email ya está registrado',
        });
      }
    });
  }

  private navigateToProducts(): void {
    const event = new CustomEvent('navigate', { detail: 'products' });
    window.dispatchEvent(event);
  }
}
