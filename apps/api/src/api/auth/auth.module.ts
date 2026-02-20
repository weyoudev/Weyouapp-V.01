import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  controllers: [AuthController, MeController],
  providers: [AuthService, MeService],
})
export class AuthModule {}

