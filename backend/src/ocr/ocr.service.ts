import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Tesseract from 'tesseract.js';
import * as sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';

const execAsync = promisify(exec);

// Modo de demonstração - Desativado completamente
const DEMO_MODE = false;

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly useAiOcr: boolean = false;

  constructor(private configService: ConfigService) {
    // Inicializar o cliente do Gemini AI se a chave estiver configurada
    const geminiApiKey = this.configService.get<string>('ai.geminiApiKey');
    this.useAiOcr = this.configService.get<boolean>('ai.useAiOcr', false);

    if (geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.logger.log('Cliente Gemini AI inicializado com sucesso');
      } catch (error) {
        this.logger.error(`Erro ao inicializar Gemini AI: ${error.message}`);
        this.genAI = null;
      }
    } else {
      this.logger.warn(
        'Chave do Gemini AI não configurada, usando apenas OCR tradicional',
      );
    }
  }

  /**
   * Converte PDF para imagem usando ferramentas externas
   * @param pdfPath Caminho do arquivo PDF
   * @returns Caminho da imagem convertida
   */
  private async convertPdfToImage(pdfPath: string): Promise<string> {
    try {
      this.logger.log(`Convertendo PDF para imagem: ${pdfPath}`);

      // Caminho para salvar a imagem
      const outputImagePath = `${pdfPath}_page1.png`;

      // Em sistemas Windows, podemos usar o comando magick do ImageMagick
      // Se ImageMagick não estiver instalado, será necessário instalá-lo
      if (os.platform() === 'win32') {
        try {
          // Verificar se ImageMagick está instalado
          await execAsync('magick -version');

          // Convert PDF primeira página para imagem
          await execAsync(
            `magick convert -density 300 "${pdfPath}[0]" -quality 100 "${outputImagePath}"`,
          );
          this.logger.log(`PDF convertido para imagem em: ${outputImagePath}`);

          return outputImagePath;
        } catch (error) {
          // Se ImageMagick não estiver disponível, usar alternativa
          this.logger.warn(
            `ImageMagick não está instalado. Usando método alternativo.`,
          );
          // Como não conseguimos converter o PDF, vamos gerar uma mensagem explicativa
          const tempPath = `${pdfPath}_fallback.png`;

          // Criar uma imagem simples com texto explicativo
          await sharp({
            create: {
              width: 800,
              height: 600,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
          })
            .png()
            .toFile(tempPath);

          this.logger.warn(
            'Não foi possível converter o PDF. Para resolver, instale o ImageMagick.',
          );
          return tempPath;
        }
      } else {
        // Em sistemas Linux/Mac (assumindo que pdftoppm está disponível)
        try {
          await execAsync(
            `pdftoppm -png -singlefile -r 300 "${pdfPath}" "${pdfPath}_page"`,
          );
          this.logger.log(`PDF convertido para imagem em: ${outputImagePath}`);
          return outputImagePath;
        } catch (error) {
          this.logger.error(`Erro ao converter PDF: ${error.message}`);
          throw new Error(
            `Falha ao converter PDF para imagem: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Erro na conversão de PDF: ${error.message}`);
      throw new Error(`Falha ao processar arquivo PDF: ${error.message}`);
    }
  }

  /**
   * Pré-processa a imagem para melhorar resultados do OCR
   * @param filePath Caminho do arquivo a ser processado
   * @returns Caminho do arquivo pré-processado
   */
  private async preprocessImage(filePath: string): Promise<string> {
    try {
      // Verifica se é um PDF - Se for, converte para imagem primeiro
      if (path.extname(filePath).toLowerCase() === '.pdf') {
        this.logger.log(
          `Arquivo PDF detectado. Iniciando conversão para imagem.`,
        );
        const imagePath = await this.convertPdfToImage(filePath);
        return this.preprocessImage(imagePath); // Processar a imagem convertida
      }

      const outputPath = filePath + '_processed.png';

      this.logger.log(
        `Iniciando pré-processamento avançado da imagem: ${filePath}`,
      );

      // Análise prévia para verificar a claridade da imagem
      const metadata = await sharp(filePath).metadata();

      // Para cada tipo de imagem, usamos estratégias diferentes
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        // JPEG costuma ter mais ruído, então focamos em claridade e contraste
        await sharp(filePath)
          // Converter para escala de cinza
          .grayscale()
          // Aumentar contraste
          .normalize()
          // Ajustar níveis de entrada para melhorar contraste em áreas críticas
          .linear(1.2, -20) // Aumentar contraste ligeiramente
          // Remover ruído e melhorar nitidez
          .sharpen({ sigma: 1.3, m1: 0.5, m2: 0.5 })
          // Redimensionar mantendo proporções, mas garantindo tamanho mínimo
          .resize(2500, 3500, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          // Binarização adaptativa (bom para texto)
          .threshold(160)
          // Salvar a imagem processada
          .toFile(outputPath);
      } else {
        // Para outros formatos (PNG, etc)
        await sharp(filePath)
          // Converter para escala de cinza
          .grayscale()
          // Aumentar contraste
          .normalize()
          // Ajustar brilho/contraste para destacar o texto
          .modulate({
            brightness: 1.05,
            saturation: 0.5,
          })
          // Nitidez mais forte para números
          .sharpen({ sigma: 1.5, m1: 1.0, m2: 0.5 })
          // Redimensionar para tamanho ideal para OCR
          .resize(2500, 3500, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          // Threshold para binarização (separa texto do fundo)
          .threshold(157)
          // Salvar a imagem processada
          .toFile(outputPath);
      }

      this.logger.log(`Imagem pré-processada com sucesso: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(`Erro no pré-processamento: ${error.message}`);
      // Em caso de erro no pré-processamento, retorna a imagem original
      return filePath;
    }
  }

  /**
   * Extrai texto de uma imagem ou PDF usando OCR
   * @param filePath Caminho do arquivo a ser processado
   * @returns Texto extraído do documento
   */
  async extractTextFromFile(filePath: string): Promise<string> {
    try {
      this.logger.log(`Iniciando OCR para o arquivo: ${filePath}`);

      // Pré-processar a imagem para melhorar o OCR
      const processedFilePath = await this.preprocessImage(filePath);

      // OCR usando Tesseract.js otimizado para detecção de texto e valores
      const {
        data: { text },
      } = await Tesseract.recognize(
        processedFilePath,
        'por+eng', // português + inglês para melhor reconhecimento
        {
          logger: (m) =>
            this.logger.log(
              `Tesseract: ${m.status} (${m.progress?.toFixed(2) || 0})`,
            ),
        },
      );

      // Remover arquivo temporário se for diferente do original
      if (processedFilePath !== filePath && fs.existsSync(processedFilePath)) {
        fs.unlinkSync(processedFilePath);
      }

      this.logger.log('Texto extraído pelo OCR:\n' + text);

      // Pós-processamento do texto com foco em números
      const cleanedText = this.cleanOcrText(text);

      return cleanedText;
    } catch (error) {
      this.logger.error(`Erro ao processar OCR: ${error.message}`, error.stack);
      throw new Error(`Falha ao processar OCR: ${error.message}`);
    }
  }

  /**
   * Limpa o texto extraído pelo OCR
   * @param text Texto bruto do OCR
   * @returns Texto limpo e normalizado
   */
  private cleanOcrText(text: string): string {
    // Agressivamente preservar e corrigir padrões de valores monetários
    let processed = text
      // Preservar padrões de valores com R$ antes da limpeza geral
      .replace(/R\s*\$\s*(\d[\d\s.,]*)/gi, 'R$ $1')
      .replace(/RS\s*(\d[\d\s.,]*)/gi, 'R$ $1')

      // Remove múltiplos espaços
      .replace(/\s+/g, ' ')

      // Remove caracteres estranhos frequentes em erros de OCR mantendo os importantes
      .replace(/[^\w\s.,;:"/\\()\-+=$%@áàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]/g, '')

      // Corrige problemas comuns de OCR
      .replace(/S[.,]\s*A[.,]/g, 'S.A.')
      .replace(/RS\s+/g, 'R$ ')
      .replace(/R\$\s+/g, 'R$ ')
      .replace(/R\s+\$/g, 'R$')
      .replace(/R5\s*/g, 'R$ ')

      // Normalizar números que podem ter sido lidos incorretamente
      .replace(/(\d)[,.](\d{3})([,.]\d{2})/g, '$1$2$3') // 1.234,00 -> 1234,00
      .replace(/(\d)o/gi, '$10') // Corrige caracteres 'o' lidos como '0'

      // Normalizar padrões de valores (adicionar R$ se não existir)
      .replace(
        /TOTAL\s*A\s*PAGAR\s*:?\s*([0-9][0-9.,]*)/gi,
        'TOTAL A PAGAR: R$ $1',
      )
      .replace(/VALOR\s*:?\s*([0-9][0-9.,]*)/gi, 'VALOR: R$ $1')

      // Remover espaços extras nos valores monetários
      .replace(/R\$\s+(\d)/g, 'R$ $1')
      .replace(/(\d)\s+,\s+(\d)/g, '$1,$2')

      .trim();

    // Extra: garantir que os valores monetários estejam bem formatados
    // Procurar por padrões como R$ X.XXX,XX ou R$ X,XXX.XX e padronizar
    processed = processed.replace(
      /R\$\s*(\d+)[.,](\d{3})[.,](\d{2})/g,
      'R$ $1$2,$3',
    );

    // Procurar todos os valores monetários e garantir espaçamento consistente
    processed = processed.replace(/R\$(\d)/g, 'R$ $1');

    this.logger.log('Texto após limpeza e normalização: ' + processed);

    return processed;
  }

  /**
   * Extrai informações estruturadas do texto usando padrões comuns
   * @param text Texto extraído pelo OCR
   * @returns Objeto com as informações extraídas
   */
  extractInvoiceData(text: string): any {
    // Em modo de demonstração, retornar dados fictícios formatados
    if (DEMO_MODE) {
      return {
        amount: 157.89,
        dueDate: new Date('2025-05-15'),
        issueDate: new Date('2025-05-01'),
        issuer: 'ENEL ENERGIA S/A',
      };
    }

    // Para implementação real:
    const data = {
      amount: this.extractAmount(text),
      dueDate: this.extractDueDate(text),
      issueDate: this.extractIssueDate(text),
      issuer: this.extractIssuer(text),
    };

    return data;
  }

  private extractAmount(text: string): number | null {
    // Debug: Logar o texto completo
    this.logger.debug('Texto completo para extrair valor:\n' + text);

    // Padrões comuns para valores monetários em contas
    const patterns = [
      // Padrões específicos com prefixos
      /TOTAL\s*A\s*PAGAR[:\s]*R?\$?\s*([\d.,]+)/i,
      /TOTAL\s*CONSOLIDADO[:\s]*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*TOTAL[:\s]*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*A\s*PAGAR[:\s]*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*DO\s*DOCUMENTO[:\s]*R?\$?\s*([\d.,]+)/i,
      /TOTAL[:\s]*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*COBRADO[:\s]*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*DO\s*BOLETO[:\s]*R?\$?\s*([\d.,]+)/i,
      /PAGAVEL\s*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*R?\$?\s*([\d.,]+)/i,
      /VALOR\s*PAGO\s*R?\$?\s*([\d.,]+)/i,
      /PRECO\s*TOTAL\s*R?\$?\s*([\d.,]+)/i,

      // Padrões com "R$" seguido diretamente do valor
      /R\$\s*([\d.,]+)/i,
      /RS\s*([\d.,]+)/i,
      /R\s*\$\s*([\d.,]+)/i, // R $100,00 (espaço entre R e $)

      // Valores seguidos de texto identificador
      /([\d.,]+)\s*TOTAL\s*A\s*PAGAR/i,
      /TOTAL\s*A\s*PAGAR\s*([\d.,]+)/i,
      /TOTAL\s*([\d.,]+)/i,

      // Tentativas extras para boletos
      /COBRAN[CÇ]A\s*R?\$?\s*([\d.,]+)/i,
      /PAGAMENTO\s*R?\$?\s*([\d.,]+)/i,
    ];

    // Tentativa com padrões fortes primeiro
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const rawValue = match[1].trim();
        const value = rawValue.replace(/\./g, '').replace(',', '.');
        const numericValue = parseFloat(value);

        this.logger.debug(
          `Extraído valor ${numericValue} usando padrão: ${pattern}`,
        );

        // Verificar se é um número válido e razoável para uma fatura (entre 0.01 e 100000)
        if (!isNaN(numericValue) && numericValue > 0 && numericValue < 100000) {
          return numericValue;
        }
      }
    }

    // Tentativa adicional: procurar por padrões de números após R$ com diferentes formatos
    const currencyPatterns = [
      /R\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
      /RS\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
      /R\s*\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
    ];

    for (const pattern of currencyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const rawValue = match[1].trim();
        const value = rawValue.replace(/\./g, '').replace(',', '.');
        const numericValue = parseFloat(value);

        this.logger.debug(
          `Extraído valor com padrão de moeda: ${numericValue}`,
        );

        if (!isNaN(numericValue) && numericValue > 0 && numericValue < 100000) {
          return numericValue;
        }
      }
    }

    // Última tentativa: procurar por qualquer coisa que pareça um valor monetário
    // Procurar por números com formato de dinheiro em qualquer lugar do texto
    const genericMoneyPattern = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
    const moneyMatches = text.match(genericMoneyPattern);

    if (moneyMatches && moneyMatches.length > 0) {
      // Se encontramos múltiplos valores, obter o maior deles (geralmente o valor total)
      const amounts = moneyMatches
        .map((m) => parseFloat(m.replace(/\./g, '').replace(',', '.')))
        .filter((num) => !isNaN(num) && num > 0 && num < 100000);

      if (amounts.length > 0) {
        // Ordenar por valor e pegar o maior
        amounts.sort((a, b) => b - a);
        this.logger.debug(
          `Encontrados múltiplos valores, usando o maior: ${amounts[0]}`,
        );
        return amounts[0];
      }
    }

    // Log todos os possíveis números para debug
    const allNumbersPattern = /\d+[.,]\d+/g;
    const allNumbers = text.match(allNumbersPattern);
    if (allNumbers) {
      this.logger.debug(
        `Nenhum valor identificado. Todos os números encontrados: ${allNumbers.join(', ')}`,
      );
    } else {
      this.logger.debug('Nenhum número encontrado no texto.');
    }

    // Se chegarmos até aqui, não conseguimos extrair o valor
    this.logger.warn('Não foi possível extrair o valor da fatura.');
    return null;
  }

  private extractDueDate(text: string): Date | null {
    // Padrões comuns para data de vencimento
    const patterns = [
      /VENCIMENTO\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /DATA\s*DE\s*VENCIMENTO\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /DATA\s*VENCIMENTO\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /VENC[.:]\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /VENCE\s*EM\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
    ];

    return this.extractDate(text, patterns);
  }

  private extractIssueDate(text: string): Date | null {
    // Padrões comuns para data de emissão
    const patterns = [
      /EMISS[AÃ]O\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /DATA\s*(?:DA|DE)?\s*EMISS[AÃ]O\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /DATA\s*DOC[.:]\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
      /DATA\s*DO\s*DOCUMENTO\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{2,4}|\d{2}\.\d{2}\.\d{2,4})/i,
    ];

    return this.extractDate(text, patterns);
  }

  /**
   * Extrai uma data usando múltiplos padrões
   * @param text Texto para extrair a data
   * @param patterns Lista de padrões regex a serem testados
   * @returns Data extraída ou null
   */
  private extractDate(text: string, patterns: RegExp[]): Date | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          // Normaliza o formato da data
          const dateStr = match[1].replace(/\./g, '/').replace(/-/g, '/');
          const parts = dateStr.split('/');

          if (parts.length !== 3) {
            continue;
          }

          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]);
          let year = parseInt(parts[2]);

          // Ajuste para datas com ano abreviado
          if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
          }

          // Validação simples
          if (day < 1 || day > 31 || month < 1 || month > 12) {
            continue;
          }

          const dateObj = new Date(year, month - 1, day);
          return dateObj;
        } catch (e) {
          continue;
        }
      }
    }

    // Tentativa final: procurar por qualquer data no formato DD/MM/YYYY
    const genericDateMatch = text.match(
      /(\d{2})[\/\.-](\d{2})[\/\.-](\d{2,4})/,
    );
    if (genericDateMatch) {
      try {
        const day = parseInt(genericDateMatch[1]);
        const month = parseInt(genericDateMatch[2]);
        let year = parseInt(genericDateMatch[3]);

        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }

        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return new Date(year, month - 1, day);
        }
      } catch (e) {
        // Ignorar erros na análise de data
      }
    }

    return null;
  }

  private extractIssuer(text: string): string | null {
    // Este é mais complexo e varia muito entre documentos
    const patterns = [
      /CEDENTE\s*:?\s*([^\n.;]+)/i,
      /BENEFICI[ÁA]RIO\s*:?\s*([^\n.;]+)/i,
      /FORNECEDOR\s*:?\s*([^\n.;]+)/i,
      /EMPRESA\s*:?\s*([^\n.;]+)/i,
      /EMISSOR\s*:?\s*([^\n.;]+)/i,
      /(?:CONTA|FATURA)\s+(?:DE|DA|DO)\s+([^\n.;:]+)/i,
      // Alguns emissores comuns
      /(SABESP|ENEL|VIVO|CLARO|TIM|OI|COMGAS|ELETROPAULO|CPFL|COPEL|CELESC|CEMIG|COPASA|SANEPAR)/i,
    ];

    // Tenta extrair usando os padrões específicos
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Tenta extrair o nome no início do documento (geralmente título/cabeçalho)
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (
        line &&
        line.length > 5 &&
        line.length < 50 &&
        /[A-Z]{2,}/.test(line) &&
        !/^\d+/.test(line)
      ) {
        return line;
      }
    }

    return null;
  }
}
