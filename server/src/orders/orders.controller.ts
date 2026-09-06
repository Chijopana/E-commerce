import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrdersService, OrderView } from './orders.service';
import { CreateOrderDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

// El guard va en la clase: todo lo que hay aqui son datos personales, asi que
// ninguna ruta debe quedarse abierta por descuido al anadir metodos nuevos.
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderView> {
    return this.ordersService.create(user.id, dto);
  }

  /** Solo los pedidos de quien pregunta; el id de usuario sale del token. */
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<OrderView[]> {
    return this.ordersService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderView> {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderView> {
    return this.ordersService.cancel(id, user.id);
  }
}
