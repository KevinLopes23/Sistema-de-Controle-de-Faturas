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
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { invoicesApi } from "../services/api";

interface InvoiceUploadProps {
  onSuccess?: () => void;
}

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Verificar se é PDF ou imagem
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setSelectedFile(file);
        setError(null);
        setWarning(null); // Reset warning ao selecionar novo arquivo
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
    setWarning(null);
    setOcrStatus("Enviando arquivo...");

    try {
      // Verificar se é um arquivo PDF para personalizar as mensagens
      const isPdf = selectedFile.type === "application/pdf";

      // Adicionar um timeout para feedback mais detalhado sobre progresso do OCR
      const showProgress = () => {
        const baseProgressMessages = [
          "Enviando arquivo...",
          "Analisando documento...",
          "Reconhecendo texto...",
          "Extraindo dados importantes...",
          "Classificando fatura...",
        ];

        // Mensagens específicas para PDF
        const pdfProgressMessages = [
          "Enviando arquivo...",
          "Convertendo PDF para imagem...",
          "Pré-processando imagem...",
          "Analisando documento com OCR...",
          "Reconhecendo texto...",
          "Extraindo dados importantes...",
          "Classificando fatura...",
        ];

        const progressMessages = isPdf
          ? pdfProgressMessages
          : baseProgressMessages;

        let i = 0;
        const interval = setInterval(
          () => {
            if (i < progressMessages.length) {
              setOcrStatus(progressMessages[i]);
              i++;
            } else {
              clearInterval(interval);
            }
          },
          isPdf ? 2500 : 2000
        ); // PDF leva mais tempo, então damos mais tempo entre mensagens

        return interval;
      };

      const progressInterval = showProgress();

      // Fazer o upload da fatura
      const response = await invoicesApi.upload(selectedFile);

      clearInterval(progressInterval);

      // Verificar se houve sucesso
      if (response.success) {
        // Verificar se há avisos sobre dados não detectados
        if (response.warnings) {
          setWarning(response.warnings);

          // Para PDFs, adicionar uma dica extra se houve problemas
          if (response.isPdf && !response.invoice?.amount) {
            setWarning(
              (prev) =>
                `${
                  prev || ""
                }\n\nDica: Para melhor reconhecimento de PDFs, você pode converter manualmente para JPG antes de enviar.`
            );
          }
        }

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
      } else {
        setError(response.message || "Erro desconhecido ao processar a fatura");
      }
    } catch (err: any) {
      console.error("Erro ao fazer upload da fatura:", err);
      setError(
        err.response?.data?.message ||
          "Falha ao fazer upload da fatura. Por favor, tente novamente."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  const handleCloseWarning = () => {
    setWarning(null);
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

        <Stack spacing={2} sx={{ width: "100%", mb: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              <AlertTitle>Erro</AlertTitle>
              {error}
            </Alert>
          )}

          {warning && (
            <Alert severity="warning" onClose={handleCloseWarning}>
              <AlertTitle>Atenção</AlertTitle>
              {warning}
              <Typography variant="caption" display="block" mt={1}>
                Você pode corrigir manualmente esses dados na tela de detalhes
                da fatura.
              </Typography>
            </Alert>
          )}
        </Stack>

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
          <Typography sx={{ mt: 2 }}>{ocrStatus}</Typography>
        </Box>
      </Backdrop>

      {/* Snackbar de sucesso */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Fatura enviada com sucesso!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default InvoiceUpload;
