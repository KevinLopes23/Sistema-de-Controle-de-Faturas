import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
  Box,
  Paper,
} from "@mui/material";
import { CategoryLabels, CategoryColors, Invoice } from "../types/invoice";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface InvoiceDetailsProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  open,
  invoice,
  onClose,
}) => {
  if (!invoice) {
    return null;
  }

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não disponível";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: pt });
  };

  // Formatar valor
  const formatCurrency = (value: number) => {
    return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Detalhes da Fatura
        <Typography variant="subtitle2" color="text.secondary">
          {invoice.filename}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Informações Principais */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Informações Gerais
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Emissor
              </Typography>
              <Typography variant="body1">
                {invoice.issuer || "Não identificado"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Categoria
              </Typography>
              {invoice.category ? (
                <Chip
                  label={CategoryLabels[invoice.category] || invoice.category}
                  size="small"
                  sx={{
                    backgroundColor: CategoryColors[invoice.category] || "#ccc",
                    color: "#fff",
                  }}
                />
              ) : (
                <Typography variant="body1">Não classificada</Typography>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={invoice.paid ? "Pago" : "Pendente"}
                color={invoice.paid ? "success" : "warning"}
                size="small"
              />
            </Box>
          </Grid>

          {/* Valores e Datas */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Valores e Datas
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Valor
              </Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(invoice.amount)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Data de Vencimento
              </Typography>
              <Typography variant="body1">
                {formatDate(invoice.dueDate)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Data de Emissão
              </Typography>
              <Typography variant="body1">
                {formatDate(invoice.issueDate)}
              </Typography>
            </Box>
          </Grid>

          {/* Descrição */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Descrição
            </Typography>
            <Typography variant="body1">
              {invoice.description || "Sem descrição disponível"}
            </Typography>
          </Grid>

          {/* Texto Original */}
          {invoice.rawText && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Texto Extraído (OCR)
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  maxHeight: "200px",
                  overflow: "auto",
                  backgroundColor: "#f5f5f5",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                <Typography
                  variant="body2"
                  component="pre"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {invoice.rawText}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Datas de Criação e Atualização */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">
                Criado em: {formatDate(invoice.createdAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Atualizado em: {formatDate(invoice.updatedAt)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDetails;
