import React from "react";
import {
  Grid,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  alpha,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { Invoice } from "../types/invoice";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { pt } from "date-fns/locale";

interface DashboardSummaryProps {
  invoices: Invoice[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ invoices }) => {
  // Filtrar faturas
  const paidInvoices = invoices.filter((invoice) => invoice.paid);
  const pendingInvoices = invoices.filter((invoice) => !invoice.paid);

  // Calcular estatísticas
  const totalPaid = paidInvoices.reduce(
    (sum, invoice) => sum + (Number(invoice.amount) || 0),
    0
  );
  const totalPending = pendingInvoices.reduce(
    (sum, invoice) => sum + (Number(invoice.amount) || 0),
    0
  );
  const totalAmount = totalPaid + totalPending;

  // Faturas com vencimento próximo (próximos 7 dias)
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);

  const upcomingInvoices = pendingInvoices.filter((invoice) => {
    if (!invoice.dueDate) return false;
    const dueDate = new Date(invoice.dueDate);
    return isAfter(dueDate, today) && isBefore(dueDate, sevenDaysFromNow);
  });

  // Faturas vencidas
  const overdueInvoices = pendingInvoices.filter((invoice) => {
    if (!invoice.dueDate) return false;
    const dueDate = new Date(invoice.dueDate);
    return isBefore(dueDate, today);
  });

  // Calcular percentual pago
  const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <Grid container spacing={3}>
      {/* Total Pago */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: (theme) => theme.palette.success.main,
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Total Pago
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  R$ {(totalPaid || 0).toFixed(2).replace(".", ",")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {paidInvoices.length} faturas
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.success.main, 0.15),
                  borderRadius: 2,
                  p: 1,
                  height: "56px",
                  width: "56px",
                }}
              >
                <CheckCircleIcon sx={{ color: "success.main", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Total Pendente */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: (theme) => theme.palette.primary.main,
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Total Pendente
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  R$ {(totalPending || 0).toFixed(2).replace(".", ",")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pendingInvoices.length} faturas
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.15),
                  borderRadius: 2,
                  p: 1,
                  height: "56px",
                  width: "56px",
                }}
              >
                <MoneyIcon sx={{ color: "primary.main", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Vencimento Próximo */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: (theme) => theme.palette.info.main,
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Vencimento Próximo
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  {upcomingInvoices.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Próximos 7 dias
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.info.main, 0.15),
                  borderRadius: 2,
                  p: 1,
                  height: "56px",
                  width: "56px",
                }}
              >
                <CalendarIcon sx={{ color: "info.main", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Vencidas */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "4px",
              background: (theme) => theme.palette.error.main,
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Faturas Vencidas
                </Typography>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  {overdueInvoices.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pagamento atrasado
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.error.main, 0.15),
                  borderRadius: 2,
                  p: 1,
                  height: "56px",
                  width: "56px",
                }}
              >
                <WarningIcon sx={{ color: "error.main", fontSize: 28 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Progresso de Pagamento */}
      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TrendingUpIcon sx={{ color: "primary.main", mr: 1 }} />
              <Typography variant="h6">Progresso de Pagamento</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Percentual do valor total que já foi pago
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={paidPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.15),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      background:
                        "linear-gradient(90deg, #6a0080 0%, #9c27b0 100%)",
                    },
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                color="primary.light"
                sx={{ minWidth: "60px", textAlign: "right" }}
              >
                {(paidPercentage || 0).toFixed(1)}%
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 3,
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.4),
                borderRadius: 2,
                p: 2,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pendente
                </Typography>
                <Typography variant="h6">
                  R$ {(totalPending || 0).toFixed(2).replace(".", ",")}
                </Typography>
              </Box>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 2, opacity: 0.2 }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6">
                  R$ {(totalAmount || 0).toFixed(2).replace(".", ",")}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Listas de faturas (Próximas e Vencidas) */}
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <CalendarIcon sx={{ color: "info.main", mr: 1 }} />
              <Typography variant="h6">Vencimentos Próximos</Typography>
            </Box>

            {upcomingInvoices.length > 0 ? (
              upcomingInvoices
                .sort(
                  (a, b) =>
                    new Date(a.dueDate!).getTime() -
                    new Date(b.dueDate!).getTime()
                )
                .slice(0, 5)
                .map((invoice, index) => (
                  <Box
                    key={invoice.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: (theme) =>
                        alpha(
                          theme.palette.background.paper,
                          index % 2 === 0 ? 0.3 : 0.1
                        ),
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <ReceiptIcon
                          sx={{ color: "info.main", mr: 1, fontSize: 20 }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {invoice.issuer || "Sem emissor"}
                        </Typography>
                      </Box>
                      <Chip
                        label={format(
                          new Date(invoice.dueDate!),
                          "dd/MM/yyyy",
                          { locale: pt }
                        )}
                        size="small"
                        color="info"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 1.5,
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {invoice.category
                          ? invoice.category.charAt(0).toUpperCase() +
                            invoice.category.slice(1)
                          : "Outros"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "info.main" }}
                      >
                        R$ {Number(invoice.amount).toFixed(2).replace(".", ",")}
                      </Typography>
                    </Box>
                  </Box>
                ))
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.2),
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Nenhuma fatura com vencimento próximo
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card
          sx={{
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.2) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <WarningIcon sx={{ color: "error.main", mr: 1 }} />
              <Typography variant="h6">Faturas Vencidas</Typography>
            </Box>

            {overdueInvoices.length > 0 ? (
              overdueInvoices
                .sort(
                  (a, b) =>
                    new Date(a.dueDate!).getTime() -
                    new Date(b.dueDate!).getTime()
                )
                .slice(0, 5)
                .map((invoice, index) => (
                  <Box
                    key={invoice.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: (theme) =>
                        alpha(
                          theme.palette.background.paper,
                          index % 2 === 0 ? 0.3 : 0.1
                        ),
                      borderLeft: "3px solid",
                      borderColor: "error.main",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <ReceiptIcon
                          sx={{ color: "error.main", mr: 1, fontSize: 20 }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {invoice.issuer || "Sem emissor"}
                        </Typography>
                      </Box>
                      <Chip
                        label={format(
                          new Date(invoice.dueDate!),
                          "dd/MM/yyyy",
                          { locale: pt }
                        )}
                        size="small"
                        color="error"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 1.5,
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {invoice.category
                          ? invoice.category.charAt(0).toUpperCase() +
                            invoice.category.slice(1)
                          : "Outros"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "error.main" }}
                      >
                        R$ {Number(invoice.amount).toFixed(2).replace(".", ",")}
                      </Typography>
                    </Box>
                  </Box>
                ))
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.2),
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Nenhuma fatura vencida
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardSummary;
