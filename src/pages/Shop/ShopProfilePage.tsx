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
  Rating,
  LinearProgress,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Edit,
  Store,
  Inventory,
  ShoppingCart,
  Star,
  TrendingUp,
  Visibility,
  MoreVert,
  Add,
  CheckCircle,
  LocationOn,
  Phone,
  Email,
  CalendarMonth,
  Verified,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../layouts/LayoutContext';

interface ShopInfo {
  shopId: number;
  shopName: string;
  shopLogo: string;
  shopDescription: string;
  businessType: string;
  taxCode: string;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  joinedAt: string;
  owner: {
    name: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
  };
  stats: {
    responseRate: number;
    responseTime: string;
    shipOnTime: number;
    cancellationRate: number;
  };
}

interface Product {
  productId: number;
  productName: string;
  productImage: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

// Mock data
const mockShopInfo: ShopInfo = {
  shopId: 1,
  shopName: 'Glassify Official Store',
  shopLogo: '/shops/glassify-logo.png',
  shopDescription:
    'Premium eyewear and optical accessories. We offer high-quality glasses, sunglasses, and contact lenses from top brands worldwide.',
  businessType: 'Company/Corporation',
  taxCode: '0123456789',
  isVerified: true,
  rating: 4.8,
  totalReviews: 2456,
  totalProducts: 156,
  totalOrders: 5280,
  totalRevenue: 1250000000,
  joinedAt: '2023-01-15',
  owner: {
    name: 'Nguyen Van A',
    phone: '0901234567',
    email: 'shop@glassify.vn',
  },
  address: {
    street: '123 Nguyen Hue',
    ward: 'Ben Nghe',
    district: 'District 1',
    city: 'Ho Chi Minh City',
  },
  stats: {
    responseRate: 98,
    responseTime: '< 1 hour',
    shipOnTime: 95,
    cancellationRate: 2,
  },
};

const mockProducts: Product[] = [
  {
    productId: 1,
    productName: 'Ray-Ban Aviator Classic',
    productImage: '/products/rayban-aviator.jpg',
    category: 'Sunglasses',
    price: 3500000,
    stock: 45,
    sold: 234,
    rating: 4.9,
    status: 'ACTIVE',
  },
  {
    productId: 2,
    productName: 'Oakley Holbrook',
    productImage: '/products/oakley-holbrook.jpg',
    category: 'Sunglasses',
    price: 4200000,
    stock: 28,
    sold: 156,
    rating: 4.7,
    status: 'ACTIVE',
  },
  {
    productId: 3,
    productName: 'Gucci Round Frame',
    productImage: '/products/gucci-round.jpg',
    category: 'Eyeglasses',
    price: 8500000,
    stock: 12,
    sold: 89,
    rating: 4.8,
    status: 'ACTIVE',
  },
  {
    productId: 4,
    productName: 'Tom Ford Blue Light',
    productImage: '/products/tomford-blue.jpg',
    category: 'Eyeglasses',
    price: 6200000,
    stock: 0,
    sold: 67,
    rating: 4.6,
    status: 'OUT_OF_STOCK',
  },
  {
    productId: 5,
    productName: 'Prada Linea Rossa',
    productImage: '/products/prada-sport.jpg',
    category: 'Sunglasses',
    price: 7800000,
    stock: 8,
    sold: 45,
    rating: 4.9,
    status: 'ACTIVE',
  },
];

const ShopProfilePage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const shop = mockShopInfo;
  const products = mockProducts;

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: theme.palette.custom.status.success.light,
          color: theme.palette.custom.status.success.main,
        };
      case 'INACTIVE':
        return {
          bg: theme.palette.custom.neutral[100],
          color: theme.palette.custom.neutral[500],
        };
      case 'OUT_OF_STOCK':
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

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  const StatCard = ({
    icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.custom.border.light}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: color + '20',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 0.5 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            {value}
          </Typography>
          {subValue && (
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{subValue}</Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Shop Profile
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<Edit />} sx={{ mr: 1 }}>
            Edit Profile
          </Button>
        </Box>

        {/* Shop Header Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Avatar
              variant="rounded"
              src={shop.shopLogo}
              sx={{
                width: 100,
                height: 100,
                bgcolor: theme.palette.custom.neutral[100],
                fontSize: 32,
              }}
            >
              <Store sx={{ fontSize: 48 }} />
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {shop.shopName}
                </Typography>
                {shop.isVerified && (
                  <Verified sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }} />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={shop.rating} precision={0.1} readOnly size="small" />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                    {shop.rating}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    ({formatNumber(shop.totalReviews)} reviews)
                  </Typography>
                </Box>
                <Chip
                  label={shop.businessType}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.custom.status.info.light,
                    color: theme.palette.custom.status.info.main,
                    fontWeight: 500,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontSize: 14,
                  color: theme.palette.custom.neutral[600],
                  maxWidth: 600,
                }}
              >
                {shop.shopDescription}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 0.5 }}>
                <CalendarMonth sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Joined {new Date(shop.joinedAt).toLocaleDateString('vi-VN')}
              </Typography>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                Tax Code: {shop.taxCode}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<Inventory sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }} />}
              label="Total Products"
              value={shop.totalProducts}
              color={theme.palette.custom.status.info.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<ShoppingCart sx={{ fontSize: 24, color: theme.palette.custom.status.success.main }} />}
              label="Total Orders"
              value={formatNumber(shop.totalOrders)}
              color={theme.palette.custom.status.success.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<TrendingUp sx={{ fontSize: 24, color: theme.palette.custom.status.warning.main }} />}
              label="Total Revenue"
              value={formatCurrency(shop.totalRevenue)}
              color={theme.palette.custom.status.warning.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<Star sx={{ fontSize: 24, color: theme.palette.custom.status.rose.main }} />}
              label="Shop Rating"
              value={shop.rating + '/5'}
              subValue={`${formatNumber(shop.totalReviews)} reviews`}
              color={theme.palette.custom.status.rose.main}
            />
          </Grid>
        </Grid>

        {/* Shop Performance & Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Performance Metrics */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.palette.custom.neutral[800],
                  mb: 3,
                }}
              >
                Shop Performance
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                    Response Rate
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                    {shop.stats.responseRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={shop.stats.responseRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.custom.neutral[100],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.custom.status.success.main,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                    Ship On Time
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.info.main }}>
                    {shop.stats.shipOnTime}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={shop.stats.shipOnTime}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.custom.neutral[100],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.custom.status.info.main,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                    Cancellation Rate
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.error.main }}>
                    {shop.stats.cancellationRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={shop.stats.cancellationRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.custom.neutral[100],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.custom.status.error.main,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                  Average Response Time:
                </Typography>
                <Chip
                  label={shop.stats.responseTime}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.custom.status.success.light,
                    color: theme.palette.custom.status.success.main,
                    fontWeight: 500,
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Contact Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.palette.custom.neutral[800],
                  mb: 3,
                }}
              >
                Contact Information
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  OWNER
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 16, color: theme.palette.custom.status.success.main }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.owner.name}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  PHONE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.owner.phone}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  EMAIL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.owner.email}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  ADDRESS
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: theme.palette.custom.status.error.main, mt: 0.3 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.address.street}, {shop.address.ward}, {shop.address.district}, {shop.address.city}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
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
              <Tab label={`Products (${products.length})`} />
              <Tab label="Orders" />
              <Tab label="Reviews" />
            </Tabs>
          </Box>

          {/* Products Tab */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                  Showing {products.length} products
                </Typography>
                <Button variant="contained" startIcon={<Add />} size="small">
                  Add Product
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                        PRODUCT
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
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                        STATUS
                      </TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => {
                      const statusStyle = getStatusColor(product.status);
                      return (
                        <TableRow key={product.productId} hover sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                variant="rounded"
                                src={product.productImage}
                                sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[100] }}
                              >
                                {product.productName[0]}
                              </Avatar>
                              <Typography
                                sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}
                              >
                                {product.productName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.category}
                              size="small"
                              sx={{
                                bgcolor: theme.palette.custom.neutral[100],
                                color: theme.palette.custom.neutral[700],
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
                            >
                              {formatCurrency(product.price)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 500,
                                color:
                                  product.stock === 0
                                    ? theme.palette.custom.status.error.main
                                    : product.stock < 10
                                    ? theme.palette.custom.status.warning.main
                                    : theme.palette.custom.neutral[800],
                              }}
                            >
                              {product.stock}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                              {product.sold}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                {product.rating}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(product.status)}
                              size="small"
                              sx={{
                                bgcolor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <Visibility sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                            <IconButton size="small">
                              <Edit sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                            <IconButton size="small">
                              <MoreVert sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Orders Tab - Placeholder */}
          {activeTab === 1 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                Orders management coming soon
              </Typography>
            </Box>
          )}

          {/* Reviews Tab - Placeholder */}
          {activeTab === 2 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Star sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                Reviews management coming soon
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopProfilePage;
