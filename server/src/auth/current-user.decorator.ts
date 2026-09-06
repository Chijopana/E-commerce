import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './jwt.strategy';

/**
 * Uso: `@CurrentUser() user: AuthenticatedUser` en un controlador protegido.
 * Evita tener que escarbar en `request.user` (y perder el tipado por el camino).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser =>
    ctx.switchToHttp().getRequest().user,
);
