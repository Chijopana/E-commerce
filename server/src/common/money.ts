/**
 * Conversión entre céntimos (como se guarda) y unidades (como se muestra).
 *
 * Todo el dinero vive en enteros dentro de la base de datos y de la lógica de
 * negocio. La conversión ocurre solo aquí y solo en el borde de la API, para
 * que ningún cálculo intermedio pase por coma flotante.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function toUnits(cents: number): number {
  return cents / 100;
}

/** Aplica un porcentaje a un importe en céntimos, redondeando al céntimo. */
export function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}
