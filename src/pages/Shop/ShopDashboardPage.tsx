import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Rating,
  Alert,
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
  Store,
  ShoppingCart,
  Inventory,
  Star,
  VerifiedUser,
  Email,
  Phone,
  LocationOn,
  Business,
  Person,
  AccessTime,
  Visibility,
  LocalShipping,
  AccountBalance,
  TrendingUp,
  Edit,
  Cancel,
  MoreVert,
  AttachMoney,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import type { MonthlyRevenueItem, SalesByCategoryItem, ShopAnalyticsSummary } from '@/api/shopApi';
import { ghnApi } from '@/api/ghnApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopDetailResponse, ShopStatus } from '@/models/Shop';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const ShopDashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [ghnNames, setGhnNames] = useState({ province: '', district: '', ward: '' });
  const [cancelDeactivateLoading, setCancelDeactivateLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<MonthlyRevenueItem[]>([]);
  const [categoryData, setCategoryData] = useState<SalesByCategoryItem[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<ShopAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  useLayoutConfig({ showNavbar: false, showFooter: false });

  useEffect(() => {
    fetchShopDetail();
  }, []);

  useEffect(() => {
    if (!shop?.id) return;
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const [monthlyRes, categoryRes, summaryRes] = await Promise.all([
          shopApi.getMonthlyRevenue(shop.id),
          shopApi.getSalesByCategory(shop.id),
          shopApi.getAnalyticsSummary(shop.id),
        ]);
        if (monthlyRes.data) setRevenueData(monthlyRes.data);
        if (categoryRes.data) setCategoryData(categoryRes.data);
        if (summaryRes.data) setAnalyticsSummary(summaryRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [shop?.id]);

  // Resolve GHN province/district/ward names
  useEffect(() => {
    if (!shop) return;
    const resolveGhnNames = async () => {
      const names = { province: '', district: '', ward: '' };
      try {
        if (shop.ghnProvinceId) {
          const provRes = await ghnApi.getProvinces();
          const prov = (provRes.data || []).find((p) => p.ProvinceID === shop.ghnProvinceId);
          if (prov) names.province = prov.ProvinceName;
        }
        if (shop.ghnDistrictId && shop.ghnProvinceId) {
          const distRes = await ghnApi.getDistricts(shop.ghnProvinceId);
          const dist = (distRes.data || []).find((d) => d.DistrictID === shop.ghnDistrictId);
          if (dist) names.district = dist.DistrictName;
        }
        if (shop.ghnWardCode && shop.ghnDistrictId) {
          const wardRes = await ghnApi.getWards(shop.ghnDistrictId);
          const ward = (wardRes.data || []).find((w) => w.WardCode === shop.ghnWardCode);
          if (ward) names.ward = ward.WardName;
        }
      } catch (err) {
        console.error('Failed to resolve GHN names:', err);
      }
      setGhnNames(names);
    };
    resolveGhnNames();
  }, [shop]);

  const fetchShopDetail = async () => {
    try {
      setLoading(true);
      const response = await shopApi.getMyShops();
      if (response.data?.[0]) {
        setShop(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch shop detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeactivate = async () => {
    if (!shop) return;
    try {
      setCancelDeactivateLoading(true);
      await shopApi.cancelDeactivate(shop.id);
      await fetchShopDetail();
    } catch (error) {
      console.error('Failed to cancel deactivation request:', error);
    } finally {
      setCancelDeactivateLoading(false);
    }
  };

  const getStatusColor = (status: ShopStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: theme.palette.custom.status.success.light,
          color: theme.palette.custom.status.success.main,
        };
      case 'PENDING':
        return {
          bg: theme.palette.custom.status.warning.light,
          color: theme.palette.custom.status.warning.main,
        };
      case 'SUSPENDED':
        return {
          bg: theme.palette.custom.status.error.light,
          color: theme.palette.custom.status.error.main,
        };
      case 'INACTIVE':
      case 'CLOSING':
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.DASHBOARD}
          shopName={user?.shop?.shopName}
          shopLogo={user?.shop?.logoUrl}
          ownerName={user?.fullName}
          ownerEmail={user?.email}
          ownerAvatar={user?.avatarUrl}
        />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.DASHBOARD}
          shopName={user?.shop?.shopName}
          shopLogo={user?.shop?.logoUrl}
          ownerName={user?.fullName}
          ownerEmail={user?.email}
          ownerAvatar={user?.avatarUrl}
        />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
          <Store sx={{ fontSize: 64, color: theme.palette.custom.neutral[300] }} />
          <Typography sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }}>
            Shop information not available
          </Typography>
        </Box>
      </Box>
    );
  }

  const formatRevenue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(3).replace(/\.?0+$/, '')}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const stats = [
    {
      icon: <ShoppingCart sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'Total Orders',
      value: analyticsLoading ? '...' : (analyticsSummary?.totalOrders ?? 0).toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.purple.main }} />,
      label: 'Total Products',
      value: analyticsLoading ? '...' : (analyticsSummary?.totalProducts ?? 0).toLocaleString(),
      bgColor: theme.palette.custom.status.purple.light,
    },
    {
      icon: <Star sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Avg Rating',
      value: analyticsLoading ? '...' : (analyticsSummary?.avgRating ?? 0).toFixed(1),
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <TrendingUp sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Commission Rate',
      value: shop.commissionRate != null ? `${shop.commissionRate}%` : 'N/A',
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <AttachMoney sx={{ color: '#f97316' }} />,
      label: 'Total Revenue',
      value: analyticsLoading ? '...' : analyticsSummary ? `₫${formatRevenue(analyticsSummary.totalRevenue)}` : '₫0',
      bgColor: '#fff7ed',
    },
  ];

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const revenueChartData = revenueData.map(d => ({
    month: MONTH_NAMES[(d.month ?? 1) - 1] ?? String(d.month),
    revenue: Number(d.revenue),
    orders: Number(d.orders),
  }));
  const categoryChartData = categoryData.map(d => ({
    name: d.categoryName,
    value: Number(d.percentage),
  }));

  const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899'];

  const statusStyle = getStatusColor(shop.status);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.DASHBOARD}
        shopName={shop.shopName}
        shopLogo={shop.logoUrl}
        ownerName={shop.ownerName || user?.fullName}
        ownerEmail={shop.ownerEmail || user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Shop Dashboard
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Overview of your shop information and performance
            </Typography>
          </Box>
        </Box>

        {/* Pending Review Banner - shop PENDING + request still PENDING */}
        {shop.status === 'PENDING' && shop.latestRequestStatus !== 'REJECTED' && (
          <Alert
            severity="warning"
            icon={<AccessTime />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Pending Approval</Typography>
            <Typography sx={{ fontSize: 14 }}>
              Your shop registration is currently being reviewed. All fields are disabled until the review is complete.
            </Typography>
          </Alert>
        )}

        {/* Pending Deactivation Banner */}
        {shop.status === 'PENDING_DEACTIVATION' && (
          <Alert
            severity="warning"
            icon={<AccessTime />}
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button
                color="warning"
                variant="outlined"
                size="small"
                startIcon={cancelDeactivateLoading ? <CircularProgress size={14} /> : <Cancel />}
                onClick={handleCancelDeactivate}
                disabled={cancelDeactivateLoading}
                sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Cancel Request
              </Button>
            }
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Pending Deactivation Request</Typography>
            <Typography sx={{ fontSize: 14 }}>
              Your shop has a pending deactivation request. You can cancel it before it takes effect.
            </Typography>
          </Alert>
        )}

        {/* Closing Banner */}
        {shop.status === 'CLOSING' && (
          <Alert
            severity="error"
            icon={<AccessTime />}
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={cancelDeactivateLoading ? <CircularProgress size={14} /> : <Cancel />}
                onClick={handleCancelDeactivate}
                disabled={cancelDeactivateLoading}
                sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Cancel Closure
              </Button>
            }
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Scheduled for Permanent Closure</Typography>
            <Typography sx={{ fontSize: 14 }}>
              Your shop has been scheduled for permanent closure in 30 days due to policy violation.
              If you wish to appeal, please contact glassify2026@gmail.com.
            </Typography>
          </Alert>
        )}

        {/* Rejected Banner - shop PENDING + request REJECTED */}
        {shop.status === 'PENDING' && shop.latestRequestStatus === 'REJECTED' && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={() => navigate(PAGE_ENDPOINTS.SHOP.RESUBMIT)}
                sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Edit & Resubmit
              </Button>
            }
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Registration Rejected</Typography>
            <Typography sx={{ fontSize: 14 }}>
              Your shop registration has been rejected. Please review the information below and update your shop details to resubmit.
            </Typography>
            {shop.rejectionReason && (
              <Typography sx={{ fontSize: 14, mt: 1 }}>
                <strong>Reason:</strong> {shop.rejectionReason}
              </Typography>
            )}
            {shop.adminComment && (
              <Typography sx={{ fontSize: 14, mt: 0.5 }}>
                <strong>Admin comment:</strong> {shop.adminComment}
              </Typography>
            )}
          </Alert>
        )}

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

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Revenue & Orders Area Chart */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                    Revenue & Orders Overview
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    Monthly performance for the past 12 months
                  </Typography>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.custom.border.light} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: theme.palette.custom.neutral[500] }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="revenue"
                    orientation="left"
                    tick={{ fontSize: 11, fill: theme.palette.custom.neutral[400] }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatRevenue}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 11, fill: theme.palette.custom.neutral[400] }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.custom.border.light}`, fontSize: 13 }}
                    formatter={(value, name) =>
                      name === 'revenue'
                        ? [`₫${formatRevenue(Number(value))}`, 'Revenue']
                        : [value, 'Orders']
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    dot={false}
                    name="revenue"
                  />
                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#colorOrders)"
                    dot={false}
                    name="orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Category Pie Chart */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Sales by Category
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  Product category breakdown
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.custom.border.light}`, fontSize: 13 }}
                      formatter={(value) => [`${value}%`, 'Share']}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Monthly Orders Bar Chart */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Monthly Order Count
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  Number of orders placed each month
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.custom.border.light} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: theme.palette.custom.neutral[500] }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: theme.palette.custom.neutral[400] }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.custom.border.light}`, fontSize: 13 }}
                    cursor={{ fill: theme.palette.custom.neutral[100] }}
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Shop Info Cards */}
        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
          {/* Shop Profile Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Shop Information
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => setDetailDialogOpen(true)}
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
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar
                  variant="rounded"
                  src={shop.logoUrl}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: theme.palette.custom.neutral[100],
                    fontSize: 32,
                  }}
                >
                  <Store sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                      {shop.shopName}
                    </Typography>
                    {shop.isVerified && (
                      <VerifiedUser sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 1.5 }}>
                    Shop Code: {shop.shopCode}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={shop.status}
                      size="small"
                      sx={{
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    />
                    {shop.isVerified && (
                      <Chip
                        label="Verified"
                        size="small"
                        icon={<VerifiedUser sx={{ fontSize: 14 }} />}
                        sx={{
                          bgcolor: theme.palette.custom.status.success.light,
                          color: theme.palette.custom.status.success.main,
                          fontWeight: 600,
                          fontSize: 12,
                          '& .MuiChip-icon': { color: theme.palette.custom.status.success.main },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Contact Info */}
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.info.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Email sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                        Email
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {shop.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.success.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                        Phone
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {shop.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.error.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocationOn sx={{ fontSize: 18, color: theme.palette.custom.status.error.main }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                        Address
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {shop.address}{shop.city ? `, ${shop.city}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Owner, Rating & Membership — single card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Owner Info */}
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                Owner
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={shop.ownerAvatarUrl} sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[200] }}>
                  <Person />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shop.ownerName || 'N/A'}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shop.ownerEmail || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {/* Rating */}
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                Shop Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: 40, fontWeight: 700, color: theme.palette.custom.neutral[800], lineHeight: 1 }}>
                  {analyticsLoading ? '...' : (analyticsSummary?.avgRating ?? 0).toFixed(1)}
                </Typography>
                <Box>
                  <Rating value={analyticsSummary?.avgRating ?? 0} precision={0.1} readOnly size="small" />
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mt: 0.25 }}>
                    Based on customer reviews
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {/* Membership */}
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', letterSpacing: 0.5, mb: 2 }}>
                Membership
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.custom.status.indigo.light,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AccessTime sx={{ fontSize: 20, color: theme.palette.custom.status.indigo.main }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                    Joined At
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                    {formatDate(shop.joinedAt)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

      </Box>

      {/* Detail Dialog */}
      <ShopDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        shop={shop}
        getStatusColor={getStatusColor}
        formatDate={formatDate}
        ghnNames={ghnNames}
        analyticsSummary={analyticsSummary}
      />
    </Box>
  );
};

