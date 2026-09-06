import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService, PagedProducts, ProductView } from './products.service';
import { CreateReviewDto, QueryProductsDto } from './dto/products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // El catalogo es publico: se puede mirar la tienda sin cuenta.
  @Get()
  findAll(@Query() query: QueryProductsDto): Promise<PagedProducts> {
    return this.productsService.findAll(query);
  }

  // Va antes que ':id' a proposito: si no, "categories" entraria por la ruta
  // con parametro y fallaria al convertirlo a numero.
  @Get('categories')
  getCategories(): Promise<string[]> {
    return this.productsService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductView> {
    return this.productsService.findOne(id);
  }

  /** Resenar exige sesion: si no, cualquiera podria inflar la nota media. */
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  addReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProductView> {
    return this.productsService.addReview(id, user.id, dto);
  }
}
