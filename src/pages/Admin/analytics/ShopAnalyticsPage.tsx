import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Button, Dialog, DialogTitle, DialogContent,
  IconButton, Chip, Skeleton,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';
import { Storefront } from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { StatusChip } from '@/components/admin/StatusChip';
import {
  adminAnalyticsApi,
  type ShopSummaryResponse,
  type ShopDetailAnalyticsResponse,
  type TrendParams,
} from '@/api/admin-analytics-api';
import { buildLineOption, buildDonutOption, fmtVNDShort, fmtVND } from '@/utils/adminChart';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const today = new Date().toISOString().split('T')[0];
const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

const ShopAnalyticsPage = () => {
  const [summary, setSummary] = useState<ShopSummaryResponse | null>(null);
  const [trendOption, setTrendOption] = useState<object | null>(null);
  const [donutOption, setDonutOption] = useState<object | null>(null);
  const [params, setParams] = useState<TrendParams>({ period: 'MONTHLY', from: defaultFrom, to: today });
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [detailShopId, setDetailShopId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ShopDetailAnalyticsResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    adminAnalyticsApi.getShopSummary().then((d) => {
      setSummary(d);
      setDonutOption(buildDonutOption(
        Object.entries(d.byStatus).map(([k, v]) => ({ name: k, value: v }))
      ));
    }).finally(() => setLoading(false));
  }, []);

  const loadTrend = useCallback((p: TrendParams) => {
    setTrendLoading(true);
    adminAnalyticsApi.getShopTrend(p).then((d) =>
      setTrendOption(buildLineOption(d.labels, d.series))
    ).finally(() => setTrendLoading(false));
  }, []);

  useEffect(() => { loadTrend(params); }, [params, loadTrend]);

  const openDetail = (shopId: string) => {
    setDetailShopId(shopId);
    setDetailLoading(true);
    adminAnalyticsApi.getShopDetail(shopId).then(setDetail).finally(() => setDetailLoading(false));
  };

  const kpiCards = summary ? [
    { label: 'Total Shops', value: summary.total.toLocaleString(), growth: summary.newThisMonth?.growthRate, bgColor: '#e3f2fd' },
    { label: 'Active', value: (summary.byStatus['ACTIVE'] ?? 0).toLocaleString(), bgColor: '#e8f5e9' },
    { label: 'Pending Approval', value: summary.pendingApproval.toLocaleString(), bgColor: '#fff8e1' },
    { label: 'Suspended', value: (summary.byStatus['SUSPENDED'] ?? 0).toLocaleString(), bgColor: '#ffebee' },
    { label: 'Inactive', value: (summary.byStatus['INACTIVE'] ?? 0).toLocaleString(), bgColor: '#f5f5f5' },
  ] : [];

  return (
    <AdminLayout activeMenu={PAGE_ENDPOINTS.ADMIN.ANALYTICS.SHOPS}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Shop Analytics</Typography>
          <Typography sx={{ fontSize: 13, color: '#888' }}>Registration, status distribution, and registration trend</Typography>
        </Box>
        <DateRangeFilter
          params={params}
          onChange={setParams}
          onExport={() => adminAnalyticsApi.exportShops(params.from, params.to)}
        />
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <KpiCard key={i} icon={<Storefront />} label="" value="" loading />)
          : kpiCards.map((c, i) => (
            <KpiCard key={i} icon={<Storefront sx={{ color: '#1a73e8', fontSize: 20 }} />} {...c} />
          ))}
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 2, mb: 3 }}>
        <ChartCard
          title="Shop Registrations Over Time"
          subtitle="Registered / Approved / Rejected"
          option={trendOption || {}}
          loading={trendLoading || !trendOption}
          height={280}
        />
        <ChartCard
          title="Shop Status Distribution"
          option={donutOption || {}}
          loading={loading || !donutOption}
          height={280}
        />
      </Box>

      {/* Pending Registrations Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
            Pending Registration Requests
            {summary && <Chip label={summary.pendingApproval} size="small" sx={{ ml: 1, bgcolor: '#fff8e1', color: '#f57f17', fontWeight: 700, fontSize: 12 }} />}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                {['Shop', 'Owner', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#aaa', fontSize: 13 }}>
                    Use the Shop Approval page to review pending requests
                    <Button size="small" sx={{ ml: 1 }} href={PAGE_ENDPOINTS.ADMIN.SHOP_APPROVAL}>Go to Approvals</Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Shop Detail Dialog */}
      <Dialog open={!!detailShopId} onClose={() => { setDetailShopId(null); setDetail(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            {detail?.shopInfo?.shopName || 'Shop Detail'}
          </Typography>
          <IconButton onClick={() => { setDetailShopId(null); setDetail(null); }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Skeleton variant="rectangular" height={400} />
          ) : detail && (
            <Box>
              {/* Shop Info */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                <StatusChip status={detail.shopInfo.status} />
                <Chip label={`Tier: ${detail.shopInfo.tier || 'N/A'}`} size="small" />
                <Chip label={`Commission: ${detail.shopInfo.commissionRate ?? 0}%`} size="small" />
                {detail.shopInfo.isVerified && <Chip label="Verified" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />}
              </Box>

              {/* Stat Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                {[
                  { label: 'Total Products', value: detail.products.total.toLocaleString() },
                  { label: 'Active Products', value: detail.products.active.toLocaleString() },
                  { label: 'Pending Approval', value: detail.products.pendingApproval.toLocaleString() },
                  { label: 'Total Orders', value: detail.orders.total.toLocaleString() },
                  { label: 'Total GMV', value: fmtVNDShort(detail.revenue.totalGmv) },
                  { label: 'Commission Earned', value: fmtVNDShort(detail.revenue.commissionEarned) },
                ].map((s) => (
                  <Box key={s.label} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1.5 }}>
                    <Typography sx={{ fontSize: 11, color: '#888', mb: 0.5 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{s.value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Wallet */}
              <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5 }}>Wallet</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                {[
                  { label: 'Available', value: fmtVND(detail.wallet.available), color: '#2e7d32' },
                  { label: 'Pending', value: fmtVND(detail.wallet.pending), color: '#f57f17' },
                  { label: 'Frozen', value: fmtVND(detail.wallet.frozen), color: '#1565c0' },
                ].map((w) => (
                  <Box key={w.label} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1.5 }}>
                    <Typography sx={{ fontSize: 11, color: '#888', mb: 0.5 }}>{w.label}</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: w.color }}>{w.value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Badges */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip label={`Return Rate: ${detail.returnRate?.toFixed(1) ?? 0}%`}
                  sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />
                <Chip label={`Avg Rating: ${detail.avgRating?.toFixed(1) ?? '—'} ★`}
                  sx={{ bgcolor: '#fff8e1', color: '#f57f17', fontWeight: 600 }} />
              </Box>

              {/* Top Products */}
              {detail.topProducts?.length > 0 && (
                <>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5 }}>Top 5 Products by Revenue</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          {['Product', 'Sold', 'Revenue'].map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.topProducts.map((p) => (
                          <TableRow key={p.productId}>
                            <TableCell sx={{ fontSize: 13 }}>{p.name}</TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{p.soldCount.toLocaleString()}</TableCell>
                            <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{fmtVND(p.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

// Export helper so other pages can open the detail dialog
export { ShopAnalyticsPage as default, type ShopDetailAnalyticsResponse };
