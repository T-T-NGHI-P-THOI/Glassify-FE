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
  Grid,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  Visibility,
  CheckCircle,
  Cancel,
  Search,
  FilterList,
  Business,
  Person,
  LocationOn,
  AccessTime,
  Description,
  Assignment,
  HourglassEmpty,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import type { ShopRequest } from '@/models/Shop';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const AdminShopApprovalPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [registrations, setRegistrations] = useState<ShopRequest[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<ShopRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchShopRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getShopRequests();
      if (response.data) {
        setRegistrations(response.data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch shop requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  useEffect(() => {
    fetchShopRequests();
  }, [fetchShopRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: theme.palette.custom.status.warning.light,
          color: theme.palette.custom.status.warning.main,
        };
      case 'APPROVED':
        return {
          bg: theme.palette.custom.status.success.light,
          color: theme.palette.custom.status.success.main,
        };
      case 'REJECTED':
        return {
          bg: theme.palette.custom.status.error.light,
          color: theme.palette.custom.status.error.main,
        };
      default:
        return {
          bg: theme.palette.custom.neutral[100],
          color: theme.palette.custom.neutral[500],
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatValue = (value: string | null | undefined) => {
    if (!value || value === 'null' || value === 'undefined') return 'N/A';
    return value;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null') return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (activeTab === 0) return true; // All
    if (activeTab === 1) return reg.status === 'PENDING';
    if (activeTab === 2) return reg.status === 'APPROVED';
    if (activeTab === 3) return reg.status === 'REJECTED';
    return true;
  });

  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = registrations.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = registrations.filter((r) => r.status === 'REJECTED').length;

  const handleViewDetails = (registration: ShopRequest) => {
    setSelectedRegistration(registration);
    setDetailDialogOpen(true);
  };

  const handleApprove = async (registrationId: string) => {
    try {
      setReviewLoading(true);
      const response = await adminApi.reviewShopRequest({
        requestId: registrationId,
        action: 'APPROVE',
        comment: approveComment || undefined,
      });
      if (response.data) {
        setRegistrations((prev) =>
          prev.map((reg) => (reg.id === registrationId ? response.data! : reg))
        );
      }
      setDetailDialogOpen(false);
      setApproveComment('');
    } catch (error) {
      console.error('Failed to approve shop request:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleOpenRejectDialog = (registration: ShopRequest) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
    setRejectionReasonPreset('');
    setCustomReason('');
    setAdminComment('');
  };

  const getRejectionReason = () =>
    rejectionReasonPreset === 'OTHER' ? customReason : rejectionReasonPreset;

  const handleReject = async () => {
    if (!selectedRegistration) return;
    try {
      setReviewLoading(true);
      const response = await adminApi.reviewShopRequest({
        requestId: selectedRegistration.id,
        action: 'REJECT',
        rejectionReason: getRejectionReason(),
        comment: adminComment.trim() || undefined,
      });
      if (response.data) {
        setRegistrations((prev) =>
          prev.map((reg) => (reg.id === selectedRegistration.id ? response.data! : reg))
        );
      }
      setRejectDialogOpen(false);
      setDetailDialogOpen(false);
      setRejectionReasonPreset('');
      setCustomReason('');
      setAdminComment('');
    } catch (error) {
      console.error('Failed to reject shop request:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const stats = [
    {
      icon: <Assignment sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Registrations',
      value: registrations.length.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <HourglassEmpty sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Pending Review',
      value: pendingCount.toLocaleString(),
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <ThumbUp sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Approved',
      value: approvedCount.toLocaleString(),
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <ThumbDown sx={{ color: theme.palette.custom.status.error.main }} />,
      label: 'Rejected',
      value: rejectedCount.toLocaleString(),
      bgColor: theme.palette.custom.status.error.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Shop Registration Approvals
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Review and approve shop registration requests
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FilterList />}>
              Filter
            </Button>
            <Button variant="outlined" startIcon={<Search />}>
              Search
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
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
                <Typography
                  sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}
                >
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Tabs & Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                },
              }}
            >
              <Tab label={`All (${registrations.length})`} />
              <Tab label={`Pending (${pendingCount})`} />
              <Tab label={`Approved (${approvedCount})`} />
              <Tab label={`Rejected (${rejectedCount})`} />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    SHOP
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    OWNER
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    BUSINESS LICENSE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    LOCATION
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    SUBMITTED
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => {
                    const statusStyle = getStatusColor(registration.status);
                    return (
                      <TableRow key={registration.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              variant="rounded"
                              src={registration.logoUrl}
                              sx={{ width: 44, height: 44, bgcolor: theme.palette.custom.neutral[100] }}
                            >
                              <Store />
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                {registration.shopName}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                {registration.shopCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                            {registration.userName}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                            {registration.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={registration.businessLicense?.licenseNumber}
                            size="small"
                            sx={{
                              bgcolor: theme.palette.custom.neutral[100],
                              color: theme.palette.custom.neutral[700],
                              fontWeight: 500,
                              fontSize: 12,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                            {registration.city}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                            {registration.address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                            {formatDate(registration.submittedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(registration.status)}
                            size="small"
                            sx={{
                              bgcolor: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDetails(registration)}
                            sx={{
                              textTransform: 'none',
                              fontSize: 13,
                              fontWeight: 500,
                              borderColor: theme.palette.custom.border.main,
                              color: theme.palette.custom.neutral[700],
                              '&:hover': {
                                borderColor: theme.palette.custom.neutral[400],
                                bgcolor: theme.palette.custom.neutral[50],
                              },
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && filteredRegistrations.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Store sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                No registrations found
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Registration Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRegistration && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  variant="rounded"
                  src={selectedRegistration.logoUrl}
                  sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[100] }}
                >
                  <Store />
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                    {selectedRegistration.shopName}
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedRegistration.status)}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(selectedRegistration.status).bg,
                      color: getStatusColor(selectedRegistration.status).color,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Shop Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.palette.custom.neutral[500],
                      textTransform: 'uppercase',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Business sx={{ fontSize: 18 }} />
                    Shop Information
                  </Typography>

                  {[
                    { label: 'Shop Name', value: selectedRegistration.shopName },
                    { label: 'Shop Code', value: selectedRegistration.shopCode },
                    { label: 'Shop Email', value: selectedRegistration.email },
                    { label: 'Phone', value: selectedRegistration.phone },
                    { label: 'Version', value: `v${selectedRegistration.version}` },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{label}</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {formatValue(value)}
                      </Typography>
                    </Box>
                  ))}

                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Submitted At</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {formatDate(selectedRegistration.submittedAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Owner Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.palette.custom.neutral[500],
                      textTransform: 'uppercase',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Person sx={{ fontSize: 18 }} />
                    Owner Information
                  </Typography>

                  {[
                    { label: 'Full Name', value: selectedRegistration.userName },
                    { label: 'Email', value: selectedRegistration.userEmail },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{label}</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {formatValue(value)}
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                {/* Business License */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography
                    component="div"
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.palette.custom.neutral[500],
                      textTransform: 'uppercase',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Description sx={{ fontSize: 18 }} />
                    Business License
                    {selectedRegistration.businessLicense?.status && (
                      <Chip
                        label={selectedRegistration.businessLicense.status}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: getStatusColor(selectedRegistration.businessLicense.status).bg,
                          color: getStatusColor(selectedRegistration.businessLicense.status).color,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    )}
                  </Typography>

                  <Grid container spacing={2}>
                    {[
                      { label: 'License Number', value: selectedRegistration.businessLicense?.licenseNumber },
                      { label: 'Business Name', value: selectedRegistration.businessLicense?.businessName },
                      { label: 'Business Type', value: selectedRegistration.businessLicense?.businessType },
                      { label: 'Tax ID', value: selectedRegistration.businessLicense?.taxId },
                      { label: 'Legal Representative', value: selectedRegistration.businessLicense?.legalRepresentative },
                      { label: 'Registered Address', value: selectedRegistration.businessLicense?.registeredAddress },
                      { label: 'Issued Date', value: formatDate(selectedRegistration.businessLicense?.issuedDate ?? '') },
                      { label: 'Expiry Date', value: formatDate(selectedRegistration.businessLicense?.expiryDate ?? '') },
                      { label: 'Issued By', value: selectedRegistration.businessLicense?.issuedBy },
                    ].map(({ label, value }) => (
                      <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{label}</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                          {formatValue(value)}
                        </Typography>
                      </Grid>
                    ))}
                    {selectedRegistration.businessLicense?.licenseImageUrl && (
                      <Grid size={{ xs: 12 }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>License Image URL</Typography>
                        <Typography
                          component="a"
                          href={selectedRegistration.businessLicense.licenseImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: theme.palette.primary.main,
                            wordBreak: 'break-all',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {selectedRegistration.businessLicense.licenseImageUrl}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {selectedRegistration.businessLicense?.rejectionReason && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: theme.palette.custom.status.error.light }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.error.main, mb: 0.5 }}>
                        License Rejection Reason
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                        {selectedRegistration.businessLicense.rejectionReason}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Address */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.palette.custom.neutral[500],
                      textTransform: 'uppercase',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <LocationOn sx={{ fontSize: 18 }} />
                    Shop Address
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                    {[selectedRegistration.address, selectedRegistration.city].filter(Boolean).join(', ') || 'N/A'}
                  </Typography>
                </Grid>

                {/* Rejection Reason (if rejected) */}
                {selectedRegistration.status === 'REJECTED' && selectedRegistration.rejectionReason && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.custom.status.error.light,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.error.main, mb: 1 }}
                      >
                        Rejection Reason:
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                        {selectedRegistration.rejectionReason}
                      </Typography>
                      {selectedRegistration.reviewedAt && (
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mt: 1 }}>
                          Reviewed by {selectedRegistration.reviewedByName} on {formatDate(selectedRegistration.reviewedAt)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* Approval Info (if approved) */}
                {selectedRegistration.status === 'APPROVED' && selectedRegistration.reviewedAt && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.custom.status.success.light,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: theme.palette.custom.status.success.main }} />
                        <Typography
                          sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.success.main }}
                        >
                          Approved
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mt: 0.5 }}>
                        Approved by {selectedRegistration.reviewedByName} on {formatDate(selectedRegistration.reviewedAt)}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Admin Comment */}
                {selectedRegistration.adminComment && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.custom.neutral[50] }}>
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}
                      >
                        Admin Comment:
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                        {selectedRegistration.adminComment}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)} disabled={reviewLoading}>Close</Button>
              {selectedRegistration.status === 'PENDING' && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleOpenRejectDialog(selectedRegistration)}
                    disabled={reviewLoading}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={reviewLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                    onClick={() => handleApprove(selectedRegistration.id)}
                    disabled={reviewLoading}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Shop Registration</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: theme.palette.custom.neutral[600] }}>
            Select a reason for rejecting this registration. This will be sent to the applicant.
          </Typography>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Rejection Reason</InputLabel>
            <Select
              value={rejectionReasonPreset}
              label="Rejection Reason"
              onChange={(e) => {
                setRejectionReasonPreset(e.target.value);
                setCustomReason('');
              }}
            >
              <MenuItem value="Thông tin giấy phép kinh doanh không đầy đủ hoặc còn thiếu">
                Thông tin giấy phép kinh doanh không đầy đủ hoặc còn thiếu
              </MenuItem>
              <MenuItem value="Giấy phép kinh doanh đã hết hạn">
                Giấy phép kinh doanh đã hết hạn
              </MenuItem>
              <MenuItem value="Thông tin cung cấp không khớp với giấy phép đăng ký">
                Thông tin cung cấp không khớp với giấy phép đăng ký
              </MenuItem>
              <MenuItem value="Loại hình kinh doanh không đủ điều kiện tham gia nền tảng">
                Loại hình kinh doanh không đủ điều kiện tham gia nền tảng
              </MenuItem>
              <MenuItem value="Phát hiện đăng ký shop trùng lặp">
                Phát hiện đăng ký shop trùng lặp
              </MenuItem>
              <MenuItem value="Mã số thuế không hợp lệ hoặc không thể xác minh">
                Mã số thuế không hợp lệ hoặc không thể xác minh
              </MenuItem>
              <MenuItem value="OTHER">Khác...</MenuItem>
            </Select>
          </FormControl>
          {rejectionReasonPreset === 'OTHER' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Nhập lý do từ chối"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Mô tả chi tiết lý do từ chối..."
              required
              sx={{ mb: 2 }}
              autoFocus
            />
          )}
          <TextField
            fullWidth
            multiline
            rows={2}
            required
            label="Admin Comment (Internal Note)"
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            placeholder="Enter a comment for admin reference..."
            error={rejectDialogOpen && !adminComment.trim()}
            helperText={rejectDialogOpen && !adminComment.trim() ? 'Admin comment is required' : 'This comment is for admin reference only'}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={reviewLoading}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={
              !rejectionReasonPreset ||
              (rejectionReasonPreset === 'OTHER' && !customReason.trim()) ||
              !adminComment.trim() ||
              reviewLoading
            }
            startIcon={reviewLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminShopApprovalPage;
