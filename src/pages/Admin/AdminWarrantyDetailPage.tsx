import {
  Avatar,
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

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
      <Typography sx={{ width: 200, fontSize: 13, color: theme.palette.custom.neutral[500], flexShrink: 0 }}>{label}</Typography>
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

            <Grid container spacing={3} alignItems="stretch">
              {/* Customer */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Customer</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar src={warranty.customerAvatarUrl} sx={{ width: 40, height: 40 }}>
                      {(warranty.customerName ?? '?')[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{warranty.customerName}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{warranty.customerEmail}</Typography>
                    </Box>
                  </Box>
                  {warranty.customerAddress && <InfoRow label="Address" value={warranty.customerAddress} />}
                </Paper>
              </Grid>

              {/* Product */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Product</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                    {warranty.productImageUrl && (
                      <Box component="img" src={warranty.productImageUrl} sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                    )}
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{warranty.productName}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>{warranty.shopName}</Typography>
                    </Box>
                  </Box>
                  <InfoRow label="Purchased at" value={formatDate(warranty.purchasedAt)} />
                  <InfoRow label="Warranty expires" value={warranty.warrantyExpiresAt ?? '—'} />
                </Paper>
              </Grid>

              {/* Issue */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Issue Reported</Typography>
                  <InfoRow label="Issue type" value={<Chip size="small" label={warranty.issueType} variant="outlined" />} />
                  <InfoRow label="Description" value={warranty.issueDescription} />
                  {warranty.issueImages && warranty.issueImages.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 1 }}>Evidence images</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {warranty.issueImages.map((img, i) => (
                          <Box
                            key={i}
                            component="img"
                            src={img}
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: `1px solid ${theme.palette.custom.border.light}`, cursor: 'pointer' }}
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Resolution */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Resolution</Typography>
                  <InfoRow label="Status" value={<Chip size="small" label={WARRANTY_STATUS_LABEL[warranty.status] ?? warranty.status} color={statusColor(warranty.status)} />} />
                  {warranty.resolutionType && <InfoRow label="Resolution type" value={warranty.resolutionType} />}
                  {warranty.repairCost != null && <InfoRow label="Repair cost" value={formatCurrency(warranty.repairCost)} />}
                  {warranty.customerPays != null && <InfoRow label="Customer pays" value={formatCurrency(warranty.customerPays)} />}
                  {warranty.rejectionReason && (
                    <InfoRow label="Rejection reason" value={<Typography sx={{ fontSize: 13, color: 'error.main' }}>{warranty.rejectionReason}</Typography>} />
                  )}
                </Paper>
              </Grid>

              {/* Timeline */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1.5, color: theme.palette.custom.neutral[700] }}>Timeline</Typography>
                  <InfoRow label="Submitted at" value={formatDate(warranty.submittedAt)} />
                  <InfoRow label="Approved at" value={formatDate(warranty.approvedAt)} />
                  <InfoRow label="Rejected at" value={formatDate(warranty.rejectedAt)} />
                  <InfoRow label="Completed at" value={formatDate(warranty.completedAt)} />
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default AdminWarrantyDetailPage;
