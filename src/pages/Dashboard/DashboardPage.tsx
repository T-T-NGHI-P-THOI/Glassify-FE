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
  Tab,
  Tabs,
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
  Visibility,
  CheckCircle,
  Schedule,
  Store,
  TrendingUp,
  AssignmentReturn,
} from '@mui/icons-material';
import {
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
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi, type AdminOverviewStats, type AdminOrderResponse, type AdminRefundResponse } from '@/api/adminApi';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import type { AdminShopItem, ShopRequest } from '@/models/Shop';
import { RETURN_REASON_LABELS, type ReturnReason } from '@/models/Refund';


const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

// Abbreviated — only for non-revenue stat cards
const formatCount = (n: number) => n.toLocaleString('vi-VN');

// Tooltip formatter for recharts
const chartTooltipFormatter = (value: number) => [formatVND(value), ''];

const DashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [activeTab, setActiveTab] = useState(0);
  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ShopRequest[]>([]);
  const [refundRequests, setRefundRequests] = useState<AdminRefundResponse[]>([]);
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrderResponse[]>([]);

  useEffect(() => {
    adminApi.getShops().then((res) => { if (res.data) setShops(res.data); }).catch(() => {});
    adminApi.getShopRequests('PENDING').then((res) => { if (res.data) setPendingRequests(res.data.requests); }).catch(() => {});
    adminApi.getRefunds('REQUESTED', 0, 3).then((res) => { if (res.data) setRefundRequests(res.data.content); }).catch(() => {});
    adminApi.getOverviewStats().then((res) => { if (res.data) setOverviewStats(res.data); }).catch(() => {});
    adminApi.getOrders(undefined, 0, 5).then((res) => { if (res.data) setRecentOrders(res.data.content); }).catch(() => {});
  }, []);

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.status === 'ACTIVE').length;
  const topShops = [...shops].sort((a, b) => (b.totalOrders ?? 0) - (a.totalOrders ?? 0)).slice(0, 5);
  const pendingRefundCount = refundRequests.length;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const getOrderStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED': return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'SHIPPING': return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'PROCESSING': return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'PENDING': return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] };
      default: return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  // Revenue chart data
  const gross = overviewStats?.totalGrossRevenue ?? 0;
  const subsidy = overviewStats?.totalShippingSubsidy ?? 0;
  const net = overviewStats?.netAfterShippingSubsidy ?? 0;

  const barChartData = [
    { name: 'Gross Revenue', value: gross },
    { name: 'Net After Subsidy', value: net },
    { name: 'Shipping Subsidy', value: subsidy },
  ];

  const pieChartData = gross > 0 ? [
    { name: 'Net After Subsidy', value: net },
    { name: 'Shipping Subsidy', value: subsidy },
  ] : [];

  const PIE_COLORS = [theme.palette.custom.status.success.main, theme.palette.custom.status.error.main];
  const BAR_COLORS = [theme.palette.custom.status.info.main, theme.palette.custom.status.success.main, theme.palette.custom.status.error.main];

  const mainStats = [
    { icon: <Storefront sx={{ color: theme.palette.custom.status.info.main }} />, label: 'Total Shops', value: formatCount(totalShops), subValue: `${activeShops} active`, bgColor: theme.palette.custom.status.info.light },
    { icon: <ShoppingCart sx={{ color: theme.palette.custom.status.success.main }} />, label: 'Total Orders', value: formatCount(overviewStats?.totalOrders ?? 0), subValue: null, bgColor: theme.palette.custom.status.success.light },
    { icon: <AttachMoney sx={{ color: theme.palette.custom.status.warning.main }} />, label: 'Total Revenue', value: formatVND(overviewStats?.totalRevenue ?? 0), subValue: null, bgColor: theme.palette.custom.status.warning.light },
    { icon: <People sx={{ color: theme.palette.custom.status.purple.main }} />, label: 'Total Customers', value: formatCount(overviewStats?.totalCustomers ?? 0), subValue: null, bgColor: theme.palette.custom.status.purple.light },
  ];

  const secondaryStats = [
    { icon: <Inventory sx={{ color: theme.palette.custom.status.teal.main }} />, label: 'Total Products', value: formatCount(overviewStats?.totalProducts ?? 0), bgColor: theme.palette.custom.status.teal.light },
    { icon: <LocalShipping sx={{ color: theme.palette.custom.status.pink.main }} />, label: 'Total Deliveries', value: formatCount(overviewStats?.totalDeliveries ?? 0), bgColor: theme.palette.custom.status.pink.light },
  ];

  const revenueStatCards = [
    { label: 'Gross Revenue (Delivered)', value: formatVND(gross), desc: 'Product + shipping collected from customers', color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light },
    { label: 'Shipping Subsidy', value: formatVND(subsidy), desc: 'Platform shipping cost subsidised for customers', color: theme.palette.custom.status.error.main, bg: theme.palette.custom.status.error.light },
    { label: 'Net After Subsidy', value: formatVND(net), desc: 'Gross revenue minus shipping subsidy', color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.DASHBOARD} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header + Tabs */}
        <Box sx={{ px: 4, pt: 4, pb: 0, bgcolor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
              Dashboard
            </Typography>
            <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
              Tổng quan hoạt động kinh doanh của hệ thống Glassify
            </Typography>
          </Box>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: 14 } }}
          >
            <Tab label="Overview" />
            <Tab label="Revenue & Shipping" icon={<TrendingUp sx={{ fontSize: 16 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, p: 4 }}>
          {/* ═══════════════ TAB 0 — OVERVIEW ═══════════════ */}
          {activeTab === 0 && (
            <>
              {/* Main Stats */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                {mainStats.map((stat, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {stat.icon}
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500, mb: 0.5 }}>{stat.label}</Typography>
                    <Typography sx={{ fontSize: stat.label === 'Total Revenue' ? 20 : 28, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5, wordBreak: 'break-all' }}>
                      {stat.value}
                    </Typography>
                    {stat.subValue && (
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{stat.subValue}</Typography>
                    )}
                  </Paper>
                ))}
              </Box>

              {/* Secondary Stats */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                {secondaryStats.map((stat, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {stat.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>{stat.label}</Typography>
                      <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{stat.value}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* Main Content Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
                {/* Left */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Recent Orders */}
                  <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>Recent Orders</Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ORDERS)}>View All</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                            {['ORDER ID', 'CUSTOMER', 'EMAIL', 'AMOUNT', 'STATUS', ''].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentOrders.map((order) => {
                            const statusStyle = getOrderStatusStyle(order.status);
                            return (
                              <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ORDER_DETAIL.replace(':id', order.id))}>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.pink.main }}>#{order.orderNumber}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 28, height: 28 }}>{order.customerFullName?.[0] ?? '?'}</Avatar>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>{order.customerFullName}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell><Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{order.customerEmail}</Typography></TableCell>
                                <TableCell><Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{formatVND(order.totalAmount)}</Typography></TableCell>
                                <TableCell>
                                  <Chip label={order.status} size="small" sx={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 11 }} />
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton size="small"><Visibility sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /></IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* Top Shops */}
                  <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>Top Performing Shops</Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.SHOPS)}>View All</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                            {['#', 'SHOP', 'ORDERS', 'PRODUCTS', 'RATING'].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 12 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topShops.map((shop, index) => (
                            <TableRow key={shop.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.SHOP_DETAIL.replace(':id', shop.id))}>
                              <TableCell><Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[400] }}>{index + 1}</Typography></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar variant="rounded" src={shop.logoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: theme.palette.custom.neutral[100] }}><Store sx={{ fontSize: 18 }} /></Avatar>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{shop.shopName}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell><Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>{shop.totalOrders ?? '—'}</Typography></TableCell>
                              <TableCell><Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>{shop.totalProducts ?? '—'}</Typography></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{shop.avgRating != null ? shop.avgRating.toFixed(1) : '—'}</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>

                {/* Right */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Pending Approvals */}
                  <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>Pending Approvals</Typography>
                        <Chip label={pendingRequests.length} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, backgroundColor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL)}>View All</Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      {pendingRequests.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textAlign: 'center', py: 2 }}>No pending approvals</Typography>
                      ) : (
                        pendingRequests.slice(0, 3).map((req, index) => (
                          <Box key={req.id} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL)} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: index < Math.min(pendingRequests.length, 3) - 1 ? 1.5 : 0, '&:hover': { bgcolor: theme.palette.custom.neutral[50] }, cursor: 'pointer' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{req.shopName}</Typography>
                              <Chip label={req.businessLicense?.businessType ?? '—'} size="small" sx={{ height: 20, fontSize: 10, backgroundColor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }} />
                            </Box>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mb: 1 }}>Owner: {req.userName}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Schedule sx={{ fontSize: 14, color: theme.palette.custom.neutral[400] }} />
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>{formatDate(req.submittedAt)}</Typography>
                            </Box>
                          </Box>
                        ))
                      )}
                    </Box>
                  </Paper>

                  {/* Refund Requests */}
                  <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentReturn sx={{ fontSize: 20, color: theme.palette.custom.status.warning.main }} />
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>Refund Requests</Typography>
                        <Chip label={pendingRefundCount} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600, backgroundColor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.info.main, cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.REFUNDS)}>View All</Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      {refundRequests.length === 0 ? (
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textAlign: 'center', py: 2 }}>No pending refund requests</Typography>
                      ) : (
                        refundRequests.map((request, index) => (
                          <Box
                            key={request.id}
                            onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.REFUND_DETAIL.replace(':id', request.id))}
                            sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: index < refundRequests.length - 1 ? 1.5 : 0, '&:hover': { bgcolor: theme.palette.custom.neutral[50] }, cursor: 'pointer' }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{request.productName}</Typography>
                              <Chip label={request.statusDisplay || 'Requested'} size="small" sx={{ height: 20, fontSize: 10, backgroundColor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }} />
                            </Box>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mb: 0.75 }}>Request #{request.requestNumber}</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mb: 0.75 }}>Shop: {request.shopName}</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mb: 0.75 }}>
                              Reason: {RETURN_REASON_LABELS[request.reason as ReturnReason] ?? request.reason}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>Requested: {formatDate(request.requestedAt)}</Typography>
                          </Box>
                        ))
                      )}
                    </Box>
                  </Paper>

                  {/* Order Status */}
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 3 }}>Order Status Overview</Typography>
                    {(() => {
                      const s = overviewStats;
                      const total = s ? (s.pendingOrders + s.confirmedOrders + s.processingOrders + s.shippedOrders + s.deliveredOrders + s.cancelledOrders) : 0;
                      const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
                      const items = s ? [
                        { label: 'Delivered', count: s.deliveredOrders, color: theme.palette.custom.status.success.main },
                        { label: 'Shipped', count: s.shippedOrders, color: theme.palette.custom.status.info.main },
                        { label: 'Processing', count: s.processingOrders, color: theme.palette.custom.status.warning.main },
                        { label: 'Confirmed', count: s.confirmedOrders, color: theme.palette.custom.status.teal.main },
                        { label: 'Pending', count: s.pendingOrders, color: theme.palette.custom.neutral[400] },
                        { label: 'Cancelled', count: s.cancelledOrders, color: theme.palette.custom.status.error.main },
                      ] : [];
                      return items.map((item, index) => (
                        <Box key={item.label} sx={{ mb: index < items.length - 1 ? 2 : 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>{item.label}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {formatCount(item.count)} <span style={{ color: theme.palette.custom.neutral[400], fontWeight: 400 }}>({pct(item.count)}%)</span>
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct(item.count)} sx={{ height: 7, borderRadius: 4, backgroundColor: theme.palette.custom.neutral[100], '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: item.color } }} />
                        </Box>
                      ));
                    })()}
                  </Paper>

                  {/* Today's Highlights */}
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>Today's Highlights</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { icon: <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />, label: 'Orders Completed', value: overviewStats?.todayCompletedOrders ?? 0, color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light },
                        { icon: <LocalShipping sx={{ fontSize: 20, color: theme.palette.custom.status.info.main }} />, label: 'Shipments Sent', value: overviewStats?.todayShipmentsSent ?? 0, color: theme.palette.custom.status.info.main, bg: theme.palette.custom.status.info.light },
                        { icon: <People sx={{ fontSize: 20, color: theme.palette.custom.status.purple.main }} />, label: 'New Customers', value: overviewStats?.todayNewCustomers ?? 0, color: theme.palette.custom.status.purple.main, bg: theme.palette.custom.status.purple.light },
                      ].map((item) => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, bgcolor: item.bg }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.icon}
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>{item.label}</Typography>
                          </Box>
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: item.color }}>{formatCount(item.value)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </>
          )}

          {/* ═══════════════ TAB 1 — REVENUE & SHIPPING ═══════════════ */}
          {activeTab === 1 && (
            <>
              {/* 3 stat cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 4 }}>
                {revenueStatCards.map((item) => (
                  <Paper key={item.label} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                    <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: 1, bgcolor: item.bg, mb: 1.5 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5, wordBreak: 'break-all' }}>
                      {item.value}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{item.desc}</Typography>
                  </Paper>
                ))}
              </Box>

              {/* Charts row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 3 }}>
                {/* Bar chart */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>Revenue Comparison</Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mb: 3 }}>Gross revenue, net amount and shipping subsidy</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData} barCategoryGap="40%" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.custom.border.light} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.custom.neutral[500] }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: theme.palette.custom.neutral[400] }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : String(v)}
                      />
                      <Tooltip formatter={chartTooltipFormatter} contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.custom.border.light}`, fontSize: 13 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {barChartData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>

                {/* Pie chart */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>Revenue Breakdown</Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mb: 2 }}>Net vs Shipping Subsidy share of Gross</Typography>
                  {gross === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>No data available</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={chartTooltipFormatter} contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.custom.border.light}`, fontSize: 13 }} />
                        <Legend
                          formatter={(value) => <span style={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>{value}</span>}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {/* Percentage breakdown */}
                  {gross > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[0] }} />
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>Net After Subsidy</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                          {((net / gross) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[1] }} />
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>Shipping Subsidy</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                          {((subsidy / gross) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
