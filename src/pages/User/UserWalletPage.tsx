import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AccountBalanceWallet,
  ArrowBack,
  ArrowUpward,
  ArrowDownward,
  TrendingUp,
  ShoppingBag,
  AddCircleOutline,
} from '@mui/icons-material';
import { userWalletApi, type UserWalletResponse, type UserTransactionResponse } from '@/api/user-wallet-api';
import { paymentApi } from '@/api/payment-api';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'TOP_UP': return <ArrowDownward sx={{ fontSize: 16 }} />;
    case 'REFUND': return <ArrowDownward sx={{ fontSize: 16 }} />;
    case 'ORDER_PAYMENT': return <ArrowUpward sx={{ fontSize: 16 }} />;
    default: return <ArrowUpward sx={{ fontSize: 16 }} />;
  }
};

const getTransactionColor = (type: string): 'success' | 'error' | 'default' => {
  switch (type) {
    case 'TOP_UP':
    case 'REFUND': return 'success';
    case 'ORDER_PAYMENT': return 'error';
    default: return 'default';
  }
};

const getTransactionLabel = (type: string) => {
  switch (type) {
    case 'TOP_UP': return 'Top Up';
    case 'ORDER_PAYMENT': return 'Order Payment';
    case 'REFUND': return 'Refund';
    default: return type;
  }
};

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'PENDING':
    case 'PROCESSING': return 'warning';
    case 'FAILED':
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const UserWalletPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<UserWalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const [transactions, setTransactions] = useState<UserTransactionResponse[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const res = await userWalletApi.getMyWallet();
      if (res.data) setWallet(res.data);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number) => {
    try {
      setTxLoading(true);
      const res = await userWalletApi.getTransactionHistory({ page: page - 1, size: 20 });
      if (res.data) {
        // BE returns List (not paginated wrapper), so we handle it as a flat list
        const list = Array.isArray(res.data) ? res.data : [];
        setTransactions(list);
        // Calculate pages from size; if returned exactly 20, there may be more
        setTxTotalPages(list.length === 20 ? page + 1 : page);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useLayoutConfig({ showNavbar: true, showFooter: true });

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage, fetchTransactions]);

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Minimum top-up amount is 10,000 VND');
      return;
    }
    try {
      setSubmitting(true);
      const res = await paymentApi.topUpWallet({ amount });
      const paymentUrl = res.data;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.error('Failed to create top-up payment URL');
      }
    } catch (err) {
      console.error('Failed to top up:', err);
      toast.error('Failed to initiate top-up. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const balanceCards = wallet ? [
    {
      label: 'Available Balance',
      value: wallet.availableBalance,
      icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />,
      color: theme.palette.custom?.status?.success?.main || '#4caf50',
      bg: theme.palette.custom?.status?.success?.light || '#e8f5e9',
    },
    {
      label: 'Total Top-Up',
      value: wallet.totalTopUp,
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      color: theme.palette.primary.main,
      bg: theme.palette.primary.light,
    },
    {
      label: 'Total Spent',
      value: wallet.totalSpent,
      icon: <ShoppingBag sx={{ fontSize: 28 }} />,
      color: theme.palette.custom?.status?.error?.main || '#d32f2f',
      bg: theme.palette.custom?.status?.error?.light || '#ffebee',
    },
  ] : [];

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: 3, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            disableElevation
            sx={{
              bgcolor: '#111',
              color: '#fff',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#333', boxShadow: 'none' },
            }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111' }}>
              My Wallet
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#888' }}>
              Manage your balance and view transaction history
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutline />}
          onClick={() => setTopUpDialogOpen(true)}
          disableElevation
          sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          Top Up
        </Button>
      </Box>

      {/* Balance Cards */}
      {walletLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : wallet ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5, mb: 4 }}>
            {balanceCards.map((card) => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e5e5' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: card.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                    {card.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#111' }}>
                  {formatCurrency(card.value)}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Transaction History */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f0f0f0' }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                Transaction History
              </Typography>
            </Box>

            {txLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : transactions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AccountBalanceWallet sx={{ fontSize: 48, color: '#ddd', mb: 1.5 }} />
                <Typography sx={{ fontSize: 14, color: '#888' }}>
                  No transactions yet. Top up to get started!
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['DATE', 'TYPE', 'DESCRIPTION', 'AMOUNT', 'BALANCE', 'STATUS'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, color: '#888', fontSize: 12, letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((tx) => {
                        const color = getTransactionColor(tx.type);
                        return (
                          <TableRow key={tx.id} hover>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: '#666' }}>
                                {formatDate(tx.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getTransactionIcon(tx.type)}
                                label={getTransactionLabel(tx.type)}
                                size="small"
                                color={color}
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: 11 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: '#555', maxWidth: 220 }} noWrap>
                                {tx.description || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: color === 'success' ? '#4caf50' : '#d32f2f',
                                }}
                              >
                                {color === 'success' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: '#666' }}>
                                {formatCurrency(tx.balanceAfter)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={tx.status}
                                size="small"
                                color={getStatusColor(tx.status)}
                                sx={{ fontWeight: 600, fontSize: 11 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                {txTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <Pagination
                      count={txTotalPages}
                      page={txPage}
                      onChange={(_, p) => setTxPage(p)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </>
      ) : (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: '1px solid #e5e5e5', textAlign: 'center' }}>
          <AccountBalanceWallet sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#666', mb: 1 }}>
            Wallet not available
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#888' }}>
            Your wallet will be set up automatically when you make your first transaction.
          </Typography>
        </Paper>
      )}

      {/* Top Up Dialog */}
      <Dialog open={topUpDialogOpen} onClose={() => setTopUpDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AddCircleOutline sx={{ color: '#4caf50' }} />
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Top Up Wallet</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {wallet && (
              <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 13, color: '#888' }}>Current balance</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#111' }}>
                  {formatCurrency(wallet.availableBalance)}
                </Typography>
              </Box>
            )}
            <Box>
              <TextField
                label="Amount to top up (VND)"
                placeholder="Min. 10,000 VND"
                fullWidth
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                size="small"
              />
              {topUpAmount && !isNaN(Number(topUpAmount)) && Number(topUpAmount) > 0 && (
                <Typography sx={{ fontSize: 13, color: '#4caf50', fontWeight: 600, mt: 0.75, pl: 0.5 }}>
                  = {formatCurrency(Number(topUpAmount))}
                </Typography>
              )}
            </Box>
            <Alert severity="info" sx={{ fontSize: 12 }}>
              You will be redirected to VNPay to complete the top-up payment.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setTopUpDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTopUp}
            disabled={submitting}
            disableElevation
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? 'Redirecting...' : 'Top Up via VNPay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserWalletPage;
