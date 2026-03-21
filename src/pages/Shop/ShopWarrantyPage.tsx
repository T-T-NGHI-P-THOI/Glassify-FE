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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Build,
  ShoppingBag,
  VerifiedUser,
  LocalShipping,
  CheckCircle,
  Cancel,
  AssignmentTurnedIn,
  Close,
  Warning,
  Person,
  CalendarMonth,
  ZoomIn,
  ArrowForward,
  ArrowBack,
  ReceiptLong,
  Info,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import { warrantyApi } from '@/api/warranty-api';
import type { WarrantyClaimResponse } from '@/api/warranty-api';
import type { ShopDetailResponse } from '@/models/Shop';
import { toast } from 'react-toastify';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  IN_REPAIR: 'In Repair',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const ISSUE_TYPE_LABEL: Record<string, string> = {
  BROKEN_FRAME: 'Broken Frame',
  BROKEN_LENS: 'Broken Lens',
  LOOSE_HINGE: 'Loose Hinge',
  COATING_DAMAGE: 'Coating Damage',
  OTHER: 'Other',
};

const RESOLUTION_OPTIONS = [
  { value: 'REPAIR', label: 'Repair', desc: 'Product is repaired and returned to customer' },
  { value: 'REPLACE', label: 'Replacement', desc: 'Product is replaced with a new unit' },
  { value: 'REFUND', label: 'Refund', desc: 'Customer is refunded for the product' },
];

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TABS = [
  { label: 'All', statuses: [] as string[] },
  { label: 'Pending Review', statuses: ['SUBMITTED', 'UNDER_REVIEW'] },
  { label: 'In Progress', statuses: ['APPROVED', 'IN_REPAIR', 'IN_PROGRESS'] },
  { label: 'Completed', statuses: ['COMPLETED'] },
  { label: 'Rejected', statuses: ['REJECTED'] },
];

const isPendingReview = (status: string) => status === 'SUBMITTED' || status === 'UNDER_REVIEW';
const isInProgress = (status: string) => status === 'APPROVED' || status === 'IN_REPAIR' || status === 'IN_PROGRESS';

