import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  Snackbar,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import InvoicesList from "../components/InvoicesList";
import InvoiceDetails from "../components/InvoiceDetails";
import InvoiceUpload from "../components/InvoiceUpload";
import { invoicesApi } from "../services/api";
import { Invoice, CategoryLabels } from "../types/invoice";

// Modo de demonstração para testes sem backend
const DEMO_MODE = false;

// Mesmos dados de exemplo da página Dashboard
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

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Efeito para buscar faturas quando o componente montar ou a tab mudar
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    console.log("Iniciando fetchInvoices - tab:", tabValue);

    // Usar dados de demonstração se estiver no modo demo
    if (demoMode) {
      setTimeout(() => {
        let data = [...DEMO_INVOICES];

        // Filtrar com base na tab selecionada
        if (tabValue === 1) {
          // Vencimento próximo - faturas não pagas com vencimento futuro
          data = data.filter(
            (invoice) =>
              !invoice.paid &&
              invoice.dueDate &&
              new Date(invoice.dueDate) > new Date()
          );
        } else if (tabValue === 2) {
          // Vencidas - faturas não pagas com vencimento passado
          data = data.filter(
            (invoice) =>
              !invoice.paid &&
              invoice.dueDate &&
              new Date(invoice.dueDate) < new Date()
          );
        }

        setInvoices(data);
        applyFilters(data);
        setIsLoading(false);
        console.log("Atualizado em modo demo com", data.length, "faturas");
      }, 800); // Simular um pequeno atraso
      return;
    }

    try {
      let data: Invoice[] = [];

      // Buscar diferentes tipos de faturas com base na tab selecionada
      if (tabValue === 0) {
        data = await invoicesApi.getAll();
      } else if (tabValue === 1) {
        data = await invoicesApi.getUpcoming();
      } else if (tabValue === 2) {
        data = await invoicesApi.getOverdue();
      }

      console.log("Dados recebidos da API:", data.length, "faturas");
      setInvoices(data);
      applyFilters(data);
    } catch (err) {
      console.error("Erro ao buscar faturas:", err);
      setError(
        "Falha ao carregar as faturas. Por favor, tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros às faturas
  const applyFilters = (data: Invoice[]) => {
    let filtered = [...data];

    // Filtrar por categoria
    if (categoryFilter) {
      filtered = filtered.filter(
        (invoice) => invoice.category === categoryFilter
      );
    }

    // Filtrar por status (pago/pendente)
    if (statusFilter === "paid") {
      filtered = filtered.filter((invoice) => invoice.paid);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((invoice) => !invoice.paid);
    }

    setFilteredInvoices(filtered);
  };

  // Lidar com a mudança de filtro de categoria
  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  // Lidar com a mudança de filtro de status
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // Lidar com mudança de tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Excluir fatura
  const handleDeleteInvoice = async (id: number) => {
    try {
      setIsLoading(true);
      await invoicesApi.delete(id);
      setSuccessMessage("Fatura excluída com sucesso");

      // Atualizar a lista localmente para resposta imediata da UI
      const updatedInvoices = invoices.filter((invoice) => invoice.id !== id);
      setInvoices(updatedInvoices);
      applyFilters(updatedInvoices);

      // Forçar atualização completa
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Erro ao excluir fatura:", err);
      setError("Falha ao excluir a fatura. Por favor, tente novamente.");
      setIsLoading(false);
    }
  };

  // Marcar fatura como paga
  const handleMarkAsPaid = async (id: number) => {
    try {
      setIsLoading(true);
      const updatedInvoice = await invoicesApi.markAsPaid(id);
      setSuccessMessage("Fatura marcada como paga");

      // Atualizar a lista localmente para resposta imediata da UI
      const updatedInvoices = invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, paid: true } : invoice
      );
      setInvoices(updatedInvoices);
      applyFilters(updatedInvoices);

      // Forçar atualização completa
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Erro ao marcar fatura como paga:", err);
      setError(
        "Falha ao marcar a fatura como paga. Por favor, tente novamente."
      );
      setIsLoading(false);
    }
  };

  // Ver detalhes da fatura
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsOpen(true);
  };

  // Fechar modal de detalhes
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  // Fechar snackbar de sucesso
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Efeito para buscar faturas quando o componente montar ou a tab mudar
  useEffect(() => {
    fetchInvoices();
  }, [tabValue, refreshTrigger]);

  // Efeito para aplicar filtros quando eles mudarem
  useEffect(() => {
    applyFilters(invoices);
  }, [categoryFilter, statusFilter]);

  // Atualizar manualmente
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Faturas
      </Typography>

      {demoMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Usando dados de demonstração para teste da interface
        </Alert>
      )}

      {/* Componente de Upload */}
      <InvoiceUpload onSuccess={fetchInvoices} />

      {/* Tabs de navegação */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Todas as Faturas" />
          <Tab label="Vencimento Próximo" />
          <Tab label="Vencidas" />
        </Tabs>
      </Paper>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Categoria</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Categoria"
                onChange={handleCategoryFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(CategoryLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="paid">Pagas</MenuItem>
                <MenuItem value="pending">Pendentes</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} sx={{ textAlign: "right" }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Atualizar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Faturas */}
      <InvoicesList
        invoices={filteredInvoices}
        isLoading={isLoading}
        onDelete={handleDeleteInvoice}
        onMarkAsPaid={handleMarkAsPaid}
        onViewDetails={handleViewDetails}
        onRefresh={handleRefresh}
      />

      {/* Modal de Detalhes */}
      <InvoiceDetails
        open={detailsOpen}
        invoice={selectedInvoice}
        onClose={handleCloseDetails}
      />

      {/* Snackbar de Sucesso */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccessMessage}
      >
        <Alert
          onClose={handleCloseSuccessMessage}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InvoicesPage;
