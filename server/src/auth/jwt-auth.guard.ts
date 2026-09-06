import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige un `Authorization: Bearer <token>` valido. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
