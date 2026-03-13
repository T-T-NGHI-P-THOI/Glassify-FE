import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  LocationOn,
  Search,
  Inventory,
  Star,
  Verified,
  Storefront,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import type { AdminShopItem } from '@/models/Shop';
import { toast } from 'react-toastify';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const ShopTrackingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getShops();
      if (response.data) {
        setShops(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const filteredShops = shops.filter((s) =>
    s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.shopCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.ownerName ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = shops.filter((s) => s.status === 'ACTIVE').length;
  const verifiedCount = shops.filter((s) => s.isVerified).length;
  const totalProducts = shops.reduce((sum, s) => sum + (s.totalProducts ?? 0), 0);

  const stats = [
    {
      icon: <Storefront sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Shops',
      value: shops.length.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <Store sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Active Shops',
      value: activeCount.toLocaleString(),
      bgColor: theme.palette.custom.status.success.light,
    },
    {
      icon: <Verified sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'Verified Shops',
      value: verifiedCount.toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Total Products',
      value: totalProducts.toLocaleString(),
      bgColor: theme.palette.custom.status.warning.light,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'INACTIVE':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      case 'PENDING':
      case 'PENDING_DEACTIVATION':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'SUSPENDED':
      case 'CLOSING':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const handleRowClick = (shop: AdminShopItem) => {
    navigate(
      PAGE_ENDPOINTS.TRACKING.SHOP_DETAIL.replace(':id', shop.id),
      { state: { shop } },
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Shop Management
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            View and manage all shops in the system
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                flex: 1, p: 2.5, borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                display: 'flex', alignItems: 'center', gap: 2,
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: 2, backgroundColor: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Shop List */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
              Shop List
            </Typography>
            <TextField
              placeholder="Search shops..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.custom.neutral[400] }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>SHOP</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>OWNER</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>LOCATION</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>PRODUCTS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>RATING</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>ORDERS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : filteredShops.map((shop) => {
                  const statusColor = getStatusColor(shop.status);
                  return (
                    <TableRow
                      key={shop.id}
                      hover
                      onClick={() => handleRowClick(shop)}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.custom.neutral[50] } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={shop.logoUrl ?? undefined}
                            sx={{ width: 44, height: 44, bgcolor: theme.palette.custom.neutral[100] }}
                          >
                            <Store />
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                {shop.shopName}
                              </Typography>
                              {shop.isVerified && (
                                <Verified sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {shop.shopCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                          {shop.ownerName ?? '—'}
                        </Typography>
                        {shop.ownerEmail && (
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                            {shop.ownerEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 16, color: theme.palette.custom.neutral[400], mt: 0.2 }} />
                          <Box>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[800] }}>
                              {shop.city}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }} noWrap>
                              {shop.address}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Inventory sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {(shop.totalProducts ?? 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {shop.avgRating != null && shop.avgRating > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                              {shop.avgRating.toFixed(1)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                          {(shop.totalOrders ?? 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shop.status}
                          size="small"
                          sx={{ backgroundColor: statusColor.bg, color: statusColor.color, fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && filteredShops.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Store sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }}>
                No shops found
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopTrackingPage;
