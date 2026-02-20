import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { WalkInService } from '../services/walk-in.service';
import { WalkInCustomerLookupQueryDto } from '../dto/walk-in-customer-lookup-query.dto';
import { CreateWalkInCustomerDto } from '../dto/create-walk-in-customer.dto';
import { CreateWalkInOrderDto } from '../dto/create-walk-in-order.dto';

@Controller('admin/walk-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS, Role.BILLING)
export class WalkInController {
  constructor(private readonly walkInService: WalkInService) {}

  @Get('customer')
  async lookupCustomer(@Query() query: WalkInCustomerLookupQueryDto) {
    const customer = await this.walkInService.lookupCustomer(query.phone);
    return { customer: customer ?? null };
  }

  @Post('customer')
  async createCustomer(@Body() body: CreateWalkInCustomerDto) {
    const customer = await this.walkInService.createCustomer(
      body.phone,
      body.name,
      body.email,
    );
    return { customer };
  }

  @Post('orders')
  async createOrder(@Body() body: CreateWalkInOrderDto) {
    const order = await this.walkInService.createOrder(body.userId, body.branchId);
    return { order: { id: order.id } };
  }
}
