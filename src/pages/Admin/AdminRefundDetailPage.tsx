import {
  Box,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBack } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { adminApi, type AdminRefundResponse } from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';

const REFUND_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested', APPROVED: 'Approved', REJECTED: 'Rejected',
  RETURN_SHIPPING: 'Return Shipping', ITEM_RECEIVED: 'Item Received',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const RETURN_TYPE_LABEL: Record<string, string> = {
  REFUND: 'Refund', EXCHANGE: 'Exchange',
};

const RETURN_REASON_LABEL: Record<string, string> = {
  NOT_RECEIVED: 'Not Received', MISSING_ITEMS: 'Missing Items',
  DAMAGED_IN_SHIPPING: 'Damaged in Shipping', WRONG_ITEM: 'Wrong Item',
  WRONG_COLOR: 'Wrong Color', WRONG_SIZE: 'Wrong Size',
  DEFECTIVE: 'Defective Product', NOT_AS_DESCRIBED: 'Not As Described',
  WRONG_PRESCRIPTION: 'Wrong Prescription', SELLER_AGREEMENT: 'Seller Agreement',
  CHANGED_MIND: 'Changed Mind', WRONG_SELECTION: 'Wrong Selection',
  BETTER_PRICE_FOUND: 'Better Price Found', NO_LONGER_NEEDED: 'No Longer Needed',
  OTHER: 'Other',
};

const statusColor = (s: string): 'warning' | 'info' | 'success' | 'error' | 'default' =>
  s === 'REQUESTED' ? 'warning' : s === 'COMPLETED' ? 'success' : s === 'REJECTED' || s === 'CANCELLED' ? 'error' : 'info';

const formatDate = (v?: string) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
      <Typography sx={{ width: 200, fontSize: 13, color: theme.palette.custom.neutral[500], flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ flex: 1, fontSize: 13, color: theme.palette.custom.neutral[800] }}>{value}</Box>
    </Box>
  );
};

const AdminRefundDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: refundId } = useParams<{ id: string }>();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [refund, setRefund] = useState<AdminRefundResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!refundId) return;
    setLoading(true);
    adminApi.getRefundById(refundId)
      .then((res) => { if (res.data) setRefund(res.data); })
      .catch(() => toast.error('Failed to load refund request'))
      .finally(() => setLoading(false));
  }, [refundId]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.REFUNDS} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton size="small" onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.REFUNDS)}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>Back to Refunds</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : !refund ? (
          <Typography sx={{ color: theme.palette.custom.neutral[500] }}>Refund request not found.</Typography>
        ) : (
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  Request #{refund.requestNumber}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mt: 0.5 }}>
                  Submitted: {formatDate(refund.requestedAt)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={RETURN_TYPE_LABEL[refund.returnType] ?? refund.returnType} variant="outlined" sx={{ fontWeight: 600 }} />
                <Chip label={REFUND_STATUS_LABEL[refund.status] ?? refund.status} color={statusColor(refund.status)} sx={{ fontWeight: 600 }} />
              </Stack>
            </Box>

            <Grid container spacing={3} alignItems="stretch">
              {/* Product info */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Product</Typography>
                  {refund.productImageUrl && (
                    <Box component="img" src={refund.productImageUrl} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, mb: 1.5 }} />
                  )}
                  <InfoRow label="Product name" value={refund.productName} />
                  <InfoRow label="SKU" value={refund.productSku} />
                  <InfoRow label="Shop" value={refund.shopName} />
                  <InfoRow label="Order number" value={`#${refund.orderNumber}`} />
                </Paper>
              </Grid>

              {/* Request info */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Request Details</Typography>
                  <InfoRow label="Return type" value={<Chip size="small" label={RETURN_TYPE_LABEL[refund.returnType] ?? refund.returnType} variant="outlined" />} />
                  <InfoRow label="Reason" value={RETURN_REASON_LABEL[refund.reason] ?? refund.reason} />
                  <InfoRow label="Refund amount" value={<Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>{formatCurrency(refund.refundAmount)}</Typography>} />
                  {refund.reasonDetail && <InfoRow label="Detail" value={refund.reasonDetail} />}
                </Paper>
              </Grid>

              {/* Resolution */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Resolution</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <InfoRow label="Status" value={<Chip size="small" label={REFUND_STATUS_LABEL[refund.status] ?? refund.status} color={statusColor(refund.status)} />} />
                      <InfoRow label="Approved at" value={formatDate(refund.approvedAt)} />
                      <InfoRow label="Completed at" value={formatDate(refund.completedAt)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <InfoRow label="Rejected at" value={formatDate(refund.rejectedAt)} />
                      {refund.rejectionReason && <InfoRow label="Rejection reason" value={refund.rejectionReason} />}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Timeline — full width, outside Grid */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Timeline</Typography>
              <InfoRow label="Requested at" value={formatDate(refund.requestedAt)} />
              <InfoRow label="Approved at" value={formatDate(refund.approvedAt)} />
              <InfoRow label="Rejected at" value={formatDate(refund.rejectedAt)} />
              <InfoRow label="Completed at" value={formatDate(refund.completedAt)} />
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AdminRefundDetailPage;
