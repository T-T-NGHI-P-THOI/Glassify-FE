import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip } from '@mui/material';
import { AttachMoney, AccountBalance, TrendingDown, Savings } from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import {
  adminAnalyticsApi,
  type FinanceSummaryResponse,
  type OrderFunnelResponse,
  type TrendParams,
} from '@/api/admin-analytics-api';
import {
  buildLineOption, buildBarOption, buildDonutOption, buildFunnelOption,
  fmtVND, fmtVNDShort,
} from '@/utils/adminChart';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const today = new Date().toISOString().split('T')[0];
const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

const FinanceAnalyticsPage = () => {
  const [summary, setSummary] = useState<FinanceSummaryResponse | null>(null);
  const [funnel, setFunnel] = useState<OrderFunnelResponse | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<object | null>(null);
  const [incomeOutcome, setIncomeOutcome] = useState<object | null>(null);
  const [funnelOption, setFunnelOption] = useState<object | null>(null);
  const [paymentPie, setPaymentPie] = useState<object | null>(null);
  const [params, setParams] = useState<TrendParams>({ period: 'MONTHLY', from: defaultFrom, to: today });
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      adminAnalyticsApi.getFinanceSummary().then(setSummary),
    ]).finally(() => setLoading(false));
  }, []);

  const loadCharts = useCallback((p: TrendParams) => {
    setChartLoading(true);
    Promise.allSettled([
      adminAnalyticsApi.getRevenueTrend(p).then((d) => setRevenueTrend(buildLineOption(d.labels, d.series, fmtVNDShort))),
      adminAnalyticsApi.getIncomeOutcome(p).then((d) => setIncomeOutcome(buildBarOption(d.labels, d.series, fmtVNDShort))),
      adminAnalyticsApi.getOrderFunnel(p.from, p.to).then((d) => {
        setFunnel(d);
        setFunnelOption(buildFunnelOption([
          { name: 'Created', value: d.created },
          { name: 'Paid', value: d.paid },
          { name: 'Delivered', value: d.delivered },
          { name: 'Returned', value: d.returned },
          { name: 'Refunded', value: d.refunded },
        ]));
      }),
      adminAnalyticsApi.getPaymentMethods(p.from, p.to).then((d) =>
        setPaymentPie(buildDonutOption(Object.entries(d).map(([k, v]) => ({ name: k, value: v as number }))))
      ),
    ]).finally(() => setChartLoading(false));
  }, []);

  useEffect(() => { loadCharts(params); }, [params, loadCharts]);

  const kpiCards = summary ? [
    {
      icon: <AttachMoney sx={{ color: '#EE4D2D', fontSize: 22 }} />,
      label: 'GMV (All Time)', value: fmtVNDShort(summary.gmv.total),
      subValue: `MTD: ${fmtVNDShort(summary.gmv.thisMonth)}`,
      growth: summary.gmv.growthRate, bgColor: '#fce4ec',
    },
    {
      icon: <AccountBalance sx={{ color: '#1565c0', fontSize: 22 }} />,
      label: 'Platform Revenue (MTD)', value: fmtVNDShort(summary.platformRevenue.thisMonth),
      subValue: `Commission: ${fmtVNDShort(summary.platformRevenue.commissionOnly)}`,
      bgColor: '#e3f2fd',
    },
    {
      icon: <TrendingDown sx={{ color: '#c62828', fontSize: 22 }} />,
      label: 'Total Refunds (MTD)', value: fmtVNDShort(summary.refunds.totalAmount),
      subValue: `Refund rate: ${summary.refunds.refundRate?.toFixed(1)}%`,
      bgColor: '#ffebee',
    },
    {
      icon: <Savings sx={{ color: '#6a1b9a', fontSize: 22 }} />,
      label: 'Escrow Held', value: fmtVNDShort(summary.escrow.currentHeld),
      subValue: `Released MTD: ${fmtVNDShort(summary.escrow.releasedThisMonth)}`,
      bgColor: '#f3e5f5',
    },
  ] : [];

  return (
    <AdminLayout activeMenu={PAGE_ENDPOINTS.ADMIN.ANALYTICS.FINANCE}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Finance Dashboard</Typography>
          <Typography sx={{ fontSize: 13, color: '#888' }}>GMV, revenue, refunds, escrow, and payment breakdown</Typography>
        </Box>
        <DateRangeFilter params={params} onChange={setParams} onExport={() => adminAnalyticsApi.exportFinance(params.from, params.to)} />
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {kpiCards.map((c, i) => <KpiCard key={i} {...c} loading={loading} />)}
      </Box>

      {/* Withdrawal quick stat */}
      {summary && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', mb: 3, display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: '#888', mb: 0.25 }}>Pending Withdrawals</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#f57f17' }}>
              {summary.shopWithdrawals.pendingCount} requests
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: '#888', mb: 0.25 }}>Pending Amount</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#e65100' }}>
              {fmtVNDShort(summary.shopWithdrawals.pendingAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: '#888', mb: 0.25 }}>Completed This Month</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#2e7d32' }}>
              {fmtVNDShort(summary.shopWithdrawals.completedThisMonth)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: '#888', mb: 0.25 }}>Top-Ups This Month</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1565c0' }}>
              {fmtVNDShort(summary.topUps.thisMonth)}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Revenue Trend */}
      <Box sx={{ mb: 3 }}>
        <ChartCard
          title="Revenue Trend"
          subtitle="GMV / Commission / Refunds / Top-ups over time"
          option={revenueTrend || {}}
          loading={chartLoading || !revenueTrend}
          height={300}
        />
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2, mb: 3 }}>
        <ChartCard
          title="Income vs Outcome"
          subtitle="Commission income vs refund + withdrawal outflow"
          option={incomeOutcome || {}}
          loading={chartLoading || !incomeOutcome}
          height={280}
        />
        <ChartCard
          title="Order Funnel"
          subtitle="Created → Paid → Delivered → Returned"
          option={funnelOption || {}}
          loading={chartLoading || !funnelOption}
          height={280}
        />
        <ChartCard
          title="Payment Methods"
          subtitle="VNPAY vs Wallet"
          option={paymentPie || {}}
          loading={chartLoading || !paymentPie}
          height={280}
        />
      </Box>

      {/* Funnel Numbers Table */}
      {funnel && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Order Lifecycle Numbers</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', p: 2.5, gap: 2 }}>
            {[
              { label: 'Created', value: funnel.created, color: '#1565c0' },
              { label: 'Paid', value: funnel.paid, color: '#2e7d32' },
              { label: 'Delivered', value: funnel.delivered, color: '#1b5e20' },
              { label: 'Returned', value: funnel.returned, color: '#e65100' },
              { label: 'Refunded', value: funnel.refunded, color: '#6a1b9a' },
              { label: 'Cancelled', value: funnel.cancelled, color: '#c62828' },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</Typography>
                <Typography sx={{ fontSize: 12, color: '#888', mt: 0.5 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </AdminLayout>
  );
};

export default FinanceAnalyticsPage;
