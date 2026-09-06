import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatBotService } from '../services/chat-bot.service';
import { TranslationService } from '../services/translation.service';
import { TranslatePipe } from '../i18n/translate.pipe';

interface ChatMsg {
  /** Clave de traducción (bot) o texto literal (usuario). */
  content: string;
  fromBot: boolean;
}

/**
 * Chat de soporte simulado.
 *
 * Mejoras sobre la versión anterior: los mensajes del bot se guardan como
 * claves y se traducen al pintarlos (así el historial cambia de idioma con la
 * interfaz), el panel baja solo al último mensaje, hay indicador de
 * "escribiendo", preguntas sugeridas para arrancar la conversación, y se puede
 * cerrar con Escape.
 */
@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [FormsModule, MatIconModule, TranslatePipe],
  template: `
    <button
      class="chat-fab"
      (click)="toggle()"
      [attr.aria-label]="(open() ? 'chat.close' : 'chat.open') | t"
      [attr.aria-expanded]="open()">
      <mat-icon>{{ open() ? 'close' : 'support_agent' }}</mat-icon>
    </button>

    @if (open()) {
      <section class="chat-panel" (keydown.escape)="close()" [attr.aria-label]="'chat.title' | t">
        <header>
          <mat-icon aria-hidden="true">support_agent</mat-icon>
          <div class="chat-heading">
            <strong>{{ 'chat.title' | t }}</strong>
            <span>{{ 'chat.subtitle' | t }}</span>
          </div>
          <button
            type="button"
            class="chat-close"
            (click)="close()"
            [attr.aria-label]="'chat.close' | t">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <div class="chat-body" #body role="log" aria-live="polite">
          @for (message of messages(); track $index) {
            <p class="msg" [class.bot]="message.fromBot" [class.user]="!message.fromBot">
              {{ message.fromBot ? (message.content | t) : message.content }}
            </p>
          }

          @if (typing()) {
            <p class="msg bot typing" [attr.aria-label]="'chat.typing' | t">
              <span></span><span></span><span></span>
            </p>
          }

          @if (messages().length === 1) {
            <div class="suggestions">
              <span class="suggestions__label">{{ 'chat.suggestions' | t }}</span>
              @for (prompt of prompts; track prompt) {
                <button type="button" (click)="sendText(translation.translate(prompt))">
                  {{ prompt | t }}
                </button>
              }
            </div>
          }
        </div>

        <form (ngSubmit)="send()" class="chat-input">
          <input
            [(ngModel)]="draft"
            name="draft"
            [placeholder]="'chat.placeholder' | t"
            [attr.aria-label]="'chat.placeholder' | t"
            autocomplete="off" />
          <button type="submit" [disabled]="!draft.trim()" [attr.aria-label]="'chat.send' | t">
            <mat-icon>send</mat-icon>
          </button>
        </form>
      </section>
    }
  `,
  styles: [
    `
      .chat-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-lg);
        z-index: 500;
        transition: transform 0.2s ease;
      }

      .chat-fab:hover {
        transform: scale(1.06);
      }

      .chat-panel {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: min(340px, calc(100vw - 32px));
        height: min(460px, calc(100vh - 140px));
        background: var(--mat-sys-surface-container-high);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 500;
        animation: chat-in 0.18s ease-out;
      }

      @keyframes chat-in {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
      }

      header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
      }

      .chat-heading {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }

      .chat-heading span {
        font-size: 11px;
        opacity: 0.85;
      }

      .chat-close {
        margin-left: auto;
        background: none;
        border: none;
        color: inherit;
        display: flex;
        padding: 4px;
      }

      .chat-body {
        flex: 1;
        overflow-y: auto;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .msg {
        max-width: 82%;
        padding: 9px 13px;
        border-radius: var(--radius-md);
        font-size: 13px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }

      .msg.bot {
        align-self: flex-start;
        background: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface);
        border-bottom-left-radius: 4px;
      }

      .msg.user {
        align-self: flex-end;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        border-bottom-right-radius: 4px;
      }

      .typing {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .typing span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--mat-sys-on-surface-variant);
        animation: blink 1.2s infinite;
      }

      .typing span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes blink {
        0%,
        60%,
        100% {
          opacity: 0.25;
        }
        30% {
          opacity: 1;
        }
      }

      .suggestions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-top: 6px;
      }

      .suggestions__label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mat-sys-on-surface-variant);
      }

      .suggestions button {
        background: none;
        border: 1px solid var(--mat-sys-outline-variant);
        color: var(--mat-sys-primary);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-family: inherit;
        text-align: left;
      }

      .suggestions button:hover {
        background: var(--mat-sys-surface-container);
      }

      .chat-input {
        display: flex;
        gap: 6px;
        padding: 10px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }

      .chat-input input {
        flex: 1;
        border: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface);
        border-radius: 999px;
        padding: 9px 14px;
        outline: none;
        color: var(--mat-sys-on-surface);
        font-family: inherit;
        font-size: 13px;
      }

      .chat-input input:focus {
        border-color: var(--mat-sys-primary);
      }

      .chat-input button {
        background: none;
        border: none;
        color: var(--mat-sys-primary);
        display: flex;
        align-items: center;
        padding: 0 6px;
      }

      .chat-input button:disabled {
        opacity: 0.4;
      }

      @media (max-width: 600px) {
        .chat-fab {
          bottom: 16px;
          right: 16px;
        }

        .chat-panel {
          bottom: 84px;
          right: 16px;
        }
      }
    `,
  ],
})
export class SupportChatComponent {
  private bot = inject(ChatBotService);
  private destroyRef = inject(DestroyRef);
  protected translation = inject(TranslationService);

  private bodyRef = viewChild<ElementRef<HTMLElement>>('body');

  readonly open = signal(false);
  readonly typing = signal(false);
  readonly messages = signal<ChatMsg[]>([{ content: 'chat.greeting', fromBot: true }]);

  readonly prompts = ['chat.prompt.shipping', 'chat.prompt.returns', 'chat.prompt.coupon'];

  draft = '';

  private replyTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Cada mensaje nuevo baja el panel hasta el final; si no, las respuestas
    // aparecían fuera de vista y parecía que el bot no contestaba.
    effect(() => {
      this.messages();
      this.typing();
      queueMicrotask(() => {
        const body = this.bodyRef()?.nativeElement;
        if (body) body.scrollTop = body.scrollHeight;
      });
    });

    // Un temporizador pendiente al destruir el componente dispararía sobre una
    // señal ya desechada.
    this.destroyRef.onDestroy(() => clearTimeout(this.replyTimer));
  }

  toggle(): void {
    this.open.update(v => !v);
  }

  close(): void {
    this.open.set(false);
  }

  send(): void {
    this.sendText(this.draft);
  }

  sendText(text: string): void {
    const message = text.trim();
    if (!message) return;

    this.messages.update(list => [...list, { content: message, fromBot: false }]);
    this.draft = '';
    this.typing.set(true);

    clearTimeout(this.replyTimer);
    this.replyTimer = setTimeout(() => {
      this.typing.set(false);
      this.messages.update(list => [...list, { content: this.bot.resolve(message), fromBot: true }]);
    }, 700);
  }
}
