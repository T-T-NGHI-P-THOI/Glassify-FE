import {
  Box,
  Chip,
  CircularProgress,
  Divider,
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

const SectionLabel = ({ children, color }: { children: string; color?: string }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: color ?? 'text.disabled', mb: 1.5 }}>
    {children}
  </Typography>
);

const FieldRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.6, gap: 2 }}>
      <Typography sx={{ width: 150, fontSize: 13, color: theme.palette.custom.neutral[500], flexShrink: 0 }}>{label}</Typography>
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

            {/* Main detail block — one paper, sections divided by Divider */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
              {/* Row 1: Customer | Delivery */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Customer</SectionLabel>
                  <FieldRow label="Full name" value={order.customerFullName || '—'} />
                  <FieldRow label="Email" value={order.customerEmail || '—'} />
                </Box>
                <Box sx={{ p: 3 }}>
                  <SectionLabel>Delivery Address</SectionLabel>
                  <FieldRow label="Recipient" value={order.shippingName || '—'} />
                  <FieldRow label="Phone" value={order.shippingPhone || '—'} />
                  <FieldRow label="Address" value={[order.shippingAddress, order.shippingCity].filter(Boolean).join(', ') || '—'} />
                  {order.trackingNumber && <FieldRow label="Tracking number" value={order.trackingNumber} />}
                </Box>
              </Box>

              <Divider />

              {/* Row 2: Payment | Pricing */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Payment</SectionLabel>
                  <FieldRow label="Method" value={order.paymentMethod || '—'} />
                  <FieldRow label="Status" value={<Chip size="small" label={order.paymentStatus} color={paymentStatusColor(order.paymentStatus)} />} />
                  <FieldRow label="Paid at" value={formatDate(order.paidAt)} />
                </Box>
                <Box sx={{ p: 3 }}>
                  <SectionLabel>Pricing</SectionLabel>
                  <FieldRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                  <FieldRow label="Shipping fee" value={formatCurrency(order.shippingFee)} />
                  <FieldRow label="Discount" value={order.discountAmount > 0 ? `- ${formatCurrency(order.discountAmount)}` : '—'} />
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 0.6, gap: 2 }}>
                    <Typography sx={{ width: 150, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>Total</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.primary.main }}>{formatCurrency(order.totalAmount)}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Refund section */}
              {order.refundRequestId && (
                <>
                  <Divider />
                  <Box sx={{ p: 3, bgcolor: `${theme.palette.warning.main}0D` }}>
                    <SectionLabel color={theme.palette.warning.dark}>Refund Request</SectionLabel>
                    <FieldRow label="Requested at" value={formatDate(order.refundRequestedAt)} />
                    {order.refundStatus && (
                      <FieldRow label="Status" value={<Chip size="small" label={REFUND_STATUS_LABEL[order.refundStatus] ?? order.refundStatus} color="warning" />} />
                    )}
                  </Box>
                </>
              )}

              <Divider />

              {/* Timeline */}
              <Box sx={{ p: 3 }}>
                <SectionLabel>Timeline</SectionLabel>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <Box>
                    <FieldRow label="Ordered at" value={formatDate(order.orderedAt)} />
                    <FieldRow label="Paid at" value={formatDate(order.paidAt)} />
                  </Box>
                  <Box>
                    <FieldRow label="Completed at" value={formatDate(order.completedAt)} />
                    <FieldRow label="Cancelled at" value={formatDate(order.cancelledAt)} />
                  </Box>
                </Box>
                {order.customerNote && <FieldRow label="Customer note" value={order.customerNote} />}
              </Box>
            </Paper>

            {/* Order items — kept as separate table block */}
            {order.items && order.items.length > 0 && (
              <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
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
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AdminOrderDetailPage;
