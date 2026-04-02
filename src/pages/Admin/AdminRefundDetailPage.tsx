import {
  Box,
  Chip,
  CircularProgress,
  Divider,
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

const SectionLabel = ({ children }: { children: string }) => (
  <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.disabled', mb: 1.5 }}>
    {children}
  </Typography>
);

const FieldRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.6, gap: 2 }}>
      <Typography sx={{ width: 160, fontSize: 13, color: theme.palette.custom.neutral[500], flexShrink: 0 }}>{label}</Typography>
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

            {/* Main detail block */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
              {/* Row 1: Product | Request Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Product</SectionLabel>
                  {refund.productImageUrl && (
                    <Box component="img" src={refund.productImageUrl} sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, mb: 1.5 }} />
                  )}
                  <FieldRow label="Product name" value={refund.productName} />
                  <FieldRow label="SKU" value={refund.productSku} />
                  <FieldRow label="Shop" value={refund.shopName} />
                  <FieldRow label="Order number" value={`#${refund.orderNumber}`} />
                </Box>
                <Box sx={{ p: 3 }}>
                  <SectionLabel>Request Details</SectionLabel>
                  <FieldRow label="Return type" value={<Chip size="small" label={RETURN_TYPE_LABEL[refund.returnType] ?? refund.returnType} variant="outlined" />} />
                  <FieldRow label="Reason" value={RETURN_REASON_LABEL[refund.reason] ?? refund.reason} />
                  <FieldRow label="Refund amount" value={<Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>{formatCurrency(refund.refundAmount)}</Typography>} />
                  {refund.reasonDetail && <FieldRow label="Detail" value={refund.reasonDetail} />}
                </Box>
              </Box>

              <Divider />

              {/* Row 2: Resolution | Timeline */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Resolution</SectionLabel>
                  <FieldRow label="Status" value={<Chip size="small" label={REFUND_STATUS_LABEL[refund.status] ?? refund.status} color={statusColor(refund.status)} />} />
                  <FieldRow label="Approved at" value={formatDate(refund.approvedAt)} />
                  <FieldRow label="Completed at" value={formatDate(refund.completedAt)} />
                  <FieldRow label="Rejected at" value={formatDate(refund.rejectedAt)} />
                  {refund.rejectionReason && <FieldRow label="Rejection reason" value={<Typography sx={{ fontSize: 13, color: 'error.main' }}>{refund.rejectionReason}</Typography>} />}
                </Box>
                <Box sx={{ p: 3 }}>
                  <SectionLabel>Timeline</SectionLabel>
                  <FieldRow label="Requested at" value={formatDate(refund.requestedAt)} />
                  <FieldRow label="Approved at" value={formatDate(refund.approvedAt)} />
                  <FieldRow label="Rejected at" value={formatDate(refund.rejectedAt)} />
                  <FieldRow label="Completed at" value={formatDate(refund.completedAt)} />
                </Box>
              </Box>
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AdminRefundDetailPage;
