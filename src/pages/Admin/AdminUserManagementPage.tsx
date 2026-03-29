import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  People,
  CheckCircle,
  Block,
  ManageAccounts,
  PersonOff,
  PersonAdd,
  Shield,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import type { UserResponse } from '@/models/User';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const ALL_ROLES = ['CUSTOMER', 'SHOP_OWNER', 'ADMIN', 'STAFF'];

const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (role) {
    case 'ADMIN': return 'error';
    case 'SHOP_OWNER': return 'primary';
    case 'STAFF': return 'warning';
    default: return 'default';
  }
};

const AdminUserManagementPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Manage dialog
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Deactivate dialog
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Activate dialog
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(0, 200);
      if (response.data) {
        setUsers(response.data.users);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    if (activeTab === 1) return u.enabled;
    if (activeTab === 2) return !u.enabled;
    return true;
  });

  const activeCount = users.filter((u) => u.enabled).length;
  const inactiveCount = users.filter((u) => !u.enabled).length;

  const handleOpenManage = (user: UserResponse) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles ?? []);
    setManageDialogOpen(true);
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      setRolesLoading(true);
      const response = await adminApi.setUserRoles(selectedUser.id.toString(), selectedRoles);
      if (response.data) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? response.data! : u)));
        setSelectedUser(response.data);
        toast.success('Roles updated successfully');
      }
    } catch {
      toast.error('Failed to update roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const handleOpenDeactivate = () => {
    setDeactivateReason('');
    setDeactivateDialogOpen(true);
  };

  const handleDeactivate = async () => {
    if (!selectedUser || !deactivateReason.trim()) return;
    try {
      setStatusLoading(true);
      const response = await adminApi.setUserStatus(selectedUser.id.toString(), false, deactivateReason.trim());
      if (response.data) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? response.data! : u)));
        setSelectedUser(response.data);
        toast.success('User deactivated and email sent');
      }
      setDeactivateDialogOpen(false);
      setDeactivateReason('');
    } catch {
      toast.error('Failed to deactivate user');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;
    try {
      setStatusLoading(true);
      const response = await adminApi.setUserStatus(selectedUser.id.toString(), true);
      if (response.data) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? response.data! : u)));
        setSelectedUser(response.data);
        toast.success('User activated and email sent');
      }
      setActivateDialogOpen(false);
    } catch {
      toast.error('Failed to activate user');
    } finally {
      setStatusLoading(false);
    }
  };

  const stats = [
    {
      icon: <People sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Users',
      value: users.length.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <CheckCircle sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Active',
      value: activeCount.toLocaleString(),
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <Block sx={{ color: theme.palette.custom.status.error.main }} />,
      label: 'Inactive',
      value: inactiveCount.toLocaleString(),
      bgColor: theme.palette.custom.status.error.light,
    },
    {
      icon: <Shield sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Admins',
      value: users.filter((u) => u.roles?.includes('ADMIN')).length.toLocaleString(),
      bgColor: theme.palette.custom.status.warning.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.USER_MANAGEMENT} />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            User Management
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Manage platform users — set roles and account status
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}
        >
          <Box sx={{ borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: 14 } }}
            >
              <Tab label={`All (${users.length})`} />
              <Tab label={`Active (${activeCount})`} />
              <Tab label={`Inactive (${inactiveCount})`} />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  {['USER', 'USERNAME', 'ROLES', 'STATUS', 'ACTIONS'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 36, height: 36 }}>
                            {(user.fullName ?? user.username ?? '?')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {user.fullName ?? user.username}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                          {user.username}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(user.roles ?? []).map((role) => (
                            <Chip
                              key={role}
                              label={role}
                              size="small"
                              color={getRoleColor(role)}
                              sx={{ fontWeight: 600, fontSize: 11 }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.enabled ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 12,
                            bgcolor: user.enabled
                              ? theme.palette.custom.status.success.light
                              : theme.palette.custom.status.error.light,
                            color: user.enabled
                              ? theme.palette.custom.status.success.main
                              : theme.palette.custom.status.error.main,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ManageAccounts />}
                          onClick={() => handleOpenManage(user)}
                          sx={{
                            textTransform: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderColor: theme.palette.custom.border.main,
                            color: theme.palette.custom.neutral[700],
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && filteredUsers.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <People sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                No users found
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Manage Dialog */}
      {selectedUser && (
        <Dialog open={manageDialogOpen} onClose={() => setManageDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={selectedUser.avatarUrl ?? undefined} sx={{ width: 40, height: 40 }}>
                {(selectedUser.fullName ?? selectedUser.username ?? '?')[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                  {selectedUser.fullName ?? selectedUser.username}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  {selectedUser.email}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {/* Roles section */}
            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>
              Roles
            </Typography>
            <FormGroup row>
              {ALL_ROLES.map((role) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      size="small"
                    />
                  }
                  label={<Typography sx={{ fontSize: 13 }}>{role}</Typography>}
                  sx={{ mr: 2 }}
                />
              ))}
            </FormGroup>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveRoles}
              disabled={rolesLoading || selectedRoles.length === 0}
              startIcon={rolesLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Save Roles
            </Button>

            <Divider sx={{ my: 2.5 }} />

            {/* Status section */}
            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>
              Account Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={selectedUser.enabled ? 'Active' : 'Inactive'}
                sx={{
                  fontWeight: 600,
                  bgcolor: selectedUser.enabled
                    ? theme.palette.custom.status.success.light
                    : theme.palette.custom.status.error.light,
                  color: selectedUser.enabled
                    ? theme.palette.custom.status.success.main
                    : theme.palette.custom.status.error.main,
                }}
              />
              {selectedUser.enabled ? (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<PersonOff />}
                  onClick={handleOpenDeactivate}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<PersonAdd />}
                  onClick={() => setActivateDialogOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Activate
                </Button>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setManageDialogOpen(false)} sx={{ textTransform: 'none' }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deactivate User</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: theme.palette.custom.neutral[600], fontSize: 14 }}>
            Provide a reason for deactivating this account. An email will be sent to the user.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
            placeholder="Describe the reason for deactivation..."
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeactivateDialogOpen(false)} disabled={statusLoading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivate}
            disabled={!deactivateReason.trim() || statusLoading}
            startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <PersonOff />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Confirm Deactivation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Activate User</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
            Are you sure you want to activate{' '}
            <strong>{selectedUser?.fullName ?? selectedUser?.username}</strong>? An email notification will be sent.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActivateDialogOpen(false)} disabled={statusLoading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleActivate}
            disabled={statusLoading}
            startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Confirm Activation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagementPage;
