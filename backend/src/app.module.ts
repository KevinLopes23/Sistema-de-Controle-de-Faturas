import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

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
import aiConfig from './config/ai.config';

@Module({
  imports: [
    // Configuração
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, aiConfig],
    }),

    // Agendamento de tarefas
    ScheduleModule.forRoot(),

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
  ],
})
export class AppModule {}
