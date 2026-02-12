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
  Phone,
  Email,
  LocationOn,
  InsertDriveFile,
  AccessTime,
  Description,
  Assignment,
  HourglassEmpty,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import type { ShopRequest } from '@/models/Shop';

const AdminShopApprovalPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const [activeTab, setActiveTab] = useState(0);
  const [registrations, setRegistrations] = useState<ShopRequest[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<ShopRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
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

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    fetchShopRequests();

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter, fetchShopRequests]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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
        comment: approveComment,
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
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!selectedRegistration) return;
    try {
      setReviewLoading(true);
      const response = await adminApi.reviewShopRequest({
        requestId: selectedRegistration.id,
        action: 'REJECT',
        comment: rejectionReason,
      });
      if (response.data) {
        setRegistrations((prev) =>
          prev.map((reg) => (reg.id === selectedRegistration.id ? response.data! : reg))
        );
      }
      setRejectDialogOpen(false);
      setDetailDialogOpen(false);
      setRejectionReason('');
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
                            label={registration.businessLicense}
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
                {/* Business Info */}
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
                    Business Information
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Shop Name
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.shopName}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Shop Code
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.shopCode}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Business License
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.businessLicense}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Tax ID
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.taxId}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Submitted At
                    </Typography>
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

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Full Name
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.userName}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Phone
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Phone sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {selectedRegistration.phone}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Email
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {selectedRegistration.userEmail}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Shop Email
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {selectedRegistration.email}
                      </Typography>
                    </Box>
                  </Box>
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
                    {selectedRegistration.address}, {selectedRegistration.city}
                  </Typography>
                </Grid>

                {/* Documents */}
                {selectedRegistration.businessLicenseUrl && (
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
                      <Description sx={{ fontSize: 18 }} />
                      Submitted Documents
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Paper
                        elevation={0}
                        component="a"
                        href={selectedRegistration.businessLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.custom.border.light}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': { bgcolor: theme.palette.custom.neutral[50] },
                        }}
                      >
                        <InsertDriveFile
                          sx={{
                            fontSize: 20,
                            color: theme.palette.custom.status.info.main,
                          }}
                        />
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                          Business License
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                )}

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
            Please provide a reason for rejecting this shop registration. This will be sent to the applicant.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={reviewLoading}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectionReason.trim() || reviewLoading}
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
