import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { ShoppingCart, CheckCircle, Cancel, AssignmentReturn } from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { StatusChip } from '@/components/admin/StatusChip';
import { adminAnalyticsApi, type OrderSummaryResponse, type TrendParams } from '@/api/admin-analytics-api';
import { buildBarOption, fmtVND, fmtVNDShort } from '@/utils/adminChart';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const today = new Date().toISOString().split('T')[0];
const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

const OrderAnalyticsPage = () => {
  const [summary, setSummary] = useState<OrderSummaryResponse | null>(null);
  const [trendOption, setTrendOption] = useState<object | null>(null);
  const [params, setParams] = useState<TrendParams>({ period: 'MONTHLY', from: defaultFrom, to: today });
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    adminAnalyticsApi.getOrderSummary().then(setSummary).finally(() => setLoading(false));
  }, []);

  const loadTrend = useCallback((p: TrendParams) => {
    setTrendLoading(true);
    adminAnalyticsApi.getOrderTrend(p)
      .then((d) => setTrendOption(buildBarOption(d.labels, d.series, undefined, true)))
      .finally(() => setTrendLoading(false));
  }, []);

  useEffect(() => { loadTrend(params); }, [params, loadTrend]);

  const kpiCards = summary ? [
    { label: 'Total Orders', value: summary.total.toLocaleString(), growth: summary.newThisMonth?.growthRate, icon: <ShoppingCart sx={{ color: '#1565c0', fontSize: 20 }} />, bgColor: '#e3f2fd' },
    { label: 'Delivered', value: (summary.byStatus['DELIVERED'] ?? 0).toLocaleString(), icon: <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />, bgColor: '#e8f5e9' },
    { label: 'Cancelled', value: (summary.byStatus['CANCELLED'] ?? 0).toLocaleString(), icon: <Cancel sx={{ color: '#c62828', fontSize: 20 }} />, bgColor: '#ffebee' },
    { label: 'Avg Order Value', value: fmtVNDShort(summary.avgOrderValue), icon: <AssignmentReturn sx={{ color: '#e65100', fontSize: 20 }} />, bgColor: '#fff3e0' },
  ] : [];

  return (
    <AdminLayout activeMenu={PAGE_ENDPOINTS.ADMIN.ANALYTICS.ORDERS}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Order Analytics</Typography>
          <Typography sx={{ fontSize: 13, color: '#888' }}>Volume by status, rates, and AOV</Typography>
        </Box>
        <DateRangeFilter params={params} onChange={setParams}
          onExport={() => adminAnalyticsApi.exportOrders(params.from, params.to)} />
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {kpiCards.map((c, i) => <KpiCard key={i} {...c} loading={loading} />)}
      </Box>

      {/* Metrics Row */}
      {summary && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e5e7eb', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 6 }}>
            <Box>
              <Typography sx={{ fontSize: 12, color: '#888', mb: 0.5 }}>Cancellation Rate</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#c62828' }}>
                {summary.cancellationRate?.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: '#888', mb: 0.5 }}>Return Rate</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#e65100' }}>
                {summary.returnRate?.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: '#888', mb: 0.5 }}>Avg Order Value</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#1565c0' }}>
                {fmtVND(summary.avgOrderValue)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Trend Chart */}
      <Box sx={{ mb: 3 }}>
        <ChartCard
          title="Orders by Status Over Time"
          subtitle="Stacked by order status"
          option={trendOption || {}}
          loading={trendLoading || !trendOption}
          height={320}
        />
      </Box>

      {/* Status Breakdown */}
      {summary && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Order Status Breakdown</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', p: 2.5, gap: 2 }}>
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1.5 }}>
                <StatusChip status={status} />
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{(count as number).toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#888' }}>
                    {((count as number) / summary.total * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </AdminLayout>
  );
};

export default OrderAnalyticsPage;
