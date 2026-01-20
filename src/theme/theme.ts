import { createTheme } from '@mui/material/styles';

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
    background: {
      default: '#ffffff', 
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
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
        root: ({ theme }) => ({
          borderRadius: 25,
          height: 45,
          width: 120,
          padding: '0 32px',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.3s ease',
          boxShadow: 'none',
        }),
        contained: ({ theme }) => ({
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
        }),
        containedPrimary: ({ theme }) => ({
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
              borderColor: '#adadad',
              borderWidth: '1px',
            },
            
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            
            '&.Mui-focused fieldset': {
              borderColor: '#adadad',
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
        root: ({ theme }) => ({
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