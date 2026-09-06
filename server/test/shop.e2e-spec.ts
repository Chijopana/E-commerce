import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Recorrido completo de la tienda contra una base de datos real (SQLite de
 * pruebas). Fija las garantías que no pueden romperse nunca:
 *
 *  - el precio y el total los pone el servidor, no el cliente;
 *  - no se puede comprar más stock del que hay;
 *  - nadie ve ni cancela pedidos ajenos.
 */
describe('Tienda (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let demoToken: string;
  let otherToken: string;

  const shippingInfo = {
    name: 'Jose Blondel',
    email: 'jose@ejemplo.com',
    phone: '5551234567',
    address: 'Calle Mayor 12, 3 B',
    city: 'Madrid',
    postalCode: '28001',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const demo = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@ecommerce.com', password: 'demo123' });
    demoToken = demo.body.accessToken;

    const other = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Otra Persona', email: 'otra@ejemplo.com', password: 'secreta123' });
    otherToken = other.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------- catálogo

  describe('catálogo', () => {
    it('es público', async () => {
      const res = await request(app.getHttpServer()).get('/api/products').expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('devuelve el precio en unidades, no en céntimos', async () => {
      const res = await request(app.getHttpServer()).get('/api/products/1').expect(200);

      expect(res.body.price).toBe(89.99);
    });

    it('filtra por categoría y ordena por precio', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?category=Electr%C3%B3nica&sort=price-asc')
        .expect(200);

      const prices = res.body.items.map((p: { price: number }) => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('rechaza un parámetro de orden inventado', async () => {
      await request(app.getHttpServer()).get('/api/products?sort=loquesea').expect(400);
    });

    it('404 si el producto no existe', async () => {
      await request(app.getHttpServer()).get('/api/products/99999').expect(404);
    });
  });

  // ---------------------------------------------------------------- auth

  describe('autenticación', () => {
    it('no devuelve nunca el hash de la contraseña', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'demo@ecommerce.com', password: 'demo123' })
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('$2');
      expect(res.body.user.password).toBeUndefined();
    });

    it('rechaza la contraseña equivocada', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'demo@ecommerce.com', password: 'noeslabuena' })
        .expect(401);
    });

    it('guarda la contraseña hasheada, nunca en claro', async () => {
      const user = await prisma.user.findUnique({ where: { email: 'demo@ecommerce.com' } });

      expect(user!.password).not.toBe('demo123');
      expect(user!.password.startsWith('$2')).toBe(true);
    });

    it('no deja colar un rol de administrador en el registro', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Escalada',
          email: 'escalada@ejemplo.com',
          password: 'secreta123',
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('bloquea las rutas privadas sin token', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });
  });

  // -------------------------------------------------------------- pedidos

  describe('pedidos', () => {
    it('ignora cualquier precio o total que mande el cliente', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 1, quantity: 1, price: 0.01 }],
          total: 0.01,
          shippingInfo,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(400); // los campos de más se rechazan de plano
    });

    it('calcula el total desde la base de datos', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 1, quantity: 2 }], // 89.99 x 2 = 179.98
          shippingInfo,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(201);

      expect(res.body.subtotal).toBe(179.98);
      expect(res.body.shippingCost).toBe(0); // supera el umbral de envío gratis
      expect(res.body.total).toBe(179.98);
      expect(res.body.status).toBe('PENDING');
    });

    it('aplica el descuento del cupón en el servidor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 1, quantity: 2 }],
          shippingInfo,
          paymentMethod: 'PAYPAL',
          couponCode: 'descuento10', // en minúsculas: debe normalizarse
        })
        .expect(201);

      expect(res.body.discount).toBe(18);
      expect(res.body.total).toBe(161.98);
      expect(res.body.couponCode).toBe('DESCUENTO10');
    });

    it('rechaza un cupón inventado en vez de ignorarlo', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 3, quantity: 1 }],
          shippingInfo,
          paymentMethod: 'CASH',
          couponCode: 'NOEXISTE',
        })
        .expect(400);
    });

    it('descuenta el stock al comprar', async () => {
      const before = await prisma.product.findUnique({ where: { id: 7 } });

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 7, quantity: 3 }],
          shippingInfo,
          paymentMethod: 'CASH',
        })
        .expect(201);

      const after = await prisma.product.findUnique({ where: { id: 7 } });
      expect(after!.stock).toBe(before!.stock - 3);
    });

    it('no permite comprar más unidades de las que hay', async () => {
      const product = await prisma.product.findUnique({ where: { id: 5 } });

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 5, quantity: product!.stock + 1 }],
          shippingInfo,
          paymentMethod: 'CASH',
        })
        .expect(409);

      // Y el intento fallido no ha tocado el stock.
      const after = await prisma.product.findUnique({ where: { id: 5 } });
      expect(after!.stock).toBe(product!.stock);
    });

    it('suma las líneas repetidas del mismo producto', async () => {
      const before = await prisma.product.findUnique({ where: { id: 11 } });

      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [
            { productId: 11, quantity: 1 },
            { productId: 11, quantity: 2 },
          ],
          shippingInfo,
          paymentMethod: 'CASH',
        })
        .expect(201);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].quantity).toBe(3);

      const after = await prisma.product.findUnique({ where: { id: 11 } });
      expect(after!.stock).toBe(before!.stock - 3);
    });

    it('devuelve el stock al cancelar', async () => {
      const before = await prisma.product.findUnique({ where: { id: 9 } });

      const order = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 9, quantity: 2 }],
          shippingInfo,
          paymentMethod: 'CASH',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/orders/${order.body.id}/cancel`)
        .set('Authorization', `Bearer ${demoToken}`)
        .expect(200);

      const after = await prisma.product.findUnique({ where: { id: 9 } });
      expect(after!.stock).toBe(before!.stock);
    });

    it('no deja cancelar dos veces', async () => {
      const order = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 12, quantity: 1 }],
          shippingInfo,
          paymentMethod: 'CASH',
        })
        .expect(201);

      const url = `/api/orders/${order.body.id}/cancel`;
      await request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${demoToken}`).expect(200);
      await request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${demoToken}`).expect(409);
    });

    it('guarda una foto del producto en la línea de pedido', async () => {
      const order = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 8, quantity: 1 }],
          shippingInfo,
          paymentMethod: 'CASH',
        })
        .expect(201);

      // Sube el precio del catálogo DESPUÉS de comprar.
      await prisma.product.update({ where: { id: 8 }, data: { priceCents: 9999 } });

      const stored = await request(app.getHttpServer())
        .get(`/api/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${demoToken}`)
        .expect(200);

      // El pedido sigue mostrando lo que se cobró, no el precio nuevo.
      expect(stored.body.items[0].price).toBe(39.99);
    });

    it('rechaza datos de envío inválidos', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: { ...shippingInfo, phone: 'no-es-un-telefono' },
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(400);
    });

    it('rechaza un pedido vacío', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .send({ items: [], shippingInfo, paymentMethod: 'CASH' })
        .expect(400);
    });
  });

  // ------------------------------------------------------ aislamiento

  describe('aislamiento entre usuarios', () => {
    it('cada quien solo ve sus pedidos', async () => {
      const mine = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`)
        .expect(200);

      const theirs = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(mine.body.length).toBeGreaterThan(0);
      expect(theirs.body).toHaveLength(0);
    });

    it('un pedido ajeno responde 404, no 403', async () => {
      const mine = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`);

      // 404 a propósito: un 403 confirmaría que ese identificador existe.
      await request(app.getHttpServer())
        .get(`/api/orders/${mine.body[0].id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });

    it('no se puede cancelar un pedido ajeno', async () => {
      const mine = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${demoToken}`);

      await request(app.getHttpServer())
        .patch(`/api/orders/${mine.body[0].id}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });
  });

  // ------------------------------------------------------------ favoritos

  describe('favoritos', () => {
    it('añadir dos veces no duplica', async () => {
      await request(app.getHttpServer())
        .post('/api/wishlist/2')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/wishlist/2')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(201);

      expect(res.body).toEqual([2]);
    });

    it('quitar algo que no está no es un error', async () => {
      await request(app.getHttpServer())
        .delete('/api/wishlist/999')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
    });
  });

  // -------------------------------------------------------------- reseñas

  describe('reseñas', () => {
    it('exige sesión', async () => {
      await request(app.getHttpServer())
        .post('/api/products/6/reviews')
        .send({ rating: 5, comment: 'Sin identificarme' })
        .expect(401);
    });

    it('recalcula la nota media del producto', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products/6/reviews')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ rating: 4, comment: 'Cumple lo que promete' })
        .expect(201);

      expect(res.body.rating).toBe(4);
      expect(res.body.reviews).toHaveLength(1);
    });

    it('reseñar dos veces actualiza en vez de duplicar', async () => {
      await request(app.getHttpServer())
        .post('/api/products/6/reviews')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ rating: 2, comment: 'Lo he usado más y me gusta menos' })
        .expect(201);

      const res = await request(app.getHttpServer()).get('/api/products/6').expect(200);

      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.rating).toBe(2);
    });

    it('rechaza una puntuación fuera de rango', async () => {
      await request(app.getHttpServer())
        .post('/api/products/6/reviews')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ rating: 99, comment: 'Puntuación imposible' })
        .expect(400);
    });
  });
});
