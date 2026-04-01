import {
  Avatar,
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

import { adminApi, type AdminWarrantyResponse } from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';

const WARRANTY_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted', APPROVED: 'Approved', REJECTED: 'Rejected',
  IN_REPAIR: 'In Repair', SHIPPING_TO_CUSTOMER: 'Shipping to Customer',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const statusColor = (s: string): 'warning' | 'info' | 'success' | 'error' | 'default' =>
  s === 'SUBMITTED' ? 'warning' : s === 'COMPLETED' ? 'success' : s === 'REJECTED' || s === 'CANCELLED' ? 'error' : 'info';

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

const AdminWarrantyDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: claimId } = useParams<{ id: string }>();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [warranty, setWarranty] = useState<AdminWarrantyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    adminApi.getWarrantyById(claimId)
      .then((res) => { if (res.data) setWarranty(res.data); })
      .catch(() => toast.error('Failed to load warranty claim'))
      .finally(() => setLoading(false));
  }, [claimId]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.WARRANTIES} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton size="small" onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.WARRANTIES)}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>Back to Warranties</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : !warranty ? (
          <Typography sx={{ color: theme.palette.custom.neutral[500] }}>Warranty claim not found.</Typography>
        ) : (
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  Claim #{warranty.claimNumber}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mt: 0.5 }}>
                  Submitted: {formatDate(warranty.submittedAt)}
                </Typography>
              </Box>
              <Chip label={WARRANTY_STATUS_LABEL[warranty.status] ?? warranty.status} color={statusColor(warranty.status)} sx={{ fontWeight: 600 }} />
            </Box>

            {/* Main detail block */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
              {/* Row 1: Customer | Product */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Customer</SectionLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar src={warranty.customerAvatarUrl} sx={{ width: 36, height: 36 }}>
                      {(warranty.customerName ?? '?')[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{warranty.customerName}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{warranty.customerEmail}</Typography>
                    </Box>
                  </Box>
                  {warranty.customerAddress && <FieldRow label="Address" value={warranty.customerAddress} />}
                </Box>
                <Box sx={{ p: 3 }}>
                  <SectionLabel>Product</SectionLabel>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                    {warranty.productImageUrl && (
                      <Box component="img" src={warranty.productImageUrl} sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                    )}
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{warranty.productName}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{warranty.shopName}</Typography>
                    </Box>
                  </Box>
                  <FieldRow label="Purchased at" value={formatDate(warranty.purchasedAt)} />
                  <FieldRow label="Warranty expires" value={warranty.warrantyExpiresAt ?? '—'} />
                </Box>
              </Box>

              <Divider />

              {/* Issue Reported — full width */}
              <Box sx={{ p: 3 }}>
                <SectionLabel>Issue Reported</SectionLabel>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <Box>
                    <FieldRow label="Issue type" value={<Chip size="small" label={warranty.issueType} variant="outlined" />} />
                    <FieldRow label="Description" value={warranty.issueDescription} />
                  </Box>
                  {warranty.issueImages && warranty.issueImages.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 1 }}>Evidence images</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {warranty.issueImages.map((img, i) => (
                          <Box
                            key={i}
                            component="img"
                            src={img}
                            sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.custom.border.light}`, cursor: 'pointer' }}
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Row 3: Resolution | Timeline */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Resolution</SectionLabel>
                  <FieldRow label="Status" value={<Chip size="small" label={WARRANTY_STATUS_LABEL[warranty.status] ?? warranty.status} color={statusColor(warranty.status)} />} />
                  {warranty.resolutionType && <FieldRow label="Resolution type" value={warranty.resolutionType} />}
                  {warranty.repairCost != null && <FieldRow label="Repair cost" value={formatCurrency(warranty.repairCost)} />}
                  {warranty.customerPays != null && <FieldRow label="Customer pays" value={formatCurrency(warranty.customerPays)} />}
                  {warranty.rejectionReason && (
                    <FieldRow label="Rejection reason" value={<Typography sx={{ fontSize: 13, color: 'error.main' }}>{warranty.rejectionReason}</Typography>} />
                  )}
                </Box>
                <Box sx={{ p: 3 }}>
                  <SectionLabel>Timeline</SectionLabel>
                  <FieldRow label="Submitted at" value={formatDate(warranty.submittedAt)} />
                  <FieldRow label="Approved at" value={formatDate(warranty.approvedAt)} />
                  <FieldRow label="Rejected at" value={formatDate(warranty.rejectedAt)} />
                  <FieldRow label="Completed at" value={formatDate(warranty.completedAt)} />
                </Box>
              </Box>
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AdminWarrantyDetailPage;
