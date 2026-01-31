import { createTheme } from '@mui/material/styles';

// Custom colors for the application
export const customColors = {
  // Status colors
  status: {
    success: {
      main: '#16a34a',
      light: '#dcfce7',
    },
    warning: {
      main: '#d97706',
      light: '#fef3c7',
    },
    error: {
      main: '#dc2626',
      light: '#fee2e2',
    },
    info: {
      main: '#2563eb',
      light: '#dbeafe',
    },
    purple: {
      main: '#8b5cf6',
      light: '#f5f3ff',
    },
    pink: {
      main: '#ec4899',
      light: '#fdf2f8',
    },
    indigo: {
      main: '#4f46e5',
      light: '#e0e7ff',
    },
    rose: {
      main: '#db2777',
      light: '#fce7f3',
    },
    teal: {
      main: '#059669',
      light: '#d1fae5',
    },
    black: {
      main: '#000000',
      light: '#353535',
    },
  },
  // Neutral/Gray colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Border colors
  border: {
    light: '#e5e7eb',
    main: '#d1d5db',
    dark: '#9ca3af',
  },
};

// Extend the theme palette type
declare module '@mui/material/styles' {
  interface Palette {
    custom: typeof customColors;
  }
  interface PaletteOptions {
    custom?: typeof customColors;
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      light: '#ffffff',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f5576c',
      light: '#ff7a8a',
      dark: '#e4465b',
      contrastText: '#ffffff',
    },
    success: {
      main: customColors.status.success.main,
      light: customColors.status.success.light,
    },
    warning: {
      main: customColors.status.warning.main,
      light: customColors.status.warning.light,
    },
    error: {
      main: customColors.status.error.main,
      light: customColors.status.error.light,
    },
    info: {
      main: customColors.status.info.main,
      light: customColors.status.info.light,
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: customColors.neutral[800],
      secondary: customColors.neutral[500],
    },
    divider: customColors.border.light,
    custom: customColors,
  },
  typography: {
    fontFamily: '"Manrope", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 15,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: false,
        variant: 'contained',
      },
      styleOverrides: {
        root: () => ({
          borderRadius: 25,
          height: 45,
          width: 'auto',
          padding: '0 32px',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.3s ease',
          boxShadow: 'none',
        }),
        contained: () => ({
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
        }),
        containedPrimary: () => ({
          background: `rgb(0, 0, 0)`,
        }),
        containedSecondary: ({ theme }) => ({
          background: `linear-gradient(45deg, #f093fb 30%, ${theme.palette.secondary.main} 90%)`,
        }),
        outlined: ({ theme }) => ({
          borderWidth: '2px',
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 15,
            backgroundColor: theme.palette.background.default,
            transition: 'all 0.3s ease',

            '& fieldset': {
              borderColor: customColors.border.dark,
              borderWidth: '1px',
            },

            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },

            '&.Mui-focused fieldset': {
              borderColor: customColors.border.dark,
              borderWidth: '2px',
            },

            '&.Mui-focused': {
              backgroundColor: theme.palette.background.paper,
            },
          },

          '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
            fontWeight: 500,

            '&.Mui-focused': {
              color: theme.palette.primary.main,
              fontWeight: 600,
            },
          },

          '& .MuiOutlinedInput-input': {
            padding: '14px 16px',
            fontSize: '15px',
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: () => ({
          borderRadius: 15,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
          },
        }),
      },
    },
  },
});
