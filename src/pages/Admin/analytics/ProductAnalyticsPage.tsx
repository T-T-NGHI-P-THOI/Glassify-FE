import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip } from '@mui/material';
import { Inventory } from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KpiCard } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import {
  adminAnalyticsApi,
  type ProductSummaryResponse,
  type TopSellingProductResponse,
  type TrendParams,
} from '@/api/admin-analytics-api';
import { buildDonutOption, buildHBarOption, fmtVND, fmtVNDShort } from '@/utils/adminChart';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const today = new Date().toISOString().split('T')[0];
const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

const ProductAnalyticsPage = () => {
  const [summary, setSummary] = useState<ProductSummaryResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopSellingProductResponse[]>([]);
  const [statusDonut, setStatusDonut] = useState<object | null>(null);
  const [typeDonut, setTypeDonut] = useState<object | null>(null);
  const [topBarOption, setTopBarOption] = useState<object | null>(null);
  const [params, setParams] = useState<TrendParams>({ period: 'MONTHLY', from: defaultFrom, to: today });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminAnalyticsApi.getProductSummary().then((d) => {
        setSummary(d);
        setStatusDonut(buildDonutOption(
          Object.entries(d.byStatus).map(([k, v]) => ({ name: k, value: v }))
        ));
        setTypeDonut(buildDonutOption(
          Object.entries(d.byType).map(([k, v]) => ({ name: k, value: v }))
        ));
      }),
      adminAnalyticsApi.getTopSellingProducts(10).then((products) => {
        setTopProducts(products);
        const reversed = [...products].reverse();
        setTopBarOption(buildHBarOption(
          reversed.map((p) => p.name.length > 25 ? p.name.substring(0, 25) + '…' : p.name),
          reversed.map((p) => p.revenue),
          fmtVNDShort,
        ));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const kpiCards = summary ? [
    { label: 'Total Products', value: summary.total.toLocaleString(), icon: <Inventory sx={{ color: '#00897b', fontSize: 20 }} />, bgColor: '#e0f2f1' },
    { label: 'Active', value: (summary.byStatus['ACTIVE'] ?? 0).toLocaleString(), icon: <Inventory sx={{ color: '#2e7d32', fontSize: 20 }} />, bgColor: '#e8f5e9' },
    { label: 'Pending Approval', value: (summary.byStatus['PENDING'] ?? 0).toLocaleString(), icon: <Inventory sx={{ color: '#f57f17', fontSize: 20 }} />, bgColor: '#fff8e1' },
    { label: 'Inactive', value: (summary.byStatus['INACTIVE'] ?? 0).toLocaleString(), icon: <Inventory sx={{ color: '#757575', fontSize: 20 }} />, bgColor: '#f5f5f5' },
    { label: 'Total Sold Units', value: summary.totalSoldUnits.toLocaleString(), icon: <Inventory sx={{ color: '#1565c0', fontSize: 20 }} />, bgColor: '#e3f2fd' },
  ] : [];

  return (
    <AdminLayout activeMenu={PAGE_ENDPOINTS.ADMIN.ANALYTICS.PRODUCTS}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Product Analytics</Typography>
          <Typography sx={{ fontSize: 13, color: '#888' }}>Product status, type distribution, and top sellers</Typography>
        </Box>
        <DateRangeFilter params={params} onChange={setParams} onExport={() => adminAnalyticsApi.exportProducts()} showPeriod={false} />
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
        {kpiCards.map((c, i) => <KpiCard key={i} {...c} loading={loading} />)}
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 2, mb: 3 }}>
        <ChartCard title="By Status" option={statusDonut || {}} loading={loading || !statusDonut} height={280} />
        <ChartCard title="By Type" option={typeDonut || {}} loading={loading || !typeDonut} height={280} />
        <ChartCard
          title="Top 10 Selling Products"
          subtitle="By revenue platform-wide"
          option={topBarOption || {}}
          loading={loading || !topBarOption}
          height={280}
        />
      </Box>

      {/* Top Products Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Top Selling Products</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                {['#', 'Product', 'Shop', 'SKU', 'Sold', 'Revenue'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {topProducts.map((p, i) => (
                <TableRow key={p.productId} hover>
                  <TableCell sx={{ color: '#aaa', fontWeight: 700, fontSize: 13 }}>{i + 1}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 600, maxWidth: 200 }}>{p.name}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: '#555' }}>{p.shopName}</TableCell>
                  <TableCell><Chip label={p.sku} size="small" sx={{ bgcolor: '#f5f5f5', color: '#555', fontSize: 11 }} /></TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{p.soldCount.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700, color: '#EE4D2D' }}>{fmtVND(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Top Categories Table */}
      {summary?.topCategories && summary.topCategories.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Top Categories</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  {['Category', 'Products', 'Sold'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#888', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.topCategories.map((c) => (
                  <TableRow key={c.categoryId} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{c.productCount.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{c.soldCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </AdminLayout>
  );
};

export default ProductAnalyticsPage;
