import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  MenuItem,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AccountBalanceWallet,
  TrendingUp,
  AccessTime,
  AcUnit,
  ArrowUpward,
  ArrowDownward,
  Cancel,
  Receipt,
  MonetizationOn,
  Info,
  Inventory2,
  Undo,
  Schedule,
  LocalShipping,
  Warning,
  AddCard,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopWalletApi } from '@/api/shop-wallet-api';
import type {
  WalletResponse,
  WithdrawalResponse,
  TransactionResponse,
  ShopBankAccountResponse,
  EscrowSummaryResponse,
} from '@/api/shop-wallet-api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatNumber, parseNumber } from '@/utils/formatCurrency';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getWithdrawalStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'PENDING': return 'warning';
    case 'PROCESSING': return 'info';
    case 'REJECTED': return 'error';
    case 'CANCELLED': return 'default';
    default: return 'default';
  }
};

const isCredit = (type: string) =>
  ['CREDIT', 'ORDER_PAYMENT', 'REFUND_REVERSAL'].includes(type);

const getTransactionTypeIcon = (type: string) => {
  if (isCredit(type)) return <ArrowDownward sx={{ fontSize: 14 }} />;
  return <ArrowUpward sx={{ fontSize: 14 }} />;
};

const ShopWalletPage = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [withdrawals, setWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [escrows, setEscrows] = useState<EscrowSummaryResponse[]>([]);
  const [escrowsLoading, setEscrowsLoading] = useState(false);

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [bankAccounts, setBankAccounts] = useState<ShopBankAccountResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingWithdrawal, setCancellingWithdrawal] = useState<WithdrawalResponse | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const fetchWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const response = await shopWalletApi.getMyWallet();
      if (response.data) setWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async (page: number) => {
    try {
      setWithdrawalsLoading(true);
      const response = await shopWalletApi.getWithdrawalHistory({ page: page - 1, size: 10 });
      if (Array.isArray(response.data)) {
        setWithdrawals(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number) => {
    try {
      setTransactionsLoading(true);
      const response = await shopWalletApi.getTransactionHistory({ page: page - 1, size: 10 });
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const fetchEscrows = useCallback(async () => {
    try {
      setEscrowsLoading(true);
      const response = await shopWalletApi.getEscrowBreakdown();
      if (response.data) setEscrows(response.data);
    } catch (error) {
      console.error('Failed to fetch escrows:', error);
    } finally {
      setEscrowsLoading(false);
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await shopWalletApi.getBankAccounts();
      if (response.data) {
        setBankAccounts(response.data);
        const defaultAccount = response.data.find((a) => a.isDefault);
        if (defaultAccount) setSelectedBankAccountId(defaultAccount.id);
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (activeTab === 0) fetchWithdrawals(1);
    else if (activeTab === 1) fetchTransactions(1);
    else if (activeTab === 2) fetchEscrows();
  }, [activeTab, fetchWithdrawals, fetchTransactions, fetchEscrows]);

  const handleWithdraw = async () => {
    const amount = parseNumber(withdrawAmount);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Minimum withdrawal amount is 10,000 VND');
      return;
    }
    if (!selectedBankAccountId) {
      toast.error('Please select a bank account');
      return;
    }
    if (wallet && amount > wallet.availableBalance) {
      toast.error('Insufficient available balance');
      return;
    }
    try {
      setSubmitting(true);
      await shopWalletApi.requestWithdrawal({ amount, bankAccountId: selectedBankAccountId });
      toast.success('Withdrawal request submitted successfully');
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      fetchWallet();
      if (activeTab === 0) fetchWithdrawals(1);
    } catch (error) {
      console.error('Failed to request withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShopTopUp = async (amount: number) => {
    try {
      setTopUpLoading(true);
      const response = await shopWalletApi.createShopTopUpUrl({ amount });
      if (response.data) {
        window.location.href = response.data;
      }
    } catch (error) {
      console.error('Failed to create top-up URL:', error);
      toast.error('Failed to initiate top-up. Please try again.');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleCancelWithdrawal = async () => {
    if (!cancellingWithdrawal) return;
    try {
      setSubmitting(true);
      await shopWalletApi.cancelWithdrawal(cancellingWithdrawal.id);
      toast.success('Withdrawal cancelled successfully');
      setCancelDialogOpen(false);
      setCancellingWithdrawal(null);
      fetchWallet();
      fetchWithdrawals(1);
    } catch (error) {
      console.error('Failed to cancel withdrawal:', error);
      toast.error('Failed to cancel withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const statCards = wallet
    ? [
        {
          label: 'Available Balance',
          value: wallet.availableBalance,
          icon: <AccountBalanceWallet sx={{ fontSize: 22 }} />,
          color: theme.palette.custom.status.success.main,
          bgColor: theme.palette.custom.status.success.light,
          tooltip: 'Ready to withdraw. This is your spendable balance after all holds.',
          primary: true,
        },
        {
          label: 'Pending (Escrow)',
          value: wallet.pendingBalance,
          icon: <AccessTime sx={{ fontSize: 22 }} />,
          color: theme.palette.custom.status.warning.main,
          bgColor: theme.palette.custom.status.warning.light,
          tooltip: 'Held in escrow for completed orders awaiting the release window.',
          primary: false,
        },
        {
          label: 'Frozen',
          value: wallet.frozenBalance,
          icon: <AcUnit sx={{ fontSize: 22 }} />,
          color: theme.palette.custom.status.info.main,
          bgColor: theme.palette.custom.status.info.light,
          tooltip: 'Locked due to active disputes or admin holds.',
          primary: false,
        },
        {
          label: 'Total Earned',
          value: wallet.totalEarned,
          icon: <TrendingUp sx={{ fontSize: 22 }} />,
          color: theme.palette.primary.main,
          bgColor: theme.palette.primary.light,
          tooltip: 'Cumulative amount credited to your wallet from all completed orders.',
          primary: false,
        },
        {
          label: 'Total Withdrawn',
          value: wallet.totalWithdrawn,
          icon: <ArrowUpward sx={{ fontSize: 22 }} />,
          color: theme.palette.custom.neutral[600],
          bgColor: theme.palette.custom.neutral[100],
          tooltip: 'Total amount successfully transferred to your bank accounts.',
          primary: false,
        },
        {
          label: 'Total Refunded',
          value: wallet.totalRefunded ?? 0,
          icon: <Undo sx={{ fontSize: 22 }} />,
          color: theme.palette.custom.status.error.main,
          bgColor: theme.palette.custom.status.error.light,
          tooltip: 'Total amount refunded to buyers from orders linked to your escrow.',
          primary: false,
        },
        {
          label: 'COD Received',
          value: wallet.codReceivedAmount ?? 0,
          icon: <LocalShipping sx={{ fontSize: 22 }} />,
          color: theme.palette.custom.status.purple?.main ?? theme.palette.primary.main,
          bgColor: theme.palette.custom.status.purple?.light ?? theme.palette.primary.light,
          tooltip: 'Total cash collected directly from customers for delivered COD orders (after commission).',
          primary: false,
        },
      ]
    : [];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.WALLET}
        shopName={user?.shop?.shopName}
        shopLogo={user?.shop?.logoUrl}
        ownerName={user?.fullName}
        ownerEmail={user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Wallet
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Manage your shop's finances and withdrawals
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<MonetizationOn />}
            onClick={() => { setWithdrawDialogOpen(true); fetchBankAccounts(); }}
            disabled={!wallet || wallet.availableBalance < 10000}
            sx={{ height: 40, px: 3 }}
          >
            Withdraw
          </Button>
        </Box>

        {/* Stats Section */}
        {walletLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : wallet ? (
          <>
            {/* Primary balance — full width spotlight */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 2.5,
                borderRadius: 2,
                border: `1.5px solid ${theme.palette.custom.status.success.main}`,
                background: `linear-gradient(135deg, ${theme.palette.custom.status.success.light} 0%, #fff 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    bgcolor: theme.palette.custom.status.success.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <AccountBalanceWallet sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                      Available Balance
                    </Typography>
                    <Tooltip title="Ready to withdraw. This is your spendable balance after all holds." arrow>
                      <Info sx={{ fontSize: 14, color: theme.palette.custom.neutral[400], cursor: 'pointer' }} />
                    </Tooltip>
                  </Box>
                  <Typography sx={{ fontSize: 32, fontWeight: 800, color: theme.palette.custom.status.success.main, lineHeight: 1.2 }}>
                    {formatCurrency(wallet.availableBalance)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 0.5 }}>
                  Total Earned
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.primary.main }}>
                  {formatCurrency(wallet.totalEarned)}
                </Typography>
              </Box>
            </Paper>

            {/* Secondary stat cards grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, mb: 3 }}>
              {statCards.slice(1).map((card) => (
                <Paper
                  key={card.label}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: card.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Tooltip title={card.tooltip} arrow placement="top">
                      <Info sx={{ fontSize: 15, color: theme.palette.custom.neutral[400], cursor: 'pointer' }} />
                    </Tooltip>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500], fontWeight: 500, mb: 0.5 }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: card.color }}>
                    {formatCurrency(card.value)}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* COD Pending Commission Alert */}
            {((wallet.codPendingCommission ?? 0) > 0) && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 2,
                  border: `1.5px solid ${theme.palette.custom.status.error.main}`,
                  bgcolor: theme.palette.custom.status.error.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Warning sx={{ fontSize: 22, color: theme.palette.custom.status.error.main, mt: 0.25, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.status.error.main }}>
                      Unpaid COD Commission — {formatCurrency(wallet.codPendingCommission ?? 0)}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.error.main, mt: 0.25 }}>
                      Your available balance was insufficient to cover the platform commission for recent COD orders.
                      Please top up within <strong>3 days</strong> to avoid shop suspension.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={topUpLoading ? <CircularProgress size={14} color="inherit" /> : <AddCard />}
                  disabled={topUpLoading}
                  onClick={() => handleShopTopUp(Math.ceil(wallet.codPendingCommission ?? 0))}
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Top Up Now
                </Button>
              </Paper>
            )}

            {/* Low Balance Warning */}
            {((wallet.codPendingCommission ?? 0) === 0) && (wallet.availableBalance < 10_000_000) && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: `1.5px solid ${theme.palette.custom.status.warning.main}`,
                  bgcolor: theme.palette.custom.status.warning.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Warning sx={{ fontSize: 20, color: theme.palette.custom.status.warning.main, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.status.warning.main }}>
                      Low Balance — below 10,000,000 VND
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.warning.main }}>
                      Your available balance is low. Top up now so you can cover platform commission for COD orders.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={topUpLoading ? <CircularProgress size={13} color="inherit" /> : <AddCard />}
                  disabled={topUpLoading}
                  onClick={() => handleShopTopUp(10_000_000)}
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0, borderColor: theme.palette.custom.status.warning.main, color: theme.palette.custom.status.warning.main }}
                >
                  Top Up
                </Button>
              </Paper>
            )}

            {/* Tabs */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                overflow: 'hidden',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                  px: 2,
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14 },
                }}
              >
                <Tab label="Withdrawals" />
                <Tab label="Transactions" />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Pending Orders
                      {wallet.pendingBalance > 0 && (
                        <Chip
                          label={formatCurrency(wallet.pendingBalance)}
                          size="small"
                          color="warning"
                          sx={{ fontSize: 11, height: 20 }}
                        />
                      )}
                    </Box>
                  }
                />
              </Tabs>

              {/* Withdrawals Tab */}
              {activeTab === 0 && (
                <Box>
                  {withdrawalsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : withdrawals?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <MonetizationOn sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                        No withdrawal requests yet
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                              {['DATE', 'AMOUNT', 'FEE', 'NET', 'BANK ACCOUNT', 'STATUS', 'ACTIONS'].map((h) => (
                                <TableCell
                                  key={h}
                                  align={h === 'ACTIONS' ? 'center' : 'left'}
                                  sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}
                                >
                                  {h}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {withdrawals?.map((w) => (
                              <TableRow key={w.id} hover>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                                    {formatDate(w.requestedAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                    {formatCurrency(w.amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                                    {formatCurrency(w.fee)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                                    {formatCurrency(w.netAmount)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                                    {w.bankName}
                                  </Typography>
                                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontFamily: 'monospace' }}>
                                    {w.accountNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Tooltip title={w.rejectionReason || ''} arrow disableHoverListener={!w.rejectionReason}>
                                    <Chip
                                      label={w.status}
                                      size="small"
                                      color={getWithdrawalStatusColor(w.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}
                                      sx={{ fontWeight: 600, fontSize: 12 }}
                                    />
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="center">
                                  {w.status === 'PENDING' && (
                                    <Button
                                      size="small"
                                      color="error"
                                      startIcon={<Cancel sx={{ fontSize: 14 }} />}
                                      onClick={() => { setCancellingWithdrawal(w); setCancelDialogOpen(true); }}
                                      sx={{ fontSize: 12, textTransform: 'none' }}
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
                    </>
                  )}
                </Box>
              )}

              {/* Transactions Tab */}
              {activeTab === 1 && (
                <Box>
                  {transactionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Receipt sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                        No transactions yet
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                              {['DATE', 'TYPE', 'SOURCE / ORDER', 'AMOUNT', 'BALANCE AFTER', 'STATUS'].map((h) => (
                                <TableCell key={h} sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                                  {h}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {transactions.map((t) => {
                              const credit = isCredit(t.type);
                              const amountColor = credit
                                ? theme.palette.custom.status.success.main
                                : theme.palette.custom.status.error.main;
                              const amountPrefix = credit ? '+' : '-';
                              const hasRefundInfo = t.type === 'REFUND' && t.referenceId;

                              return (
                                <TableRow key={t.id} hover>
                                  <TableCell sx={{ minWidth: 130 }}>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                                      {formatDate(t.createdAt)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      icon={getTransactionTypeIcon(t.type)}
                                      label={t.type.replace(/_/g, ' ')}
                                      size="small"
                                      color={credit ? 'success' : 'error'}
                                      variant="outlined"
                                      sx={{ fontWeight: 600, fontSize: 11 }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ maxWidth: 260 }}>
                                    {t.orderNumber ? (
                                      <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                          <Receipt sx={{ fontSize: 13, color: theme.palette.primary.main }} />
                                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>
                                            #{t.orderNumber}
                                          </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }} noWrap>
                                          {t.description}
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }} noWrap>
                                        {t.description}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Tooltip
                                      title={hasRefundInfo ? `Refund from order${t.orderNumber ? ` #${t.orderNumber}` : ''}` : ''}
                                      arrow
                                      disableHoverListener={!hasRefundInfo}
                                    >
                                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: amountColor, cursor: hasRefundInfo ? 'help' : 'default' }}>
                                        {amountPrefix}{formatCurrency(Math.abs(t.amount))}
                                      </Typography>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                                      {formatCurrency(t.balanceAfter)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={t.status}
                                      size="small"
                                      color={getWithdrawalStatusColor(t.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}
                                      sx={{ fontWeight: 600, fontSize: 12 }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </Box>
              )}

              {/* Pending Orders (Escrow) Tab */}
              {activeTab === 2 && (
                <Box>
                  {escrowsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : escrows.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Inventory2 sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                        No pending orders — all funds have been released
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {escrows.map((e) => {
                        const hasRefund = e.refundedAmount > 0;
                        const releaseProgress = e.daysRemaining === 0
                          ? 100
                          : Math.max(0, Math.min(100, 100 - (e.daysRemaining / 7) * 100));

                        return (
                          <Paper
                            key={e.id}
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.custom.border.light}`,
                              '&:hover': { borderColor: theme.palette.custom.status.warning.main },
                              transition: 'border-color 0.15s',
                            }}
                          >
                            {/* Row 1: Order number + Days remaining badge */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Receipt sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                                <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.primary.main }}>
                                  #{e.shopOrderNumber}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {e.daysRemaining === 0 ? (
                                  <Chip label="Releasing soon" size="small" color="success" sx={{ fontWeight: 600, fontSize: 12 }} />
                                ) : (
                                  <Chip
                                    icon={<Schedule sx={{ fontSize: 13 }} />}
                                    label={`${e.daysRemaining}d remaining`}
                                    size="small"
                                    color="warning"
                                    sx={{ fontWeight: 600, fontSize: 12 }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* Row 2: Amount breakdown */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1.5 }}>
                              <Box>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.3 }}>
                                  Order Total
                                </Typography>
                                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                  {formatCurrency(e.totalAmount)}
                                </Typography>
                              </Box>
                              {hasRefund && (
                                <>
                                  <Box sx={{ color: theme.palette.custom.neutral[300] }}>−</Box>
                                  <Tooltip title="Amount refunded to buyer from this order" arrow>
                                    <Box sx={{ cursor: 'help' }}>
                                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.error.main, mb: 0.3 }}>
                                        Refunded
                                      </Typography>
                                      <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.status.error.main }}>
                                        −{formatCurrency(e.refundedAmount)}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                  <Box sx={{ color: theme.palette.custom.neutral[300] }}>=</Box>
                                  <Box>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.3 }}>
                                      Net to Release
                                    </Typography>
                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                                      {formatCurrency(e.netAmount)}
                                    </Typography>
                                  </Box>
                                </>
                              )}
                              {!hasRefund && (
                                <Box>
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.3 }}>
                                    Will Release
                                  </Typography>
                                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                                    {formatCurrency(e.netAmount)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Row 3: Release date + progress bar */}
                            <Box sx={{ mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                                  Release by {formatDateShort(e.holdUntil)}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                                  Held since {formatDateShort(e.createdAt)}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={releaseProgress}
                                color={e.daysRemaining === 0 ? 'success' : 'warning'}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
              textAlign: 'center',
            }}
          >
            <AccountBalanceWallet sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>
              Wallet not available
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Your shop wallet will be available once your shop is approved
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: theme.palette.custom.status.success.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MonetizationOn sx={{ fontSize: 22, color: theme.palette.custom.status.success.main }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 600 }}>Request Withdrawal</Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                Available: {wallet ? formatCurrency(wallet.availableBalance) : '---'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Amount (VND)"
              placeholder="Minimum 10,000 VND"
              fullWidth
              type="text"
              value={withdrawAmount ? formatNumber(parseNumber(withdrawAmount)) : ''}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
              slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', min: 10000 } }}
            />
            <TextField
              label="Bank Account"
              select
              fullWidth
              value={selectedBankAccountId}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              helperText={bankAccounts.length === 0 ? 'No bank accounts found. Please add one first.' : ''}
            >
              {bankAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 14 }}>
                      {account.bankName} - {account.accountNumber}
                    </Typography>
                    {account.isDefault && (
                      <Chip label="Default" size="small" sx={{ fontSize: 11, height: 20 }} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWithdrawDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleWithdraw}
            disabled={submitting || bankAccounts.length === 0}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Withdrawal Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Withdrawal</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.custom.neutral[600] }}>
            Are you sure you want to cancel this withdrawal of{' '}
            <strong>{cancellingWithdrawal ? formatCurrency(cancellingWithdrawal.amount) : ''}</strong>?
            The amount will be returned to your available balance.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={submitting}>Keep</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelWithdrawal}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            Cancel Withdrawal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopWalletPage;
