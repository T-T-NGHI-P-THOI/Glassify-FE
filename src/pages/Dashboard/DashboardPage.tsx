import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Storefront,
  ShoppingCart,
  AttachMoney,
  People,
  LocalShipping,
  Inventory,
  Star,
  ArrowUpward,
  ArrowDownward,
  Visibility,
  CheckCircle,
  Schedule,
  Store,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import type { AdminShopItem, ShopRequest } from '@/models/Shop';

// Mock data for stats not yet covered by API
const dashboardStats = {
  totalOrders: 12580,
  pendingOrders: 234,
  totalRevenue: 2850000000,
  monthlyRevenue: 385000000,
  totalCustomers: 8920,
  newCustomers: 156,
  totalProducts: 4250,
  lowStockProducts: 28,
  pendingDeliveries: 89,
  completedDeliveries: 1250,
  shopGrowth: 12.5,
  orderGrowth: 8.3,
  revenueGrowth: 15.2,
  customerGrowth: 6.8,
};

const recentOrders = [ // TODO: replace when admin orders API is available
  {
    orderId: 'ORD-2024-001',
    customer: 'Nguyễn Văn Minh',
    customerAvatar: '/avatars/c1.jpg',
    shop: 'Optical Vision Store',
    amount: 7500000,
    status: 'DELIVERED',
    date: '2024-01-20T10:30:00',
  },
  {
    orderId: 'ORD-2024-002',
    customer: 'Trần Thị Lan',
    customerAvatar: '/avatars/c2.jpg',
    shop: 'EyeWear Plus',
    amount: 3200000,
    status: 'SHIPPING',
    date: '2024-01-20T09:15:00',
  },
  {
    orderId: 'ORD-2024-003',
    customer: 'Lê Văn Hùng',
    customerAvatar: '/avatars/c3.jpg',
    shop: 'Premium Optics',
    amount: 12800000,
    status: 'PROCESSING',
    date: '2024-01-20T08:45:00',
  },
  {
    orderId: 'ORD-2024-004',
    customer: 'Phạm Thị Mai',
    customerAvatar: '/avatars/c4.jpg',
    shop: 'Lens World',
    amount: 4500000,
    status: 'PENDING',
    date: '2024-01-19T16:20:00',
  },
  {
    orderId: 'ORD-2024-005',
    customer: 'Hoàng Văn Nam',
    customerAvatar: '/avatars/c5.jpg',
    shop: 'Optical Vision Store',
    amount: 8900000,
    status: 'DELIVERED',
    date: '2024-01-19T14:00:00',
  },
];


const DashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ShopRequest[]>([]);

  useEffect(() => {
    adminApi.getShops().then((res) => {
      if (res.data) setShops(res.data);
    }).catch(() => {});

    adminApi.getShopRequests('PENDING').then((res) => {
      if (res.data) setPendingRequests(res.data.requests);
    }).catch(() => {});
  }, []);

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.status === 'ACTIVE').length;
  const topShops = [...shops]
    .sort((a, b) => (b.totalOrders ?? 0) - (a.totalOrders ?? 0))
    .slice(0, 5);


  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}M`;
    }
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'SHIPPING':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'PROCESSING':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'PENDING':
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const mainStats = [
    {
      icon: <Storefront sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'Total Shops',
      value: totalShops.toLocaleString(),
      subValue: `${activeShops} active`,
      growth: dashboardStats.shopGrowth,
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <ShoppingCart sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Total Orders',
      value: dashboardStats.totalOrders.toLocaleString(),
      subValue: `${dashboardStats.pendingOrders} pending`,
      growth: dashboardStats.orderGrowth,
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <AttachMoney sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Total Revenue',
      value: formatCurrency(dashboardStats.totalRevenue),
      subValue: `${formatCurrency(dashboardStats.monthlyRevenue)} this month`,
      growth: dashboardStats.revenueGrowth,
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <People sx={{ color: theme.palette.custom.status.purple.main }} />,
      label: 'Total Customers',
      value: dashboardStats.totalCustomers.toLocaleString(),
      subValue: `+${dashboardStats.newCustomers} this month`,
      growth: dashboardStats.customerGrowth,
      bgColor: theme.palette.custom.status.purple.light,
    },
  ];

  const secondaryStats = [
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.teal.main }} />,
      label: 'Total Products',
      value: dashboardStats.totalProducts.toLocaleString(),
      alert: dashboardStats.lowStockProducts > 0 ? `${dashboardStats.lowStockProducts} low stock` : null,
      bgColor: theme.palette.custom.status.teal.light,
    },
    {
      icon: <LocalShipping sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Pending Deliveries',
      value: dashboardStats.pendingDeliveries.toLocaleString(),
      subValue: `${dashboardStats.completedDeliveries} completed today`,
      bgColor: theme.palette.custom.status.pink.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.DASHBOARD} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 1 }}>
            Dashboard
          </Typography>
          <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
            Tổng quan hoạt động kinh doanh của hệ thống Glassify
          </Typography>
        </Box>

        {/* Main Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          {mainStats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    backgroundColor: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
                <Chip
                  icon={stat.growth >= 0 ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
                  label={`${Math.abs(stat.growth)}%`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: stat.growth >= 0 ? theme.palette.custom.status.success.light : theme.palette.custom.status.error.light,
                    color: stat.growth >= 0 ? theme.palette.custom.status.success.main : theme.palette.custom.status.error.main,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500, mb: 0.5 }}>
                {stat.label}
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                {stat.subValue}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Secondary Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
          {secondaryStats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
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
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {stat.value}
                </Typography>
              </Box>
              {stat.alert ? (
                <Chip
                  label={stat.alert}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.custom.status.error.light,
                    color: theme.palette.custom.status.error.main,
                    fontWeight: 500,
                    fontSize: 12,
                  }}
                />
              ) : stat.subValue ? (
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  {stat.subValue}
                </Typography>
              ) : null}
            </Paper>
          ))}
        </Box>

        {/* Main Content Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
          {/* Left Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Recent Orders */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Recent Orders
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => navigate('/order')} // TODO: Update when order page is created
                >
                  View All
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        ORDER ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        CUSTOMER
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        SHOP
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        AMOUNT
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        STATUS
                      </TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => {
                      const statusStyle = getOrderStatusStyle(order.status);
                      return (
                        <TableRow key={order.orderId} hover sx={{ cursor: 'pointer' }}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.pink.main }}>
                              {order.orderId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar src={order.customerAvatar} sx={{ width: 28, height: 28 }}>
                                {order.customer[0]}
                              </Avatar>
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>
                                {order.customer}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                              {order.shop}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {formatFullCurrency(order.amount)}
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
                          <TableCell align="right">
                            <IconButton size="small">
                              <Visibility sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Top Performing Shops */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Top Performing Shops
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.SHOPS)}
                >
                  View All
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        SHOP
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        ORDERS
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        PRODUCTS
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>
                        RATING
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topShops.map((shop, index) => (
                      <TableRow
                        key={shop.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`${PAGE_ENDPOINTS.TRACKING.SHOP_DETAIL}`.replace(':shopId', shop.id))}
                      >
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[400] }}>
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar variant="rounded" src={shop.logoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: theme.palette.custom.neutral[100] }}>
                              <Store sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {shop.shopName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                            {shop.totalOrders ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                            {shop.totalProducts ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                              {shop.avgRating != null ? shop.avgRating.toFixed(1) : '—'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Right Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Pending Shop Approvals */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                    Pending Approvals
                  </Typography>
                  <Chip
                    label={pendingRequests.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: theme.palette.custom.status.warning.light,
                      color: theme.palette.custom.status.warning.main,
                    }}
                  />
                </Box>
                <Typography
                  sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL)}
                >
                  View All
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {pendingRequests.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textAlign: 'center', py: 2 }}>
                    No pending approvals
                  </Typography>
                ) : (
                  pendingRequests.slice(0, 3).map((req, index) => (
                    <Box
                      key={req.id}
                      onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        mb: index < Math.min(pendingRequests.length, 3) - 1 ? 1.5 : 0,
                        '&:hover': { bgcolor: theme.palette.custom.neutral[50] },
                        cursor: 'pointer',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {req.shopName}
                        </Typography>
                        <Chip
                          label={req.businessLicense?.businessType ?? '—'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            backgroundColor: theme.palette.custom.neutral[100],
                            color: theme.palette.custom.neutral[600],
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mb: 1 }}>
                        Owner: {req.userName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 14, color: theme.palette.custom.neutral[400] }} />
                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                          {formatDate(req.submittedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            {/* Order Status Distribution */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 3 }}>
                Order Status Overview
              </Typography>

              {[
                { label: 'Delivered', value: 68, color: theme.palette.custom.status.success.main },
                { label: 'Shipping', value: 18, color: theme.palette.custom.status.info.main },
                { label: 'Processing', value: 10, color: theme.palette.custom.status.warning.main },
                { label: 'Pending', value: 4, color: theme.palette.custom.neutral[400] },
              ].map((item, index) => (
                <Box key={index} sx={{ mb: index < 3 ? 2.5 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {item.value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.custom.neutral[100],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: item.color,
                      },
                    }}
                  />
                </Box>
              ))}
            </Paper>

            {/* Quick Stats */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                Today's Highlights
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, bgcolor: theme.palette.custom.status.success.light }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                      Orders Completed
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                    156
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, bgcolor: theme.palette.custom.status.info.light }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ fontSize: 20, color: theme.palette.custom.status.info.main }} />
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                      Shipments Sent
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.status.info.main }}>
                    89
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, bgcolor: theme.palette.custom.status.purple.light }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 20, color: theme.palette.custom.status.purple.main }} />
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                      New Customers
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.status.purple.main }}>
                    24
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