// ==================== Shop Detail Dialog ====================
interface ShopDetailDialogProps {
  open: boolean;
  onClose: () => void;
  shop: ShopDetailResponse;
  getStatusColor: (status: ShopStatus) => { bg: string; color: string };
  formatDate: (dateString: string | null | undefined) => string;
  ghnNames: { province: string; district: string; ward: string };
  analyticsSummary: ShopAnalyticsSummary | null;
}

const ShopDetailDialog = ({
  open,
  onClose,
  shop,
  getStatusColor,
  formatDate,
  ghnNames,
  analyticsSummary,
}: ShopDetailDialogProps) => {
  const theme = useTheme();
  const statusStyle = getStatusColor(shop.status);

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
        {value ?? 'N/A'}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Dialog Title */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            variant="rounded"
            src={shop.logoUrl}
            sx={{ width: 56, height: 56, bgcolor: theme.palette.custom.neutral[100] }}
          >
            <Store sx={{ fontSize: 28 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {shop.shopName}
              </Typography>
              {shop.isVerified && (
                <VerifiedUser sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                label={shop.status}
                size="small"
                sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 11 }}
              />
              <Chip
                label={shop.shopCode}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: 11, borderColor: theme.palette.custom.border.main }}
              />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Shop Information */}
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

            <InfoRow label="Shop Name" value={shop.shopName} />
            <InfoRow label="Shop Code" value={shop.shopCode} />
            <InfoRow label="Email" value={shop.email} />
            <InfoRow label="Phone" value={shop.phone} />
            <InfoRow label="Tax ID" value={shop.businessLicense?.taxId} />
            <InfoRow label="Business License No." value={shop.businessLicense?.licenseNumber} />
            <InfoRow label="Business Name" value={shop.businessLicense?.businessName} />
          </Grid>

          {/* Owner Information */}
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

            <InfoRow label="Owner Name" value={shop.ownerName} />
            <InfoRow label="Owner Email" value={shop.ownerEmail} />
            <InfoRow label="Owner ID" value={shop.ownerId} />
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
              Address
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow label="Address" value={shop.address} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow label="City" value={shop.city} />
              </Grid>
            </Grid>
          </Grid>

          {/* GHN Shipping Info */}
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
              <LocalShipping sx={{ fontSize: 18 }} />
              GHN Shipping Info
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="GHN Shop ID" value={shop.ghnShopId} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Province" value={ghnNames.province || shop.ghnProvinceId} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="District" value={ghnNames.district || shop.ghnDistrictId} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Ward" value={ghnNames.ward || shop.ghnWardCode} />
              </Grid>
            </Grid>
          </Grid>

          {/* Performance Stats */}
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
              <AccountBalance sx={{ fontSize: 18 }} />
              Performance & Billing
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Total Orders" value={(analyticsSummary?.totalOrders ?? 0).toLocaleString()} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Total Products" value={(analyticsSummary?.totalProducts ?? 0).toLocaleString()} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                    Avg Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {(analyticsSummary?.avgRating ?? 0).toFixed(1)}
                    </Typography>
                    <Rating value={analyticsSummary?.avgRating ?? 0} precision={0.1} readOnly size="small" />
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Commission Rate" value={shop.commissionRate != null ? `${shop.commissionRate}%` : 'N/A'} />
              </Grid>
            </Grid>
          </Grid>

          {/* Verification & Tier */}
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
              <VerifiedUser sx={{ fontSize: 18 }} />
              Status & Verification
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={shop.status}
                    size="small"
                    sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 12 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                    Verified
                  </Typography>
                  <Chip
                    label={shop.isVerified ? 'Yes' : 'No'}
                    size="small"
                    sx={{
                      bgcolor: shop.isVerified
                        ? theme.palette.custom.status.success.light
                        : theme.palette.custom.neutral[100],
                      color: shop.isVerified
                        ? theme.palette.custom.status.success.main
                        : theme.palette.custom.neutral[500],
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Timestamps */}
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
              <AccessTime sx={{ fontSize: 18 }} />
              Timestamps
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoRow label="Joined At" value={formatDate(shop.joinedAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoRow label="Created At" value={formatDate(shop.createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoRow label="Updated At" value={formatDate(shop.updatedAt)} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShopDashboardPage;
