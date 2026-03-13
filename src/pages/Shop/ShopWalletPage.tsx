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
  Pagination,
  Tooltip,
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
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopWalletApi } from '@/api/shop-wallet-api';
import type { WalletResponse, WithdrawalResponse, TransactionResponse } from '@/api/shop-wallet-api';
import type { ShopBankAccount } from '@/models/Shop';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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

const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case 'CREDIT':
    case 'ORDER_PAYMENT':
    case 'REFUND_REVERSAL':
      return <ArrowDownward sx={{ fontSize: 16 }} />;
    case 'DEBIT':
    case 'WITHDRAWAL':
    case 'REFUND':
    case 'FEE':
      return <ArrowUpward sx={{ fontSize: 16 }} />;
    default:
      return <Receipt sx={{ fontSize: 16 }} />;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'CREDIT':
    case 'ORDER_PAYMENT':
    case 'REFUND_REVERSAL':
      return 'success';
    case 'DEBIT':
    case 'WITHDRAWAL':
    case 'REFUND':
    case 'FEE':
      return 'error';
    default:
      return 'default';
  }
};

const ShopWalletPage = () => {
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);

  // Transactions
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);

  // Withdrawal Dialog
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [bankAccounts, setBankAccounts] = useState<ShopBankAccount[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cancel Dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingWithdrawal, setCancellingWithdrawal] = useState<WithdrawalResponse | null>(null);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const fetchWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const response = await shopWalletApi.getMyWallet();
      if (response.data) {
        setWallet(response.data);
      }
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
      if (response.data) {
        setWithdrawals(response.data.content);
        setWithdrawalTotalPages(response.data.totalPages);
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
      if (response.data) {
        setTransactions(response.data.content);
        setTransactionTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // const fetchBankAccounts = useCallback(async () => {
  //   try {
  //     const response = await shopApi.getBankAccounts();
  //     if (response.data) {
  //       setBankAccounts(response.data);
  //       const defaultAccount = response.data.find((a: ShopBankAccount) => a.isDefault);
  //       if (defaultAccount) {
  //         setSelectedBankAccountId(defaultAccount.id);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch bank accounts:', error);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchWallet();
  //   fetchBankAccounts();
  // }, [fetchWallet, fetchBankAccounts]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchWithdrawals(withdrawalPage);
    } else {
      fetchTransactions(transactionPage);
    }
  }, [activeTab, withdrawalPage, transactionPage, fetchWithdrawals, fetchTransactions]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
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
      if (activeTab === 0) fetchWithdrawals(withdrawalPage);
    } catch (error) {
      console.error('Failed to request withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
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
      fetchWithdrawals(withdrawalPage);
    } catch (error) {
      console.error('Failed to cancel withdrawal:', error);
      toast.error('Failed to cancel withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const balanceCards = wallet ? [
    {
      label: 'Available Balance',
      value: wallet.availableBalance,
      icon: <AccountBalanceWallet />,
      color: theme.palette.custom.status.success.main,
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      label: 'Pending Balance',
      value: wallet.pendingBalance,
      icon: <AccessTime />,
      color: theme.palette.custom.status.warning.main,
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      label: 'Frozen Balance',
      value: wallet.frozenBalance,
      icon: <AcUnit />,
      color: theme.palette.custom.status.info.main,
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      label: 'Total Earned',
      value: wallet.totalEarned,
      icon: <TrendingUp />,
      color: theme.palette.primary.main,
      bgColor: theme.palette.primary.light,
    },
  ] : [];

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
            onClick={() => setWithdrawDialogOpen(true)}
            disabled={!wallet || wallet.availableBalance < 10000}
            sx={{ height: 40, px: 3 }}
          >
            Withdraw
          </Button>
        </Box>

        {/* Balance Cards */}
        {walletLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : wallet ? (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2.5, mb: 4 }}>
              {balanceCards.map((card) => (
                <Paper
                  key={card.label}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
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
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                      {card.label}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    {formatCurrency(card.value)}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Total Withdrawn Summary */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ArrowUpward sx={{ color: theme.palette.custom.status.info.main }} />
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                  Total Withdrawn
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                {formatCurrency(wallet.totalWithdrawn)}
              </Typography>
            </Paper>

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
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                DATE
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                AMOUNT
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                FEE
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                NET
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                BANK ACCOUNT
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                STATUS
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                ACTIONS
                              </TableCell>
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
                                      startIcon={<Cancel sx={{ fontSize: 16 }} />}
                                      onClick={() => {
                                        setCancellingWithdrawal(w);
                                        setCancelDialogOpen(true);
                                      }}
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
                      {withdrawalTotalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <Pagination
                            count={withdrawalTotalPages}
                            page={withdrawalPage}
                            onChange={(_, p) => setWithdrawalPage(p)}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      )}
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
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                DATE
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                TYPE
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                DESCRIPTION
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                AMOUNT
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                BALANCE
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                                STATUS
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {transactions.map((t) => (
                              <TableRow key={t.id} hover>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                                    {formatDate(t.createdAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getTransactionTypeIcon(t.type)}
                                    label={t.type.replace(/_/g, ' ')}
                                    size="small"
                                    color={getTransactionColor(t.type) as 'success' | 'error' | 'default'}
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: 11 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], maxWidth: 250 }} noWrap>
                                    {t.description}
                                  </Typography>
                                  {t.referenceId && (
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], fontFamily: 'monospace' }}>
                                      Ref: {t.referenceId.slice(0, 8)}...
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    sx={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: getTransactionColor(t.type) === 'success'
                                        ? theme.palette.custom.status.success.main
                                        : theme.palette.custom.status.error.main,
                                    }}
                                  >
                                    {getTransactionColor(t.type) === 'success' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                                  </Typography>
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
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {transactionTotalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <Pagination
                            count={transactionTotalPages}
                            page={transactionPage}
                            onChange={(_, p) => setTransactionPage(p)}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      )}
                    </>
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
              <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                Request Withdrawal
              </Typography>
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
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              inputProps={{ min: 10000 }}
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
          <Button onClick={() => setWithdrawDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
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
          <Button onClick={() => setCancelDialogOpen(false)} disabled={submitting}>
            Keep
          </Button>
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
