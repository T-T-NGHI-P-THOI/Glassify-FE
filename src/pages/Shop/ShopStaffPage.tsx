import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  PersonAdd,
  Delete,
  PeopleAlt,
  Search,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';

// ===================== Mock Data =====================

interface StaffMember {
  id: string;
  name: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

const MOCK_STAFF: StaffMember[] = [
  {
    id: 'USR-001',
    name: 'Nguyen Van An',
    email: 'vanan@gmail.com',
    gender: 'Male',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    role: 'Staff',
    joinedAt: '2024-11-01',
  },
  {
    id: 'USR-002',
    name: 'Tran Thi Bich',
    email: 'thibich@gmail.com',
    gender: 'Female',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    role: 'Staff',
    joinedAt: '2024-12-15',
  },
  {
    id: 'USR-003',
    name: 'Le Minh Khoa',
    email: 'minhkhoa@gmail.com',
    gender: 'Male',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    role: 'Staff',
    joinedAt: '2025-01-20',
  },
];

// Mock lookup by staff ID
const MOCK_LOOKUP: Record<string, { name: string; email: string; gender: 'Male' | 'Female' | 'Other'; avatarUrl: string }> = {
  'USR-004': {
    name: 'Pham Thanh Huong',
    email: 'thanhhuong@gmail.com',
    gender: 'Female',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
  },
  'USR-005': {
    name: 'Hoang Duc Long',
    email: 'duclong@gmail.com',
    gender: 'Male',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
  },
};

// ===================== Add Member Dialog =====================

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (staff: StaffMember) => void;
  existingIds: string[];
}

