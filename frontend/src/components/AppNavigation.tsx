import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  ListItemButton,
  useMediaQuery,
  useTheme,
  Badge,
  Avatar,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Notifications as NotificationsIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";

const drawerWidth = 260;

interface AppNavigationProps {
  pendingNotificationsCount?: number;
}

const AppNavigation: React.FC<AppNavigationProps> = ({
  pendingNotificationsCount = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Faturas", icon: <DescriptionIcon />, path: "/faturas" },
    {
      text: "Notificações",
      icon: (
        <Badge badgeContent={pendingNotificationsCount} color="error">
          <NotificationsIcon />
        </Badge>
      ),
      path: "/notificacoes",
    },
  ];

  const logo = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 2,
        px: 1,
      }}
    >
      <Avatar
        sx={{
          bgcolor: "primary.main",
          width: 40,
          height: 40,
          mr: 1,
        }}
      >
        <ReceiptIcon />
      </Avatar>
      <Typography
        variant="h6"
        noWrap
        sx={{
          fontWeight: 600,
          letterSpacing: "0.5px",
          background: "linear-gradient(45deg, #bb86fc 30%, #03dac6 90%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Sistema de Faturas
      </Typography>
    </Box>
  );

  const drawer = (
    <>
      {logo}
      <Divider sx={{ opacity: 0.2 }} />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                "&.Mui-selected": {
                  bgcolor: "rgba(156, 39, 176, 0.15)",
                  "&:hover": {
                    bgcolor: "rgba(156, 39, 176, 0.2)",
                  },
                },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color:
                    location.pathname === item.path
                      ? "primary.light"
                      : "text.secondary",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: "blur(8px)",
          bgcolor: "rgba(30, 30, 30, 0.8)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Sistema de Controle de Faturas com OCR
            </Typography>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: "block", sm: "none" } }}
            >
              Faturas OCR
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={drawerOpen}
          onClose={isMobile ? handleDrawerToggle : undefined}
          ModalProps={{
            keepMounted: true, // Melhor performance em dispositivos móveis
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "background.paper",
              borderRight: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.3)",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default AppNavigation;
