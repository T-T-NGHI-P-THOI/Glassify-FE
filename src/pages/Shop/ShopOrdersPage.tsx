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
  IconButton,
  TableSortLabel,
  Checkbox,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LocalShipping,
  FlightTakeoff,
  Inventory,
  PendingActions,
  MoreVert,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import type { ShopOrderResponse } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:        'Pending',
  CONFIRMED:      'Confirmed',
  PROCESSING:     'Processing',
  PICKED_UP:      'Picked Up',
  SHIPPED:        'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:      'Delivered',
  CANCELLED:      'Cancelled',
  RETURNED:       'Returned',
};

const ShopOrdersPage = () => {
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [orderList, setOrderList] = useState<ShopOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  useEffect(() => {
    shopApi.getMyShops().then((res) => {
      const shops = res.data;
      setShop(Array.isArray(shops) && shops.length > 0 ? shops[0] : null);
    }).catch(() => setShop(null));
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!shop) return;
    try {
      setLoading(true);
      const res = await shopApi.getShopOrders(shop.id);
      if (res.data) setOrderList(res.data);
    } catch (err) {
      console.error('Failed to fetch shop orders:', err);
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    const { custom } = theme.palette;
    switch (status) {
      case 'PENDING':
        return { bg: custom.neutral[100], color: custom.neutral[500] };
      case 'CONFIRMED':
        return { bg: theme.palette.warning.light, color: theme.palette.warning.main };
      case 'PROCESSING':
        return { bg: custom.status.indigo.light, color: custom.status.indigo.main };
      case 'PICKED_UP':
        return { bg: custom.status.purple.light, color: custom.status.purple.main };
      case 'SHIPPED':
        return { bg: theme.palette.info.light, color: theme.palette.info.main };
      case 'OUT_FOR_DELIVERY':
        return { bg: custom.status.pink.light, color: custom.status.pink.main };
      case 'DELIVERED':
        return { bg: theme.palette.success.light, color: theme.palette.success.main };
      case 'CANCELLED':
        return { bg: theme.palette.error.light, color: theme.palette.error.main };
      case 'RETURNED':
        return { bg: custom.status.rose.light, color: custom.status.rose.main };
      default:
        return { bg: custom.neutral[100], color: custom.neutral[500] };
    }
  };

  const handleRowClick = (orderId: string) => {
    navigate(PAGE_ENDPOINTS.SHOP.ORDER_DETAIL.replace(':id', orderId));
  };

  const totalOrders = orderList.length;
  const pendingCount = orderList.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const processingCount = orderList.filter(o => o.status === 'PROCESSING' || o.status === 'SHIPPED').length;
  const deliveredCount = orderList.filter(o => o.status === 'DELIVERED').length;

  const stats = [
    {
      icon: <LocalShipping sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <PendingActions sx={{ color: theme.palette.warning.main }} />,
      label: 'Awaiting Action',
      value: pendingCount.toLocaleString(),
      bgColor: theme.palette.warning.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.purple.main }} />,
      label: 'In Progress',
      value: processingCount.toLocaleString(),
      bgColor: theme.palette.custom.status.purple.light,
    },
    {
      icon: <FlightTakeoff sx={{ color: theme.palette.success.main }} />,
      label: 'Delivered',
      value: deliveredCount.toLocaleString(),
      bgColor: theme.palette.success.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.ORDERS}
        shopName={shop?.shopName}
        shopLogo={shop?.logoUrl}
        ownerName={shop?.ownerName || user?.fullName}
        ownerEmail={shop?.ownerEmail || user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
            Order Management
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
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
                <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary }}>
              Order List
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" />
                    </TableCell>
                    <TableCell>
                      <TableSortLabel>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                          Order No.
                        </Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                          Customer
                        </Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                          Tracking No.
                        </Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                          Shipping Address
                        </Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                          Total
                        </Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                          Ordered At
                        </Typography>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: theme.palette.text.secondary }}>
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderList.map((row) => {
                      const statusStyle = getStatusColor(row.status);
                      const trackingDisplay = row.ghnOrderCode ?? row.trackingNumber;
                      return (
                        <TableRow
                          key={row.id}
                          hover
                          onClick={() => handleRowClick(row.id)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: theme.palette.custom.neutral[50],
                            },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: theme.palette.custom.status.pink.main,
                              }}
                            >
                              #{row.shopOrderNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography sx={{ fontSize: 14, color: theme.palette.text.primary, fontWeight: 500 }}>
                                {row.customerName}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                                {row.shippingPhone}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: trackingDisplay ? theme.palette.info.main : theme.palette.custom.neutral[400],
                              }}
                            >
                              {trackingDisplay ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`${row.shippingName} · ${row.shippingPhone} · ${row.shippingAddress}`}>
                              <Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.text.primary }}>
                                  {row.shippingName}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                                  {row.shippingPhone}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    color: theme.palette.text.secondary,
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {row.shippingAddress}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 14, color: theme.palette.text.primary, fontWeight: 500 }}>
                              {formatCurrency(row.totalAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                              {formatDate(row.orderedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ORDER_STATUS_LABEL[row.status] ?? row.status}
                              size="small"
                              sx={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: 600,
                                fontSize: 12,
                                borderRadius: 1,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                              <MoreVert sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopOrdersPage;
