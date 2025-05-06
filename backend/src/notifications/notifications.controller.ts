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
  async findAll() {
    return this.notificationsService.findAll();
  }

  @Get('pending')
  async findPending() {
    return this.notificationsService.findPending();
  }

  @Post(':id/send')
  async sendNotification(@Param('id', ParseIntPipe) id: number) {
    // Buscar a notificação pelo ID
    const notifications = await this.notificationsService.findAll();
    const notification = notifications.find((n) => n.id === id);

    if (!notification) {
      throw new Error(`Notificação ${id} não encontrada`);
    }

    // Enviar a notificação
    await this.notificationsService.sendNotification(notification);

    return { success: true, message: 'Notificação enviada com sucesso' };
  }
}
