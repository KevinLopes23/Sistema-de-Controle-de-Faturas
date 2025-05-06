import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../entities/invoice.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadInvoice(@UploadedFile() file: Express.Multer.File) {
    const invoice = await this.invoicesService.processNewInvoice(file);

    // Verificar limites e criar notificações se necessário
    await this.notificationsService.checkValueLimits(invoice);

    return invoice;
  }

  @Get()
  async findAll(@Query() query) {
    return this.invoicesService.findAll({
      category: query.category,
      paid: query.paid === 'true',
      dueDateStart: query.dueDateStart,
      dueDateEnd: query.dueDateEnd,
      minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      search: query.search,
    });
  }

  @Get('upcoming')
  async findUpcoming(@Query('days') days?: string) {
    return this.invoicesService.findUpcoming(days ? parseInt(days) : 7);
  }

  @Get('overdue')
  async findOverdue() {
    return this.invoicesService.findOverdue();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceData: Partial<Invoice>,
  ) {
    return this.invoicesService.update(id, updateInvoiceData);
  }

  @Patch(':id/mark-paid')
  async markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.markAsPaid(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.remove(id);
  }
}
