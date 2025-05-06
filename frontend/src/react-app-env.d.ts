/// <reference types="react-scripts" />

declare module "@mui/material/Grid" {
  interface GridProps {
    item?: boolean;
    container?: boolean;
    children?: React.ReactNode;
  }
}

declare module "@mui/material" {
  export interface Theme {
    zIndex: {
      drawer: number;
      [key: string]: number;
    };
    breakpoints: {
      down: (key: string) => boolean;
      up: (key: string) => boolean;
    };
    spacing: (...values: number[]) => string | number;
    mixins: {
      toolbar: object;
    };
    palette: any;
    transitions: {
      create: (props: string | string[], options?: object) => string;
      duration: {
        shortest: number;
        shorter: number;
        short: number;
        standard: number;
        complex: number;
        enteringScreen: number;
        leavingScreen: number;
      };
      easing: {
        easeInOut: string;
        easeOut: string;
        easeIn: string;
        sharp: string;
      };
    };
  }

  export function alpha(color: string, opacity: number): string;
  export function createTheme(options: any, ...args: any[]): Theme;
  export function useTheme(): Theme;
  export function useMediaQuery(query: any): boolean;

  export interface ThemeProviderProps {
    theme: Theme;
    children?: React.ReactNode;
  }

  export const ThemeProvider: React.ComponentType<ThemeProviderProps>;

  export interface GridProps {
    item?: boolean;
    container?: boolean;
    xs?: number | boolean;
    sm?: number | boolean;
    md?: number | boolean;
    lg?: number | boolean;
    xl?: number | boolean;
    spacing?: number;
    direction?: "row" | "column";
    justifyContent?: string;
    alignItems?: string;
    sx?: any;
    children?: React.ReactNode;
    elevation?: number;
  }

  export interface TablePaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    rowsPerPageOptions?: number[];
    component?: string;
    onPageChange: (
      event: React.MouseEvent<HTMLButtonElement> | null,
      newPage: number
    ) => void;
    onRowsPerPageChange?: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    labelRowsPerPage?: React.ReactNode;
    labelDisplayedRows?: (paginationInfo: {
      from: number;
      to: number;
      count: number;
    }) => string;
    sx?: any;
  }

  export interface SelectChangeEvent {
    target: {
      value: string;
      name: string;
    };
  }

  export interface AvatarProps {
    alt?: string;
    children?: React.ReactNode;
    src?: string;
    srcSet?: string;
    variant?: "circular" | "rounded" | "square";
    sx?: any;
  }

  export const Alert: React.ComponentType<any>;
  export const AppBar: React.ComponentType<any>;
  export const Avatar: React.ComponentType<AvatarProps>;
  export const Backdrop: React.ComponentType<any>;
  export const Badge: React.ComponentType<any>;
  export const Box: React.ComponentType<any>;
  export const Button: React.ComponentType<any>;
  export const Card: React.ComponentType<any>;
  export const CardContent: React.ComponentType<any>;
  export const Chip: React.ComponentType<any>;
  export const CircularProgress: React.ComponentType<any>;
  export const Container: React.ComponentType<any>;
  export const CssBaseline: React.ComponentType<any>;
  export const Dialog: React.ComponentType<any>;
  export const DialogActions: React.ComponentType<any>;
  export const DialogContent: React.ComponentType<any>;
  export const DialogContentText: React.ComponentType<any>;
  export const DialogTitle: React.ComponentType<any>;
  export const Divider: React.ComponentType<any>;
  export const Drawer: React.ComponentType<any>;
  export const FormControl: React.ComponentType<any>;
  export const Grid: React.ComponentType<GridProps>;
  export const IconButton: React.ComponentType<any>;
  export const InputAdornment: React.ComponentType<any>;
  export const InputLabel: React.ComponentType<any>;
  export const LinearProgress: React.ComponentType<any>;
  export const List: React.ComponentType<any>;
  export const ListItem: React.ComponentType<any>;
  export const ListItemButton: React.ComponentType<any>;
  export const ListItemIcon: React.ComponentType<any>;
  export const ListItemSecondaryAction: React.ComponentType<any>;
  export const ListItemText: React.ComponentType<any>;
  export const MenuItem: React.ComponentType<any>;
  export const Paper: React.ComponentType<any>;
  export const Select: React.ComponentType<any>;
  export const Snackbar: React.ComponentType<any>;
  export const Tab: React.ComponentType<any>;
  export const Table: React.ComponentType<any>;
  export const TableBody: React.ComponentType<any>;
  export const TableCell: React.ComponentType<any>;
  export const TableContainer: React.ComponentType<any>;
  export const TableHead: React.ComponentType<any>;
  export const TablePagination: React.ComponentType<TablePaginationProps>;
  export const TableRow: React.ComponentType<any>;
  export const Tabs: React.ComponentType<any>;
  export const TextField: React.ComponentType<any>;
  export const Toolbar: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const Typography: React.ComponentType<any>;
}
