import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Modo de demonstração
const DEMO_MODE = true;

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Extrai texto de uma imagem ou PDF usando OCR
   * @param filePath Caminho do arquivo a ser processado
   * @returns Texto extraído do documento
   */
  async extractTextFromFile(filePath: string): Promise<string> {
    try {
      this.logger.log(`Iniciando OCR para o arquivo: ${filePath}`);

      // Em modo de demonstração, retornar texto de exemplo
      if (DEMO_MODE) {
        this.logger.log('Modo de demonstração: retornando texto de exemplo');
        return `
          FATURA DE ENERGIA ELÉTRICA
          CLIENTE: EMPRESA EXEMPLO S/A
          NÚMERO DA CONTA: 123456789
          DATA DE EMISSÃO: 01/05/2025
          DATA DE VENCIMENTO: 15/05/2025
          VALOR TOTAL: R$ 157,89
          CONSUMO KWH: 230
          CEDENTE: ENEL ENERGIA S/A
          CNPJ: 12.345.678/0001-90
        `;
      }

      // Para implementação real:
      // 1. Para PDFs, seria necessário converter para imagem primeiro
      // 2. Usar tesseract.js para OCR
      throw new Error('OCR não implementado no modo de demonstração');
    } catch (error) {
      this.logger.error(`Erro ao processar OCR: ${error.message}`, error.stack);
      // Em modo de demonstração, não propagar erro
      if (DEMO_MODE) {
        return 'Texto de exemplo para OCR';
      }
      throw new Error(`Falha ao processar OCR: ${error.message}`);
    }
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
    // Padrões comuns para valores monetários
    const patterns = [
      /R\$\s*([\d.,]+)/i,
      /VALOR\s*(?:TOTAL|A PAGAR|DO DOCUMENTO)?\s*(?:R\$)?\s*([\d.,]+)/i,
      /TOTAL\s*(?:A PAGAR)?\s*(?:R\$)?\s*([\d.,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].replace(/\./g, '').replace(',', '.');
        return parseFloat(value);
      }
    }
    return null;
  }

  private extractDueDate(text: string): Date | null {
    // Padrões comuns para data de vencimento
    const patterns = [
      /VENCIMENTO\s*:?\s*(\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}|\d{2}-\d{2}-\d{4})/i,
      /DATA\s*DE\s*VENCIMENTO\s*:?\s*(\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}|\d{2}-\d{2}-\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].replace(/\./g, '/').replace(/-/g, '/');
        return new Date(dateStr.split('/').reverse().join('-'));
      }
    }
    return null;
  }

  private extractIssueDate(text: string): Date | null {
    // Padrões comuns para data de emissão
    const patterns = [
      /EMISS[AÃ]O\s*:?\s*(\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}|\d{2}-\d{2}-\d{4})/i,
      /DATA\s*(?:DA|DE)?\s*EMISS[AÃ]O\s*:?\s*(\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}|\d{2}-\d{2}-\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].replace(/\./g, '/').replace(/-/g, '/');
        return new Date(dateStr.split('/').reverse().join('-'));
      }
    }
    return null;
  }

  private extractIssuer(text: string): string | null {
    // Este é mais complexo e varia muito entre documentos
    // Poderia usar NER (Named Entity Recognition) para melhor precisão
    const patterns = [
      /CEDENTE\s*:?\s*([^\n]+)/i,
      /BENEFICI[ÁA]RIO\s*:?\s*([^\n]+)/i,
      /FORNECEDOR\s*:?\s*([^\n]+)/i,
      /EMPRESA\s*:?\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }
}
