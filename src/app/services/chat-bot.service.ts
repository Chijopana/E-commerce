import { Injectable } from '@angular/core';

interface Intent {
  /** Palabras clave en los dos idiomas: el bot responde escribas como escribas. */
  keywords: string[];
  /** Clave de traducción de la respuesta. */
  replyKey: string;
}

/**
 * Bot de soporte por palabras clave.
 *
 * Devuelve claves de traducción en vez de texto: antes las respuestas estaban
 * escritas en español dentro del servicio, así que con la interfaz en inglés el
 * chat seguía contestando en español.
 */
@Injectable({ providedIn: 'root' })
export class ChatBotService {
  private readonly intents: Intent[] = [
    {
      keywords: ['envio', 'entrega', 'demora', 'tarda', 'shipping', 'delivery', 'arrive'],
      replyKey: 'chat.reply.shipping',
    },
    {
      keywords: ['devolucion', 'reembolso', 'cambio', 'return', 'refund'],
      replyKey: 'chat.reply.returns',
    },
    {
      keywords: ['pago', 'pagar', 'tarjeta', 'paypal', 'payment', 'pay', 'card'],
      replyKey: 'chat.reply.payment',
    },
    {
      keywords: ['stock', 'disponible', 'agotado', 'available', 'sold out'],
      replyKey: 'chat.reply.stock',
    },
    {
      keywords: ['cupon', 'descuento', 'codigo', 'coupon', 'discount', 'promo'],
      replyKey: 'chat.reply.coupon',
    },
    {
      keywords: ['hola', 'buenas', 'hey', 'hi', 'hello'],
      replyKey: 'chat.reply.greeting',
    },
    {
      keywords: ['gracias', 'thanks', 'thank you'],
      replyKey: 'chat.reply.thanks',
    },
  ];

  /** Devuelve la clave de traducción de la respuesta al mensaje del usuario. */
  resolve(message: string): string {
    const text = this.normalize(message);
    const match = this.intents.find(intent =>
      intent.keywords.some(keyword => text.includes(keyword)),
    );

    return match?.replyKey ?? 'chat.reply.fallback';
  }

  /**
   * Quita acentos antes de comparar, así "envío" y "envio" caen en la misma
   * intención. Por eso las palabras clave de arriba van ya sin tilde.
   */
  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }
}
