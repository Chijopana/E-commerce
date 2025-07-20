import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  // Aquí debes emitir un evento o cambiar la vista
  // Para simplificar, el botón emitirá un evento custom
  navigateToProducts() {
    // Emitimos evento para que el padre (app.ts) lo reciba
    const event = new CustomEvent('navigate', { detail: 'products' });
    window.dispatchEvent(event);
  }
}