const AddMemberDialog = ({ open, onClose, onConfirm, existingIds }: AddMemberDialogProps) => {
  const theme = useTheme();
  const [staffId, setStaffId] = useState('');
  const [lookupResult, setLookupResult] = useState<typeof MOCK_LOOKUP[string] | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [looking, setLooking] = useState(false);

  const handleClose = () => {
    setStaffId('');
    setLookupResult(null);
    setLookupError('');
    onClose();
  };

  const handleLookup = () => {
    setLookupError('');
    setLookupResult(null);
    if (!staffId.trim()) {
      setLookupError('Please enter a Staff ID.');
      return;
    }
    setLooking(true);
    // Simulate async lookup
    setTimeout(() => {
      if (existingIds.includes(staffId.trim())) {
        setLookupError('This user is already a staff member.');
      } else if (MOCK_LOOKUP[staffId.trim()]) {
        setLookupResult(MOCK_LOOKUP[staffId.trim()]);
      } else {
        setLookupError('No user found with this ID. Please check and try again.');
      }
      setLooking(false);
    }, 600);
  };

  const handleConfirm = () => {
    if (!lookupResult) return;
    const newMember: StaffMember = {
      id: staffId.trim(),
      name: lookupResult.name,
      email: lookupResult.email,
      gender: lookupResult.gender,
      avatarUrl: lookupResult.avatarUrl,
      role: 'Staff',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    onConfirm(newMember);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: theme.palette.custom.status.indigo?.light ?? '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAdd sx={{ fontSize: 20, color: theme.palette.custom.status.indigo?.main ?? '#4f46e5' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Add Shop Member</Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              Enter a user ID to look up and grant access
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], mb: 1.5 }}>
          Enter the staff user ID. If the ID is valid, user information will be filled in automatically.
        </Typography>

        {/* ID Input */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <TextField
            label="Staff ID"
            placeholder="e.g. USR-004"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setLookupResult(null);
              setLookupError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            size="small"
            fullWidth
            error={!!lookupError}
          />
          <Button
            variant="contained"
            onClick={handleLookup}
            disabled={looking}
            startIcon={looking ? <CircularProgress size={16} color="inherit" /> : <Search />}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap', fontWeight: 600, minWidth: 110 }}
          >
            Look Up
          </Button>
        </Box>

        {/* Error */}
        {lookupError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {lookupError}
          </Alert>
        )}

        {/* Lookup Result */}
        {lookupResult && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1.5px solid ${theme.palette.custom.status.success.main}`,
              bgcolor: theme.palette.custom.status.success.light,
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main, mb: 1.5, textTransform: 'uppercase' }}>
              User Found
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={lookupResult.avatarUrl} sx={{ width: 52, height: 52 }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <TextField
                    label="Full Name"
                    value={lookupResult.name}
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ flex: 1, bgcolor: 'white', borderRadius: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Email"
                    value={lookupResult.email}
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ flex: 1, bgcolor: 'white', borderRadius: 1 }}
                  />
                  <TextField
                    label="Gender"
                    value={lookupResult.gender}
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ width: 110, bgcolor: 'white', borderRadius: 1 }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!lookupResult}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Confirm & Grant Access
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== Main Page =====================

const ShopStaffPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { setShowNavbar, setShowFooter } = useLayout();
  const [staffList, setStaffList] = useState<StaffMember[]>(MOCK_STAFF);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const handleAddMember = (staff: StaffMember) => {
    setStaffList((prev) => [...prev, staff]);
  };

  const handleRemove = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    setRemoveId(null);
  };

  const genderColor = (gender: string) => {
    if (gender === 'Female') return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
    if (gender === 'Male') return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
    return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] };
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.STAFF}
        shopName={user?.shop?.shopName}
        shopLogo={user?.shop?.logoUrl}
        ownerName={user?.fullName}
        ownerEmail={user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: theme.palette.custom.status.indigo?.light ?? '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PeopleAlt sx={{ color: theme.palette.custom.status.indigo?.main ?? '#4f46e5' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                Staff Management
              </Typography>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                Manage shop members and their access permissions
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Add Shop Member
          </Button>
        </Box>

        {/* Summary strip */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <PeopleAlt sx={{ fontSize: 20, color: theme.palette.custom.neutral[500] }} />
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
            <strong>{staffList.length}</strong> staff member{staffList.length !== 1 ? 's' : ''} with shop access
          </Typography>
        </Box>

        {/* Staff Table */}
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
                <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    Staff
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    Gender
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    Joined
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    Role
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <PeopleAlt sx={{ fontSize: 48, color: theme.palette.custom.neutral[300], mb: 1 }} />
                      <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 15 }}>
                        No staff members yet. Add one to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {staffList.map((staff) => {
                  const gc = genderColor(staff.gender);
                  return (
                    <TableRow
                      key={staff.id}
                      sx={{ '&:hover': { bgcolor: theme.palette.custom.neutral[50] }, transition: 'background 0.15s' }}
                    >
                      {/* Staff Avatar + Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={staff.avatarUrl} sx={{ width: 40, height: 40 }}>
                            {staff.name[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            {staff.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* ID */}
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontFamily: 'monospace',
                            color: theme.palette.custom.neutral[600],
                            bgcolor: theme.palette.custom.neutral[100],
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            display: 'inline-block',
                          }}
                        >
                          {staff.id}
                        </Typography>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                          {staff.email}
                        </Typography>
                      </TableCell>

                      {/* Gender */}
                      <TableCell>
                        <Chip
                          label={staff.gender}
                          size="small"
                          sx={{ bgcolor: gc.bg, color: gc.color, fontWeight: 600, fontSize: 12 }}
                        />
                      </TableCell>

                      {/* Joined */}
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                          {staff.joinedAt}
                        </Typography>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Chip
                          label={staff.role}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.custom.status.success.light,
                            color: theme.palette.custom.status.success.main,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        />
                      </TableCell>

                      {/* Action */}
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => setRemoveId(staff.id)}
                          sx={{
                            color: theme.palette.custom.status.error.main,
                            '&:hover': { bgcolor: theme.palette.custom.status.error.light },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleAddMember}
        existingIds={staffList.map((s) => s.id)}
      />

      {/* Remove Confirm Dialog */}
      <Dialog open={!!removeId} onClose={() => setRemoveId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Staff Member</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
            Are you sure you want to remove{' '}
            <strong>{staffList.find((s) => s.id === removeId)?.name}</strong> from the shop?
            They will no longer have access to shop functions.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setRemoveId(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => removeId && handleRemove(removeId)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopStaffPage;
