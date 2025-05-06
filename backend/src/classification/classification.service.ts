import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  // Lista de palavras-chave para classificação por categoria
  private readonly keywordMap = {
    energia: [
      'energia',
      'eletricidade',
      'elétrica',
      'light',
      'enel',
      'cemig',
      'copel',
      'celesc',
      'ampla',
      'cpfl',
      'eletropaulo',
      'kWh',
    ],
    agua: [
      'água',
      'saneamento',
      'sabesp',
      'cedae',
      'copasa',
      'cagece',
      'compesa',
      'embasa',
      'casan',
      'corsan',
      'm³',
    ],
    internet: [
      'internet',
      'banda larga',
      'fibra',
      'conexão',
      'oi fibra',
      'vivo fibra',
      'claro net',
      'tim live',
      'provedor',
    ],
    telefone: [
      'telefone',
      'móvel',
      'celular',
      'tim',
      'vivo',
      'claro',
      'oi',
      'nextel',
      'minutos',
    ],
    aluguel: [
      'aluguel',
      'locação',
      'imóvel',
      'locatário',
      'inquilino',
      'imobiliária',
      'proprietário',
    ],
    condominio: [
      'condomínio',
      'taxa condominial',
      'síndico',
      'administradora',
      'assembleia',
    ],
    streaming: [
      'netflix',
      'spotify',
      'disney',
      'amazon prime',
      'hbo',
      'globoplay',
      'deezer',
      'youtube premium',
    ],
    cartao: [
      'cartão de crédito',
      'fatura cartão',
      'nubank',
      'itaucard',
      'bradesco',
      'visa',
      'mastercard',
      'american express',
    ],
    seguro: [
      'seguro',
      'apólice',
      'porto seguro',
      'bradesco seguros',
      'sulamerica',
      'liberty',
    ],
    educacao: [
      'educação',
      'mensalidade',
      'escola',
      'faculdade',
      'universidade',
      'curso',
      'material escolar',
    ],
    saude: [
      'saúde',
      'plano de saúde',
      'amil',
      'unimed',
      'hapvida',
      'notredame',
      'hospital',
      'clínica',
    ],
    transporte: [
      'transporte',
      'combustível',
      'gasolina',
      'etanol',
      'diesel',
      'uber',
      '99',
      'táxi',
      'passagem',
    ],
    impostos: [
      'imposto',
      'iptu',
      'ipva',
      'taxa',
      'tributo',
      'darf',
      'inss',
      'contribuição',
    ],
  };

  /**
   * Classifica uma fatura com base no texto extraído por OCR
   * @param text Texto extraído por OCR
   * @param issuer Nome do emissor (opcional)
   * @returns Categoria classificada
   */
  classifyInvoice(text: string, issuer?: string): string {
    this.logger.log('Classificando fatura...');

    // Converter para lowercase para facilitar a comparação
    const lowerText = (text || '').toLowerCase();
    const lowerIssuer = (issuer || '').toLowerCase();

    // Combinar texto e emissor para a busca
    const combinedText = `${lowerText} ${lowerIssuer}`;

    let bestCategory = 'outros'; // Categoria padrão
    let bestScore = 0;

    // Percorrer cada categoria e suas palavras-chave
    for (const [category, keywords] of Object.entries(this.keywordMap)) {
      let score = 0;

      // Verificar cada palavra-chave na categoria
      for (const keyword of keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          score += 1;

          // Peso extra para palavras-chave encontradas no nome do emissor
          if (lowerIssuer && lowerIssuer.includes(keyword.toLowerCase())) {
            score += 2;
          }
        }
      }

      // Atualizar a melhor categoria se a pontuação for maior
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    this.logger.log(`Fatura classificada como: ${bestCategory}`);
    return bestCategory;
  }
}
