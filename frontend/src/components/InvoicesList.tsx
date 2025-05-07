import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  TablePagination,
  Box,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { Invoice, CategoryLabels, CategoryColors } from "../types/invoice";
import { invoicesApi } from "../services/api";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface InvoicesListProps {
  invoices: Invoice[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onMarkAsPaid: (id: number) => void;
  onViewDetails: (invoice: Invoice) => void;
  onRefresh: () => void;
}

const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices,
  isLoading,
  onDelete,
  onMarkAsPaid,
  onViewDetails,
  onRefresh,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);

  // Filtrar faturas com base no termo de busca
  const filteredInvoices = invoices.filter(
    (invoice) =>
      (invoice.issuer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (invoice.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manipular mudança de página
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Manipular mudança de linhas por página
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Abrir diálogo de confirmação de exclusão
  const handleOpenDeleteDialog = (id: number) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Fechar diálogo de confirmação de exclusão
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  // Confirmar exclusão
  const handleConfirmDelete = () => {
    if (invoiceToDelete !== null) {
      onDelete(invoiceToDelete);
      handleCloseDeleteDialog();
    }
  };

  // Renderizar faturas vazia
  if (invoices.length === 0 && !isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Nenhuma fatura encontrada.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Barra de busca */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar faturas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabela de faturas */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Emissor</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.issuer || "Desconhecido"}</TableCell>
                    <TableCell>
                      {invoice.category && (
                        <Chip
                          label={
                            CategoryLabels[invoice.category] || invoice.category
                          }
                          size="small"
                          sx={{
                            backgroundColor: invoice.category
                              ? CategoryColors[invoice.category]
                              : "#ccc",
                            color: "#fff",
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      R$ {Number(invoice.amount).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), "dd/MM/yyyy", {
                            locale: pt,
                          })
                        : "Não definido"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.paid ? "Pago" : "Pendente"}
                        color={invoice.paid ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onViewDetails(invoice)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {!invoice.paid && (
                        <Tooltip title="Marcar como pago">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onMarkAsPaid(invoice.id)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(invoice.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredInvoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Itens por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir esta fatura? Esta ação não pode ser
            desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicesList;
