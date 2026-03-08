import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { People, PersonOutline, Store } from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { adminAnalyticsApi, type UserSummaryResponse, type TrendParams } from '@/api/admin-analytics-api';
import { buildLineOption, buildDonutOption } from '@/utils/adminChart';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const today = new Date().toISOString().split('T')[0];
const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

const UserAnalyticsPage = () => {
  const [summary, setSummary] = useState<UserSummaryResponse | null>(null);
  const [trendOption, setTrendOption] = useState<object | null>(null);
  const [donutOption, setDonutOption] = useState<object | null>(null);
  const [shopOwnerDonut, setShopOwnerDonut] = useState<object | null>(null);
  const [params, setParams] = useState<TrendParams>({ period: 'MONTHLY', from: defaultFrom, to: today });
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    adminAnalyticsApi.getUserSummary().then((d) => {
      setSummary(d);
      setDonutOption(buildDonutOption([
        { name: 'Active', value: d.activeUsers },
        { name: 'Inactive', value: d.inactiveUsers },
      ]));
      setShopOwnerDonut(buildDonutOption([
        { name: 'Active Shop', value: d.shopOwners.withActiveShop },
        { name: 'Inactive Shop', value: d.shopOwners.withInactiveShop },
        { name: 'Pending Shop', value: d.shopOwners.withPendingShop },
        { name: 'Suspended Shop', value: d.shopOwners.withSuspendedShop },
      ]));
    }).finally(() => setLoading(false));
  }, []);

  const loadTrend = useCallback((p: TrendParams) => {
    setTrendLoading(true);
    adminAnalyticsApi.getUserTrend(p)
      .then((d) => setTrendOption(buildLineOption(d.labels, d.series)))
      .finally(() => setTrendLoading(false));
  }, []);

  useEffect(() => { loadTrend(params); }, [params, loadTrend]);

  const kpiCards = summary ? [
    { label: 'Total Users', value: summary.totalUsers.toLocaleString(), growth: summary.newThisMonth?.growthRate, icon: <People sx={{ color: '#7b1fa2', fontSize: 20 }} />, bgColor: '#f3e5f5' },
    { label: 'Active Users', value: summary.activeUsers.toLocaleString(), icon: <PersonOutline sx={{ color: '#2e7d32', fontSize: 20 }} />, bgColor: '#e8f5e9' },
    { label: 'Inactive Users', value: summary.inactiveUsers.toLocaleString(), icon: <PersonOutline sx={{ color: '#757575', fontSize: 20 }} />, bgColor: '#f5f5f5' },
    { label: 'Shop Owners', value: summary.shopOwners.total.toLocaleString(), icon: <Store sx={{ color: '#1565c0', fontSize: 20 }} />, bgColor: '#e3f2fd' },
  ] : [];

  return (
    <AdminLayout activeMenu={PAGE_ENDPOINTS.ADMIN.ANALYTICS.USERS}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>User Analytics</Typography>
          <Typography sx={{ fontSize: 13, color: '#888' }}>Registrations, activity distribution, and shop owner breakdown</Typography>
        </Box>
        <DateRangeFilter params={params} onChange={setParams} onExport={() => adminAnalyticsApi.exportUsers()} />
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {kpiCards.map((c, i) => <KpiCard key={i} {...c} loading={loading} />)}
      </Box>

      {/* Shop Owner Breakdown */}
      {summary && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', mb: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111', mb: 2 }}>Shop Owner Breakdown</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {[
              { label: 'Active Shop', value: summary.shopOwners.withActiveShop, color: '#2e7d32', bg: '#e8f5e9' },
              { label: 'Inactive Shop', value: summary.shopOwners.withInactiveShop, color: '#757575', bg: '#f5f5f5' },
              { label: 'Pending Shop', value: summary.shopOwners.withPendingShop, color: '#f57f17', bg: '#fff8e1' },
              { label: 'Suspended Shop', value: summary.shopOwners.withSuspendedShop, color: '#c62828', bg: '#ffebee' },
            ].map((item) => (
              <Box key={item.label} sx={{ p: 2, bgcolor: item.bg, borderRadius: 1.5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</Typography>
                <Typography sx={{ fontSize: 12, color: '#666', mt: 0.5 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: 2 }}>
        <ChartCard
          title="User Registrations Over Time"
          option={trendOption || {}}
          loading={trendLoading || !trendOption}
          height={300}
        />
        <ChartCard title="User Status" option={donutOption || {}} loading={loading || !donutOption} height={300} />
        <ChartCard title="Shop Owner Types" option={shopOwnerDonut || {}} loading={loading || !shopOwnerDonut} height={300} />
      </Box>
    </AdminLayout>
  );
};

export default UserAnalyticsPage;
