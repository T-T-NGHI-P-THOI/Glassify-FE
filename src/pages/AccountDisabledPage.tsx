import { Box, Typography, Button, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Block, SupportAgent } from '@mui/icons-material';
import { TokenManager } from '@/api/axios.config';
import { useNavigate } from 'react-router-dom';

const AccountDisabledPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    TokenManager.clearTokens();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.custom.neutral[50],
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          width: '100%',
          p: 5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.custom.border.light}`,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: theme.palette.custom.status.error.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Block sx={{ fontSize: 40, color: theme.palette.custom.status.error.main }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 1 }}>
          Account Disabled
        </Typography>

        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3, lineHeight: 1.7 }}>
          Your account has been temporarily disabled by our admin team. You cannot access the platform until your account is reactivated.
        </Typography>

        <Box
          sx={{
            bgcolor: theme.palette.custom.status.error.light,
            borderRadius: 2,
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <SupportAgent sx={{ color: theme.palette.custom.status.error.main, fontSize: 20 }} />
          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
            If you believe this is a mistake, please contact us at{' '}
            <strong>support@glassify.com</strong>
          </Typography>
        </Box>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleLogout}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderColor: theme.palette.custom.border.main,
            color: theme.palette.custom.neutral[700],
          }}
        >
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
};

export default AccountDisabledPage;
