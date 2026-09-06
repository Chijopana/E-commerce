import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: el acceso a datos lo necesitan casi todos los modulos y no aporta
// nada tener que importarlo uno por uno.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
