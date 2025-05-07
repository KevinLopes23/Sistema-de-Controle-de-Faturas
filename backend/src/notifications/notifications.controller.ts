import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Get('pending')
  async findPending(): Promise<Notification[]> {
    return this.notificationsService.findPending();
  }

  @Post(':id/send')
  async sendNotification(
    @Param('id') id: number,
  ): Promise<{ success: boolean }> {
    return this.notificationsService.sendNotification(id);
  }
}
