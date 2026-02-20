import { Controller, Get, Post, Patch, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AdminCatalogService } from '../services/admin-catalog.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { PatchItemDto } from '../dto/patch-item.dto';
import { PutItemPricesDto } from '../dto/put-item-prices.dto';

@Controller('admin/items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS)
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get()
  async list(@Query('withPrices') withPrices?: string) {
    return this.adminCatalogService.listItems(withPrices === 'true' || withPrices === '1');
  }

  @Post()
  async create(@Body() dto: CreateItemDto) {
    const item = await this.adminCatalogService.createItem(
      dto.name,
      dto.active ?? true,
    );
    return { id: item.id, name: item.name, active: item.active };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: PatchItemDto) {
    const item = await this.adminCatalogService.updateItem(id, {
      name: dto.name,
      active: dto.active,
    });
    return { id: item.id, name: item.name, active: item.active };
  }

  @Put(':id/prices')
  async putPrices(@Param('id') id: string, @Body() dto: PutItemPricesDto) {
    const prices = await this.adminCatalogService.upsertItemPrices(
      id,
      dto.prices.map((p) => ({
        serviceType: p.serviceType,
        unitPricePaise: p.unitPricePaise,
        active: p.active,
      })),
    );
    return prices.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      serviceType: p.serviceType,
      unitPricePaise: p.unitPricePaise,
      active: p.active,
    }));
  }
}
