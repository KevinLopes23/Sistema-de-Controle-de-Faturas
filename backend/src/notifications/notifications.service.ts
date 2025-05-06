import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Equal } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { Invoice } from '../entities/invoice.entity';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { InvoicesService } from '../invoices/invoices.service';
import * as AgendaJS from 'agenda';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;
  private agenda: any; // Usando any temporariamente para contornar o problema de tipagem

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private configService: ConfigService,
    private invoicesService: InvoicesService,
  ) {
    // Configuração do nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: this.configService.get('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });

    // Configuração do Agenda
    this.agenda = new AgendaJS.Agenda({
      db: {
        address:
          this.configService.get('MONGODB_URI') ||
          'mongodb://localhost/invoice-system',
      },
    });

    this.setupAgenda();
  }

  private async setupAgenda() {
    // Aguardar a conexão do agenda
    await this.agenda.start();

    // Definir job para processamento de notificações
    this.agenda.define('check-pending-notifications', async (job) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar notificações programadas para hoje que ainda não foram enviadas
        const notifications = await this.notificationsRepository.find({
          where: {
            scheduleDate: Equal(today),
            sent: false,
          },
          relations: ['invoice'],
        });

        this.logger.log(
          `Processando ${notifications.length} notificações pendentes`,
        );

        // Processar cada notificação
        for (const notification of notifications) {
          await this.sendNotification(notification);
        }
      } catch (error) {
        this.logger.error('Erro ao processar notificações', error.stack);
      }
    });

    // Programar verificação diária de notificações (às 8 da manhã)
    this.agenda.every('0 8 * * *', 'check-pending-notifications');

    // Definir job para criar notificações de vencimento
    this.agenda.define('create-due-date-notifications', async () => {
      try {
        // Buscar faturas com vencimento em 2 dias
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
        twoDaysFromNow.setHours(0, 0, 0, 0);

        const invoices = await this.invoicesRepository.find({
          where: {
            dueDate: Equal(twoDaysFromNow),
            paid: false,
          },
        });

        this.logger.log(
          `Criando notificações para ${invoices.length} faturas com vencimento próximo`,
        );

        // Criar notificações para cada fatura
        for (const invoice of invoices) {
          await this.createDueDateNotification(invoice);
        }
      } catch (error) {
        this.logger.error(
          'Erro ao criar notificações de vencimento',
          error.stack,
        );
      }
    });

    // Executar diariamente às 7 da manhã
    this.agenda.every('0 7 * * *', 'create-due-date-notifications');
  }

  /**
   * Cria uma notificação de vencimento para uma fatura
   */
  async createDueDateNotification(invoice: Invoice): Promise<Notification> {
    const notification = new Notification();
    notification.invoiceId = invoice.id;
    notification.type = 'VENCIMENTO';
    notification.scheduleDate = new Date();
    notification.emailTo = this.configService.get('DEFAULT_NOTIFICATION_EMAIL');
    notification.sent = false;
    notification.message = `A fatura ${invoice.issuer || 'sem emissor'} no valor de R$ ${invoice.amount} vence em 2 dias (${invoice.dueDate.toLocaleDateString('pt-BR')}).`;

    return this.notificationsRepository.save(notification);
  }

  /**
   * Cria uma notificação para uma fatura que excedeu um valor limite
   */
  async createExceedLimitNotification(
    invoice: Invoice,
    limit: number,
  ): Promise<Notification> {
    const notification = new Notification();
    notification.invoiceId = invoice.id;
    notification.type = 'LIMITE_EXCEDIDO';
    notification.scheduleDate = new Date();
    notification.emailTo = this.configService.get('DEFAULT_NOTIFICATION_EMAIL');
    notification.sent = false;
    notification.message = `Alerta: A fatura ${invoice.issuer || 'sem emissor'} possui valor de R$ ${invoice.amount}, que excede o limite de R$ ${limit} para a categoria ${invoice.category}.`;

    return this.notificationsRepository.save(notification);
  }

  /**
   * Envia uma notificação
   */
  async sendNotification(notification: Notification): Promise<void> {
    try {
      if (!notification.emailTo) {
        throw new Error('Email de destino não definido');
      }

      // Enviar e-mail
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM') || 'sistema@faturas.com',
        to: notification.emailTo,
        subject: `Notificação: ${notification.type === 'VENCIMENTO' ? 'Fatura com vencimento próximo' : 'Alerta de valor excedido'}`,
        text: notification.message,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2c3e50;">${notification.type === 'VENCIMENTO' ? 'Aviso de Vencimento' : 'Alerta de Valor Excedido'}</h2>
          <p>${notification.message}</p>
          <p>Acesse o sistema para mais detalhes.</p>
        </div>`,
      });

      // Marcar como enviada
      notification.sent = true;
      await this.notificationsRepository.save(notification);

      this.logger.log(`Notificação ${notification.id} enviada com sucesso`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação ${notification.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verifica limites de valor para criar notificações
   * Chamado após o processamento OCR de uma nova fatura
   */
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
      await this.createExceedLimitNotification(invoice, limit);
      this.logger.log(
        `Criada notificação de limite excedido para fatura ${invoice.id}`,
      );
    }
  }

  /**
   * Busca todas as notificações
   */
  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      relations: ['invoice'],
      order: {
        scheduleDate: 'DESC',
      },
    });
  }

  /**
   * Busca notificações pendentes
   */
  async findPending(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        sent: false,
      },
      relations: ['invoice'],
      order: {
        scheduleDate: 'ASC',
      },
    });
  }
}
