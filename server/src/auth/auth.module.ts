import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // `getOrThrow`: si falta la clave el servidor no arranca. Un valor por
        // defecto silencioso aqui significaria firmar tokens con un secreto
        // conocido y publicado en el repositorio.
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // El tipo de `expiresIn` es una plantilla estricta ('7d', '15m'...)
          // y el valor viene de una variable de entorno, que siempre es string.
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '7d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
