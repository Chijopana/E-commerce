import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Prepara una base de datos limpia SOLO para los tests.
 *
 * Se borra y se recrea en cada tanda: los tests comprueban stock y pedidos, y
 * arrastrar datos de una ejecucion anterior los volveria dependientes del orden.
 * Nunca toca dev.db.
 */
export default function globalSetup(): void {
  const dbFile = join(__dirname, '..', 'prisma', 'test.db');
  if (existsSync(dbFile)) unlinkSync(dbFile);

  const env = {
    ...process.env,
    DATABASE_URL: 'file:./test.db',
    JWT_SECRET: 'clave-solo-para-tests',
  };

  execSync('npx prisma migrate deploy', { cwd: join(__dirname, '..'), env, stdio: 'ignore' });
  execSync('npx ts-node prisma/seed.ts', { cwd: join(__dirname, '..'), env, stdio: 'ignore' });

  // Las variables tienen que seguir puestas cuando arranque la aplicacion.
  process.env['DATABASE_URL'] = 'file:./test.db';
  process.env['JWT_SECRET'] = 'clave-solo-para-tests';
}
