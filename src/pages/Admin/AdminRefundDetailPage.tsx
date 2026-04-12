import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Paper,
  Stack,
  TextField,
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
import { getApiErrorMessage } from '@/utils/api-error';
import { RefundDecision, SHOP_APPEAL_REASON_LABELS, SHOP_APPEAL_STATUS_LABELS, ShopAppealStatus } from '@/models/Refund';

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
  return new Date(v).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewApproved, setReviewApproved] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestReviewMode, setRequestReviewMode] = useState<'approve' | 'reject'>('approve');
  const [approvalFlowType, setApprovalFlowType] = useState<'RETURN_AND_REFUND' | 'DIRECT_REFUND'>('RETURN_AND_REFUND');
  const [requestRejectionReason, setRequestRejectionReason] = useState('');
  const [requestReturnInstruction, setRequestReturnInstruction] = useState('');
  const [requestShopCoverShipping, setRequestShopCoverShipping] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRefundDetail = async () => {
    if (!refundId) return;
    setLoading(true);
    try {
      const res = await adminApi.getRefundById(refundId);
      if (res.data) setRefund(res.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to load refund request'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundDetail();
  }, [refundId]);

  const handleReviewAppeal = async () => {
    if (!refundId) return;

    const amountValue = compensationAmount.trim() ? Number(compensationAmount) : undefined;
    if (reviewApproved && (amountValue === undefined || Number.isNaN(amountValue) || amountValue < 0)) {
      toast.error('Please enter a valid compensation amount');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.reviewShopAppeal(refundId, {
        approved: reviewApproved,
        reviewNote: reviewNote.trim() || undefined,
        compensationAmount: reviewApproved ? amountValue : undefined,
      });
      toast.success('Appeal reviewed successfully');
      setReviewDialogOpen(false);
      setReviewApproved(true);
      setReviewNote('');
      setCompensationAmount('');
      await fetchRefundDetail();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to review appeal'));
    } finally {
      setSubmitting(false);
    }
  };

  const canReviewAppeal = refund?.shopAppealStatus === ShopAppealStatus.SUBMITTED;
  const canReviewRequest = refund?.status === 'REQUESTED';
  const isShippingFeeExemptReason = refund?.reason === 'NOT_RECEIVED';

  const handleOpenRequestDialog = (mode: 'approve' | 'reject') => {
    setRequestReviewMode(mode);
    setRequestDialogOpen(true);
  };

  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
    setRequestReviewMode('approve');
    setApprovalFlowType('RETURN_AND_REFUND');
    setRequestRejectionReason('');
    setRequestReturnInstruction('');
    setRequestShopCoverShipping(true);
  };

  const handleReviewRequest = async () => {
    if (!refundId) return;

    if (requestReviewMode === 'reject' && !requestRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (
      requestReviewMode === 'approve'
      && approvalFlowType === 'RETURN_AND_REFUND'
      && !requestReturnInstruction.trim()
    ) {
      toast.error('Please provide return instructions');
      return;
    }

    const effectiveShopCoverShipping =
      requestReviewMode === 'approve' && approvalFlowType === 'RETURN_AND_REFUND'
        ? (isShippingFeeExemptReason ? false : requestShopCoverShipping)
        : undefined;

    try {
      setSubmitting(true);
      const refundDecision =
        requestReviewMode === 'reject'
          ? RefundDecision.REJECT
          : approvalFlowType === 'DIRECT_REFUND'
            ? RefundDecision.REFUND_WITHOUT_RETURN
            : RefundDecision.RETURN_AND_REFUND;

      await adminApi.reviewRefundRequest(refundId, {
        approved: requestReviewMode === 'approve',
        refundDecision,
        rejectionReason: requestReviewMode === 'reject' ? requestRejectionReason.trim() : undefined,
        returnInstruction:
          requestReviewMode === 'approve' && approvalFlowType === 'RETURN_AND_REFUND'
            ? requestReturnInstruction.trim()
            : undefined,
        sellerPaysShipping: effectiveShopCoverShipping,
        // Backward compatibility for older API wiring.
        decision: refundDecision,
        returnInstructions:
          requestReviewMode === 'approve' && approvalFlowType === 'RETURN_AND_REFUND'
            ? requestReturnInstruction.trim()
            : undefined,
        shopCoverShipping: effectiveShopCoverShipping,
      });

      toast.success(
        requestReviewMode === 'approve'
          ? 'Refund request approved successfully'
          : 'Refund request rejected successfully',
      );
      handleCloseRequestDialog();
      await fetchRefundDetail();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to review refund request'));
    } finally {
      setSubmitting(false);
    }
  };

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
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end', rowGap: 1 }}>
                {canReviewRequest && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenRequestDialog('reject')}
                      sx={{ textTransform: 'none', fontSize: 13, fontWeight: 700, minHeight: 36, px: 2 }}
                    >
                      Reject Request
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleOpenRequestDialog('approve')}
                      sx={{ textTransform: 'none', fontSize: 13, fontWeight: 700, minHeight: 36, px: 2.2 }}
                    >
                      Review Request
                    </Button>
                  </>
                )}
                <Chip label={RETURN_TYPE_LABEL[refund.returnType] ?? refund.returnType} variant="outlined" sx={{ fontWeight: 600 }} />
                <Chip label={REFUND_STATUS_LABEL[refund.status] ?? refund.status} color={statusColor(refund.status)} sx={{ fontWeight: 600 }} />
              </Stack>
            </Box>

            {canReviewRequest && (
              <Alert severity="info">
                Review this request before the shop handles return logistics or refund processing.
              </Alert>
            )}

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
                    <FieldRow
                      label="Admin decision"
                      value={
                        (refund.adminRefundDecision ?? refund.refundDecision)
                          ? (refund.adminRefundDecision ?? refund.refundDecision) === RefundDecision.REFUND_WITHOUT_RETURN
                            ? 'Refund without return'
                            : (refund.adminRefundDecision ?? refund.refundDecision) === RefundDecision.RETURN_AND_REFUND
                              ? 'Return and refund'
                              : 'Partial refund'
                          : '—'
                      }
                    />
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

              <Divider />

              {/* Row 3: Appeal */}
              <Box sx={{ p: 3 }}>
                <SectionLabel>Shop Appeal</SectionLabel>
                <FieldRow
                  label="Appeal status"
                  value={
                    <Chip
                      size="small"
                      color={
                        refund.shopAppealStatus === ShopAppealStatus.APPROVED
                          ? 'success'
                          : refund.shopAppealStatus === ShopAppealStatus.SUBMITTED
                            ? 'warning'
                            : refund.shopAppealStatus === ShopAppealStatus.REJECTED || refund.shopAppealStatus === ShopAppealStatus.EXPIRED
                              ? 'error'
                              : 'default'
                      }
                      label={SHOP_APPEAL_STATUS_LABELS[refund.shopAppealStatus ?? ShopAppealStatus.NONE]}
                    />
                  }
                />
                <FieldRow label="Appealed at" value={formatDate(refund.shopAppealedAt)} />
                <FieldRow
                  label="Appeal reason"
                  value={refund.shopAppealReason ? SHOP_APPEAL_REASON_LABELS[refund.shopAppealReason] : '—'}
                />
                <FieldRow label="Appeal detail" value={refund.shopAppealDetail || '—'} />
                <FieldRow label="Appeal evidence" value={`${refund.shopAppealEvidenceImages?.length ?? 0} file(s)`} />
                <FieldRow label="Admin review note" value={refund.adminAppealReviewNote || '—'} />
                <FieldRow
                  label="Compensation"
                  value={typeof refund.shopCompensationAmount === 'number' ? formatCurrency(refund.shopCompensationAmount) : '—'}
                />
                <FieldRow label="Compensated at" value={formatDate(refund.shopCompensatedAt)} />

                {canReviewAppeal && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>Shop appeal is waiting for Glassify review.</Alert>
                    <Button variant="contained" onClick={() => setReviewDialogOpen(true)}>
                      Review Appeal
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Stack>
        )}
      </Box>

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Shop Appeal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl>
              <RadioGroup
                value={reviewApproved ? 'approve' : 'reject'}
                onChange={(e) => setReviewApproved(e.target.value === 'approve')}
              >
                <FormControlLabel value="approve" control={<Radio />} label="Approve appeal and compensate shop" />
                <FormControlLabel value="reject" control={<Radio />} label="Reject appeal" />
              </RadioGroup>
            </FormControl>

            {reviewApproved && (
              <TextField
                label="Compensation Amount"
                type="number"
                inputProps={{ min: '0', step: '1000' }}
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(e.target.value)}
              />
            )}

            <TextField
              label="Review Note"
              multiline
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Explain your decision"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReviewAppeal} disabled={submitting}>
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={requestDialogOpen} onClose={handleCloseRequestDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 19, fontWeight: 700, pb: 1 }}>
          {requestReviewMode === 'approve' ? 'Approve Refund Request' : 'Reject Refund Request'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {requestReviewMode === 'approve' ? (
              <>
                <FormControl>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                    Approval flow
                  </Typography>
                  <RadioGroup
                    value={approvalFlowType}
                    onChange={(e) => setApprovalFlowType(e.target.value as 'RETURN_AND_REFUND' | 'DIRECT_REFUND')}
                  >
                    <FormControlLabel
                      value="RETURN_AND_REFUND"
                      control={<Radio />}
                      label={<Typography sx={{ fontSize: 14 }}>Return and refund flow</Typography>}
                    />
                    <FormControlLabel
                      value="DIRECT_REFUND"
                      control={<Radio />}
                      label={<Typography sx={{ fontSize: 14 }}>Direct refund now</Typography>}
                    />
                  </RadioGroup>
                </FormControl>

                {approvalFlowType === 'RETURN_AND_REFUND' ? (
                  <>
                    <TextField
                      label="Return Instructions"
                      multiline
                      rows={3}
                      size="small"
                      value={requestReturnInstruction}
                      onChange={(e) => setRequestReturnInstruction(e.target.value)}
                      placeholder="Explain where and how buyer should return the item"
                    />
                    <FormControl>
                      <RadioGroup
                        value={(isShippingFeeExemptReason ? false : requestShopCoverShipping) ? 'shop' : 'buyer'}
                        onChange={(e) => setRequestShopCoverShipping(e.target.value === 'shop')}
                      >
                        <FormControlLabel
                          value="shop"
                          control={<Radio />}
                          disabled={isShippingFeeExemptReason}
                          label={<Typography sx={{ fontSize: 14 }}>Shop covers return shipping</Typography>}
                        />
                        <FormControlLabel
                          value="buyer"
                          control={<Radio />}
                          disabled={isShippingFeeExemptReason}
                          label={<Typography sx={{ fontSize: 14 }}>Buyer covers return shipping</Typography>}
                        />
                      </RadioGroup>
                    </FormControl>
                    {isShippingFeeExemptReason && (
                      <Alert severity="warning" sx={{ fontSize: 13 }}>
                        This request reason is Not Received. Shipping fee is exempt for the shop under policy.
                      </Alert>
                    )}
                  </>
                ) : (
                  <Alert severity="warning" sx={{ fontSize: 13 }}>
                    Direct refund will submit approval without return instructions. Final handling depends on backend policy.
                  </Alert>
                )}
              </>
            ) : (
              <TextField
                label="Rejection Reason"
                multiline
                rows={3}
                size="small"
                value={requestRejectionReason}
                onChange={(e) => setRequestRejectionReason(e.target.value)}
                placeholder="Explain why this refund request is rejected"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseRequestDialog}
            sx={{ textTransform: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReviewRequest}
            disabled={submitting}
            sx={{ textTransform: 'none', fontSize: 13, fontWeight: 700, px: 2.5 }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminRefundDetailPage;
