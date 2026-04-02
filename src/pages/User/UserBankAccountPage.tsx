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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, AccountBalance, Delete, Star } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  userBankAccountApi,
  type UserBankAccountResponse,
  type UserBankAccountRequest,
} from '@/api/user-bank-account-api';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const UserBankAccountPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  useLayoutConfig({ showNavbar: true, showFooter: true });

  const [accounts, setAccounts] = useState<UserBankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UserBankAccountRequest>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await userBankAccountApi.getMyBankAccounts();
      if (res.data) setAccounts(res.data);
    } catch {
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.bankName.trim()) errors.bankName = 'Bank name is required';
    if (!form.accountNumber.trim()) errors.accountNumber = 'Account number is required';
    if (!form.accountHolder.trim()) errors.accountHolder = 'Account holder name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await userBankAccountApi.addBankAccount(form);
      toast.success('Bank account added');
      setDialogOpen(false);
      setForm({ bankName: '', accountNumber: '', accountHolder: '', isDefault: false });
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await userBankAccountApi.setDefaultBankAccount(id);
      toast.success('Default bank account updated');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update default');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await userBankAccountApi.deleteBankAccount(deletingId);
      toast.success('Bank account removed');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete bank account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 3, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111' }}>Bank Accounts</Typography>
          <Typography sx={{ fontSize: 14, color: '#888' }}>
            Manage your bank accounts for withdrawals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          disableElevation
          sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600 }}
        >
          Add Account
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : accounts.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: '1px solid #e5e5e5', textAlign: 'center' }}>
          <AccountBalance sx={{ fontSize: 48, color: '#ddd', mb: 2 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#666', mb: 1 }}>
            No bank accounts yet
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#888' }}>
            Add a bank account to start withdrawing your wallet balance.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {accounts.map((account) => (
            <Paper
              key={account.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: account.isDefault ? '2px solid #111' : '1px solid #e5e5e5',
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: account.isDefault ? '#111' : '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AccountBalance sx={{ color: account.isDefault ? '#fff' : '#888' }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{account.bankName}</Typography>
                      {account.isDefault && (
                        <Chip label="Default" size="small" icon={<Star sx={{ fontSize: '14px !important' }} />}
                          sx={{ bgcolor: '#111', color: '#fff', fontWeight: 600, fontSize: 11, height: 22 }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 14, color: '#555', mt: 0.25 }}>
                      {account.accountNumber}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#888' }}>
                      {account.accountHolder}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!account.isDefault && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSetDefault(account.id)}
                      sx={{ textTransform: 'none', fontSize: 12 }}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Delete sx={{ fontSize: 16 }} />}
                    onClick={() => { setDeletingId(account.id); setDeleteDialogOpen(true); }}
                    sx={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Bank Name"
              fullWidth
              size="small"
              value={form.bankName}
              onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))}
              error={!!formErrors.bankName}
              helperText={formErrors.bankName}
              placeholder="e.g. Vietcombank"
            />
            <TextField
              label="Account Number"
              fullWidth
              size="small"
              value={form.accountNumber}
              onChange={(e) => setForm(f => ({ ...f, accountNumber: e.target.value }))}
              error={!!formErrors.accountNumber}
              helperText={formErrors.accountNumber}
            />
            <TextField
              label="Account Holder Name"
              fullWidth
              size="small"
              value={form.accountHolder}
              onChange={(e) => setForm(f => ({ ...f, accountHolder: e.target.value }))}
              error={!!formErrors.accountHolder}
              helperText={formErrors.accountHolder}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.isDefault}
                  onChange={(e) => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                />
              }
              label="Set as default"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            disableElevation
            sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, textTransform: 'none', fontWeight: 600 }}
          >
            Add Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Bank Account</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#555' }}>
            Are you sure you want to remove this bank account? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ textTransform: 'none' }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserBankAccountPage;
