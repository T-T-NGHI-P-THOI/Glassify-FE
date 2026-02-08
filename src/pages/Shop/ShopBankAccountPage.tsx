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
  IconButton,
  FormControlLabel,
  Switch,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add,
  AccountBalance,
  Edit,
  Delete,
  Star,
  StarBorder,
  VerifiedUser,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopBankAccount, CreateBankAccountRequest } from '@/models/Shop';
import { toast } from 'react-toastify';

const ShopBankAccountPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { setShowNavbar, setShowFooter } = useLayout();
  const [bankAccounts, setBankAccounts] = useState<ShopBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ShopBankAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<ShopBankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateBankAccountRequest>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await shopApi.getBankAccounts();
      if (response.data) {
        setBankAccounts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingAccount(null);
    setFormData({ bankName: '', accountNumber: '', accountHolder: '', isDefault: false });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (account: ShopBankAccount) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      isDefault: account.isDefault,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.bankName.trim()) errors.bankName = 'Bank name is required';
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Account number is required';
    if (!formData.accountHolder.trim()) errors.accountHolder = 'Account holder is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (editingAccount) {
        await shopApi.updateBankAccount(editingAccount.id, formData);
        toast.success('Bank account updated successfully');
      } else {
        await shopApi.createBankAccount(formData);
        toast.success('Bank account added successfully');
      }
      handleCloseDialog();
      fetchBankAccounts();
    } catch (error) {
      console.error('Failed to save bank account:', error);
      toast.error('Failed to save bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (account: ShopBankAccount) => {
    setDeletingAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    try {
      setSubmitting(true);
      await shopApi.deleteBankAccount(deletingAccount.id);
      toast.success('Bank account deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingAccount(null);
      fetchBankAccounts();
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      toast.error('Failed to delete bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (account: ShopBankAccount) => {
    if (account.isDefault) return;
    try {
      await shopApi.setDefaultBankAccount(account.id);
      toast.success('Default bank account updated');
      fetchBankAccounts();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('Failed to set default bank account');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.BANK_ACCOUNTS}
        shopName={user?.shop?.shopName}
        shopLogo={user?.shop?.shopLogo}
        ownerName={user?.fullName}
        ownerEmail={user?.email}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Bank Accounts
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Manage your shop's bank accounts for withdrawals
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAddDialog}
            sx={{ height: 40, px: 3 }}
          >
            Add Bank Account
          </Button>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : bankAccounts.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
              textAlign: 'center',
            }}
          >
            <AccountBalance sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>
              No bank accounts yet
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
              Add a bank account to receive withdrawals from your shop
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
              Add Your First Bank Account
            </Button>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
              overflow: 'hidden',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      BANK NAME
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      ACCOUNT NUMBER
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      ACCOUNT HOLDER
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
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              bgcolor: theme.palette.custom.status.info.light,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <AccountBalance sx={{ fontSize: 20, color: theme.palette.custom.status.info.main }} />
                          </Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            {account.bankName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800], fontFamily: 'monospace' }}>
                          {account.accountNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                          {account.accountHolder}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {account.isDefault && (
                            <Chip
                              label="Default"
                              size="small"
                              icon={<Star sx={{ fontSize: 14 }} />}
                              sx={{
                                bgcolor: theme.palette.custom.status.warning.light,
                                color: theme.palette.custom.status.warning.main,
                                fontWeight: 600,
                                fontSize: 12,
                                '& .MuiChip-icon': { color: theme.palette.custom.status.warning.main },
                              }}
                            />
                          )}
                          <Chip
                            label={account.isVerified ? 'Verified' : 'Unverified'}
                            size="small"
                            icon={account.isVerified ? <VerifiedUser sx={{ fontSize: 14 }} /> : undefined}
                            sx={{
                              bgcolor: account.isVerified
                                ? theme.palette.custom.status.success.light
                                : theme.palette.custom.neutral[100],
                              color: account.isVerified
                                ? theme.palette.custom.status.success.main
                                : theme.palette.custom.neutral[500],
                              fontWeight: 600,
                              fontSize: 12,
                              '& .MuiChip-icon': {
                                color: theme.palette.custom.status.success.main,
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {!account.isDefault && (
                            <IconButton
                              size="small"
                              onClick={() => handleSetDefault(account)}
                              title="Set as default"
                              sx={{ color: theme.palette.custom.neutral[500] }}
                            >
                              <StarBorder sx={{ fontSize: 20 }} />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(account)}
                            title="Edit"
                            sx={{ color: theme.palette.custom.status.info.main }}
                          >
                            <Edit sx={{ fontSize: 20 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(account)}
                            title="Delete"
                            sx={{ color: theme.palette.custom.status.error.main }}
                          >
                            <Delete sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: theme.palette.custom.status.info.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalance sx={{ fontSize: 22, color: theme.palette.custom.status.info.main }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
              {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Account Holder Name"
              placeholder="e.g. NGUYEN VAN A"
              fullWidth
              value={formData.accountHolder}
              onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              error={!!formErrors.accountHolder}
              helperText={formErrors.accountHolder}
            />
            <TextField
              label="Account Number"
              placeholder="e.g. 1234567890"
              fullWidth
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              error={!!formErrors.accountNumber}
              helperText={formErrors.accountNumber}
            />
            <TextField
              label="Bank Name"
              placeholder="e.g. Vietcombank, Techcombank, MB Bank..."
              fullWidth
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              error={!!formErrors.bankName}
              helperText={formErrors.bankName}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault || false}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
              }
              label={
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  Set as default bank account
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            {editingAccount ? 'Update' : 'Add Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Bank Account</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.custom.neutral[600] }}>
            Are you sure you want to delete the bank account{' '}
            <strong>{deletingAccount?.bankName} - {deletingAccount?.accountNumber}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopBankAccountPage;
