import { Controller, Get, Put, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AdminCatalogService } from '../services/admin-catalog.service';
import { UpdateItemWithMatrixDto } from '../dto/update-item-with-matrix.dto';
import { CreateServiceCategoryDto } from '../dto/create-service-category.dto';
import { CreateSegmentCategoryDto } from '../dto/create-segment-category.dto';
import { PatchServiceCategoryDto } from '../dto/patch-service-category.dto';
import { PatchSegmentCategoryDto } from '../dto/patch-segment-category.dto';
import { ImportCatalogDto } from '../dto/import-catalog.dto';

@Controller('admin/catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS)
export class AdminCatalogMatrixController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Get('prices/lookup')
  async getPriceLookup(
    @Query('itemId') itemId: string,
    @Query('segmentCategoryId') segmentCategoryId: string,
    @Query('serviceCategoryId') serviceCategoryId: string,
  ) {
    if (!itemId || !segmentCategoryId || !serviceCategoryId) {
      return { priceRupees: null };
    }
    const result = await this.adminCatalogService.getPriceLookup(
      itemId,
      segmentCategoryId,
      serviceCategoryId,
    );
    return result ?? { priceRupees: null };
  }

  @Get('items')
  async listWithMatrix() {
    const result = await this.adminCatalogService.listItemsWithMatrix();
    return {
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        active: item.active,
        branchIds: (item as { branchIds?: string[] }).branchIds ?? [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        segmentPrices: item.segmentPrices.map((p) => ({
          id: p.id,
          itemId: p.itemId,
          segmentCategoryId: p.segmentCategoryId,
          serviceCategoryId: p.serviceCategoryId,
          priceRupees: p.priceRupees,
          isActive: p.isActive,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      })),
      serviceCategories: result.serviceCategories.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
      segmentCategories: result.segmentCategories.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    };
  }

  @Put('items/:id')
  async updateItemWithMatrix(@Param('id') id: string, @Body() dto: UpdateItemWithMatrixDto) {
    const result = await this.adminCatalogService.updateItemWithMatrix(id, {
      name: dto.name,
      active: dto.active,
      branchIds: dto.branchIds,
      segmentPrices: dto.segmentPrices.map((p) => ({
        segmentCategoryId: p.segmentCategoryId,
        serviceCategoryId: p.serviceCategoryId,
        priceRupees: p.priceRupees,
        isActive: p.isActive ?? true,
      })),
    });
    return {
      item: {
        id: result.item.id,
        name: result.item.name,
        active: result.item.active,
        createdAt: result.item.createdAt,
        updatedAt: result.item.updatedAt,
      },
      segmentPrices: result.segmentPrices.map((p) => ({
        id: p.id,
        itemId: p.itemId,
        segmentCategoryId: p.segmentCategoryId,
        serviceCategoryId: p.serviceCategoryId,
        priceRupees: p.priceRupees,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }

  @Post('segments')
  async createSegmentCategory(@Body() dto: CreateSegmentCategoryDto) {
    const segment = await this.adminCatalogService.createSegmentCategory(
      dto.code,
      dto.label,
      dto.isActive,
    );
    return {
      id: segment.id,
      code: segment.code,
      label: segment.label,
      isActive: segment.isActive,
      createdAt: segment.createdAt,
    };
  }

  @Post('service-categories')
  async createServiceCategory(@Body() dto: CreateServiceCategoryDto) {
    const category = await this.adminCatalogService.createServiceCategory(
      dto.code,
      dto.label,
      dto.isActive,
    );
    return {
      id: category.id,
      code: category.code,
      label: category.label,
      isActive: category.isActive,
      createdAt: category.createdAt,
    };
  }

  @Patch('service-categories/:id')
  async updateServiceCategory(@Param('id') id: string, @Body() dto: PatchServiceCategoryDto) {
    const category = await this.adminCatalogService.updateServiceCategory(id, {
      label: dto.label,
      isActive: dto.isActive,
    });
    return {
      id: category.id,
      code: category.code,
      label: category.label,
      isActive: category.isActive,
      createdAt: category.createdAt,
    };
  }

  @Delete('service-categories/:id')
  async deleteServiceCategory(@Param('id') id: string) {
    await this.adminCatalogService.deleteServiceCategory(id);
    return { success: true };
  }

  @Patch('segments/:id')
  async updateSegmentCategory(@Param('id') id: string, @Body() dto: PatchSegmentCategoryDto) {
    const segment = await this.adminCatalogService.updateSegmentCategory(id, {
      label: dto.label,
      isActive: dto.isActive,
    });
    return {
      id: segment.id,
      code: segment.code,
      label: segment.label,
      isActive: segment.isActive,
      createdAt: segment.createdAt,
    };
  }

  @Delete('segments/:id')
  async deleteSegmentCategory(@Param('id') id: string) {
    await this.adminCatalogService.deleteSegmentCategory(id);
    return { success: true };
  }

  @Post('import')
  async importCatalog(@Body() dto: ImportCatalogDto) {
    return this.adminCatalogService.importCatalog(dto.content);
  }

  @Get('import/sample')
  async getImportSample() {
    const csv = this.adminCatalogService.getImportSampleCsv();
    return { content: csv };
  }
}