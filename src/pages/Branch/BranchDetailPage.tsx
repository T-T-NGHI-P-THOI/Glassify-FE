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
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Button,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Warehouse,
  Store,
  LocationOn,
  Phone,
  Email,
  Person,
  Inventory,
  LocalShipping,
  People,
  Edit,
  MoreHoriz,
  TrendingUp,
  TrendingDown,
  AccessTime,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

type BranchType = 'HUB' | 'FEEDER';

interface Staff {
  staffId: number;
  name: string;
  avatar: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
}

interface InventoryItem {
  productId: number;
  productName: string;
  productImage: string;
  sku: string;
  category: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  lastUpdated: string;
}

interface RecentTransfer {
  transferId: number;
  trackingCode: string;
  type: 'INBOUND' | 'OUTBOUND';
  partnerBranch: string;
  status: string;
  itemCount: number;
  date: string;
}

interface BranchDetail {
  branchId: number;
  branchName: string;
  branchCode: string;
  type: BranchType;
  address: string;
  city: string;
  district: string;
  ward: string;
  phone: string;
  email: string;
  managerId: number;
  managerName: string;
  managerAvatar: string;
  managerEmail: string;
  managerPhone: string;
  isActive: boolean;
  createdAt: string;
  openingHours: string;
  // Stats
  totalInventory: number;
  totalProducts: number;
  pendingTransfersIn: number;
  pendingTransfersOut: number;
  totalStaff: number;
  // Monthly stats
  monthlyInbound: number;
  monthlyOutbound: number;
  // Data
  staff: Staff[];
  inventory: InventoryItem[];
  recentTransfers: RecentTransfer[];
}

