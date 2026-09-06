import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  /**
   * Comprobacion de salud. Toca la base de datos a proposito: un servidor que
   * responde pero no puede consultar no esta sano, y los servicios de hosting
   * usan esto para decidir si el despliegue ha ido bien.
   */
  @Get('health')
  async health(): Promise<{ status: string; database: string; uptime: number }> {
    let database = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
    };
  }
}
