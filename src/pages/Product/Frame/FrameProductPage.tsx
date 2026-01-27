import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TableSortLabel,
  Checkbox,
  Avatar,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  LocationOn,
  Phone,
  MoreVert,
  Search,
  Add,
  Inventory,
  Star,
  Verified,
  Storefront,
  Inventory2,
  CheckCircle,
  Warehouse,
  RemoveShoppingCart,
  EditNote,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/sidebar/Sidebar';
import { useLayout } from '../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { CustomButton } from '@/components/custom';

type ShopStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

interface Shop {
  shopId: number;
  shopName: string;
  shopLogo: string;
  shopCode: string;
  businessType: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  ownerId: number;
  ownerName: string;
  ownerAvatar: string;
  status: ShopStatus;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  createdAt: string;
  // Stats
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

// Mock data for shops
const shopsData: Shop[] = [
  {
    shopId: 1,
    shopName: 'Optical Vision Store',
    shopLogo: '/shops/optical-vision.png',
    shopCode: 'SHOP-OVS-001',
    businessType: 'Company/Corporation',
    address: '123 Nguyễn Huệ, Phường Bến Nghé',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    phone: '028-3823-4567',
    email: 'contact@opticalvision.vn',
    ownerId: 101,
    ownerName: 'Nguyễn Văn A',
    ownerAvatar: '/avatars/owner1.jpg',
    status: 'ACTIVE',
    isVerified: true,
    rating: 4.8,
    totalReviews: 256,
    createdAt: '2023-01-15T08:00:00',
    totalProducts: 150,
    totalOrders: 1250,
    totalRevenue: 850000000,
  },
  {
    shopId: 2,
    shopName: 'EyeWear Plus',
    shopLogo: '/shops/eyewear-plus.png',
    shopCode: 'SHOP-EWP-002',
    businessType: 'Individual/Sole Proprietor',
    address: '456 Lê Lợi, Phường Bến Thành',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    phone: '028-3773-8900',
    email: 'info@eyewearplus.vn',
    ownerId: 102,
    ownerName: 'Trần Thị B',
    ownerAvatar: '/avatars/owner2.jpg',
    status: 'ACTIVE',
    isVerified: true,
    rating: 4.5,
    totalReviews: 189,
    createdAt: '2023-02-20T08:00:00',
    totalProducts: 98,
    totalOrders: 980,
    totalRevenue: 620000000,
  },
  {
    shopId: 3,
    shopName: 'Lens World',
    shopLogo: '/shops/lens-world.png',
    shopCode: 'SHOP-LW-003',
    businessType: 'Partnership',
    address: '789 Trần Hưng Đạo',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    phone: '0236-382-1234',
    email: 'hello@lensworld.vn',
    ownerId: 103,
    ownerName: 'Lê Văn C',
    ownerAvatar: '/avatars/owner3.jpg',
    status: 'ACTIVE',
    isVerified: false,
    rating: 4.2,
    totalReviews: 87,
    createdAt: '2023-03-10T08:00:00',
    totalProducts: 65,
    totalOrders: 450,
    totalRevenue: 280000000,
  },
  {
    shopId: 4,
    shopName: 'Quick Glasses',
    shopLogo: '/shops/quick-glasses.png',
    shopCode: 'SHOP-QG-004',
    businessType: 'Household Business',
    address: '321 Hai Bà Trưng, Phường 15',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận Bình Thạnh',
    phone: '028-3840-5678',
    email: 'support@quickglasses.vn',
    ownerId: 104,
    ownerName: 'Phạm Văn D',
    ownerAvatar: '/avatars/owner4.jpg',
    status: 'INACTIVE',
    isVerified: false,
    rating: 3.8,
    totalReviews: 42,
    createdAt: '2023-04-05T08:00:00',
    totalProducts: 0,
    totalOrders: 120,
    totalRevenue: 45000000,
  },
  {
    shopId: 5,
    shopName: 'Sun Shades Co.',
    shopLogo: '/shops/sun-shades.png',
    shopCode: 'SHOP-SSC-005',
    businessType: 'Company/Corporation',
    address: '555 Phạm Văn Đồng',
    city: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    phone: '028-3811-9012',
    email: 'sales@sunshades.vn',
    ownerId: 105,
    ownerName: 'Hoàng Thị E',
    ownerAvatar: '/avatars/owner5.jpg',
    status: 'PENDING',
    isVerified: false,
    rating: 0,
    totalReviews: 0,
    createdAt: '2024-01-21T08:00:00',
    totalProducts: 25,
    totalOrders: 0,
    totalRevenue: 0,
  },
  {
    shopId: 6,
    shopName: 'Premium Optics',
    shopLogo: '/shops/premium-optics.png',
    shopCode: 'SHOP-PO-006',
    businessType: 'Company/Corporation',
    address: '987 Nguyễn Thị Minh Khai',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    phone: '028-3930-1234',
    email: 'info@premiumoptics.vn',
    ownerId: 106,
    ownerName: 'Ngô Văn F',
    ownerAvatar: '/avatars/owner6.jpg',
    status: 'ACTIVE',
    isVerified: true,
    rating: 4.9,
    totalReviews: 512,
    createdAt: '2022-11-01T08:00:00',
    totalProducts: 230,
    totalOrders: 2100,
    totalRevenue: 1500000000,
  },
];

const FrameProductPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setShowNavbar, setShowFooter } = useLayout();

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const totalShops = shopsData.length;
  const activeCount = shopsData.filter((s) => s.status === 'ACTIVE').length;
  const verifiedCount = shopsData.filter((s) => s.isVerified).length;
  const totalProducts = shopsData.reduce((sum, s) => sum + s.totalProducts, 0);

  const handleRowClick = (shopId: number) => {
    navigate(PAGE_ENDPOINTS.TRACKING.SHOP_DETAIL.replace(':id', shopId.toString()));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      icon: <Inventory2 sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Frame',
      value: totalShops.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <Verified sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Active Frame',
      value: activeCount.toLocaleString(),
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <Warehouse sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'In-stock Frame',
      value: totalShops.toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <RemoveShoppingCart sx={{ color: theme.palette.custom.status.error.main }} />,
      label: 'Out-of-stock Frame',
      value: verifiedCount.toLocaleString(),
      bgColor: theme.palette.custom.status.error.light,
    },
    {
      icon: <EditNote sx={{ color: theme.palette.custom.status.warning }} />,
      label: 'Draft Frame',
      value: totalProducts.toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
  ];

  const getStatusColor = (status: ShopStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'INACTIVE':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      case 'PENDING':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 1 }}
            >
              Frame Management
            </Typography>
            <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
              Quản lý và theo dõi thông tin gọng kính có trong cửa hàng
            </Typography>
          </Box>
          <CustomButton
            variant="contained"
            startIcon={<Add />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Add Frame
          </CustomButton>
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

        {/* Shop List */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
            >
              Shop List
            </Typography>
            <TextField
              placeholder="Search shops..."
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.custom.neutral[400] }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Shop
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Owner
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Location
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Products
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Rating
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        Revenue
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                      Status
                    </Typography>
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {shopsData.map((shop) => {
                  const statusColor = getStatusColor(shop.status);

                  return (
                    <TableRow
                      key={shop.shopId}
                      hover
                      onClick={() => handleRowClick(shop.shopId)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.custom.neutral[50],
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={shop.shopLogo}
                            sx={{ width: 44, height: 44, bgcolor: theme.palette.custom.neutral[100] }}
                          >
                            <Store />
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                {shop.shopName}
                              </Typography>
                              {shop.isVerified && (
                                <Verified sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {shop.shopCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={shop.ownerAvatar}
                            sx={{ width: 32, height: 32, bgcolor: theme.palette.custom.neutral[200] }}
                          >
                            {shop.ownerName[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                              {shop.ownerName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }} />
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                {shop.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 16, color: theme.palette.custom.neutral[400], mt: 0.3 }} />
                          <Box>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>
                              {shop.district}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {shop.city}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Inventory sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {shop.totalProducts.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {shop.rating > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {shop.rating}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              ({shop.totalReviews})
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                            No reviews
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                          {formatCurrency(shop.totalRevenue)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shop.status}
                          size="small"
                          sx={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.color,
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          <MoreVert sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
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
    </Box>
  );
};

export default FrameProductPage;
