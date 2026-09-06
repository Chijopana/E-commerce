import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Datos de arranque.
 *
 * Vive dentro de `src/` a propósito: así se compila a `dist/` y el contenedor
 * puede ejecutarlo sin arrastrar `ts-node` a la imagen de producción. El
 * `Dockerfile` lo lanza en cada arranque, después de las migraciones.
 *
 * Es idempotente: usa `upsert` en todo, así que se puede ejecutar las veces
 * que haga falta sin duplicar catálogo ni chocar contra índices únicos. El
 * stock NO se toca si el producto ya existe, para no deshacer las compras
 * reales cada vez que el servidor se reinicia. Para dejarlo todo como recién
 * instalado está `npm run db:reset`.
 */

const CATEGORIES = {
  ELECTRONICS: 'Electrónica',
  ACCESSORIES: 'Accesorios',
  SPORTS: 'Deportes',
  HOME: 'Hogar',
} as const;

const products = [
  {
    id: 1,
    name: 'Auriculares Inalámbricos Premium',
    description:
      'Auriculares con cancelación de ruido activa, batería de 30 horas y calidad de sonido Hi-Fi.',
    priceCents: 8999,
    image: 'assets/images/auriculares.jpg',
    stock: 12,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 2,
    name: 'Smartwatch Deportivo Pro',
    description:
      'Monitoriza tu salud 24/7: frecuencia cardíaca, oxígeno en sangre, sueño y 100+ modos deportivos.',
    priceCents: 19999,
    image: 'assets/images/smartwatch.jpg',
    stock: 7,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 3,
    name: 'Mochila Antirrobo Inteligente',
    description:
      'Diseño ergonómico con puerto USB, compartimentos secretos y material impermeable.',
    priceCents: 5999,
    image: 'assets/images/mochila.jpg',
    stock: 15,
    category: CATEGORIES.ACCESSORIES,
  },
  {
    id: 4,
    name: 'Altavoz Bluetooth Resistente',
    description: 'Sonido 360°, resistente al agua IP67, batería de 24 horas.',
    priceCents: 4599,
    image: 'assets/images/altavoz.jpg',
    stock: 8,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 5,
    name: 'Cámara Web 4K Ultra HD',
    description:
      'Cámara profesional para streaming con micrófono incorporado y enfoque automático.',
    priceCents: 12999,
    image: 'https://placehold.co/600x450/5b4bd6/fff?text=Camara+4K',
    stock: 5,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 6,
    name: 'Teclado Mecánico RGB',
    description:
      'Teclado gaming con switches mecánicos, iluminación RGB personalizable y reposamuñecas.',
    priceCents: 8999,
    image: 'https://placehold.co/600x450/7c3aed/fff?text=Teclado+RGB',
    stock: 10,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 7,
    name: 'Botella Térmica Inteligente',
    description: 'Mantiene bebidas frías 24h o calientes 12h, con recordatorio de hidratación.',
    priceCents: 3499,
    image: 'https://placehold.co/600x450/0891b2/fff?text=Botella',
    stock: 20,
    category: CATEGORIES.SPORTS,
  },
  {
    id: 8,
    name: 'Lámpara LED de Escritorio',
    description: 'Lámpara con 3 modos de luz, puerto USB de carga y brazo flexible.',
    priceCents: 3999,
    image: 'https://placehold.co/600x450/ea580c/fff?text=Lampara',
    stock: 12,
    category: CATEGORIES.HOME,
  },
  {
    id: 9,
    name: 'Mouse Ergonómico Inalámbrico',
    description: 'Diseño ergonómico vertical para reducir la fatiga, 6 botones programables.',
    priceCents: 2999,
    image: 'https://placehold.co/600x450/9333ea/fff?text=Mouse',
    stock: 18,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 10,
    name: 'Cargador Inalámbrico 3 en 1',
    description:
      'Carga simultánea de teléfono, smartwatch y auriculares. Compatible con todos los dispositivos.',
    priceCents: 4999,
    image: 'https://placehold.co/600x450/475569/fff?text=Cargador',
    stock: 14,
    category: CATEGORIES.ELECTRONICS,
  },
  {
    id: 11,
    name: 'Funda para Portátil Acolchada',
    description: 'Protección premium para portátiles de 13-15 pulgadas con bolsillos adicionales.',
    priceCents: 2499,
    image: 'https://placehold.co/600x450/78716c/fff?text=Funda',
    stock: 25,
    category: CATEGORIES.ACCESSORIES,
  },
  {
    id: 12,
    name: 'Pulsera Fitness Tracker',
    description: 'Monitoreo de actividad, sueño y notificaciones. Batería de 7 días.',
    priceCents: 3999,
    image: 'https://placehold.co/600x450/e11d48/fff?text=Pulsera',
    stock: 16,
    category: CATEGORIES.SPORTS,
  },
];

const coupons = [
  { code: 'DESCUENTO10', discountPercent: 10 },
  { code: 'BIENVENIDO15', discountPercent: 15 },
  { code: 'VIP20', discountPercent: 20 },
];

async function main(): Promise<void> {
  console.log('Sembrando la base de datos…');

  // --- Usuarios --------------------------------------------------------
  // La contraseña se guarda hasheada también aquí: el seed no es excusa para
  // meter una en claro en la base de datos.
  const demoPassword = await bcrypt.hash('demo123', 12);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@ecommerce.com' },
    update: { password: demoPassword },
    create: {
      email: 'demo@ecommerce.com',
      password: demoPassword,
      name: 'Usuario Demo',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'maria@ejemplo.com' },
    update: {},
    create: {
      email: 'maria@ejemplo.com',
      password: await bcrypt.hash('maria123', 12),
      name: 'María G.',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
  });

  console.log(`  usuarios: ${demo.email}, ${reviewer.email}`);

  // --- Catálogo --------------------------------------------------------
  for (const product of products) {
    const { stock, ...withoutStock } = product;

    await prisma.product.upsert({
      where: { id: product.id },
      // Sin `stock`: si el producto ya existe, se refrescan nombre, precio o
      // imagen, pero las unidades vendidas siguen descontadas.
      update: withoutStock,
      create: product,
    });
  }

  console.log(`  productos: ${products.length}`);

  // --- Reseñas de ejemplo ----------------------------------------------
  const sampleReviews = [
    { productId: 1, userId: demo.id, rating: 4, comment: 'Muy buenos, la batería dura mucho.' },
    { productId: 1, userId: reviewer.id, rating: 5, comment: 'Excelente calidad de sonido.' },
    { productId: 2, userId: reviewer.id, rating: 5, comment: 'Perfecto para hacer ejercicio.' },
    { productId: 4, userId: demo.id, rating: 5, comment: 'Increíble para la playa.' },
  ];

  for (const review of sampleReviews) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: review.productId, userId: review.userId } },
      update: { rating: review.rating, comment: review.comment },
      create: review,
    });
  }

  // Se recalcula la media denormalizada de cada producto reseñado.
  const reviewedIds = [...new Set(sampleReviews.map(r => r.productId))];
  for (const productId of reviewedIds) {
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: Math.round((stats._avg.rating ?? 0) * 10) / 10,
        ratingCount: stats._count,
      },
    });
  }

  console.log(`  reseñas: ${sampleReviews.length}`);

  // --- Cupones ---------------------------------------------------------
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { discountPercent: coupon.discountPercent, active: true },
      create: coupon,
    });
  }

  console.log(`  cupones: ${coupons.map(c => c.code).join(', ')}`);
  console.log('Listo. Entra con demo@ecommerce.com / demo123');
}

main()
  .catch(error => {
    console.error('El seed ha fallado:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
