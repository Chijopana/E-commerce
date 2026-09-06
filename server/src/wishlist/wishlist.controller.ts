import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<number[]> {
    return this.wishlistService.getIds(user.id);
  }

  @Post(':productId')
  add(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<number[]> {
    return this.wishlistService.add(user.id, productId);
  }

  @Delete(':productId')
  remove(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<number[]> {
    return this.wishlistService.remove(user.id, productId);
  }
}
