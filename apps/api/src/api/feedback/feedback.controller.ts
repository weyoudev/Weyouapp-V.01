import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/roles.guard';
import { FeedbackService } from './feedback.service';
import { CreateGeneralFeedbackDto } from './dto/create-general-feedback.dto';
import { CreateAreaRequestDto } from './dto/create-area-request.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /** Public: customer requests service for their area (no auth). Shown in admin Feedback section. */
  @Post('area-request')
  async createAreaRequest(@Body() dto: CreateAreaRequestDto) {
    const feedback = await this.feedbackService.createAreaRequest({
      pincode: dto.pincode,
      addressLine: dto.addressLine,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
    });
    return {
      id: feedback.id,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async createGeneral(@CurrentUser() user: AuthUser, @Body() dto: CreateGeneralFeedbackDto) {
    const feedback = await this.feedbackService.createGeneral(user, {
      rating: dto.rating,
      tags: dto.tags,
      message: dto.message,
    });
    return {
      id: feedback.id,
      type: feedback.type,
      rating: feedback.rating,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async listMy(@CurrentUser() user: AuthUser) {
    const list = await this.feedbackService.listForCustomer(user);
    return list.map((f) => ({
      id: f.id,
      orderId: f.orderId,
      type: f.type,
      rating: f.rating,
      tags: f.tags,
      message: f.message,
      status: f.status,
      createdAt: f.createdAt,
    }));
  }
}
