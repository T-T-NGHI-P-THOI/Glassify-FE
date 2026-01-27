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
  Divider,
  Button,
  Grid,
  Rating,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Store,
  LocationOn,
  Phone,
  Email,
  Inventory,
  People,
  Edit,
  MoreHoriz,
  Star,
  ShoppingCart,
  AttachMoney,
  Verified,
  AccessTime,
  Description,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

type ShopStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

interface Product {
  productId: number;
  productName: string;
  productImage: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  rating: number;
}

interface Order {
  orderId: number;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: string;
  itemCount: number;
  date: string;
}

interface Review {
  reviewId: number;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  productName: string;
  date: string;
}

interface ShopDetail {
  shopId: number;
  shopName: string;
  shopLogo: string;
  shopCode: string;
  businessType: string;
  taxCode: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  phone: string;
  email: string;
  website: string;
  ownerId: number;
  ownerName: string;
  ownerAvatar: string;
  ownerEmail: string;
  ownerPhone: string;
  status: ShopStatus;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  createdAt: string;
  description: string;
  // Stats
  totalProducts: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  // Data
  products: Product[];
  recentOrders: Order[];
  recentReviews: Review[];
}

// Mock data
const mockShopDetail: ShopDetail = {
  shopId: 1,
  shopName: 'Optical Vision Store',
  shopLogo: '/shops/optical-vision.png',
  shopCode: 'SHOP-OVS-001',
  businessType: 'Company/Corporation',
  taxCode: '0123456789',
  address: '123 Nguyễn Huệ, Phường Bến Nghé',
  city: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  phone: '028-3823-4567',
  email: 'contact@opticalvision.vn',
  website: 'www.opticalvision.vn',
  ownerId: 101,
  ownerName: 'Nguyễn Văn A',
  ownerAvatar: '/avatars/owner1.jpg',
  ownerEmail: 'nguyenvana@email.com',
  ownerPhone: '0901-234-567',
  status: 'ACTIVE',
  isVerified: true,
  rating: 4.8,
  totalReviews: 256,
  createdAt: '2023-01-15T08:00:00',
  description: 'Cửa hàng kính mắt cao cấp với hơn 10 năm kinh nghiệm, chuyên cung cấp các thương hiệu kính nổi tiếng thế giới.',
  totalProducts: 150,
  totalOrders: 1250,
  completedOrders: 1180,
  totalRevenue: 850000000,
  monthlyRevenue: 85000000,
  totalCustomers: 890,
  products: [
    {
      productId: 1,
      productName: 'Kính Rayban Aviator Classic',
      productImage: '/products/rayban-aviator.jpg',
      sku: 'RB-AV-001',
      category: 'Sunglasses',
      price: 3500000,
      stock: 45,
      sold: 120,
      rating: 4.9,
    },
    {
      productId: 2,
      productName: 'Kính Gucci Square Frame',
      productImage: '/products/gucci-square.jpg',
      sku: 'GC-SQ-002',
      category: 'Luxury',
      price: 8500000,
      stock: 15,
      sold: 35,
      rating: 4.7,
    },
    {
      productId: 3,
      productName: 'Kính Oakley Sport Pro',
      productImage: '/products/oakley-sport.jpg',
      sku: 'OK-SP-003',
      category: 'Sport',
      price: 4200000,
      stock: 60,
      sold: 95,
      rating: 4.8,
    },
    {
      productId: 4,
      productName: 'Kính Prada Cat Eye',
      productImage: '/products/prada-cat.jpg',
      sku: 'PR-CE-004',
      category: 'Luxury',
      price: 7800000,
      stock: 20,
      sold: 28,
      rating: 4.6,
    },
    {
      productId: 5,
      productName: 'Kính Dior Round',
      productImage: '/products/dior-round.jpg',
      sku: 'DR-RD-005',
      category: 'Luxury',
      price: 9200000,
      stock: 12,
      sold: 18,
      rating: 4.9,
    },
  ],
  recentOrders: [
    {
      orderId: 1,
      orderCode: 'ORD-20240619-001',
      customerName: 'Trần Văn Minh',
      totalAmount: 7000000,
      status: 'DELIVERED',
      itemCount: 2,
      date: '2024-06-19T10:00:00',
    },
    {
      orderId: 2,
      orderCode: 'ORD-20240619-002',
      customerName: 'Lê Thị Hoa',
      totalAmount: 3500000,
      status: 'SHIPPING',
      itemCount: 1,
      date: '2024-06-19T08:30:00',
    },
    {
      orderId: 3,
      orderCode: 'ORD-20240618-005',
      customerName: 'Phạm Văn Nam',
      totalAmount: 12500000,
      status: 'PROCESSING',
      itemCount: 3,
      date: '2024-06-18T14:00:00',
    },
  ],
  recentReviews: [
    {
      reviewId: 1,
      customerName: 'Nguyễn Thị Lan',
      customerAvatar: '/avatars/customer1.jpg',
      rating: 5,
      comment: 'Sản phẩm chất lượng, đóng gói cẩn thận, giao hàng nhanh!',
      productName: 'Kính Rayban Aviator Classic',
      date: '2024-06-18T10:00:00',
    },
    {
      reviewId: 2,
      customerName: 'Trần Văn Hùng',
      customerAvatar: '/avatars/customer2.jpg',
      rating: 4,
      comment: 'Kính đẹp, đúng mô tả. Sẽ ủng hộ shop lần sau.',
      productName: 'Kính Gucci Square Frame',
      date: '2024-06-17T15:30:00',
    },
    {
      reviewId: 3,
      customerName: 'Lê Minh Tuấn',
      customerAvatar: '/avatars/customer3.jpg',
      rating: 5,
      comment: 'Shop tư vấn nhiệt tình, sản phẩm authentic 100%',
      productName: 'Kính Oakley Sport Pro',
      date: '2024-06-16T09:00:00',
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const ShopTrackingDetailPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(0);

  // In real app, fetch shop by id
  const shop = mockShopDetail;

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const statusColor = {
    ACTIVE: { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main },
    INACTIVE: { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main },
    PENDING: { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main },
  }[shop.status];

  const getOrderStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'SHIPPING':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'PROCESSING':
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.SHOPS)}>
            <ArrowBack />
          </IconButton>
          <Avatar
            variant="rounded"
            src={shop.shopLogo}
            sx={{ width: 56, height: 56, bgcolor: theme.palette.custom.neutral[100] }}
          >
            <Store sx={{ fontSize: 28 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                {shop.shopName}
              </Typography>
              {shop.isVerified && (
                <Verified sx={{ fontSize: 22, color: theme.palette.custom.status.info.main }} />
              )}
              <Chip
                label={shop.status}
                size="small"
                sx={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.color,
                  fontWeight: 600,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                {shop.shopCode}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                  {shop.rating}
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                  ({shop.totalReviews} reviews)
                </Typography>
              </Box>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit Shop
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
                Total Products
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {shop.totalProducts.toLocaleString()}
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
              <ShoppingCart sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Total Orders
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {shop.totalOrders.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
              {shop.completedOrders} completed
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
              <AttachMoney sx={{ fontSize: 18, color: theme.palette.custom.status.warning.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Total Revenue
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {formatCurrency(shop.totalRevenue)}
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
              <AttachMoney sx={{ fontSize: 18, color: theme.palette.custom.status.purple.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Monthly Revenue
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {formatCurrency(shop.monthlyRevenue)}
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
              <People sx={{ fontSize: 18, color: theme.palette.custom.status.teal.main }} />
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                Total Customers
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              {shop.totalCustomers.toLocaleString()}
            </Typography>
          </Paper>
        </Box>

        {/* Shop Info & Owner */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 4 }}>
          {/* Shop Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
              Shop Information
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
                      {shop.address}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                      {shop.ward}, {shop.district}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                      {shop.city}
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
                        {shop.phone}
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
                        {shop.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mt: 2 }}>
                  <Description sx={{ fontSize: 20, color: theme.palette.custom.neutral[400], mt: 0.3 }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                      DESCRIPTION
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                      {shop.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Owner Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
              Shop Owner
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={shop.ownerAvatar}
                sx={{ width: 56, height: 56, bgcolor: theme.palette.custom.neutral[200] }}
              >
                {shop.ownerName[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  {shop.ownerName}
                </Typography>
                <Chip
                  label="Shop Owner"
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
                  {shop.ownerEmail}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                  {shop.ownerPhone}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                  Joined {formatDate(shop.createdAt)}
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
              <Tab label="Products" />
              <Tab label="Recent Orders" />
              <Tab label="Reviews" />
            </Tabs>
          </Box>

          {/* Products Tab */}
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
                      PRICE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      STOCK
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      SOLD
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      RATING
                    </TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shop.products.map((item) => (
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
                          {formatCurrency(item.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                          {item.stock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.status.success.main }}>
                          {item.sold}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                            {item.rating}
                          </Typography>
                        </Box>
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

          {/* Recent Orders Tab */}
          {activeTab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      ORDER CODE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      CUSTOMER
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      ITEMS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                      TOTAL
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
                  {shop.recentOrders.map((order) => {
                    const statusStyle = getOrderStatusStyle(order.status);

                    return (
                      <TableRow key={order.orderId} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.pink.main }}>
                            {order.orderCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>
                            {order.customerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                            {order.itemCount} items
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            {formatCurrency(order.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
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
                            {formatDate(order.date)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
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

          {/* Reviews Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              {shop.recentReviews.map((review, index) => (
                <Box key={review.reviewId}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      src={review.customerAvatar}
                      sx={{ width: 44, height: 44, bgcolor: theme.palette.custom.neutral[200] }}
                    >
                      {review.customerName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {review.customerName}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          {formatDate(review.date)}
                        </Typography>
                      </Box>
                      <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], mb: 1 }}>
                        {review.comment}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                        Product: {review.productName}
                      </Typography>
                    </Box>
                  </Box>
                  {index < shop.recentReviews.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopTrackingDetailPage;
