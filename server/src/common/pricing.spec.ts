import {
  calculateTotals,
  FREE_SHIPPING_THRESHOLD_CENTS,
  STANDARD_SHIPPING_CENTS,
} from './pricing';
import { percentOf, toCents, toUnits } from './money';

describe('pricing', () => {
  it('cobra envío por debajo del umbral', () => {
    const totals = calculateTotals(5000);

    expect(totals.shippingCents).toBe(STANDARD_SHIPPING_CENTS);
    expect(totals.totalCents).toBe(5000 + STANDARD_SHIPPING_CENTS);
  });

  it('regala el envío justo al alcanzar el umbral', () => {
    const totals = calculateTotals(FREE_SHIPPING_THRESHOLD_CENTS);

    expect(totals.shippingCents).toBe(0);
    expect(totals.totalCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS);
  });

  it('aplica el descuento antes de decidir el envío', () => {
    // 110.00 con 20% se queda en 88.00, por debajo del umbral: se cobra envío.
    const totals = calculateTotals(11_000, 20);

    expect(totals.discountCents).toBe(2200);
    expect(totals.shippingCents).toBe(STANDARD_SHIPPING_CENTS);
    expect(totals.totalCents).toBe(8800 + STANDARD_SHIPPING_CENTS);
  });

  it('no cobra envío con el carrito vacío', () => {
    expect(calculateTotals(0)).toMatchObject({ shippingCents: 0, totalCents: 0 });
  });

  it('nunca produce un total negativo, ni con el descuento máximo', () => {
    expect(calculateTotals(5000, 100).totalCents).toBe(0);
  });
});

describe('money', () => {
  it('convierte a céntimos sin arrastrar error de coma flotante', () => {
    // 89.99 * 100 da 8998.999... en coma flotante; sin redondeo se perdería
    // un céntimo en cada producto del catálogo.
    expect(toCents(89.99)).toBe(8999);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  it('vuelve a unidades', () => {
    expect(toUnits(8999)).toBe(89.99);
  });

  it('redondea el porcentaje al céntimo', () => {
    expect(percentOf(8999, 10)).toBe(900);
  });
});
