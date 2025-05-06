export interface Invoice {
  id: number;
  filename: string;
  issuer: string | null;
  amount: number;
  dueDate: string | null;
  issueDate: string | null;
  description: string | null;
  category: string | null;
  paid: boolean;
  status: string;
  rawText: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFilters {
  category?: string;
  paid?: boolean;
  dueDateStart?: string;
  dueDateEnd?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export const CategoryLabels: Record<string, string> = {
  energia: "Energia Elétrica",
  agua: "Água",
  internet: "Internet",
  telefone: "Telefone",
  aluguel: "Aluguel",
  condominio: "Condomínio",
  streaming: "Streaming",
  cartao: "Cartão de Crédito",
  seguro: "Seguro",
  educacao: "Educação",
  saude: "Saúde",
  transporte: "Transporte",
  impostos: "Impostos",
  outros: "Outros",
};

export const CategoryColors: Record<string, string> = {
  energia: "#f1c40f",
  agua: "#3498db",
  internet: "#8e44ad",
  telefone: "#2ecc71",
  aluguel: "#e74c3c",
  condominio: "#95a5a6",
  streaming: "#d35400",
  cartao: "#c0392b",
  seguro: "#16a085",
  educacao: "#27ae60",
  saude: "#e84393",
  transporte: "#2980b9",
  impostos: "#f39c12",
  outros: "#7f8c8d",
};
