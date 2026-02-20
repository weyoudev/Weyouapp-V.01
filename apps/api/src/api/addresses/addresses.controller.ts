import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/roles.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return this.addressesService.listForCustomer(user);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    const address = await this.addressesService.createForCustomer(user, {
      label: dto.label,
      addressLine: dto.addressLine,
      pincode: dto.pincode,
      isDefault: dto.isDefault,
      googleMapUrl: dto.googleMapUrl,
      houseNo: dto.houseNo,
      streetArea: dto.streetArea,
      city: dto.city,
    });
    return {
      id: address.id,
      pincode: address.pincode,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.updateForCustomer(user, id, {
      ...(dto.label != null && { label: dto.label }),
      ...(dto.addressLine != null && { addressLine: dto.addressLine }),
      ...(dto.pincode != null && { pincode: dto.pincode }),
      ...(dto.isDefault != null && { isDefault: dto.isDefault }),
      ...(dto.googleMapUrl !== undefined && { googleMapUrl: dto.googleMapUrl }),
      ...(dto.houseNo !== undefined && { houseNo: dto.houseNo }),
      ...(dto.streetArea !== undefined && { streetArea: dto.streetArea }),
      ...(dto.city !== undefined && { city: dto.city }),
    });
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.addressesService.deleteForCustomer(user, id);
    return { ok: true };
  }
}
