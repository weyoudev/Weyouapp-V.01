import { Controller, Get, Query } from '@nestjs/common';
import { ServiceabilityService } from './serviceability.service';
import { ServiceabilityQueryDto } from './dto/serviceability-query.dto';

@Controller('serviceability')
export class ServiceabilityController {
  constructor(private readonly serviceabilityService: ServiceabilityService) {}

  @Get()
  async check(@Query() query: ServiceabilityQueryDto) {
    const result = await this.serviceabilityService.check(query.pincode);
    return {
      pincode: query.pincode,
      serviceable: result.serviceable,
      message: result.message,
      ...(result.branchId != null && { branchId: result.branchId }),
      ...(result.branchName != null && { branchName: result.branchName }),
    };
  }
}