// Mock data
const mockBranchDetail: BranchDetail = {
  branchId: 1,
  branchName: 'HCM - Quận 1 Hub',
  branchCode: 'HCM-Q1-HUB',
  type: 'HUB',
  address: '123 Nguyễn Huệ, Phường Bến Nghé',
  city: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  phone: '028-3823-4567',
  email: 'q1hub@glassify.vn',
  managerId: 101,
  managerName: 'Nguyễn Văn Minh',
  managerAvatar: '/avatars/manager1.jpg',
  managerEmail: 'minh.nv@glassify.vn',
  managerPhone: '0901-234-567',
  isActive: true,
  createdAt: '2023-01-15T08:00:00',
  openingHours: '08:00 - 20:00',
  totalInventory: 1250,
  totalProducts: 45,
  pendingTransfersIn: 3,
  pendingTransfersOut: 2,
  totalStaff: 15,
  monthlyInbound: 450,
  monthlyOutbound: 380,
  staff: [
    {
      staffId: 1,
      name: 'Nguyễn Văn Minh',
      avatar: '/avatars/manager1.jpg',
      role: 'Branch Manager',
      email: 'minh.nv@glassify.vn',
      phone: '0901-234-567',
      isActive: true,
    },
    {
      staffId: 2,
      name: 'Trần Thị Lan',
      avatar: '/avatars/staff2.jpg',
      role: 'Inventory Supervisor',
      email: 'lan.tt@glassify.vn',
      phone: '0902-345-678',
      isActive: true,
    },
    {
      staffId: 3,
      name: 'Lê Văn Hùng',
      avatar: '/avatars/staff3.jpg',
      role: 'Warehouse Staff',
      email: 'hung.lv@glassify.vn',
      phone: '0903-456-789',
      isActive: true,
    },
    {
      staffId: 4,
      name: 'Phạm Thị Mai',
      avatar: '/avatars/staff4.jpg',
      role: 'Warehouse Staff',
      email: 'mai.pt@glassify.vn',
      phone: '0904-567-890',
      isActive: true,
    },
    {
      staffId: 5,
      name: 'Hoàng Văn Nam',
      avatar: '/avatars/staff5.jpg',
      role: 'Delivery Coordinator',
      email: 'nam.hv@glassify.vn',
      phone: '0905-678-901',
      isActive: false,
    },
  ],
  inventory: [
    {
      productId: 1,
      productName: 'Kính Rayban Aviator Classic',
      productImage: '/products/rayban-aviator.jpg',
      sku: 'RB-AV-001',
      category: 'Sunglasses',
      quantity: 120,
      reservedQty: 15,
      availableQty: 105,
      lastUpdated: '2024-06-19T10:00:00',
    },
    {
      productId: 2,
      productName: 'Kính Gucci Square Frame',
      productImage: '/products/gucci-square.jpg',
      sku: 'GC-SQ-002',
      category: 'Luxury',
      quantity: 45,
      reservedQty: 8,
      availableQty: 37,
      lastUpdated: '2024-06-19T09:30:00',
    },
    {
      productId: 3,
      productName: 'Kính Oakley Sport Pro',
      productImage: '/products/oakley-sport.jpg',
      sku: 'OK-SP-003',
      category: 'Sport',
      quantity: 200,
      reservedQty: 25,
      availableQty: 175,
      lastUpdated: '2024-06-19T11:00:00',
    },
    {
      productId: 4,
      productName: 'Kính Prada Cat Eye',
      productImage: '/products/prada-cat.jpg',
      sku: 'PR-CE-004',
      category: 'Luxury',
      quantity: 30,
      reservedQty: 5,
      availableQty: 25,
      lastUpdated: '2024-06-18T16:00:00',
    },
    {
      productId: 5,
      productName: 'Kính Dior Round',
      productImage: '/products/dior-round.jpg',
      sku: 'DR-RD-005',
      category: 'Luxury',
      quantity: 55,
      reservedQty: 10,
      availableQty: 45,
      lastUpdated: '2024-06-19T08:00:00',
    },
  ],
  recentTransfers: [
    {
      transferId: 1,
      trackingCode: 'TRF-20240619-001',
      type: 'OUTBOUND',
      partnerBranch: 'HCM - Thủ Đức',
      status: 'IN_TRANSIT',
      itemCount: 8,
      date: '2024-06-19T10:00:00',
    },
    {
      transferId: 2,
      trackingCode: 'TRF-20240619-002',
      type: 'INBOUND',
      partnerBranch: 'HCM - Quận 7 Hub',
      status: 'ARRIVED',
      itemCount: 15,
      date: '2024-06-19T08:30:00',
    },
    {
      transferId: 3,
      trackingCode: 'TRF-20240618-005',
      type: 'OUTBOUND',
      partnerBranch: 'HCM - Bình Thạnh',
      status: 'RECEIVED',
      itemCount: 12,
      date: '2024-06-18T14:00:00',
    },
  ],
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const BranchDetailPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);

  // In real app, fetch branch by id
  const branch = mockBranchDetail;

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const typeColor = branch.type === 'HUB'
    ? { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main }
    : { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };

  const statusColor = branch.isActive
    ? { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main }
    : { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.BRANCH} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.BRANCH)}>
            <ArrowBack />
          </IconButton>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              backgroundColor: typeColor.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {branch.type === 'HUB' ? (
              <Store sx={{ color: typeColor.color, fontSize: 28 }} />
            ) : (
              <Warehouse sx={{ color: typeColor.color, fontSize: 28 }} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                {branch.branchName}
              </Typography>
              <Chip
                label={branch.type}
                size="small"
                sx={{
                  backgroundColor: typeColor.bg,
                  color: typeColor.color,
                  fontWeight: 600,
                }}
              />
              <Chip
                label={branch.isActive ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.color,
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              {branch.branchCode} • Created {formatDate(branch.createdAt)}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit Branch
          </Button>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Inventory sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Total Inventory
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {branch.totalInventory.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
              {branch.totalProducts} products
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingDown sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Inbound (Monthly)
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {branch.monthlyInbound}
            </Typography>
            <Chip
              label={`${branch.pendingTransfersIn} pending`}
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                backgroundColor: theme.palette.custom.status.warning.light,
                color: theme.palette.custom.status.warning.main,
              }}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUp sx={{ fontSize: 18, color: theme.palette.custom.status.error.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Outbound (Monthly)
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {branch.monthlyOutbound}
            </Typography>
            <Chip
              label={`${branch.pendingTransfersOut} pending`}
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                backgroundColor: theme.palette.custom.status.warning.light,
                color: theme.palette.custom.status.warning.main,
              }}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <People sx={{ fontSize: 18, color: theme.palette.custom.status.purple.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Total Staff
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {branch.totalStaff}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
              {branch.staff.filter(s => s.isActive).length} active
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccessTime sx={{ fontSize: 18, color: theme.palette.custom.status.teal.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Opening Hours
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {branch.openingHours}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
              Mon - Sat
            </Typography>
          </Paper>
        </Box>

        {/* Branch Info & Manager */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 4 }}>
          {/* Branch Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
              Branch Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <LocationOn sx={{ fontSize: 20, color: theme.palette.custom.neutral[400], mt: 0.3 }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                      ADDRESS
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                      {branch.address}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                      {branch.ward}, {branch.district}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                      {branch.city}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Phone sx={{ fontSize: 20, color: theme.palette.custom.neutral[400] }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                        PHONE
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                        {branch.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Email sx={{ fontSize: 20, color: theme.palette.custom.neutral[400] }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                        EMAIL
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                        {branch.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Manager Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
              Branch Manager
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={branch.managerAvatar}
                sx={{ width: 56, height: 56, bgcolor: theme.palette.custom.neutral[200] }}
              >
                {branch.managerName[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  {branch.managerName}
                </Typography>
                <Chip
                  label="Branch Manager"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    backgroundColor: theme.palette.custom.status.purple.light,
                    color: theme.palette.custom.status.purple.main,
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                  {branch.managerEmail}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                  {branch.managerPhone}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Tabs Section */}
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
                  fontWeight: 600,
                  fontSize: 14,
                },
              }}
            >
              <Tab label="Inventory" />
              <Tab label="Staff" />
              <Tab label="Recent Transfers" />
            </Tabs>
          </Box>

          {/* Inventory Tab */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      PRODUCT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      SKU
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      CATEGORY
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      QUANTITY
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      RESERVED
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      AVAILABLE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      LAST UPDATED
                    </TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branch.inventory.map((item) => (
                    <TableRow key={item.productId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={item.productImage}
                            sx={{ width: 40, height: 40, bgcolor: theme.palette.custom.neutral[100] }}
                          >
                            {item.productName[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {item.productName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], fontFamily: 'monospace' }}>
                          {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.custom.neutral[100],
                            color: theme.palette.custom.neutral[700],
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.status.warning.main }}>
                          {item.reservedQty}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                          {item.availableQty}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          {formatDate(item.lastUpdated)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreHoriz sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Staff Tab */}
          {activeTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      STAFF
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      ROLE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      EMAIL
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      PHONE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      STATUS
                    </TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branch.staff.map((staff) => (
                    <TableRow key={staff.staffId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={staff.avatar}
                            sx={{ width: 40, height: 40, bgcolor: theme.palette.custom.neutral[200] }}
                          >
                            {staff.name[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {staff.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={staff.role}
                          size="small"
                          sx={{
                            backgroundColor: staff.role === 'Branch Manager'
                              ? theme.palette.custom.status.purple.light
                              : theme.palette.custom.neutral[100],
                            color: staff.role === 'Branch Manager'
                              ? theme.palette.custom.status.purple.main
                              : theme.palette.custom.neutral[700],
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                          {staff.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                          {staff.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={staff.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            backgroundColor: staff.isActive
                              ? theme.palette.custom.status.success.light
                              : theme.palette.custom.status.error.light,
                            color: staff.isActive
                              ? theme.palette.custom.status.success.main
                              : theme.palette.custom.status.error.main,
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreHoriz sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Recent Transfers Tab */}
          {activeTab === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      TRACKING CODE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      TYPE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      PARTNER BRANCH
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      ITEMS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      STATUS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      DATE
                    </TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branch.recentTransfers.map((transfer) => {
                    const typeStyle = transfer.type === 'INBOUND'
                      ? { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main }
                      : { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };

                    const statusStyle = transfer.status === 'RECEIVED'
                      ? { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main }
                      : transfer.status === 'IN_TRANSIT'
                        ? { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main }
                        : { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };

                    return (
                      <TableRow
                        key={transfer.transferId}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER_DETAIL.replace(':id', transfer.transferId.toString()))}
                      >
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.pink.main }}>
                            {transfer.trackingCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transfer.type}
                            size="small"
                            sx={{
                              backgroundColor: typeStyle.bg,
                              color: typeStyle.color,
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>
                            {transfer.partnerBranch}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {transfer.itemCount} items
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transfer.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                            {formatDate(transfer.date)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                            <MoreHoriz sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default BranchDetailPage;
