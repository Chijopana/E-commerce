import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

/** Lo que se devuelve al cliente. Nunca incluye el hash. */
export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    avatar: string | null;
  };
}

@Injectable()
export class AuthService {
  /**
   * Coste de bcrypt. 12 rondas son unos ~250 ms en hardware normal: caro para
   * quien intente fuerza bruta, imperceptible en un login legítimo.
   */
  private static readonly SALT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Ese email ya está registrado');
    }

    const password = await bcrypt.hash(dto.password, AuthService.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        name: dto.name,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(dto.email)}`,
      },
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Se compara el hash aunque el usuario no exista, con un hash de descarte.
    // Si se devolviera antes, el tiempo de respuesta delataría qué emails están
    // registrados y cuáles no.
    const hash = user?.password ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu';
    const valid = await bcrypt.compare(dto.password, hash);

    if (!user || !valid) {
      // Mensaje único a propósito: decir "el email no existe" es filtrar
      // quién tiene cuenta en la tienda.
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    return this.buildResponse(user);
  }

  private buildResponse(user: {
    id: number;
    email: string;
    name: string;
    avatar: string | null;
  }): AuthResponse {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }
}
