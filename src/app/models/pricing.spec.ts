import { calculateTotals, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST, round2 } from './pricing';

describe('pricing', () => {
  describe('calculateTotals', () => {
    it('cobra envío cuando el subtotal no llega al umbral', () => {
      const totals = calculateTotals(50);

      expect(totals.shippingCost).toBe(STANDARD_SHIPPING_COST);
      expect(totals.total).toBe(round2(50 + STANDARD_SHIPPING_COST));
      expect(totals.amountToFreeShipping).toBe(50);
    });

    it('regala el envío justo al alcanzar el umbral', () => {
      const totals = calculateTotals(FREE_SHIPPING_THRESHOLD);

      expect(totals.shippingCost).toBe(0);
      expect(totals.total).toBe(FREE_SHIPPING_THRESHOLD);
      expect(totals.amountToFreeShipping).toBe(0);
    });

    it('aplica el descuento antes de decidir el envío', () => {
      // 110 con 20% se queda en 88, por debajo del umbral: el envío se cobra.
      const totals = calculateTotals(110, 20);

      expect(totals.discount).toBe(22);
      expect(totals.shippingCost).toBe(STANDARD_SHIPPING_COST);
      expect(totals.total).toBe(round2(88 + STANDARD_SHIPPING_COST));
    });

    it('no cobra envío con el carrito vacío', () => {
      const totals = calculateTotals(0);

      expect(totals.shippingCost).toBe(0);
      expect(totals.total).toBe(0);
    });

    it('redondea a céntimos en vez de arrastrar error de coma flotante', () => {
      const totals = calculateTotals(0.1 + 0.2);

      expect(totals.subtotal).toBe(0.3);
    });
  });

  describe('round2', () => {
    it('redondea al alza en el caso medio', () => {
      expect(round2(1.005)).toBe(1.01);
    });
  });
});
