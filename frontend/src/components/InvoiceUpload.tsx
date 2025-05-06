import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Backdrop,
  Snackbar,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { invoicesApi } from "../services/api";

interface InvoiceUploadProps {
  onSuccess?: () => void;
}

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Verificar se é PDF ou imagem
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError(
          "Por favor, selecione apenas arquivos PDF ou imagens (PNG, JPG, etc)"
        );
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Nenhum arquivo selecionado");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await invoicesApi.upload(selectedFile);
      setSuccess(true);
      setSelectedFile(null);

      // Limpar input de arquivo
      const fileInput = document.getElementById(
        "invoice-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Erro ao fazer upload da fatura:", err);
      setError("Falha ao fazer upload da fatura. Por favor, tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 2,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Upload de Fatura
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, textAlign: "center" }}
      >
        Faça upload de uma fatura em PDF ou imagem para processar
        automaticamente
      </Typography>

      <Box sx={{ width: "100%", textAlign: "center" }}>
        <input
          accept="application/pdf,image/*"
          id="invoice-upload"
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <label htmlFor="invoice-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
          >
            Selecionar Arquivo
          </Button>
        </label>

        {selectedFile && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Arquivo selecionado: {selectedFile.name}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          sx={{ mt: 1 }}
        >
          {isUploading ? "Enviando..." : "Enviar Fatura"}
        </Button>
      </Box>

      {/* Backdrop de carregamento */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isUploading}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Processando fatura com OCR...</Typography>
        </Box>
      </Backdrop>

      {/* Snackbar de sucesso */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Fatura enviada com sucesso!"
      />
    </Paper>
  );
};

export default InvoiceUpload;