const ShopWarrantyPage = () => {
  const { setShowNavbar, setShowFooter } = useLayout();
  const theme = useTheme();
  const { user } = useAuth();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [claims, setClaims] = useState<WarrantyClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Detail dialog
  const [selected, setSelected] = useState<WarrantyClaimResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Approve flow (shown after clicking Approve in detail dialog)
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveStep, setApproveStep] = useState<1 | 2>(1);
  const [resolutionType, setResolutionType] = useState('REPAIR');
  const [repairCostInput, setRepairCostInput] = useState('');
  const [actioning, setActioning] = useState(false);

  const resetApproveDialog = () => {
    setApproveStep(1);
    setRepairCostInput('');
  };

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const res = await warrantyApi.getShopClaims({ size: 100 });
      if (res.data) setClaims(res.data);
    } catch {
      console.error('Failed to fetch shop warranty claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const getStatusColor = (status: string) => {
    const { custom } = theme.palette;
    switch (status) {
      case 'SUBMITTED': case 'UNDER_REVIEW':
        return { bg: custom.status.warning.light, color: custom.status.warning.main };
      case 'APPROVED':
        return { bg: custom.status.info.light, color: custom.status.info.main };
      case 'IN_REPAIR': case 'IN_PROGRESS':
        return { bg: custom.status.purple.light, color: custom.status.purple.main };
      case 'COMPLETED':
        return { bg: custom.status.success.light, color: custom.status.success.main };
      case 'REJECTED':
        return { bg: custom.status.error.light, color: custom.status.error.main };
      default:
        return { bg: custom.neutral[100], color: custom.neutral[500] };
    }
  };

  const filteredClaims = activeTab === 0
    ? claims
    : claims.filter((c) => TABS[activeTab].statuses.includes(c.status));

  const handleApprove = async () => {
    if (!selected) return;
    try {
      setActioning(true);
      const res = await warrantyApi.approveShopClaim(selected.id, resolutionType, repairCostInput ? Number(repairCostInput) : undefined);
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Warranty claim approved — customer will be notified to ship the product');
      setApproveOpen(false);
      resetApproveDialog();
    } catch {
      toast.error('Failed to approve claim');
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    try {
      setActioning(true);
      const res = await warrantyApi.rejectShopClaim(selected.id, rejectReason.trim());
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Warranty claim rejected');
      setRejectOpen(false);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject claim');
    } finally {
      setActioning(false);
    }
  };

  const handleMarkReceived = async () => {
    if (!selected) return;
    try {
      setActioning(true);
      const res = await warrantyApi.markItemReceived(selected.id);
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Item marked as received — repair in progress');
    } catch {
      toast.error('Failed to mark item as received');
    } finally {
      setActioning(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    try {
      setActioning(true);
      const res = await warrantyApi.completeShopClaim(selected.id);
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Repair completed — product will be shipped back to customer');
    } catch {
      toast.error('Failed to complete claim');
    } finally {
      setActioning(false);
    }
  };

  const tabCounts = TABS.map((tab, i) =>
    i === 0 ? claims.length : claims.filter((c) => tab.statuses.includes(c.status)).length
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
      {children}
    </Typography>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.WARRANTY}
        shopName={shop?.shopName}
        shopLogo={shop?.logoUrl}
        ownerName={shop?.ownerName || user?.fullName}
        ownerEmail={shop?.ownerEmail || user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Build sx={{ color: theme.palette.custom.neutral[600] }} />
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Warranty Claims
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Manage warranty requests from customers. Review, approve, and track repair progress.
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {TABS.map((tab, i) => (
            <Button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              variant={activeTab === i ? 'contained' : 'outlined'}
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: activeTab === i ? 600 : 400,
                fontSize: 13,
                px: 2,
                ...(activeTab === i
                  ? { bgcolor: theme.palette.custom.neutral[800], '&:hover': { bgcolor: theme.palette.custom.neutral[700] } }
                  : { borderColor: theme.palette.custom.border.light, color: theme.palette.custom.neutral[600] }),
              }}
            >
              {tab.label}
              <Box
                component="span"
                sx={{
                  ml: 1, px: 0.75, py: 0.1, borderRadius: 1, fontSize: 11, fontWeight: 600,
                  bgcolor: activeTab === i ? 'rgba(255,255,255,0.2)' : theme.palette.custom.neutral[100],
                  color: activeTab === i ? '#fff' : theme.palette.custom.neutral[600],
                }}
              >
                {tabCounts[i]}
              </Box>
            </Button>
          ))}
        </Box>

        {/* Table */}
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredClaims.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
              <Build sx={{ fontSize: 40, color: theme.palette.custom.neutral[300] }} />
              <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>No warranty claims found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                    {['Claim No.', 'Product', 'Issue', 'Customer', 'Submitted', 'Status', ''].map((h) => (
                      <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow
                      key={claim.id}
                      hover
                      sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                      onClick={() => { setSelected(claim); setDetailOpen(true); }}
                    >
                      <TableCell sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800], fontFamily: 'monospace' }}>
                        {claim.claimNumber}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            variant="rounded"
                            src={claim.productImageUrl}
                            sx={{ width: 36, height: 36, borderRadius: '6px', bgcolor: theme.palette.custom.neutral[100], flexShrink: 0 }}
                          >
                            <ShoppingBag sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {claim.productName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ISSUE_TYPE_LABEL[claim.issueType] ?? claim.issueType}
                          size="small"
                          sx={{ fontSize: 12, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[700] }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={claim.customerAvatarUrl} sx={{ width: 28, height: 28, fontSize: 12 }}>
                            {claim.customerName?.[0] ?? 'C'}
                          </Avatar>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                            {claim.customerName ?? '—'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                        {formatDate(claim.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABEL[claim.status] ?? claim.status}
                          size="small"
                          sx={{ fontSize: 12, fontWeight: 600, bgcolor: getStatusColor(claim.status).bg, color: getStatusColor(claim.status).color }}
                        />
                      </TableCell>
                      {/* Action icon */}
                      <TableCell onClick={(e) => e.stopPropagation()} sx={{ width: 40 }}>
                        {isPendingReview(claim.status) && (
                          <Tooltip title="Review claim" arrow>
                            <IconButton
                              size="small"
                              onClick={() => { setSelected(claim); setDetailOpen(true); }}
                              sx={{
                                bgcolor: theme.palette.custom.status.warning.light,
                                color: theme.palette.custom.status.warning.main,
                                '&:hover': { bgcolor: theme.palette.custom.status.warning.main, color: '#fff' },
                              }}
                            >
                              <Warning sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isInProgress(claim.status) && (
                          <Tooltip title="Mark as completed" arrow>
                            <IconButton
                              size="small"
                              disabled={actioning}
                              onClick={() => { setSelected(claim); setDetailOpen(true); }}
                              sx={{
                                bgcolor: theme.palette.custom.status.purple.light,
                                color: theme.palette.custom.status.purple.main,
                                '&:hover': { bgcolor: theme.palette.custom.status.purple.main, color: '#fff' },
                              }}
                            >
                              <Build sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* ==================== IMAGE PREVIEW ==================== */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        slotProps={{ paper: { sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{ position: 'absolute', top: -16, right: -16, bgcolor: 'white', boxShadow: 2, zIndex: 1, '&:hover': { bgcolor: theme.palette.custom.neutral[100] } }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
          <Box component="img" src={previewImage ?? ''} sx={{ maxWidth: '85vw', maxHeight: '85vh', display: 'block', borderRadius: '12px', objectFit: 'contain' }} />
        </Box>
      </Dialog>

      {/* ==================== DETAIL DIALOG ==================== */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        {selected && (
          <>
            {/* Header */}
            <DialogTitle sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 2.5, background: `linear-gradient(135deg, ${theme.palette.custom.neutral[50]} 0%, white 100%)`, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* Product */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      src={selected.productImageUrl}
                      sx={{ width: 72, height: 72, borderRadius: '12px', bgcolor: theme.palette.custom.neutral[100], border: `1px solid ${theme.palette.custom.border.light}`, flexShrink: 0 }}
                    >
                      <ShoppingBag sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 17, fontWeight: 700, color: theme.palette.custom.neutral[800], lineHeight: 1.3 }}>
                        {selected.productName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {selected.purchasedAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarMonth sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }} />
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              Purchased {formatDate(selected.purchasedAt)}
                            </Typography>
                          </Box>
                        )}
                        {selected.warrantyExpiresAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VerifiedUser sx={{ fontSize: 13, color: theme.palette.custom.status.success.main }} />
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>
                              Warranty until {formatDate(selected.warrantyExpiresAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <IconButton size="small" onClick={() => setDetailOpen(false)}>
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Chip
                      label={STATUS_LABEL[selected.status] ?? selected.status}
                      sx={{ fontWeight: 700, fontSize: 12, height: 26, bgcolor: getStatusColor(selected.status).bg, color: getStatusColor(selected.status).color }}
                    />
                  </Box>
                </Box>

                {/* Claim meta */}
                <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Claim No.</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[700], fontFamily: 'monospace' }}>{selected.claimNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Submitted</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>{formatDate(selected.submittedAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Customer Pays</Typography>
                    {selected.customerPays != null ? (
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>{Number(selected.customerPays).toLocaleString('vi-VN')} VND</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[400] }}>TBD after review</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Customer Info */}
                <Box>
                  <SectionLabel>Customer</SectionLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                    <Avatar src={selected.customerAvatarUrl} sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[200] }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                        {selected.customerName ?? '—'}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                        {selected.customerEmail ?? '—'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Issue */}
                <Box>
                  <SectionLabel>Issue Details</SectionLabel>
                  <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                    <Chip
                      icon={<Warning sx={{ fontSize: '14px !important' }} />}
                      label={ISSUE_TYPE_LABEL[selected.issueType] ?? selected.issueType}
                      size="small"
                      sx={{
                        mb: 1.5,
                        bgcolor: theme.palette.custom.status.warning.light,
                        color: theme.palette.custom.status.warning.main,
                        fontWeight: 700, fontSize: 12,
                        '& .MuiChip-icon': { color: theme.palette.custom.status.warning.main },
                      }}
                    />
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>
                      {selected.issueDescription}
                    </Typography>
                  </Box>
                </Box>

                {/* Product Photos */}
                {(selected.issueImages ?? []).length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SectionLabel>Product Condition Photos</SectionLabel>
                      <Chip
                        label={selected.issueImages?.length ?? 0}
                        size="small"
                        sx={{ height: 18, fontSize: 11, fontWeight: 700, mb: 1, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }}
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
                      {(selected.issueImages ?? []).map((img, i) => (
                        <Box key={i} sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1/1', cursor: 'zoom-in', border: `1.5px solid ${theme.palette.custom.border.light}` }}
                          onClick={() => setPreviewImage(img)}
                        >
                          <Box component="img" src={img} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }} />
                          <Box sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ZoomIn sx={{ fontSize: 16, color: '#fff' }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Shipping Process (always visible for context) */}
                <Box sx={{ p: 2, borderRadius: '8px', border: `1px dashed ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <LocalShipping sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[700] }}>
                      Warranty Shipping Process
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {[
                      { step: '1', text: 'After approval, customer ships product to your store via GHN' },
                      { step: '2', text: 'You receive and inspect the product, then perform repair / replacement' },
                      { step: '3', text: 'After repair, you ship the product back to the customer via GHN' },
                    ].map(({ step, text }) => (
                      <Box key={step} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: theme.palette.custom.status.info.main, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
                          {step}
                        </Box>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>{text}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mt: 1.5, fontStyle: 'italic' }}>
                    Shipping fees (both directions) will be calculated and included in the total cost estimate sent to the customer.
                  </Typography>
                </Box>

                {/* Resolution (if set) */}
                {selected.resolutionType && (
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.status.success.light, border: `1px solid ${theme.palette.custom.status.success.main}30`, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <AssignmentTurnedIn sx={{ fontSize: 22, color: theme.palette.custom.status.success.main, mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.status.success.main, textTransform: 'uppercase', mb: 0.25 }}>Resolution</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                        {RESOLUTION_OPTIONS.find((r) => r.value === selected.resolutionType)?.label ?? selected.resolutionType}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Cost Summary */}
                {(selected.repairCost != null || selected.customerShippingFeeToShop != null || selected.customerPays != null) && (
                  <Box>
                    <SectionLabel>Cost Summary</SectionLabel>
                    <Box sx={{ borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                      {selected.repairCost != null && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Service Fee</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{Number(selected.repairCost).toLocaleString('vi-VN')} VND</Typography>
                        </Box>
                      )}
                      {selected.customerShippingFeeToShop != null && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: selected.platformSubsidyToShop != null ? 'none' : `1px solid ${theme.palette.custom.border.light}` }}>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Customer → Shop)</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{Number(selected.customerShippingFeeToShop).toLocaleString('vi-VN')} VND</Typography>
                          </Box>
                          {selected.platformSubsidyToShop != null && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 0.75, borderBottom: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.status.success.light }}>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>↳ Platform support (leg 1)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main }}>−{Number(selected.platformSubsidyToShop).toLocaleString('vi-VN')} VND</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {selected.customerShippingFeeToCustomer != null && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: selected.platformSubsidyToCustomer != null ? 'none' : `1px solid ${theme.palette.custom.border.light}` }}>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Shop → Customer)</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{Number(selected.customerShippingFeeToCustomer).toLocaleString('vi-VN')} VND</Typography>
                          </Box>
                          {selected.platformSubsidyToCustomer != null && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 0.75, borderBottom: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.status.success.light }}>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>↳ Platform support (leg 2)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main }}>−{Number(selected.platformSubsidyToCustomer).toLocaleString('vi-VN')} VND</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {selected.customerPays != null && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, bgcolor: theme.palette.custom.neutral[50] }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>Customer Pays</Typography>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.status.warning.main }}>{Number(selected.customerPays).toLocaleString('vi-VN')} VND</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Tracking */}
                {(selected.returnTrackingNumber || selected.replacementTrackingNumber) && (
                  <Box>
                    <SectionLabel>Tracking Numbers</SectionLabel>
                    <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selected.returnTrackingNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Customer → Shop</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: theme.palette.custom.status.purple.main }}>{selected.returnTrackingNumber}</Typography>
                        </Box>
                      )}
                      {selected.replacementTrackingNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shop → Customer</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: theme.palette.custom.status.success.main }}>{selected.replacementTrackingNumber}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Timeline */}
                <Box>
                  <SectionLabel>Activity Timeline</SectionLabel>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { label: 'Claim submitted', date: selected.submittedAt, color: theme.palette.primary.main, always: true },
                      { label: 'Approved by shop', date: selected.approvedAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Package delivered to shop (GHN)', date: selected.returnDeliveredAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Item received — in repair', date: undefined, color: theme.palette.custom.status.purple.main, always: selected.status === 'IN_REPAIR' || selected.status === 'IN_PROGRESS' || selected.status === 'COMPLETED' },
                      { label: 'Repair completed', date: selected.completedAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Product delivered to customer (GHN)', date: selected.replacementDeliveredAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Rejected', date: selected.rejectedAt, color: theme.palette.custom.status.error.main, always: false },
                    ].filter((e) => e.always || e.date).map((event, i, arr) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: event.date ? event.color : theme.palette.custom.neutral[200], border: `2px solid ${event.date ? event.color : theme.palette.custom.neutral[300]}`, mt: 0.5, flexShrink: 0 }} />
                          {i < arr.length - 1 && <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: theme.palette.custom.border.light, my: 0.5 }} />}
                        </Box>
                        <Box sx={{ pb: i < arr.length - 1 ? 1.5 : 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: event.date ? theme.palette.custom.neutral[800] : theme.palette.custom.neutral[400] }}>{event.label}</Typography>
                          {event.date && <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{formatDate(event.date)}</Typography>}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Rejection reason */}
                {selected.rejectionReason && (
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.status.error.light, border: `1px solid ${theme.palette.custom.status.error.main}30`, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Cancel sx={{ fontSize: 22, color: theme.palette.custom.status.error.main, mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.status.error.main, textTransform: 'uppercase', mb: 0.25 }}>Rejection Reason</Typography>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>{selected.rejectionReason}</Typography>
                    </Box>
                  </Box>
                )}

                {/* GHN delivery notification */}
                {selected.status === 'APPROVED' && selected.returnDeliveredAt && (
                  <Box sx={{ p: 2, borderRadius: '10px', bgcolor: theme.palette.custom.status.success.light, border: `1.5px solid ${theme.palette.custom.status.success.main}50`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                        Package delivered to your shop
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mt: 0.25 }}>
                        GHN confirmed delivery on {formatDateTime(selected.returnDeliveredAt)}. Click "Mark Item Received" to start the repair.
                      </Typography>
                    </Box>
                  </Box>
                )}

              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.custom.border.light}`, gap: 1.5 }}>
              {isPendingReview(selected.status) && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => { setDetailOpen(false); setApproveOpen(true); }}
                    sx={{
                      textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px',
                      bgcolor: theme.palette.custom.status.success.main,
                      '&:hover': { bgcolor: '#15803d' },
                    }}
                  >
                    Approve Claim
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Cancel />}
                    onClick={() => { setDetailOpen(false); setRejectOpen(true); }}
                    sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.error.main, '&:hover': { bgcolor: '#b91c1c' } }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <Button
                  variant="contained"
                  startIcon={<LocalShipping />}
                  disabled={actioning}
                  onClick={handleMarkReceived}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.purple.main, '&:hover': { bgcolor: '#6d28d9' } }}
                >
                  {actioning ? <CircularProgress size={18} color="inherit" /> : 'Mark Item Received'}
                </Button>
              )}
              {(selected.status === 'IN_REPAIR' || selected.status === 'IN_PROGRESS') && (
                <Button
                  variant="contained"
                  startIcon={<AssignmentTurnedIn />}
                  disabled={actioning}
                  onClick={handleComplete}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px' }}
                >
                  {actioning ? <CircularProgress size={18} color="inherit" /> : 'Complete Repair'}
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ==================== APPROVE DIALOG ==================== */}
      <Dialog
        open={approveOpen}
        onClose={() => { setApproveOpen(false); resetApproveDialog(); }}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        {/* ---- Header ---- */}
        <DialogTitle sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.palette.custom.status.success.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                  {approveStep === 1 ? 'Approve Warranty Claim' : 'Review & Confirm'}
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selected?.claimNumber}</Typography>
              </Box>
            </Box>
            {/* Step indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {([1, 2] as const).map((s) => (
                <Box key={s} sx={{ width: s === approveStep ? 20 : 8, height: 8, borderRadius: 4, transition: 'all 0.2s', bgcolor: s === approveStep ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[200] }} />
              ))}
            </Box>
          </Box>
        </DialogTitle>

        {/* ---- STEP 1: Resolution + Fees ---- */}
        {approveStep === 1 && (
          <>
            <DialogContent sx={{ pt: 2.5 }}>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                Choose resolution type and enter the estimated fees. The customer will review before work begins.
              </Typography>

              {/* Resolution options */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {RESOLUTION_OPTIONS.map((opt) => {
                  const isSelected = resolutionType === opt.value;
                  return (
                    <Box
                      key={opt.value}
                      onClick={() => setResolutionType(opt.value)}
                      sx={{
                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden',
                        border: `2px solid ${isSelected ? theme.palette.custom.status.success.main : theme.palette.custom.border.light}`,
                        bgcolor: 'white',
                        '&:hover': { borderColor: theme.palette.custom.status.success.main },
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{opt.label}</Typography>
                          {isSelected && <CheckCircle sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />}
                        </Box>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.25 }}>{opt.desc}</Typography>
                      </Box>

                      {/* Service fee input — expands when selected */}
                      {isSelected && (
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          sx={{ px: 2, pb: 2, pt: 0.5, borderTop: `1px solid ${theme.palette.custom.border.light}` }}
                        >
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>
                            Service Fee (VND)
                          </Typography>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="e.g. 150000"
                            value={repairCostInput}
                            onChange={(e) => setRepairCostInput(e.target.value.replace(/\D/g, ''))}
                            slotProps={{
                              htmlInput: { inputMode: 'numeric' },
                              input: {
                                endAdornment: repairCostInput ? (
                                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], whiteSpace: 'nowrap', ml: 1 }}>
                                    {Number(repairCostInput).toLocaleString('vi-VN')} VND
                                  </Typography>
                                ) : undefined,
                              },
                            }}
                            sx={{ bgcolor: 'white', borderRadius: '8px' }}
                            helperText="Leave blank to notify customer later"
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Shipping fee — auto */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: theme.palette.custom.status.info.light, border: `1px solid ${theme.palette.custom.status.info.main}20` }}>
                <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.status.info.main, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], lineHeight: 1.5 }}>
                  <strong>Shipping fee (2-way)</strong> is calculated automatically via GHN when you submit — leg 1 (customer → shop) is created immediately, leg 2 (shop → customer) is estimated and confirmed on completion.
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => { setApproveOpen(false); resetApproveDialog(); }} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                onClick={() => setApproveStep(2)}
                sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: '#111', '&:hover': { bgcolor: '#333' } }}
              >
                Next: Review
              </Button>
            </DialogActions>
          </>
        )}

        {/* ---- STEP 2: Summary ---- */}
        {approveStep === 2 && (() => {
          const repair = repairCostInput ? Number(repairCostInput) : null;
          const resolution = RESOLUTION_OPTIONS.find((r) => r.value === resolutionType);
          return (
            <>
              <DialogContent sx={{ pt: 2.5 }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2.5 }}>
                  Review the details below before sending to the customer.
                </Typography>

                {/* Product + claim summary */}
                <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50], mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar variant="rounded" src={selected?.productImageUrl} sx={{ width: 44, height: 44, borderRadius: '8px', bgcolor: theme.palette.custom.neutral[200] }}>
                      <ShoppingBag sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{selected?.productName}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selected?.customerName ?? '—'}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Resolution */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                    Resolution
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.custom.status.success.main}50`, bgcolor: theme.palette.custom.status.success.light }}>
                    <AssignmentTurnedIn sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{resolution?.label}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{resolution?.desc}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Cost breakdown */}
                <Box sx={{ borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden', mb: 2.5 }}>
                  <Box sx={{ px: 2, py: 1.25, bgcolor: theme.palette.custom.neutral[50], borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptLong sx={{ fontSize: 15, color: theme.palette.custom.neutral[600] }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[700], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Cost Breakdown
                    </Typography>
                  </Box>
                  <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Service Fee</Typography>
                      {repair != null ? (
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {repair.toLocaleString('vi-VN')} VND
                        </Typography>
                      ) : (
                        <Chip label="TBD" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 20, bgcolor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping Fee (2-way)</Typography>
                      <Chip label="Auto-calculated on approval" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 20, bgcolor: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main }} />
                    </Box>
                    <Box sx={{ height: 1, bgcolor: theme.palette.custom.border.light }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>Total</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>
                        Confirmed after approval
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* What happens next */}
                <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: theme.palette.custom.status.info.light, border: `1px solid ${theme.palette.custom.status.info.main}30`, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Info sx={{ fontSize: 15, color: theme.palette.custom.status.info.main, mt: 0.1, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], lineHeight: 1.6 }}>
                    After submitting, the customer will be notified to drop off the product at the nearest GHN point. Tracking numbers will be generated automatically for both legs of the shipment.
                  </Typography>
                </Box>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button startIcon={<ArrowBack sx={{ fontSize: 16 }} />} onClick={() => setApproveStep(1)} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                  Back
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="contained"
                  disabled={actioning}
                  onClick={handleApprove}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.success.main, '&:hover': { bgcolor: '#15803d' } }}
                >
                  {actioning ? <CircularProgress size={18} color="inherit" /> : 'Submit Approval'}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* ==================== REJECT DIALOG ==================== */}
      <Dialog open={rejectOpen} onClose={() => { setRejectOpen(false); setRejectReason(''); }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.palette.custom.status.error.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cancel sx={{ fontSize: 20, color: theme.palette.custom.status.error.main }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Reject Warranty Claim</Typography>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selected?.claimNumber}</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 2 }}>
            Please provide a clear reason. The customer will see this message.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            size="small"
            placeholder="e.g. The damage is not covered under warranty as it appears to be caused by physical impact..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setRejectOpen(false); setRejectReason(''); }} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actioning || !rejectReason.trim()}
            onClick={handleReject}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px' }}
          >
            {actioning ? <CircularProgress size={18} color="inherit" /> : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopWarrantyPage;
