import { Invoice } from "./invoice";

export interface Notification {
  id: number;
  invoiceId: number;
  invoice: Invoice;
  type: string;
  scheduleDate: string;
  sent: boolean;
  emailTo: string | null;
  message: string | null;
  createdAt: string;
}

export const NotificationTypeLabels: Record<string, string> = {
  VENCIMENTO: "Aviso de Vencimento",
  LIMITE_EXCEDIDO: "Valor Limite Excedido",
};

export const NotificationTypeColors: Record<string, string> = {
  VENCIMENTO: "#e74c3c",
  LIMITE_EXCEDIDO: "#f39c12",
};
