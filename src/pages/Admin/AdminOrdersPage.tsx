import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,

  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Visibility } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { adminApi, type AdminOrderResponse } from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PICKED_UP: 'Picked Up',
  SHIPPED: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'SHIPPED', label: 'In Transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'CONFIRMED': case 'PROCESSING': return 'info';
    case 'PICKED_UP': case 'SHIPPED': case 'OUT_FOR_DELIVERY': return 'info';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': case 'RETURNED': return 'error';
    default: return 'default';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const AdminOrdersPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [orders, setOrders] = useState<AdminOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const fetchOrders = async (status: string, pageNum: number) => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders(status || undefined, pageNum, pageSize);
      if (res.data) {
        setOrders(res.data.content);
        setTotalElements(res.data.totalElements);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter, page);
  }, [statusFilter, page]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.ORDERS} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Order Management
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            View and manage all customer orders across the platform.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
        >
          {/* Filter bar */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[600] }}>
              Status:
            </Typography>
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 160, fontSize: 14 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            <Typography sx={{ ml: 'auto', fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              {totalElements} orders
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: theme.palette.custom.neutral[500] }}>No orders found.</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                      {['Order', 'Customer', 'Amount', 'Payment', 'Status', 'Ordered At', ''].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ORDER_DETAIL.replace(':id', order.id))}>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>
                            #{order.orderNumber}
                          </Typography>
                          {order.trackingNumber && (
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                              {order.trackingNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{order.customerFullName}</Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{order.customerEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Chip
                              size="small"
                              label={order.paymentStatus}
                              color={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'PENDING' ? 'warning' : 'default'}
                            />
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{order.paymentMethod}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={ORDER_STATUS_LABEL[order.status] ?? order.status}
                            color={getStatusColor(order.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>
                            {formatDate(order.orderedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate(PAGE_ENDPOINTS.ADMIN.ORDER_DETAIL.replace(':id', order.id)); }}
                          >
                            <Visibility sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalElements}
                page={page}
                rowsPerPage={pageSize}
                rowsPerPageOptions={[pageSize]}
                onPageChange={(_e, newPage) => setPage(newPage)}
              />
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminOrdersPage;
