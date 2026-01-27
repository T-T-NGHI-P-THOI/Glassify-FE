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
  IconButton,
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
import { useEffect, useState } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ShopRegistration {
  registrationId: number;
  shopName: string;
  shopLogo: string;
  businessType: string;
  taxCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  address: string;
  city: string;
  district: string;
  submittedAt: string;
  status: ApprovalStatus;
  documents: {
    name: string;
    type: string;
    url: string;
  }[];
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// Mock data
const mockRegistrations: ShopRegistration[] = [
  {
    registrationId: 1,
    shopName: 'Optical Vision Store',
    shopLogo: '/shops/optical-vision.png',
    businessType: 'Company/Corporation',
    taxCode: '0123456789',
    ownerName: 'Nguyen Van A',
    ownerPhone: '0901234567',
    ownerEmail: 'nguyenvana@email.com',
    address: '123 Nguyen Hue Street',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    submittedAt: '2024-01-20T10:30:00',
    status: 'PENDING',
    documents: [
      { name: 'Business License.pdf', type: 'pdf', url: '/docs/license1.pdf' },
      { name: 'ID Card Front.jpg', type: 'image', url: '/docs/id1.jpg' },
      { name: 'ID Card Back.jpg', type: 'image', url: '/docs/id2.jpg' },
    ],
  },
  {
    registrationId: 2,
    shopName: 'EyeWear Plus',
    shopLogo: '/shops/eyewear-plus.png',
    businessType: 'Individual/Sole Proprietor',
    taxCode: '9876543210',
    ownerName: 'Tran Thi B',
    ownerPhone: '0912345678',
    ownerEmail: 'tranthib@email.com',
    address: '456 Le Loi Street',
    city: 'Ha Noi',
    district: 'Hoan Kiem',
    submittedAt: '2024-01-19T14:20:00',
    status: 'PENDING',
    documents: [
      { name: 'Business Registration.pdf', type: 'pdf', url: '/docs/license2.pdf' },
      { name: 'Owner ID.jpg', type: 'image', url: '/docs/id3.jpg' },
    ],
  },
  {
    registrationId: 3,
    shopName: 'Lens World',
    shopLogo: '/shops/lens-world.png',
    businessType: 'Partnership',
    taxCode: '5678901234',
    ownerName: 'Le Van C',
    ownerPhone: '0923456789',
    ownerEmail: 'levanc@email.com',
    address: '789 Tran Hung Dao',
    city: 'Da Nang',
    district: 'Hai Chau',
    submittedAt: '2024-01-18T09:15:00',
    status: 'APPROVED',
    documents: [
      { name: 'Business License.pdf', type: 'pdf', url: '/docs/license3.pdf' },
      { name: 'Tax Certificate.pdf', type: 'pdf', url: '/docs/tax3.pdf' },
    ],
    reviewedBy: 'Admin User',
    reviewedAt: '2024-01-19T11:00:00',
  },
  {
    registrationId: 4,
    shopName: 'Quick Glasses',
    shopLogo: '/shops/quick-glasses.png',
    businessType: 'Household Business',
    taxCode: '1122334455',
    ownerName: 'Pham Van D',
    ownerPhone: '0934567890',
    ownerEmail: 'phamvand@email.com',
    address: '321 Hai Ba Trung',
    city: 'Ho Chi Minh City',
    district: 'District 3',
    submittedAt: '2024-01-17T16:45:00',
    status: 'REJECTED',
    documents: [
      { name: 'Business License.pdf', type: 'pdf', url: '/docs/license4.pdf' },
    ],
    reviewedBy: 'Admin User',
    reviewedAt: '2024-01-18T10:30:00',
    rejectionReason: 'Incomplete documentation. Missing ID card images.',
  },
  {
    registrationId: 5,
    shopName: 'Sun Shades Co.',
    shopLogo: '/shops/sun-shades.png',
    businessType: 'Company/Corporation',
    taxCode: '6677889900',
    ownerName: 'Hoang Thi E',
    ownerPhone: '0945678901',
    ownerEmail: 'hoangthie@email.com',
    address: '555 Pham Van Dong',
    city: 'Ho Chi Minh City',
    district: 'Thu Duc',
    submittedAt: '2024-01-21T08:00:00',
    status: 'PENDING',
    documents: [
      { name: 'Business License.pdf', type: 'pdf', url: '/docs/license5.pdf' },
      { name: 'ID Card.jpg', type: 'image', url: '/docs/id5.jpg' },
      { name: 'Tax Registration.pdf', type: 'pdf', url: '/docs/tax5.pdf' },
    ],
  },
];

const AdminShopApprovalPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const [activeTab, setActiveTab] = useState(0);
  const [registrations, setRegistrations] = useState<ShopRegistration[]>(mockRegistrations);
  const [selectedRegistration, setSelectedRegistration] = useState<ShopRegistration | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const getStatusColor = (status: ApprovalStatus) => {
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

  const getStatusLabel = (status: ApprovalStatus) => {
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

  const handleViewDetails = (registration: ShopRegistration) => {
    setSelectedRegistration(registration);
    setDetailDialogOpen(true);
  };

  const handleApprove = (registrationId: number) => {
    setRegistrations((prev) =>
      prev.map((reg) =>
        reg.registrationId === registrationId
          ? {
              ...reg,
              status: 'APPROVED' as ApprovalStatus,
              reviewedBy: 'Admin User',
              reviewedAt: new Date().toISOString(),
            }
          : reg
      )
    );
    setDetailDialogOpen(false);
  };

  const handleOpenRejectDialog = (registration: ShopRegistration) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
    setRejectionReason('');
  };

  const handleReject = () => {
    if (selectedRegistration) {
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.registrationId === selectedRegistration.registrationId
            ? {
                ...reg,
                status: 'REJECTED' as ApprovalStatus,
                reviewedBy: 'Admin User',
                reviewedAt: new Date().toISOString(),
                rejectionReason: rejectionReason,
              }
            : reg
        )
      );
    }
    setRejectDialogOpen(false);
    setDetailDialogOpen(false);
    setRejectionReason('');
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
                    BUSINESS TYPE
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
                {filteredRegistrations.map((registration) => {
                  const statusStyle = getStatusColor(registration.status);
                  return (
                    <TableRow key={registration.registrationId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={registration.shopLogo}
                            sx={{ width: 44, height: 44, bgcolor: theme.palette.custom.neutral[100] }}
                          >
                            <Store />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {registration.shopName}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              Tax: {registration.taxCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                          {registration.ownerName}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          {registration.ownerPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={registration.businessType}
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
                          {registration.district}
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
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredRegistrations.length === 0 && (
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
                  src={selectedRegistration.shopLogo}
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
                      Business Type
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.businessType}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Tax Code
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {selectedRegistration.taxCode}
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
                      {selectedRegistration.ownerName}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Phone
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Phone sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {selectedRegistration.ownerPhone}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Email
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {selectedRegistration.ownerEmail}
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
                    {selectedRegistration.address}, {selectedRegistration.district}, {selectedRegistration.city}
                  </Typography>
                </Grid>

                {/* Documents */}
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
                    Submitted Documents ({selectedRegistration.documents.length})
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedRegistration.documents.map((doc, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.custom.border.light}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: theme.palette.custom.neutral[50] },
                        }}
                      >
                        <InsertDriveFile
                          sx={{
                            fontSize: 20,
                            color:
                              doc.type === 'pdf'
                                ? theme.palette.custom.status.error.main
                                : theme.palette.custom.status.info.main,
                          }}
                        />
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                          {doc.name}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
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
                          Reviewed by {selectedRegistration.reviewedBy} on {formatDate(selectedRegistration.reviewedAt)}
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
                        Approved by {selectedRegistration.reviewedBy} on {formatDate(selectedRegistration.reviewedAt)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              {selectedRegistration.status === 'PENDING' && (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleOpenRejectDialog(selectedRegistration)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApprove(selectedRegistration.registrationId)}
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
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectionReason.trim()}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminShopApprovalPage;
