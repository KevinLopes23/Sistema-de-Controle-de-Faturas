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
import { Logger } from '@nestjs/common';

@Controller('invoices')
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

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
      // Filtrar arquivos permitidos
      fileFilter: (req, file, cb) => {
        // Verificar se é um formato permitido (PDF ou imagens)
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype.startsWith('image/')
        ) {
          const isPdf = file.mimetype === 'application/pdf';

          // Adicionar informação se é PDF ao request para logging
          if (req.body) {
            req.body.isPdf = isPdf;
          }

          cb(null, true);
        } else {
          cb(
            new Error(
              'Formato não suportado. Envie apenas PDF ou imagens (JPG, PNG, etc)',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadInvoice(@UploadedFile() file: Express.Multer.File, @Body() body) {
    try {
      if (!file) {
        return {
          success: false,
          message: 'Nenhum arquivo enviado ou formato não suportado',
        };
      }

      // Verificar se é um PDF para dar feedback mais específico
      const isPdf = body?.isPdf || file.mimetype === 'application/pdf';

      // Log do início do processamento
      if (isPdf) {
        this.logger.log(
          `Iniciando processamento do arquivo PDF: ${file.originalname}`,
        );
      } else {
        this.logger.log(
          `Iniciando processamento do arquivo: ${file.originalname}`,
        );
      }

      const invoice = await this.invoicesService.processNewInvoice(file);

      // Verificar limites e criar notificações se necessário
      await this.notificationsService.checkValueLimits(invoice);

      // Verifica se o OCR conseguiu identificar dados importantes
      const missingData = [];
      if (!invoice.amount) missingData.push('valor');
      if (!invoice.dueDate) missingData.push('data de vencimento');
      if (!invoice.issuer) missingData.push('emissor');

      // Feedback específico para PDFs
      let warnings = null;
      if (missingData.length > 0) {
        warnings = `Não foi possível identificar: ${missingData.join(', ')}`;

        // Adicionar mensagem adicional para PDFs
        if (isPdf) {
          warnings +=
            '. Para melhor reconhecimento de PDFs, certifique-se que o ImageMagick está instalado no servidor.';
        }
      }

      // Retorna os avisos sobre dados faltantes juntamente com a fatura
      return {
        success: true,
        invoice,
        warnings,
        isPdf,
      };
    } catch (error) {
      this.logger.error(`Erro no upload: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Erro ao processar fatura: ${error.message}`,
      };
    }
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

  @Delete('admin/limpar-dados')
  async limparTodosDados() {
    return this.invoicesService.limparTodosDados();
  }
}
