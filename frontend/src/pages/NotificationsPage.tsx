import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { notificationsApi } from "../services/api";
import {
  Notification,
  NotificationTypeLabels,
  NotificationTypeColors,
} from "../types/notification";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// Modo de demonstração para testes sem backend
const DEMO_MODE = true;

// Dados de exemplo para notificações
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    invoiceId: 1,
    invoice: {
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
    type: "VENCIMENTO",
    scheduleDate: "2025-01-23",
    sent: false,
    emailTo: "usuario@example.com",
    message:
      "A fatura ENEL Energia no valor de R$ 157,89 vence em 2 dias (25/01/2025).",
    createdAt: "2025-01-20T10:00:00.000Z",
  },
  {
    id: 2,
    invoiceId: 2,
    invoice: {
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
    type: "VENCIMENTO",
    scheduleDate: "2025-01-18",
    sent: false,
    emailTo: "usuario@example.com",
    message:
      "A fatura SABESP no valor de R$ 92,50 vence em 2 dias (20/01/2025).",
    createdAt: "2025-01-18T08:30:00.000Z",
  },
  {
    id: 3,
    invoiceId: 3,
    invoice: {
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
    type: "LIMITE_EXCEDIDO",
    scheduleDate: "2025-01-02",
    sent: true,
    emailTo: "usuario@example.com",
    message:
      "Alerta: A fatura Imobiliária Central possui valor de R$ 1200,00, que excede o limite de R$ 1000 para a categoria aluguel.",
    createdAt: "2025-01-02T10:15:00.000Z",
  },
];

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);

    // Usar dados de demonstração se estiver no modo demo
    if (demoMode) {
      setTimeout(() => {
        setNotifications(DEMO_NOTIFICATIONS);
        filterNotifications(DEMO_NOTIFICATIONS, tabValue);
        setIsLoading(false);
      }, 800); // Simular um pequeno atraso
      return;
    }

    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
      filterNotifications(data, tabValue);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
      setError(
        "Falha ao carregar as notificações. Por favor, tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = (data: Notification[], tab: number) => {
    if (tab === 0) {
      // Todas as notificações
      setFilteredNotifications(data);
    } else if (tab === 1) {
      // Notificações pendentes
      setFilteredNotifications(
        data.filter((notification) => !notification.sent)
      );
    } else if (tab === 2) {
      // Notificações enviadas
      setFilteredNotifications(
        data.filter((notification) => notification.sent)
      );
    }
  };

  const handleSendNotification = async (id: number) => {
    if (demoMode) {
      // No modo demo, apenas simular o envio
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id ? { ...notification, sent: true } : notification
      );
      setNotifications(updatedNotifications);
      filterNotifications(updatedNotifications, tabValue);
      setSuccessMessage("Notificação enviada com sucesso (modo demo)");
      return;
    }

    try {
      await notificationsApi.send(id);
      setSuccessMessage("Notificação enviada com sucesso");
      fetchNotifications();
    } catch (err) {
      console.error("Erro ao enviar notificação:", err);
      setError("Falha ao enviar a notificação. Por favor, tente novamente.");
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    filterNotifications(notifications, newValue);
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não disponível";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: pt });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Notificações
      </Typography>

      {demoMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Usando dados de demonstração para teste da interface
        </Alert>
      )}

      {/* Tabs de navegação */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Todas" />
          <Tab label="Pendentes" />
          <Tab label="Enviadas" />
        </Tabs>
      </Paper>

      {/* Lista de Notificações */}
      <Paper elevation={2}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              Nenhuma notificação encontrada.
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    {notification.type === "VENCIMENTO" ? (
                      <CalendarIcon color="primary" />
                    ) : (
                      <WarningIcon color="warning" />
                    )}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="subtitle1">
                          {notification.invoice?.issuer || "Fatura"} -
                          {notification.invoice &&
                            ` R$ ${notification.invoice.amount
                              .toFixed(2)
                              .replace(".", ",")}`}
                        </Typography>

                        <Chip
                          label={
                            NotificationTypeLabels[notification.type] ||
                            notification.type
                          }
                          size="small"
                          sx={{
                            backgroundColor: notification.type
                              ? NotificationTypeColors[notification.type]
                              : "#ccc",
                            color: "#fff",
                          }}
                        />

                        {notification.sent && (
                          <Chip
                            icon={<CheckCircleIcon fontSize="small" />}
                            label="Enviado"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Data programada:{" "}
                          {formatDate(notification.scheduleDate)}
                          {notification.emailTo &&
                            ` • Destinatário: ${notification.emailTo}`}
                        </Typography>
                      </>
                    }
                  />

                  {!notification.sent && (
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<SendIcon />}
                        onClick={() => handleSendNotification(notification.id)}
                      >
                        Enviar
                      </Button>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Botão de atualizar */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button variant="outlined" onClick={fetchNotifications}>
          Atualizar notificações
        </Button>
      </Box>

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

export default NotificationsPage;
