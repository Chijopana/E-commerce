import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatBotService {
  private rules: { keywords: string[]; response: string }[] = [
    { keywords: ['envío', 'envio', 'entrega', 'demora'], response: 'El envío es gratis en compras mayores a $100 y tarda entre 3 y 7 días hábiles.' },
    { keywords: ['devolución', 'devolucion', 'reembolso', 'cambio'], response: 'Tienes 30 días para devoluciones. Contáctanos con tu número de pedido y te ayudamos.' },
    { keywords: ['pago', 'tarjeta', 'paypal'], response: 'Aceptamos tarjeta de crédito, débito, PayPal y efectivo contra entrega.' },
    { keywords: ['stock', 'disponible', 'agotado'], response: 'Puedes ver la disponibilidad exacta en la ficha de cada producto.' },
    { keywords: ['hola', 'buenas', 'hey'], response: '¡Hola! 👋 ¿En qué puedo ayudarte hoy?' },
    { keywords: ['gracias'], response: '¡De nada! Cualquier otra duda, aquí estoy.' },
  ];

  getResponse(message: string): string {
    const text = message.toLowerCase();
    const match = this.rules.find(r => r.keywords.some(k => text.includes(k)));
    return match?.response ??
      'No estoy seguro de eso. Prueba preguntarme sobre envíos, devoluciones o métodos de pago 🙂';
  }
}