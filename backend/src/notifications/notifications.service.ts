import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { Invoice } from '../entities/invoice.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      relations: ['invoice'],
      order: { scheduleDate: 'DESC' },
    });
  }

  async findPending(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        sent: false,
        scheduleDate: LessThan(new Date()),
      },
      relations: ['invoice'],
    });
  }

  async createNotification(
    invoice: Invoice,
    type: string,
    scheduleDate: Date,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      invoiceId: invoice.id,
      type,
      scheduleDate,
      message: this.generateMessage(invoice, type),
    });
    return this.notificationsRepository.save(notification);
  }

  async sendNotification(id: number): Promise<{ success: boolean }> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });

    if (!notification || notification.sent) {
      return { success: false };
    }

    // Aqui você pode implementar o envio real de email
    console.log(`Enviando notificação: ${notification.message}`);

    notification.sent = true;
    notification.processedAt = new Date();
    await this.notificationsRepository.save(notification);

    return { success: true };
  }

  @Cron('0 * * * *') // Executa a cada hora
  async processPendingNotifications() {
    const pendingNotifications = await this.findPending();

    for (const notification of pendingNotifications) {
      await this.sendNotification(notification.id);
    }
  }

  async checkValueLimits(invoice: Invoice): Promise<void> {
    const limitsMap = {
      energia: 300,
      agua: 200,
      internet: 150,
      telefone: 100,
      aluguel: 1500,
      condominio: 800,
      streaming: 100,
      cartao: 2000,
      seguro: 500,
      educacao: 1000,
      saude: 800,
      transporte: 500,
      outros: 300,
    };

    const category = invoice.category || 'outros';
    const limit = limitsMap[category] || limitsMap['outros'];

    if (invoice.amount > limit) {
      await this.createNotification(invoice, 'LIMITE_EXCEDIDO', new Date());
    }
  }

  private generateMessage(invoice: Invoice, type: string): string {
    switch (type) {
      case 'VENCIMENTO':
        return `Fatura ${invoice.filename} vence em ${invoice.dueDate}`;
      case 'LIMITE_EXCEDIDO':
        return `Fatura ${invoice.filename} excede o limite estabelecido`;
      default:
        return `Notificação para fatura ${invoice.filename}`;
    }
  }
}
