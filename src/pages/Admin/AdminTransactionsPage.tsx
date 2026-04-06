import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  adminApi,
  type AdminWalletSummary,
  type AdminUserTransactionResponse,
  type AdminShopTransactionResponse,
  type AdminPaymentTransactionResponse,
  type AdminUserWithdrawalResponse,
  type AdminShopWithdrawalResponse,
} from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getWithdrawalStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'COMPLETED': return 'success';
    case 'REJECTED': case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const AdminTransactionsPage = () => {
  const theme = useTheme();
  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<AdminWalletSummary | null>(null);

  // User transactions
  const [userTx, setUserTx] = useState<AdminUserTransactionResponse[]>([]);
  const [userTxPage, setUserTxPage] = useState(0);
  const [userTxTotal, setUserTxTotal] = useState(0);
  const [userTxLoading, setUserTxLoading] = useState(false);

  // Shop transactions
  const [shopTx, setShopTx] = useState<AdminShopTransactionResponse[]>([]);
  const [shopTxPage, setShopTxPage] = useState(0);
  const [shopTxTotal, setShopTxTotal] = useState(0);
  const [shopTxLoading, setShopTxLoading] = useState(false);

  // Payment transactions
  const [payTx, setPayTx] = useState<AdminPaymentTransactionResponse[]>([]);
  const [payTxPage, setPayTxPage] = useState(0);
  const [payTxTotal, setPayTxTotal] = useState(0);
  const [payTxLoading, setPayTxLoading] = useState(false);

  // User withdrawals
  const [userWd, setUserWd] = useState<AdminUserWithdrawalResponse[]>([]);
  const [userWdPage, setUserWdPage] = useState(0);
  const [userWdTotal, setUserWdTotal] = useState(0);
  const [userWdLoading, setUserWdLoading] = useState(false);

  // Shop withdrawals
  const [shopWd, setShopWd] = useState<AdminShopWithdrawalResponse[]>([]);
  const [shopWdPage, setShopWdPage] = useState(0);
  const [shopWdTotal, setShopWdTotal] = useState(0);
  const [shopWdLoading, setShopWdLoading] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'user' | 'shop' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    adminApi.getAdminWalletSummary().then(r => { if (r.data) setSummary(r.data); });
  }, []);

  useEffect(() => {
    if (tab === 0) {
      setUserTxLoading(true);
      adminApi.getAdminUserTransactions(userTxPage, PAGE_SIZE).then(r => {
        if (r.data) { setUserTx(r.data.content); setUserTxTotal(r.data.totalElements); }
      }).finally(() => setUserTxLoading(false));
    }
  }, [tab, userTxPage]);

  useEffect(() => {
    if (tab === 1) {
      setShopTxLoading(true);
      adminApi.getAdminShopTransactions(shopTxPage, PAGE_SIZE).then(r => {
        if (r.data) { setShopTx(r.data.content); setShopTxTotal(r.data.totalElements); }
      }).finally(() => setShopTxLoading(false));
    }
  }, [tab, shopTxPage]);

  useEffect(() => {
    if (tab === 2) {
      setPayTxLoading(true);
      adminApi.getAdminPaymentTransactions(payTxPage, PAGE_SIZE).then(r => {
        if (r.data) { setPayTx(r.data.content); setPayTxTotal(r.data.totalElements); }
      }).finally(() => setPayTxLoading(false));
    }
  }, [tab, payTxPage]);

  useEffect(() => {
    if (tab === 3) {
      setUserWdLoading(true);
      adminApi.getAdminUserWithdrawals(userWdPage, PAGE_SIZE).then(r => {
        if (r.data) { setUserWd(r.data.content); setUserWdTotal(r.data.totalElements); }
      }).finally(() => setUserWdLoading(false));
    }
  }, [tab, userWdPage]);

  useEffect(() => {
    if (tab === 4) {
      setShopWdLoading(true);
      adminApi.getAdminShopWithdrawals(shopWdPage, PAGE_SIZE).then(r => {
        if (r.data) { setShopWd(r.data.content); setShopWdTotal(r.data.totalElements); }
      }).finally(() => setShopWdLoading(false));
    }
  }, [tab, shopWdPage]);

  const handleApprove = async (id: string, type: 'user' | 'shop') => {
    try {
      setActionLoading(true);
      if (type === 'user') {
        await adminApi.approveUserWithdrawal(id);
        toast.success('User withdrawal approved');
        adminApi.getAdminUserWithdrawals(userWdPage, PAGE_SIZE).then(r => { if (r.data) { setUserWd(r.data.content); setUserWdTotal(r.data.totalElements); } });
      } else {
        await adminApi.approveShopWithdrawal(id);
        toast.success('Shop withdrawal approved');
        adminApi.getAdminShopWithdrawals(shopWdPage, PAGE_SIZE).then(r => { if (r.data) { setShopWd(r.data.content); setShopWdTotal(r.data.totalElements); } });
      }
      adminApi.getAdminWalletSummary().then(r => { if (r.data) setSummary(r.data); });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (id: string, type: 'user' | 'shop') => {
    setRejectTarget({ id, type });
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      if (rejectTarget.type === 'user') {
        await adminApi.rejectUserWithdrawal(rejectTarget.id, rejectReason);
        toast.success('User withdrawal rejected');
        adminApi.getAdminUserWithdrawals(userWdPage, PAGE_SIZE).then(r => { if (r.data) { setUserWd(r.data.content); setUserWdTotal(r.data.totalElements); } });
      } else {
        await adminApi.rejectShopWithdrawal(rejectTarget.id, rejectReason);
        toast.success('Shop withdrawal rejected');
        adminApi.getAdminShopWithdrawals(shopWdPage, PAGE_SIZE).then(r => { if (r.data) { setShopWd(r.data.content); setShopWdTotal(r.data.totalElements); } });
      }
      adminApi.getAdminWalletSummary().then(r => { if (r.data) setSummary(r.data); });
      setRejectDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const summaryCards = summary ? [
    { label: 'Total Top-Ups', value: formatCurrency(summary.totalTopUps), color: '#4caf50' },
    { label: 'Total Payments', value: formatCurrency(summary.totalOrderPayments), color: '#1976d2' },
    { label: 'Total Refunds', value: formatCurrency(summary.totalRefunds), color: '#ff9800' },
    { label: 'Shop Withdrawals', value: formatCurrency(summary.totalShopWithdrawals), color: '#9c27b0' },
    { label: 'User Withdrawals', value: formatCurrency(summary.totalUserWithdrawals), color: '#f44336' },
    { label: 'Pending Shop', value: `${summary.pendingShopWithdrawals} requests`, color: '#ff5722' },
    { label: 'Pending User', value: `${summary.pendingUserWithdrawals} requests`, color: '#e91e63' },
  ] : [];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.TRANSACTIONS} />

      <Box sx={{ flex: 1, p: 4, overflow: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Finance & Transactions
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Overview of all platform financial activity and withdrawal management.
          </Typography>
        </Box>

        {/* Summary Cards */}
        {summary && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, mb: 3 }}>
            {summaryCards.map((card) => (
              <Paper key={card.label} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e5e5', textAlign: 'center' }}>
                <Typography sx={{ fontSize: 11, color: '#888', fontWeight: 600, mb: 0.5 }}>{card.label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: card.color }}>{card.value}</Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #f0f0f0', px: 2 }}>
            <Tab label="User Transactions" />
            <Tab label="Shop Transactions" />
            <Tab label="VNPay Payments" />
            <Tab label="User Withdrawals" />
            <Tab label="Shop Withdrawals" />
          </Tabs>

          {/* Tab 0: User Transactions */}
          {tab === 0 && (
            userTxLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['User', 'Type', 'Amount', 'Balance After', 'Status', 'Date'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userTx.map(tx => (
                        <TableRow key={tx.id} hover>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{tx.userName}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{tx.userEmail}</Typography>
                          </TableCell>
                          <TableCell><Chip label={tx.type} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: tx.amount >= 0 ? '#4caf50' : '#d32f2f' }}>
                              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{formatCurrency(tx.balanceAfter)}</TableCell>
                          <TableCell><Chip label={tx.status} size="small" color={tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'} sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#888' }}>{formatDate(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={userTxTotal}
                  page={userTxPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setUserTxPage(p)}
                />
              </>
            )
          )}

          {/* Tab 1: Shop Transactions */}
          {tab === 1 && (
            shopTxLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['Shop', 'Type', 'Amount', 'Balance After', 'Status', 'Date'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shopTx.map(tx => (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ fontSize: 13 }}>{tx.shopName}</TableCell>
                          <TableCell><Chip label={tx.type} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: tx.amount >= 0 ? '#4caf50' : '#d32f2f' }}>
                              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{formatCurrency(tx.balanceAfter)}</TableCell>
                          <TableCell><Chip label={tx.status} size="small" color={tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'} sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#888' }}>{formatDate(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={shopTxTotal}
                  page={shopTxPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setShopTxPage(p)}
                />
              </>
            )
          )}

          {/* Tab 2: Payment Transactions */}
          {tab === 2 && (
            payTxLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['User', 'Amount', 'Purpose', 'Status', 'Bank', 'Ref', 'Date'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payTx.map(tx => (
                        <TableRow key={tx.id} hover>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{tx.userName}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{tx.userEmail}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(tx.amount)}</TableCell>
                          <TableCell><Chip label={tx.purpose} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell><Chip label={tx.status} size="small" color={tx.status === 'SUCCESS' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'} sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{tx.vnpBankCode || '—'}</TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#888' }}>{tx.txnRef || '—'}</TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#888' }}>{formatDate(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={payTxTotal}
                  page={payTxPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setPayTxPage(p)}
                />
              </>
            )
          )}

          {/* Tab 3: User Withdrawals */}
          {tab === 3 && (
            userWdLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['User', 'Amount', 'Net', 'Bank Account', 'Status', 'Requested', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userWd.map(wd => (
                        <TableRow key={wd.id} hover>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{wd.userName}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{wd.userEmail}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(wd.amount)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{formatCurrency(wd.netAmount)}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12 }}>{wd.bankName}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{wd.accountNumber} · {wd.accountHolder}</Typography>
                          </TableCell>
                          <TableCell><Chip label={wd.status} size="small" color={getWithdrawalStatusColor(wd.status)} sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#888' }}>{formatDate(wd.requestedAt)}</TableCell>
                          <TableCell>
                            {wd.status === 'PENDING' && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button size="small" variant="contained" color="success" startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                                  disabled={actionLoading}
                                  onClick={() => handleApprove(wd.id, 'user')}
                                  sx={{ fontSize: 11, py: 0.25, px: 1, textTransform: 'none' }}>
                                  Approve
                                </Button>
                                <Button size="small" variant="outlined" color="error" startIcon={<Cancel sx={{ fontSize: 14 }} />}
                                  disabled={actionLoading}
                                  onClick={() => openRejectDialog(wd.id, 'user')}
                                  sx={{ fontSize: 11, py: 0.25, px: 1, textTransform: 'none' }}>
                                  Reject
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={userWdTotal}
                  page={userWdPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setUserWdPage(p)}
                />
              </>
            )
          )}

          {/* Tab 4: Shop Withdrawals */}
          {tab === 4 && (
            shopWdLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fafafa' }}>
                        {['Shop', 'Amount', 'Net', 'Bank Account', 'Status', 'Requested', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shopWd.map(wd => (
                        <TableRow key={wd.id} hover>
                          <TableCell sx={{ fontSize: 13 }}>{wd.shopName}</TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(wd.amount)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{formatCurrency(wd.netAmount)}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12 }}>{wd.bankName}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{wd.accountNumber} · {wd.accountHolder}</Typography>
                          </TableCell>
                          <TableCell><Chip label={wd.status} size="small" color={getWithdrawalStatusColor(wd.status)} sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell sx={{ fontSize: 12, color: '#888' }}>{formatDate(wd.requestedAt)}</TableCell>
                          <TableCell>
                            {wd.status === 'PENDING' && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button size="small" variant="contained" color="success" startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                                  disabled={actionLoading}
                                  onClick={() => handleApprove(wd.id, 'shop')}
                                  sx={{ fontSize: 11, py: 0.25, px: 1, textTransform: 'none' }}>
                                  Approve
                                </Button>
                                <Button size="small" variant="outlined" color="error" startIcon={<Cancel sx={{ fontSize: 14 }} />}
                                  disabled={actionLoading}
                                  onClick={() => openRejectDialog(wd.id, 'shop')}
                                  sx={{ fontSize: 11, py: 0.25, px: 1, textTransform: 'none' }}>
                                  Reject
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={shopWdTotal}
                  page={shopWdPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setShopWdPage(p)}
                />
              </>
            )
          )}
        </Paper>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Withdrawal</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for rejection"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ textTransform: 'none' }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTransactionsPage;
