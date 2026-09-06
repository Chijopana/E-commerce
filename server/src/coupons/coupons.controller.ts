import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CouponsService, CouponView } from './coupons.service';
import { ValidateCouponDto } from './dto/coupons.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  /**
   * Con sesion y con limite de peticiones: sin ninguna de las dos cosas, este
   * endpoint es un oraculo para ir probando codigos hasta dar con uno valido.
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('validate')
  validate(@Body() dto: ValidateCouponDto): Promise<CouponView> {
    return this.couponsService.validate(dto.code);
  }
}
