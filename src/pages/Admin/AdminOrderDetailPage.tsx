import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBack } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { adminApi, type AdminOrderResponse } from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  PICKED_UP: 'Picked Up', SHIPPED: 'In Transit', OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', RETURNED: 'Returned',
};

const REFUND_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested', APPROVED: 'Approved', REJECTED: 'Rejected',
  RETURN_SHIPPING: 'Return Shipping', ITEM_RECEIVED: 'Item Received',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const orderStatusColor = (s: string): 'warning' | 'info' | 'success' | 'error' | 'default' =>
  s === 'PENDING' ? 'warning' : s === 'DELIVERED' ? 'success' : s === 'CANCELLED' || s === 'RETURNED' ? 'error' : 'info';

const paymentStatusColor = (s: string): 'warning' | 'success' | 'error' | 'default' =>
  s === 'PAID' ? 'success' : s === 'PENDING' ? 'warning' : s === 'FAILED' ? 'error' : 'default';

const formatDate = (v?: string) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
      <Typography sx={{ width: 180, fontSize: 13, color: theme.palette.custom.neutral[500], flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, fontSize: 13, color: theme.palette.custom.neutral[800] }}>{value}</Box>
    </Box>
  );
};

const AdminOrderDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [order, setOrder] = useState<AdminOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    adminApi.getOrderById(orderId)
      .then((res) => { if (res.data) setOrder(res.data); })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.ORDERS} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton size="small" onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ORDERS)}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>Back to Orders</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : !order ? (
          <Typography sx={{ color: theme.palette.custom.neutral[500] }}>Order not found.</Typography>
        ) : (
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  Order #{order.orderNumber}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mt: 0.5 }}>
                  Ordered: {formatDate(order.orderedAt)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={ORDER_STATUS_LABEL[order.status] ?? order.status} color={orderStatusColor(order.status)} sx={{ fontWeight: 600 }} />
                <Chip label={order.paymentStatus} color={paymentStatusColor(order.paymentStatus)} variant="outlined" sx={{ fontWeight: 600 }} />
              </Stack>
            </Box>

            <Grid container spacing={3} alignItems="stretch">
              {/* Customer info */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Customer</Typography>
                  <InfoRow label="Full name" value={order.customerFullName || '—'} />
                  <InfoRow label="Email" value={order.customerEmail || '—'} />
                </Paper>
              </Grid>

              {/* Delivery info */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Delivery Address</Typography>
                  <InfoRow label="Recipient" value={order.shippingName || '—'} />
                  <InfoRow label="Phone" value={order.shippingPhone || '—'} />
                  <InfoRow label="Address" value={[order.shippingAddress, order.shippingCity].filter(Boolean).join(', ') || '—'} />
                  {order.trackingNumber && <InfoRow label="Tracking number" value={order.trackingNumber} />}
                </Paper>
              </Grid>

              {/* Payment info */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Payment</Typography>
                  <InfoRow label="Method" value={order.paymentMethod || '—'} />
                  <InfoRow label="Status" value={<Chip size="small" label={order.paymentStatus} color={paymentStatusColor(order.paymentStatus)} />} />
                  <InfoRow label="Paid at" value={formatDate(order.paidAt)} />
                </Paper>
              </Grid>

              {/* Pricing */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Pricing</Typography>
                  <InfoRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                  <InfoRow label="Shipping fee" value={formatCurrency(order.shippingFee)} />
                  <InfoRow label="Discount" value={order.discountAmount > 0 ? `- ${formatCurrency(order.discountAmount)}` : '—'} />
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', py: 1 }}>
                    <Typography sx={{ width: 180, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>Total</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.primary.main }}>{formatCurrency(order.totalAmount)}</Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Refund info if any */}
              {order.refundRequestId && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.warning.main}` }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.warning.dark }}>Refund Request</Typography>
                    <InfoRow label="Requested at" value={formatDate(order.refundRequestedAt)} />
                    {order.refundStatus && (
                      <InfoRow label="Status" value={<Chip size="small" label={REFUND_STATUS_LABEL[order.refundStatus] ?? order.refundStatus} color="warning" />} />
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Order Items ({order.items.length})</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                        {['Product', 'SKU', 'Type', 'Qty', 'Unit Price', 'Total'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {item.productImageUrl && (
                                <Box component="img" src={item.productImageUrl} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }} />
                              )}
                              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.productName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{item.productSku}</Typography></TableCell>
                          <TableCell><Chip size="small" variant="outlined" label={item.itemType} /></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{item.quantity}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{formatCurrency(item.unitPrice)}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Timestamps */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Timeline</Typography>
              <InfoRow label="Ordered at" value={formatDate(order.orderedAt)} />
              <InfoRow label="Paid at" value={formatDate(order.paidAt)} />
              <InfoRow label="Completed at" value={formatDate(order.completedAt)} />
              <InfoRow label="Cancelled at" value={formatDate(order.cancelledAt)} />
              {order.customerNote && <InfoRow label="Customer note" value={order.customerNote} />}
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AdminOrderDetailPage;
