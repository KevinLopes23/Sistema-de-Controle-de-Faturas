import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { OcrService } from '../ocr/ocr.service';
import { ClassificationService } from '../classification/classification.service';
import * as fs from 'fs';
import * as path from 'path';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private ocrService: OcrService,
    private classificationService: ClassificationService,
  ) {
    // Garantir que o diretório de uploads existe
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Processa uma nova fatura a partir do arquivo enviado
   * @param file Arquivo de fatura (imagem/PDF)
   * @returns Fatura processada e salva
   */
  async processNewInvoice(file: Express.Multer.File): Promise<Invoice> {
    this.logger.log(`Processando nova fatura: ${file.originalname}`);

    // Salvar o arquivo no sistema
    const filePath = path.join(this.uploadDir, file.filename);

    try {
      // Criar registro inicial da fatura
      let invoice = new Invoice();
      invoice.filename = file.originalname;
      invoice.filePath = filePath;
      invoice.status = 'PROCESSANDO';

      // Salvar fatura inicial
      invoice = await this.invoicesRepository.save(invoice);

      // Extrair texto via OCR
      this.logger.log(
        `Iniciando extração de texto via OCR para a fatura ${invoice.id}`,
      );
      const rawText = await this.ocrService.extractTextFromFile(filePath);
      invoice.rawText = rawText;

      // Log do texto bruto extraído para debug
      this.logger.log(
        `Texto bruto extraído da fatura ${invoice.id}:\n${rawText.substring(0, 300)}...`,
      );

      // Extrair dados estruturados
      this.logger.log(`Extraindo dados estruturados da fatura ${invoice.id}`);
      const extractedData = this.ocrService.extractInvoiceData(rawText);

      // Log dos dados extraídos
      this.logger.log(`Dados extraídos da fatura ${invoice.id}:`);
      this.logger.log(`- Valor: ${extractedData.amount || 'não detectado'}`);
      this.logger.log(
        `- Data de vencimento: ${extractedData.dueDate || 'não detectada'}`,
      );
      this.logger.log(
        `- Data de emissão: ${extractedData.issueDate || 'não detectada'}`,
      );
      this.logger.log(`- Emissor: ${extractedData.issuer || 'não detectado'}`);

      // Atualizar os campos da fatura
      invoice.amount = extractedData.amount || 0;
      invoice.dueDate = extractedData.dueDate || new Date();
      invoice.issueDate = extractedData.issueDate || new Date();
      invoice.issuer = extractedData.issuer || 'Não identificado';

      // Classificar a fatura
      invoice.category =
        this.classificationService.classifyInvoice(rawText, invoice.issuer) ||
        'outros';

      // Atualizar status
      invoice.status = 'PROCESSADO';

      // Salvar fatura atualizada
      const savedInvoice = await this.invoicesRepository.save(invoice);
      this.logger.log(`Fatura ${savedInvoice.id} processada com sucesso`);

      return savedInvoice;
    } catch (error) {
      this.logger.error(
        `Erro ao processar fatura: ${error.message}`,
        error.stack,
      );
      // Em caso de erro, criar fatura com status de erro
      const invoice = new Invoice();
      invoice.filename = file.originalname;
      invoice.filePath = filePath;
      invoice.status = 'ERRO';
      invoice.amount = 0; // Garantir um valor padrão mesmo em caso de erro
      invoice.description = `Erro ao processar: ${error.message}`;
      return this.invoicesRepository.save(invoice);
    }
  }

  /**
   * Busca todas as faturas com opção de filtros
   */
  async findAll(filters?: any): Promise<Invoice[]> {
    const query = this.invoicesRepository.createQueryBuilder('invoice');

    // Aplicar filtros se fornecidos
    if (filters) {
      if (filters.category) {
        query.andWhere('invoice.category = :category', {
          category: filters.category,
        });
      }

      if (filters.paid !== undefined) {
        query.andWhere('invoice.paid = :paid', { paid: filters.paid });
      }

      if (filters.dueDateStart && filters.dueDateEnd) {
        query.andWhere('invoice.dueDate BETWEEN :start AND :end', {
          start: filters.dueDateStart,
          end: filters.dueDateEnd,
        });
      } else if (filters.dueDateStart) {
        query.andWhere('invoice.dueDate >= :start', {
          start: filters.dueDateStart,
        });
      } else if (filters.dueDateEnd) {
        query.andWhere('invoice.dueDate <= :end', { end: filters.dueDateEnd });
      }

      if (filters.minAmount) {
        query.andWhere('invoice.amount >= :minAmount', {
          minAmount: filters.minAmount,
        });
      }

      if (filters.maxAmount) {
        query.andWhere('invoice.amount <= :maxAmount', {
          maxAmount: filters.maxAmount,
        });
      }

      if (filters.search) {
        query.andWhere(
          '(invoice.issuer ILIKE :search OR invoice.description ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }
    }

    // Ordenar por data de vencimento por padrão
    query.orderBy('invoice.dueDate', 'ASC');

    return query.getMany();
  }

  /**
   * Busca faturas com vencimento próximo
   * @param daysAhead Número de dias para considerar próximo
   */
  async findUpcoming(daysAhead: number = 7): Promise<Invoice[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return this.invoicesRepository.find({
      where: {
        dueDate: Between(today, futureDate),
        paid: false,
      },
      order: {
        dueDate: 'ASC',
      },
    });
  }

  /**
   * Busca faturas vencidas
   */
  async findOverdue(): Promise<Invoice[]> {
    const today = new Date();

    return this.invoicesRepository.find({
      where: {
        dueDate: LessThan(today),
        paid: false,
      },
      order: {
        dueDate: 'ASC',
      },
    });
  }

  /**
   * Busca uma fatura por ID
   */
  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Fatura com ID ${id} não encontrada`);
    }
    return invoice;
  }

  /**
   * Atualiza os dados de uma fatura
   */
  async update(id: number, updateData: Partial<Invoice>): Promise<Invoice> {
    await this.findOne(id); // Verifica se existe
    await this.invoicesRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Marca uma fatura como paga
   */
  async markAsPaid(id: number): Promise<Invoice> {
    return this.update(id, { paid: true });
  }

  /**
   * Remove uma fatura
   */
  async remove(id: number): Promise<void> {
    const invoice = await this.findOne(id);

    // Remover arquivo físico se existir
    if (invoice.filePath && fs.existsSync(invoice.filePath)) {
      fs.unlinkSync(invoice.filePath);
    }

    await this.invoicesRepository.delete(id);
  }

  /**
   * Limpa todos os dados do banco (faturas e notificações)
   */
  async limparTodosDados(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Iniciando limpeza de todos os dados');

    try {
      // Usar uma transação para garantir que todas as operações são realizadas ou nenhuma é
      const queryRunner =
        this.invoicesRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Remover notificações com SQL direto para ignorar restrições de chave estrangeira
        await queryRunner.query('TRUNCATE TABLE notification CASCADE');
        this.logger.log('Notificações removidas com sucesso');

        // Obter todas as faturas para remover os arquivos físicos
        const todasFaturas = await this.invoicesRepository.find();

        // Remover arquivos físicos
        for (const fatura of todasFaturas) {
          if (fatura.filePath && fs.existsSync(fatura.filePath)) {
            try {
              fs.unlinkSync(fatura.filePath);
            } catch (error) {
              this.logger.error(`Erro ao remover arquivo: ${fatura.filePath}`);
            }

            // Remover também arquivos de processamento associados
            const dir = path.dirname(fatura.filePath);
            const base = path.basename(fatura.filePath);

            // Procurar por arquivos processados associados
            const arquivosRelacionados = fs
              .readdirSync(dir)
              .filter((file) => file.startsWith(base) || file.includes(base));

            for (const arquivo of arquivosRelacionados) {
              try {
                const caminhoCompleto = path.join(dir, arquivo);
                if (
                  caminhoCompleto !== fatura.filePath &&
                  fs.existsSync(caminhoCompleto)
                ) {
                  fs.unlinkSync(caminhoCompleto);
                }
              } catch (error) {
                this.logger.error(
                  `Erro ao remover arquivo relacionado: ${arquivo}`,
                );
              }
            }
          }
        }

        // Limpar a tabela de faturas usando SQL direto
        await queryRunner.query('TRUNCATE TABLE invoice CASCADE');
        this.logger.log('Faturas removidas com sucesso');

        // Confirmar a transação
        await queryRunner.commitTransaction();

        return {
          success: true,
          message: 'Todos os dados foram excluídos com sucesso!',
        };
      } catch (error) {
        // Se ocorrer um erro, desfazer a transação
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Libera o queryRunner
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Erro ao limpar dados: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Erro ao limpar dados: ${error.message}`,
      };
    }
  }
}
