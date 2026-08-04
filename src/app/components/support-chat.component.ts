import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatBotService } from '../services/chat-bot.service';

interface ChatMsg { text: string; fromBot: boolean; }

@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <button class="chat-fab" (click)="open = !open" [class.open]="open">
      <mat-icon>{{ open ? 'close' : 'support_agent' }}</mat-icon>
    </button>

    <div class="chat-panel" *ngIf="open">
      <header>
        <mat-icon>support_agent</mat-icon>
        <span>Soporte</span>
      </header>
      <div class="chat-body" #body>
        <div *ngFor="let m of messages" class="msg" [class.bot]="m.fromBot" [class.user]="!m.fromBot">
          {{ m.text }}
        </div>
      </div>
      <form (ngSubmit)="send()" class="chat-input">
        <input [(ngModel)]="draft" name="draft" placeholder="Escribe tu mensaje..." autocomplete="off">
        <button type="submit"><mat-icon>send</mat-icon></button>
      </form>
    </div>
  `,
  styles: [`
    .chat-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%;
      background: var(--mat-sys-primary); color: var(--mat-sys-on-primary); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.3); z-index: 500; }
    .chat-panel { position: fixed; bottom: 92px; right: 24px; width: 320px; height: 420px;
      background: var(--mat-sys-surface-container-high); border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.3);
      display: flex; flex-direction: column; overflow: hidden; z-index: 500; }
    .chat-panel header { display: flex; align-items: center; gap: 8px; padding: 14px 16px;
      background: var(--mat-sys-primary); color: var(--mat-sys-on-primary); font-weight: 600; }
    .chat-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .msg { max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; }
    .msg.bot { align-self: flex-start; background: var(--mat-sys-surface-container); color: var(--mat-sys-on-surface); }
    .msg.user { align-self: flex-end; background: var(--mat-sys-primary); color: var(--mat-sys-on-primary); }
    .chat-input { display: flex; gap: 6px; padding: 10px; border-top: 1px solid var(--mat-sys-outline-variant); }
    .chat-input input { flex: 1; border: none; background: var(--mat-sys-surface); border-radius: 20px;
      padding: 8px 14px; outline: none; color: var(--mat-sys-on-surface); }
    .chat-input button { background: none; border: none; color: var(--mat-sys-primary); cursor: pointer;
      display: flex; align-items: center; }
  `],
})
export class SupportChatComponent {
  open = false;
  draft = '';
  messages: ChatMsg[] = [
    { text: '¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?', fromBot: true },
  ];

  constructor(private bot: ChatBotService) {}

  send(): void {
    const text = this.draft.trim();
    if (!text) return;

    this.messages.push({ text, fromBot: false });
    this.draft = '';

    setTimeout(() => {
      this.messages.push({ text: this.bot.getResponse(text), fromBot: true });
    }, 500); // simula "escribiendo..."
  }
}