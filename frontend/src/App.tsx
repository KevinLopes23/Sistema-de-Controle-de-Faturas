import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Alert,
} from "@mui/material";
import { ptBR } from "@mui/material/locale";
import AppNavigation from "./components/AppNavigation";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import NotificationsPage from "./pages/NotificationsPage";
import { notificationsApi } from "./services/api";

// Tema preto e roxo moderno
const theme = createTheme(
  {
    palette: {
      mode: "dark",
      primary: {
        main: "#9c27b0", // Roxo
        light: "#bb86fc",
        dark: "#6a0080",
      },
      secondary: {
        main: "#03dac6", // Verde água para contraste
      },
      background: {
        default: "#121212", // Preto suave
        paper: "#1e1e1e",
      },
      text: {
        primary: "#ffffff",
        secondary: "#b0b0b0",
      },
      error: {
        main: "#cf6679",
      },
    },
    typography: {
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      h6: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.5)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 8,
          },
        },
      },
    },
  },
  ptBR
);

// Modo de demonstração para testes sem backend completo
const DEMO_MODE = false;

function App() {
  const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0);
  const [apiError, setApiError] = useState(false);

  // Buscar contagem de notificações pendentes
  const fetchPendingNotificationsCount = async () => {
    if (DEMO_MODE) {
      console.log("Modo de demonstração ativo - não buscando notificações");
      return;
    }

    try {
      const notifications = await notificationsApi.getPending();
      setPendingNotificationsCount(notifications.length);
      setApiError(false);
    } catch (error) {
      console.error("Erro ao buscar notificações pendentes:", error);
      setApiError(true);
    }
  };

  useEffect(() => {
    fetchPendingNotificationsCount();

    // Buscar notificações pendentes a cada 5 minutos
    const interval = setInterval(fetchPendingNotificationsCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {apiError && (
        <Alert severity="warning" sx={{ m: 1 }}>
          Não foi possível conectar ao servidor backend. Algumas funcionalidades
          podem estar limitadas.
        </Alert>
      )}
      {DEMO_MODE && (
        <Alert severity="info" sx={{ m: 1 }}>
          Modo de demonstração ativo - Interface limitada para testes
        </Alert>
      )}
      <Router>
        <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <AppNavigation
            pendingNotificationsCount={pendingNotificationsCount}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: "100%",
              overflow: "auto",
              bgcolor: "background.default",
              pt: 8, // Espaço para a barra superior
            }}
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/faturas" element={<InvoicesPage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
