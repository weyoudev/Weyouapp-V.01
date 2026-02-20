import { Module } from '@nestjs/common';
import { ServiceabilityController } from './serviceability.controller';
import { ServiceabilityService } from './serviceability.service';

@Module({
  controllers: [ServiceabilityController],
  providers: [ServiceabilityService],
})
export class ServiceabilityModule {}
