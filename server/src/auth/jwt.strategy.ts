import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

/** Lo que queda colgado en `request.user` tras validar el token. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Se consulta el usuario en cada peticion en vez de fiarse de lo que trae el
   * token. Un token sigue siendo valido hasta que caduca, asi que si la cuenta
   * se borra por el camino hay que rechazarlo igualmente.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }

    return user;
  }
}
