import axios from "axios";
import { Invoice, InvoiceFilters } from "../types/invoice";
import { Notification } from "../types/notification";

// Criar instância do axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
});

// API para faturas
export const invoicesApi = {
  // Buscar todas as faturas com filtros opcionais
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const response = await api.get("/invoices", { params: filters });
    return response.data;
  },

  // Buscar faturas com vencimento próximo
  getUpcoming: async (days: number = 7): Promise<Invoice[]> => {
    const response = await api.get(`/invoices/upcoming?days=${days}`);
    return response.data;
  },

  // Buscar faturas vencidas
  getOverdue: async (): Promise<Invoice[]> => {
    const response = await api.get("/invoices/overdue");
    return response.data;
  },

  // Buscar uma fatura específica
  getById: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // Fazer upload de uma nova fatura
  upload: async (file: File): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/invoices/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Atualizar uma fatura
  update: async (id: number, data: Partial<Invoice>): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },

  // Marcar fatura como paga
  markAsPaid: async (id: number): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}/mark-paid`);
    return response.data;
  },

  // Excluir uma fatura
  delete: async (id: number): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
};

// API para notificações
export const notificationsApi = {
  // Buscar todas as notificações
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get("/notifications");
    return response.data;
  },

  // Buscar notificações pendentes
  getPending: async (): Promise<Notification[]> => {
    const response = await api.get("/notifications/pending");
    return response.data;
  },

  // Enviar uma notificação
  send: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/notifications/${id}/send`);
    return response.data;
  },
};

export default api;
