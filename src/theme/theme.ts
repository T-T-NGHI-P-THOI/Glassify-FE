import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', 
      light: '#8b9cff',
      dark: '#5568d3',
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
          borderRadius: 15,
          padding: '12px 32px',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 0.3s ease',
        }),
        contained: ({ theme }) => ({
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
          // '&:hover': {
          //   boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
          //   transform: 'translateY(-2px)',
          // },
        }),
        containedPrimary: ({ theme }) => ({
          background: `rgb(0, 0, 0)`,
          // '&:hover': {
          //   background: `rgb(0, 0, 0)`,
          //   boxShadow: `0 6px 20px ${theme.palette.primary.main}66`,
          // },
        }),
        containedSecondary: ({ theme }) => ({
          background: `linear-gradient(45deg, #f093fb 30%, ${theme.palette.secondary.main} 90%)`,
          // '&:hover': {
          //   background: `linear-gradient(45deg, #e082ea 30%, ${theme.palette.secondary.dark} 90%)`,
          //   boxShadow: `0 6px 20px ${theme.palette.secondary.main}66`,
          // },
        }),
        outlined: ({ theme }) => ({
          borderWidth: '2px',
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          // '&:hover': {
          //   borderWidth: '1px',
          //   backgroundColor: `${theme.palette.primary.main}0D`, 
          //   transform: 'translateY(-2px)',
          // },
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