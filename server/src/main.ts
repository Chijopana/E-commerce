import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Cabeceras de seguridad por defecto (nosniff, frameguard, HSTS…).
  app.use(helmet());

  // Todo cuelga de /api: deja libre la raíz por si algún día el mismo proceso
  // sirve también los ficheros estáticos del frontend.
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta cualquier campo que no esté en el DTO. Sin esto, un cliente
      // podría colar `role: "ADMIN"` en el registro y confiar en que algo lo
      // propague hasta la base de datos.
      whitelist: true,
      // Y si manda campos de más, se rechaza en vez de ignorarlos en silencio:
      // suele ser señal de un cliente desactualizado o de alguien probando.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const origins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:4200')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Cierra conexiones de Prisma limpiamente al recibir SIGTERM (lo que manda
  // cualquier plataforma de hosting al redesplegar).
  app.enableShutdownHooks();

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);

  logger.log(`API escuchando en http://localhost:${port}/api`);
  logger.log(`CORS permitido para: ${origins.join(', ')}`);
}

void bootstrap();
