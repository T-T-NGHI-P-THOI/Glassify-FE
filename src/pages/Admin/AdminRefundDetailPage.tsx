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
import { formatCurrency, formatNumber, parseNumber } from '@/utils/formatCurrency';
import { getApiErrorMessage } from '@/utils/api-error';
import { SHOP_APPEAL_REASON_LABELS, SHOP_APPEAL_STATUS_LABELS, ShopAppealStatus, RefundReviewDecision } from '@/models/Refund';

const isVideoFile = (url?: string) => {
  if (!url) return false;
  return /\.(mp4|mov|webm|ogg|m4v|avi)(\?|#|$)/i.test(url.toLowerCase()) || url.includes('/video/');
};

const REFUND_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested', APPROVED: 'Approved', REJECTED: 'Rejected',
  RETURN_READY_TO_PICK: 'Ready for Pickup',
  RETURN_SHIPPING: 'Return Shipping', ITEM_RECEIVED: 'Item Received',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const REFUND_DECISION_LABEL: Record<string, string> = {
  REFUND_WITHOUT_RETURN: 'Refund Without Return',
  RETURN_AND_REFUND: 'Return and Refund',
  REJECT: 'Reject Request',
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

const humanizeStatusText = (value?: string) => {
  if (!value) return '—';

  return (
    REFUND_STATUS_LABEL[value] ??
    value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
};

const getRefundStatusLabel = (status?: string) => humanizeStatusText(status);

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
  const [submitting, setSubmitting] = useState(false);

  // Refund review dialog states
  const [refundReviewDialogOpen, setRefundReviewDialogOpen] = useState(false);
  const [refundDecision, setRefundDecision] = useState<RefundReviewDecision>(RefundReviewDecision.REFUND_WITHOUT_RETURN);
  const [refundRejectionReason, setRefundRejectionReason] = useState('');
  const [refundReturnInstructions, setRefundReturnInstructions] = useState('');
  const [refundSellerPaysShipping, setRefundSellerPaysShipping] = useState(false);
  const [refundSubmitting, setRefundSubmitting] = useState(false);

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

    const amountValue = compensationAmount.trim() ? parseNumber(compensationAmount) : undefined;
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

  const handleReviewRefund = async () => {
    if (!refundId) return;

    if (refundDecision === RefundReviewDecision.REJECT && !refundRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setRefundSubmitting(true);
      await adminApi.reviewRefund(refundId, {
        refundDecision,
        rejectionReason: refundDecision === RefundReviewDecision.REJECT ? refundRejectionReason.trim() : undefined,
        returnInstructions: refundReturnInstructions.trim() || undefined,
        sellerPaysShipping: refundSellerPaysShipping || undefined,
      });
      toast.success('Refund request reviewed successfully');
      setRefundReviewDialogOpen(false);
      setRefundDecision(RefundReviewDecision.REFUND_WITHOUT_RETURN);
      setRefundRejectionReason('');
      setRefundReturnInstructions('');
      setRefundSellerPaysShipping(false);
      await fetchRefundDetail();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to review refund request'));
    } finally {
      setRefundSubmitting(false);
    }
  };

  const canReviewAppeal = refund?.shopAppealStatus === ShopAppealStatus.SUBMITTED;
  const canReviewRefund = refund?.status === 'REQUESTED';

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
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  Request #{refund.requestNumber}
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mt: 0.5 }}>
                  Submitted: {formatDate(refund.requestedAt)}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Chip label={RETURN_TYPE_LABEL[refund.returnType] ?? refund.returnType} variant="outlined" sx={{ fontWeight: 600 }} />
                <Chip label={getRefundStatusLabel(refund.status)} color={statusColor(refund.status)} sx={{ fontWeight: 600 }} />
              </Stack>
            </Box>

            {/* Main detail block */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
              {canReviewRefund && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 3, pt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setRefundReviewDialogOpen(true)}
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    Make Decision
                  </Button>
                </Box>
              )}

              {/* Row 1: Product | Request Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Product</SectionLabel>
                  {refund.productImageUrl && (
                    <Box component="img" src={refund.productImageUrl} sx={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 1, mb: 1.5 }} />
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

              {/* Row 1.5: Customer Information */}
              <Box sx={{ p: 3 }}>
                <SectionLabel>Customer Information</SectionLabel>
                <FieldRow label="Customer name" value={refund.orderName || '—'} />
                <FieldRow label="Phone" value={refund.orderPhone || '—'} />
                <FieldRow label="Address" value={refund.orderAddress || '—'} />
              </Box>

              <Divider />

              {/* Row 2: Resolution | Timeline */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionLabel>Resolution</SectionLabel>
                  <FieldRow label="Status" value={<Chip size="small" label={getRefundStatusLabel(refund.status)} color={statusColor(refund.status)} />} />
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
                <SectionLabel>Customer Evidence</SectionLabel>
                <FieldRow
                  label="Evidence files"
                  value={
                    (refund.evidenceImages && refund.evidenceImages.length > 0) ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {refund.evidenceImages.map((url, idx) => (
                          <Box
                            key={`evidence-${idx}`}
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 1,
                              overflow: 'hidden',
                              display: 'block',
                              border: `1px solid ${theme.palette.custom.border.light}`,
                            }}
                          >
                            {isVideoFile(url) ? (
                              <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                            ) : (
                              <Box component="img" src={url} alt={`Evidence ${idx + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      '—'
                    )
                  }
                />
              </Box>
            <Divider />
              {/* Row 4: Customer Evidence */}
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
                <FieldRow
                  label="Appeal evidence"
                  value={
                    (refund.shopAppealEvidenceImages && refund.shopAppealEvidenceImages.length > 0) ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {refund.shopAppealEvidenceImages!.map((url, idx) => (
                          <Box
                            key={`appeal-evidence-${idx}`}
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 1,
                              overflow: 'hidden',
                              display: 'block',
                              border: `1px solid ${theme.palette.custom.border.light}`,
                            }}
                          >
                            {isVideoFile(url) ? (
                              <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                            ) : (
                              <Box component="img" src={url} alt={`Appeal evidence ${idx + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : `${refund.shopAppealEvidenceImages?.length ?? 0} file(s)`
                  }
                />
                <FieldRow label="Admin review note" value={refund.adminAppealReviewNote || '—'} />
                <FieldRow
                  label="Compensation"
                  value={typeof refund.shopCompensationAmount === 'number' ? formatCurrency(refund.shopCompensationAmount) : '—'}
                />
                <FieldRow label="Compensated at" value={formatDate(refund.shopCompensatedAt)} />

                {canReviewAppeal && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>Shop appeal is waiting for admin review.</Alert>
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

      {/* Review Refund Request Dialog */}
      <Dialog open={refundReviewDialogOpen} onClose={() => setRefundReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Review Refund Request</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.disabled' }}>
                Decision
              </Typography>
              <FormControl fullWidth>
                <RadioGroup
                  value={refundDecision}
                  onChange={(e) => setRefundDecision(e.target.value as RefundReviewDecision)}
                >
                  <FormControlLabel
                    value={RefundReviewDecision.REFUND_WITHOUT_RETURN}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{REFUND_DECISION_LABEL[RefundReviewDecision.REFUND_WITHOUT_RETURN]}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Refund customer without requiring return of item</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value={RefundReviewDecision.RETURN_AND_REFUND}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{REFUND_DECISION_LABEL[RefundReviewDecision.RETURN_AND_REFUND]}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Approve return and refund after item received</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value={RefundReviewDecision.REJECT}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{REFUND_DECISION_LABEL[RefundReviewDecision.REJECT]}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Reject the refund request</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {refundDecision === RefundReviewDecision.REJECT && (
              <TextField
                label="Rejection Reason"
                multiline
                rows={3}
                value={refundRejectionReason}
                onChange={(e) => setRefundRejectionReason(e.target.value)}
                placeholder="Explain why the refund request is rejected"
                required
              />
            )}

            {refundDecision === RefundReviewDecision.RETURN_AND_REFUND && (
              <>
                <TextField
                  label="Return Instructions"
                  multiline
                  rows={3}
                  value={refundReturnInstructions}
                  onChange={(e) => setRefundReturnInstructions(e.target.value)}
                  placeholder="Provide instructions for the customer on how to return the item"
                />
                <FormControlLabel
                  control={<Radio checked={refundSellerPaysShipping} onChange={(e) => setRefundSellerPaysShipping(e.target.checked)} />}
                  label="Seller pays shipping cost for return"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundReviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleReviewRefund}
            disabled={refundSubmitting}
            color={refundDecision === RefundReviewDecision.REJECT ? 'error' : 'primary'}
          >
            {refundSubmitting ? 'Processing...' : 'Submit Decision'}
          </Button>
        </DialogActions>
      </Dialog>

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
                type="text"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: '0' }}
                value={compensationAmount ? formatNumber(parseNumber(compensationAmount)) : ''}
                onChange={(e) => setCompensationAmount(e.target.value.replace(/\D/g, ''))}
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
    </Box>
  );
};

export default AdminRefundDetailPage;
