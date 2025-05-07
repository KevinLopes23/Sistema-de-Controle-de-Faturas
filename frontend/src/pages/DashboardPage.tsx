import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import DashboardSummary from "../components/DashboardSummary";
import InvoiceUpload from "../components/InvoiceUpload";
import { invoicesApi } from "../services/api";
import { Invoice } from "../types/invoice";

// Modo de demonstração para testes sem backend
const DEMO_MODE = false;

// Dados de exemplo para o modo de demonstração
const DEMO_INVOICES: Invoice[] = [
  {
    id: 1,
    filename: "conta_luz_janeiro.pdf",
    issuer: "ENEL Energia",
    amount: 157.89,
    dueDate: "2025-01-25",
    issueDate: "2025-01-05",
    category: "energia",
    status: "PROCESSADO",
    description: "Conta de energia elétrica referente ao mês de janeiro",
    paid: false,
    rawText: "Texto extraído via OCR...",
    filePath: null,
    createdAt: "2025-01-06T10:00:00.000Z",
    updatedAt: "2025-01-06T10:05:30.000Z",
  },
  {
    id: 2,
    filename: "conta_agua_janeiro.pdf",
    issuer: "SABESP",
    amount: 92.5,
    dueDate: "2025-01-20",
    issueDate: "2025-01-03",
    category: "agua",
    status: "PROCESSADO",
    description: "Conta de água referente ao mês de janeiro",
    paid: false,
    rawText: "Texto extraído via OCR...",
    filePath: null,
    createdAt: "2025-01-04T14:20:00.000Z",
    updatedAt: "2025-01-04T14:25:30.000Z",
  },
  {
    id: 3,
    filename: "aluguel_janeiro.pdf",
    issuer: "Imobiliária Central",
    amount: 1200.0,
    dueDate: "2025-01-10",
    issueDate: "2024-12-30",
    category: "aluguel",
    status: "PROCESSADO",
    description: "Aluguel referente ao mês de janeiro",
    paid: true,
    rawText: "Texto extraído via OCR...",
    filePath: null,
    createdAt: "2024-12-31T09:15:00.000Z",
    updatedAt: "2025-01-02T11:30:45.000Z",
  },
];

const DashboardPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);

    // Usar dados de demonstração se estiver no modo demo
    if (demoMode) {
      setTimeout(() => {
        setInvoices(DEMO_INVOICES);
        setIsLoading(false);
      }, 1000); // Simular um pequeno atraso de carregamento
      return;
    }

    try {
      const data = await invoicesApi.getAll();
      setInvoices(data);
    } catch (err) {
      console.error("Erro ao buscar faturas:", err);
      setError(
        "Falha ao carregar as faturas. Por favor, tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {demoMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Usando dados de demonstração para teste da interface
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Componente de Upload */}
        <Grid item xs={12}>
          <InvoiceUpload onSuccess={fetchInvoices} />
        </Grid>

        {/* Conteúdo Principal */}
        <Grid item xs={12}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, textAlign: "center", color: "error.main" }}>
              {error}
            </Paper>
          ) : (
            <DashboardSummary invoices={invoices} />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
