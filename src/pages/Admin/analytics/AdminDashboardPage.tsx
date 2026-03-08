import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Skeleton, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Storefront, People, Inventory, AttachMoney, TrendingUp,
  Schedule, ArrowForward,
} from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import {
  adminAnalyticsApi,
  type ShopSummaryResponse,
  type UserSummaryResponse,
  type FinanceSummaryResponse,
  type OrderSummaryResponse,
  type ShopRegistrationSummaryResponse,
  type TrendParams,
} from '@/api/admin-analytics-api';
import { buildLineOption, buildBarOption, fmtVND, fmtVNDShort } from '@/utils/adminChart';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const AdminDashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [shopSummary, setShopSummary] = useState<ShopSummaryResponse | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummaryResponse | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummaryResponse | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummaryResponse | null>(null);
  const [regSummary, setRegSummary] = useState<ShopRegistrationSummaryResponse | null>(null);
  const [revenueTrendData, setRevenueTrendData] = useState<ReturnType<typeof buildLineOption> | null>(null);
  const [shopUserTrendData, setShopUserTrendData] = useState<ReturnType<typeof buildBarOption> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trendParams: TrendParams = { period: 'MONTHLY' };
    Promise.allSettled([
      adminAnalyticsApi.getShopSummary().then(setShopSummary),
      adminAnalyticsApi.getUserSummary().then(setUserSummary),
      adminAnalyticsApi.getFinanceSummary().then(setFinanceSummary),
      adminAnalyticsApi.getOrderSummary().then(setOrderSummary),
      adminAnalyticsApi.getShopRegistrationSummary().then(setRegSummary),
      adminAnalyticsApi.getRevenueTrend(trendParams).then((d) =>
        setRevenueTrendData(buildLineOption(d.labels, d.series, fmtVNDShort))
      ),
      Promise.all([
        adminAnalyticsApi.getShopTrend(trendParams),
        adminAnalyticsApi.getUserTrend(trendParams),
      ]).then(([shopT, userT]) => {
        const combined: Record<string, (number | null)[]> = {};
        if (shopT.series['registered']) combined['New Shops'] = shopT.series['registered'];
        if (userT.series['registered']) combined['New Users'] = userT.series['registered'];
        setShopUserTrendData(buildBarOption(shopT.labels, combined));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    {
      icon: <Storefront sx={{ color: theme.palette.custom.status.info.main, fontSize: 22 }} />,
      label: 'Total Shops',
      value: shopSummary ? shopSummary.total.toLocaleString() : '—',
      subValue: shopSummary ? `${shopSummary.byStatus['ACTIVE'] ?? 0} active` : undefined,
      growth: shopSummary?.newThisMonth?.growthRate,
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <People sx={{ color: theme.palette.custom.status.purple.main, fontSize: 22 }} />,
      label: 'Total Users',
      value: userSummary ? userSummary.totalUsers.toLocaleString() : '—',
      subValue: userSummary ? `+${userSummary.newThisMonth?.value ?? 0} this month` : undefined,
      growth: userSummary?.newThisMonth?.growthRate,
      bgColor: theme.palette.custom.status.purple.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.teal.main, fontSize: 22 }} />,
      label: 'Total Orders',
      value: orderSummary ? orderSummary.total.toLocaleString() : '—',
      subValue: orderSummary ? `AOV: ${fmtVND(orderSummary.avgOrderValue)}` : undefined,
      growth: orderSummary?.newThisMonth?.growthRate,
      bgColor: theme.palette.custom.status.teal.light,
    },
    {
      icon: <AttachMoney sx={{ color: theme.palette.custom.status.warning.main, fontSize: 22 }} />,
      label: 'Platform Revenue (MTD)',
      value: financeSummary ? fmtVNDShort(financeSummary.platformRevenue.thisMonth) : '—',
      subValue: financeSummary ? `GMV: ${fmtVNDShort(financeSummary.gmv.thisMonth)}` : undefined,
      growth: financeSummary?.gmv?.growthRate,
      bgColor: theme.palette.custom.status.warning.light,
    },
  ];

  return (
    <AdminLayout activeMenu={PAGE_ENDPOINTS.DASHBOARD}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>
          Admin Dashboard
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#888' }}>
          Platform-wide overview — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {kpiCards.map((card, i) => (
          <KpiCard key={i} {...card} loading={loading} />
        ))}
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 2, mb: 3 }}>
        <ChartCard
          title="GMV vs Commission"
          subtitle="Last 12 months"
          option={revenueTrendData || {}}
          loading={loading || !revenueTrendData}
          height={280}
        />
        <ChartCard
          title="New Shops & Users"
          subtitle="Last 6 months"
          option={shopUserTrendData || {}}
          loading={loading || !shopUserTrendData}
          height={280}
        />
      </Box>

      {/* Bottom Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
        {/* Pending Approvals Widget */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Shop Approvals</Typography>
            <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL)}
              sx={{ textTransform: 'none', fontSize: 12, color: '#EE4D2D' }}>
              Review
            </Button>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {loading ? (
              <>
                <Skeleton height={60} sx={{ mb: 1 }} />
                <Skeleton height={60} />
              </>
            ) : regSummary ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Pending Review', value: regSummary.pending, color: '#f57f17', bg: '#fff8e1', icon: <Schedule sx={{ fontSize: 18, color: '#f57f17' }} /> },
                  { label: 'Approved Today', value: regSummary.approvedToday, color: '#2e7d32', bg: '#e8f5e9', icon: <TrendingUp sx={{ fontSize: 18, color: '#2e7d32' }} /> },
                  { label: 'Rejected Today', value: regSummary.rejectedToday, color: '#c62828', bg: '#ffebee', icon: <Storefront sx={{ fontSize: 18, color: '#c62828' }} /> },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: item.bg, borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.icon}
                      <Typography sx={{ fontSize: 13, color: '#444' }}>{item.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
        </Paper>

        {/* Order Status */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Order Status</Typography>
            <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ANALYTICS.ORDERS)}
              sx={{ textTransform: 'none', fontSize: 12, color: '#EE4D2D' }}>
              Details
            </Button>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {loading ? <Skeleton height={200} /> : orderSummary && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(orderSummary.byStatus).slice(0, 5).map(([status, count]) => (
                  <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, color: '#555' }}>{status}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{(count as number).toLocaleString()}</Typography>
                      <Chip label={`${((count as number) / orderSummary.total * 100).toFixed(0)}%`} size="small"
                        sx={{ height: 18, fontSize: 10, bgcolor: '#f5f5f5', color: '#666' }} />
                    </Box>
                  </Box>
                ))}
                <Box sx={{ mt: 1, pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, color: '#888' }}>Cancellation Rate</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#c62828' }}>{orderSummary.cancellationRate?.toFixed(1)}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: '#888' }}>Return Rate</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#e65100' }}>{orderSummary.returnRate?.toFixed(1)}%</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Finance Quick Stats */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Finance</Typography>
            <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ANALYTICS.FINANCE)}
              sx={{ textTransform: 'none', fontSize: 12, color: '#EE4D2D' }}>
              Details
            </Button>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {loading ? <Skeleton height={200} /> : financeSummary && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'GMV (All Time)', value: fmtVNDShort(financeSummary.gmv.total) },
                  { label: 'Commission Earned', value: fmtVNDShort(financeSummary.platformRevenue.commissionOnly) },
                  { label: 'Escrow Held', value: fmtVNDShort(financeSummary.escrow.currentHeld) },
                  { label: 'Pending Withdrawals', value: `${financeSummary.shopWithdrawals.pendingCount} (${fmtVNDShort(financeSummary.shopWithdrawals.pendingAmount)})` },
                  { label: 'Total Refunds', value: fmtVNDShort(financeSummary.refunds.totalAmount) },
                  { label: 'Refund Rate', value: `${financeSummary.refunds.refundRate?.toFixed(1)}%` },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, color: '#888' }}>{row.label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{row.value}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Analytics Links */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5, mt: 2 }}>
        {[
          { label: 'Shop Analytics', path: PAGE_ENDPOINTS.ADMIN.ANALYTICS.SHOPS, color: '#1a73e8' },
          { label: 'User Analytics', path: PAGE_ENDPOINTS.ADMIN.ANALYTICS.USERS, color: '#9c27b0' },
          { label: 'Product Analytics', path: PAGE_ENDPOINTS.ADMIN.ANALYTICS.PRODUCTS, color: '#00897b' },
          { label: 'Finance Dashboard', path: PAGE_ENDPOINTS.ADMIN.ANALYTICS.FINANCE, color: '#EE4D2D' },
          { label: 'Order Analytics', path: PAGE_ENDPOINTS.ADMIN.ANALYTICS.ORDERS, color: '#e65100' },
        ].map((item) => (
          <Button key={item.label} variant="outlined" fullWidth onClick={() => navigate(item.path)}
            sx={{ textTransform: 'none', fontSize: 13, borderColor: item.color, color: item.color, py: 1,
              '&:hover': { bgcolor: item.color + '10' } }}>
            {item.label}
          </Button>
        ))}
      </Box>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
