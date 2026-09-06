import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Limite global de peticiones. Los endpoints sensibles (login, registro,
    // cupones) lo aprietan mas con su propio @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    PrismaModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    WishlistModule,
  ],
  controllers: [AppController],
  providers: [
    // Se registra como guard global para que aplique tambien a las rutas que
    // se anadan en el futuro sin tener que acordarse de ponerlo.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
