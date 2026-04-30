import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
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
  AccountBalance,
  Replay,
  LocalShipping,
  InfoOutlined,
} from '@mui/icons-material';
import { userWalletApi, type UserWalletResponse, type UserTransactionResponse, type UserWithdrawalResponse } from '@/api/user-wallet-api';
import { userBankAccountApi, type UserBankAccountResponse } from '@/api/user-bank-account-api';
import { paymentApi } from '@/api/payment-api';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber, parseNumber } from '@/utils/formatCurrency';
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
    case 'WITHDRAWAL': return 'Withdrawal';
    default: return type;
  }
};

const getWithdrawalStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'COMPLETED': return 'success';
    case 'REJECTED': case 'CANCELLED': return 'error';
    default: return 'default';
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
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState(0);
  const [wallet, setWallet] = useState<UserWalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const [transactions, setTransactions] = useState<UserTransactionResponse[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Withdrawal state
  const [withdrawals, setWithdrawals] = useState<UserWithdrawalResponse[]>([]);
  const [wdLoading, setWdLoading] = useState(false);
  const [wdPage, setWdPage] = useState(1);
  const [wdTotalPages, setWdTotalPages] = useState(1);
  const [bankAccounts, setBankAccounts] = useState<UserBankAccountResponse[]>([]);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);

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
        const list = Array.isArray(res.data) ? res.data : [];
        setTransactions(list);
        setTxTotalPages(list.length === 20 ? page + 1 : page);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async (page: number) => {
    try {
      setWdLoading(true);
      const res = await userWalletApi.getWithdrawalHistory({ page: page - 1, size: 20 });
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        setWithdrawals(list);
        setWdTotalPages(list.length === 20 ? page + 1 : page);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setWdLoading(false);
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await userBankAccountApi.getMyBankAccounts();
      if (res.data) {
        setBankAccounts(res.data);
        const def = res.data.find(a => a.isDefault);
        if (def) setSelectedBankAccountId(def.id);
      }
    } catch { /* ignore */ }
  }, []);

  useLayoutConfig({ showNavbar: true, showFooter: true });

  useEffect(() => { fetchWallet(); }, [fetchWallet]);
  useEffect(() => { fetchTransactions(txPage); }, [txPage, fetchTransactions]);
  useEffect(() => { if (tab === 1) { fetchWithdrawals(wdPage); fetchBankAccounts(); } }, [tab, wdPage, fetchWithdrawals, fetchBankAccounts]);

  // Auto-open top-up dialog when redirected from checkout with insufficient wallet funds
  useEffect(() => {
    const topUpAmount = searchParams.get('topUpAmount');
    if (topUpAmount) {
      setTopUpAmount(topUpAmount);
      setTopUpDialogOpen(true);
    }
  }, [searchParams]);

  const handleWithdrawRequest = async () => {
    const amount = parseNumber(withdrawAmount);
    if (isNaN(amount) || amount < 50000) {
      toast.error('Minimum withdrawal amount is 50,000 VND');
      return;
    }
    if (!selectedBankAccountId) {
      toast.error('Please select a bank account');
      return;
    }
    try {
      setSubmitting(true);
      await userWalletApi.requestWithdrawal({ amount, bankAccountId: selectedBankAccountId });
      toast.success('Withdrawal request submitted');
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      fetchWallet();
      fetchWithdrawals(wdPage);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    try {
      setSubmitting(true);
      await userWalletApi.cancelWithdrawal(id);
      toast.success('Withdrawal cancelled');
      setCancelDialogId(null);
      fetchWallet();
      fetchWithdrawals(wdPage);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseNumber(topUpAmount);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Minimum top-up amount is 10,000 VND');
      return;
    }
    try {
      setSubmitting(true);
      const res = await paymentApi.topUpWallet({ amount });
      const paymentUrl = res.data;
      if (paymentUrl) {
        // Persist returnTo so PaymentResultPage can redirect back after VNPay completes
        const returnTo = searchParams.get('returnTo') || sessionStorage.getItem('topup_return_to');
        if (returnTo) {
          sessionStorage.setItem('topup_return_to', returnTo);
        }
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
      color: theme.palette.custom?.status?.success?.main || '#16a34a',
      bg: theme.palette.custom?.status?.success?.light || '#dcfce7',
      prefix: '',
      tooltip: 'Current spendable balance in your wallet',
    },
    {
      label: 'Total Topped Up',
      value: wallet.totalTopUp,
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      color: '#2563eb',
      bg: '#dbeafe',
      prefix: '+',
      tooltip: 'Total amount you have added to your wallet via VNPay',
    },
    {
      label: 'Total Spent on Orders',
      value: wallet.totalSpent,
      icon: <ShoppingBag sx={{ fontSize: 28 }} />,
      color: theme.palette.custom?.status?.error?.main || '#dc2626',
      bg: theme.palette.custom?.status?.error?.light || '#fee2e2',
      prefix: '-',
      tooltip: 'Total amount deducted for order payments',
    },
    {
      label: 'Total Refunded',
      value: wallet.totalRefunded ?? 0,
      icon: <Replay sx={{ fontSize: 28 }} />,
      color: '#d97706',
      bg: '#fef3c7',
      prefix: '+',
      tooltip: 'Total amount refunded back to your wallet from returns or cancellations',
    },
  ] : [];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, py: 4 }}>
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
          {/* Stats Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
            {balanceCards.map((card) => (
              <Paper
                key={card.label}
                elevation={0}
                sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e5e5', position: 'relative' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
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
                  <Tooltip title={card.tooltip} placement="top" arrow>
                    <InfoOutlined sx={{ fontSize: 16, color: '#bbb', cursor: 'help' }} />
                  </Tooltip>
                </Box>
                <Typography sx={{ fontSize: 12, color: '#888', fontWeight: 500, mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: card.prefix ? card.color : '#111' }}>
                  {card.prefix}{formatCurrency(card.value)}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Balance equation */}
          {wallet && (
            <Paper elevation={0} sx={{ px: 3, py: 1.5, mb: 4, borderRadius: 2, border: '1px solid #e5e5e5', bgcolor: '#fafafa' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 12, color: '#888' }}>Balance formula:</Typography>
                <Typography sx={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>+{formatCurrency(wallet.totalTopUp)} topped up</Typography>
                <Typography sx={{ fontSize: 12, color: '#888' }}>−</Typography>
                <Typography sx={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{formatCurrency(wallet.totalSpent)} spent</Typography>
                <Typography sx={{ fontSize: 12, color: '#888' }}>+</Typography>
                <Typography sx={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>{formatCurrency(wallet.totalRefunded ?? 0)} refunded</Typography>
                <Typography sx={{ fontSize: 12, color: '#888' }}>=</Typography>
                <Typography sx={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>{formatCurrency(wallet.availableBalance)} available</Typography>
                <Typography sx={{ fontSize: 11, color: '#aaa', ml: 0.5 }}>(excl. withdrawals)</Typography>
              </Box>
            </Paper>
          )}

          {/* Tabs */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Transaction History" />
                <Tab label="Withdrawals" />
              </Tabs>
              {tab === 1 && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AccountBalance sx={{ fontSize: 16 }} />}
                  onClick={() => { fetchBankAccounts(); setWithdrawDialogOpen(true); }}
                  disableElevation
                  sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontSize: 13, mr: 1 }}
                >
                  Request Withdrawal
                </Button>
              )}
            </Box>

            {/* Transaction History Tab */}
            {tab === 0 && (txLoading ? (
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
                        {['DATE', 'TYPE', 'DESCRIPTION', 'ORDER DETAIL', 'AMOUNT', 'BALANCE', 'STATUS'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, color: '#888', fontSize: 12, letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((tx) => {
                        const color = getTransactionColor(tx.type);
                        const summary = tx.orderSummary;
                        // Build top-level items (frames, accessories) — exclude lens children for the summary header
                        const topLevelItems = summary?.items.filter(it => !it.parentItemId) ?? [];
                        const lensItems = summary?.items.filter(it => it.parentItemId) ?? [];

                        const orderTooltip = summary ? (
                          <Box sx={{ p: 0.5, minWidth: 260, maxWidth: 340 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff', mb: 1 }}>
                              Order #{summary.orderNumber}
                            </Typography>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 1 }} />
                            {topLevelItems.map((item, idx) => {
                              const childLenses = lensItems.filter(l => l.parentItemId === summary.items.find(p => p === item)?.productName
                                // fallback: match by position in original list
                              );
                              // Since we don't have the frame item ID here, just show all items in order
                              return null; // handled below
                            })}
                            {summary.items.map((item, idx) => (
                              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, pl: item.parentItemId ? 2 : 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                                  {item.parentItemId && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00838f', flexShrink: 0 }} />
                                  )}
                                  <Typography sx={{ fontSize: 11, color: item.parentItemId ? '#80cbc4' : '#fff', fontWeight: item.parentItemId ? 400 : 500 }} noWrap>
                                    {item.parentItemId ? `↳ Lens: ${item.productName}` : `${item.productName} ×${item.quantity}`}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 11, color: item.isFree ? '#81c784' : '#fff', fontWeight: 500, ml: 1, flexShrink: 0 }}>
                                  {item.isFree ? 'Free' : formatCurrency(item.lineTotal)}
                                </Typography>
                              </Box>
                            ))}
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 0.75 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Subtotal</Typography>
                              <Typography sx={{ fontSize: 11, color: '#fff' }}>{formatCurrency(summary.subtotal)}</Typography>
                            </Box>
                            {summary.shippingFee > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocalShipping sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }} />
                                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Shipping</Typography>
                                </Box>
                                <Typography sx={{ fontSize: 11, color: '#fff' }}>{formatCurrency(summary.shippingFee)}</Typography>
                              </Box>
                            )}
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Total</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#ffeb3b' }}>{formatCurrency(summary.totalAmount)}</Typography>
                            </Box>
                          </Box>
                        ) : null;

                        return (
                          <TableRow key={tx.id} hover sx={{ cursor: summary ? 'pointer' : 'default' }}>
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
                            <TableCell sx={{ minWidth: 180 }}>
                              <Typography sx={{ fontSize: 13, color: '#555' }}>
                                {tx.description || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {summary ? (
                                <Tooltip
                                  title={orderTooltip}
                                  placement="left"
                                  arrow
                                  componentsProps={{
                                    tooltip: {
                                      sx: {
                                        bgcolor: '#1a1a2e',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 2,
                                        p: 1.5,
                                        maxWidth: 360,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                      },
                                    },
                                    arrow: { sx: { color: '#1a1a2e' } },
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1976d2' }}>
                                      #{summary.orderNumber}
                                    </Typography>
                                    <InfoOutlined sx={{ fontSize: 14, color: '#1976d2' }} />
                                    <Typography sx={{ fontSize: 11, color: '#888' }}>
                                      {summary.items.filter(i => !i.parentItemId).length} item{summary.items.filter(i => !i.parentItemId).length !== 1 ? 's' : ''}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Typography sx={{ fontSize: 13, color: '#bbb' }}>—</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: color === 'success' ? '#16a34a' : '#dc2626',
                                }}
                              >
                                {color === 'success' ? '+' : '−'}{formatCurrency(Math.abs(tx.amount))}
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
            ))}

            {/* Withdrawals Tab */}
            {tab === 1 && (wdLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : withdrawals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AccountBalance sx={{ fontSize: 48, color: '#ddd', mb: 1.5 }} />
                <Typography sx={{ fontSize: 14, color: '#888' }}>
                  No withdrawal requests yet.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['DATE', 'AMOUNT', 'NET', 'BANK ACCOUNT', 'STATUS', 'ACTION'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, color: '#888', fontSize: 12, letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.map((wd) => (
                        <TableRow key={wd.id} hover>
                          <TableCell sx={{ fontSize: 13, color: '#666' }}>{formatDate(wd.requestedAt)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(wd.amount)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{formatCurrency(wd.netAmount)}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{wd.bankName}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{wd.accountNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={wd.status} size="small" color={getWithdrawalStatusColor(wd.status)} sx={{ fontWeight: 600, fontSize: 11 }} />
                          </TableCell>
                          <TableCell>
                            {wd.status === 'PENDING' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => setCancelDialogId(wd.id)}
                                sx={{ textTransform: 'none', fontSize: 12 }}
                              >
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {wdTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <Pagination count={wdTotalPages} page={wdPage} onChange={(_, p) => setWdPage(p)} color="primary" size="small" />
                  </Box>
                )}
              </>
            ))}
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

      {/* Withdrawal Request Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountBalance sx={{ color: '#1976d2' }} />
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Request Withdrawal</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {wallet && (
              <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 13, color: '#888' }}>Available balance</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#111' }}>
                  {formatCurrency(wallet.availableBalance)}
                </Typography>
              </Box>
            )}
            <TextField
              label="Amount to withdraw (VND)"
              placeholder="Min. 50,000 VND"
              fullWidth
              value={withdrawAmount ? formatNumber(parseNumber(withdrawAmount)) : ''}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              size="small"
            />
            {withdrawAmount && parseNumber(withdrawAmount) > 0 && (
              <Typography sx={{ fontSize: 13, color: '#1976d2', fontWeight: 600, mt: -1, pl: 0.5 }}>
                = {formatCurrency(parseNumber(withdrawAmount))}
              </Typography>
            )}
            {bankAccounts.length === 0 ? (
              <Alert severity="warning" sx={{ fontSize: 12 }}>
                You have no bank accounts. Please add one first in Bank Accounts settings.
              </Alert>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Bank Account</InputLabel>
                <Select
                  value={selectedBankAccountId}
                  label="Bank Account"
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                >
                  {bankAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.bankName} – {acc.accountNumber} ({acc.accountHolder})
                      {acc.isDefault ? ' ★' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setWithdrawDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleWithdrawRequest}
            disabled={submitting || bankAccounts.length === 0}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            disableElevation
            sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Withdrawal Dialog */}
      <Dialog open={!!cancelDialogId} onClose={() => setCancelDialogId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Withdrawal</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#555' }}>
            Are you sure you want to cancel this withdrawal? Your balance will be refunded.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCancelDialogId(null)} disabled={submitting} sx={{ textTransform: 'none' }}>Back</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => cancelDialogId && handleCancelWithdrawal(cancelDialogId)}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ textTransform: 'none' }}
          >
            Cancel Withdrawal
          </Button>
        </DialogActions>
      </Dialog>

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
                value={topUpAmount ? formatNumber(parseNumber(topUpAmount)) : ''}
                onChange={(e) => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                size="small"
              />
              {topUpAmount && parseNumber(topUpAmount) > 0 && (
                <Typography sx={{ fontSize: 13, color: '#4caf50', fontWeight: 600, mt: 0.75, pl: 0.5 }}>
                  = {formatCurrency(parseNumber(topUpAmount))}
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
