import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Invoice } from './entities/invoice.entity';
import { Notification } from './entities/notification.entity';

import { InvoicesController } from './invoices/invoices.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { InvoicesService } from './invoices/invoices.service';
import { NotificationsService } from './notifications/notifications.service';
import { OcrService } from './ocr/ocr.service';
import { ClassificationService } from './classification/classification.service';

import databaseConfig from './config/database.config';

// Mock para o repositório
class MockInvoiceRepository {
  private invoices: Invoice[] = [];
  private idCounter = 1;

  async save(invoice: Invoice): Promise<Invoice> {
    if (!invoice.id) {
      invoice.id = this.idCounter++;
      invoice.createdAt = new Date();
      this.invoices.push(invoice);
    } else {
      const index = this.invoices.findIndex((i) => i.id === invoice.id);
      if (index !== -1) {
        this.invoices[index] = {
          ...this.invoices[index],
          ...invoice,
          updatedAt: new Date(),
        };
      }
    }
    return { ...invoice };
  }

  async findOne(options: any): Promise<Invoice | undefined> {
    const id = options.where?.id;
    return this.invoices.find((invoice) => invoice.id === id);
  }

  async find(options?: any): Promise<Invoice[]> {
    // Implementação básica sem filtros
    return [...this.invoices];
  }

  async delete(id: number): Promise<void> {
    const index = this.invoices.findIndex((invoice) => invoice.id === id);
    if (index !== -1) {
      this.invoices.splice(index, 1);
    }
  }

  createQueryBuilder() {
    return {
      andWhere: () => this,
      orderBy: () => this,
      getMany: () => this.invoices,
    };
  }

  update(id: number, data: Partial<Invoice>): Promise<any> {
    const invoice = this.invoices.find((i) => i.id === id);
    if (invoice) {
      Object.assign(invoice, data, { updatedAt: new Date() });
    }
    return Promise.resolve({ affected: invoice ? 1 : 0 });
  }
}

@Module({
  imports: [
    // Configuração
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    // Comentando temporariamente a configuração do banco de dados para teste
    /*
    // Banco de dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

    // Entidades para injeção
    TypeOrmModule.forFeature([Invoice, Notification]),
    */

    // Upload de arquivos
    MulterModule.register({
      dest: './uploads',
    }),

    // Servir arquivos estáticos para o frontend
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'build'),
    }),
  ],
  controllers: [AppController, InvoicesController, NotificationsController],
  providers: [
    AppService,
    InvoicesService,
    OcrService,
    ClassificationService,
    NotificationsService,
    // Fornecer mock do repositório quando o banco de dados está desativado
    {
      provide: 'InvoiceRepository',
      useClass: MockInvoiceRepository,
    },
    // Mock simples para NotificationRepository
    {
      provide: 'NotificationRepository',
      useValue: {
        find: () => [],
        save: (entity) => entity,
        findOne: () => null,
        delete: () => Promise.resolve(),
      },
    },
  ],
})
export class AppModule {}
