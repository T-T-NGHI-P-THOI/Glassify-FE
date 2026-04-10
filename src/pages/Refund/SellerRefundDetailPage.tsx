import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Avatar,
  Stack,
  CircularProgress,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  CheckCircle,
  ArrowBack,
  ThumbUp,
  ThumbDown,
  LocalShipping,
  Inventory,
  Image as ImageIcon,
  Videocam,
  VerifiedUser,
  AttachFile,
  Person,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLayout } from '@/layouts/LayoutContext';
import { useAuth } from '@/hooks/useAuth';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import {
  getReturnRequestDetail,
  reviewReturnRequest,
  confirmItemReceived,
  processRefund,
  getReturnGhnStatus,
} from '@/api/refund-api';
import { userApi } from '@/api/service/userApi';
import type { RefundRequest } from '@/models/Refund';
import {
  ReturnStatus,
  RETURN_STATUS_LABELS,
  RETURN_REASON_LABELS,
  ItemCondition,
  ITEM_CONDITION_LABELS,
  RefundProcessType,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';
import { getApiErrorMessage } from '@/utils/api-error';

type BuyerInfo = {
  name: string;
  email: string;
  phone: string;
};

type StepItem = { label: string; status: ReturnStatus };

const toNumberIfValid = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const findMinRequiredAmount = (value: unknown): number | null => {
  if (!value) {
    return null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const direct =
    toNumberIfValid(record.minRequiredAmount) ??
    toNumberIfValid(record.min_required_amount) ??
    toNumberIfValid(record.minimumRequiredAmount);

  if (direct !== null) {
    return direct;
  }

  for (const nestedValue of Object.values(record)) {
    if (Array.isArray(nestedValue)) {
      for (const item of nestedValue) {
        const found = findMinRequiredAmount(item);
        if (found !== null) {
          return found;
        }
      }
      continue;
    }

    const found = findMinRequiredAmount(nestedValue);
    if (found !== null) {
      return found;
    }
  }

  return null;
};

const getMinRequiredAmountFromError = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const err = error as {
    response?: { data?: unknown };
    originalError?: { response?: { data?: unknown } };
    errors?: unknown;
  };

  return (
    findMinRequiredAmount(err.response?.data) ??
    findMinRequiredAmount(err.originalError?.response?.data) ??
    findMinRequiredAmount(err.errors)
  );
};

const getStatusSteps = (status: ReturnStatus): StepItem[] => {
  const normalSteps: StepItem[] = [
    { label: 'Request Submitted', status: ReturnStatus.REQUESTED },
    { label: 'Approved', status: ReturnStatus.APPROVED },
    // { label: 'Ready to Pick', status: ReturnStatus.RETURN_READY_TO_PICK },
    { label: 'Transporting', status: ReturnStatus.RETURN_SHIPPING },
    { label: 'Delivered', status: ReturnStatus.RETURN_DELIVERED },
    { label: 'Item Received', status: ReturnStatus.ITEM_RECEIVED },
    { label: 'Completed', status: ReturnStatus.COMPLETED },
  ];

  if (status === ReturnStatus.REJECTED || status === ReturnStatus.CANCELLED) {
    return [
      { label: 'Request Submitted', status: ReturnStatus.REQUESTED },
      {
        label: status === ReturnStatus.REJECTED ? 'Rejected' : 'Cancelled',
        status,
      },
    ];
  }

  return normalSteps;
};

const getActiveStep = (status: ReturnStatus, steps: StepItem[]) => {
  const index = steps.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
};

const getStatusColor = (status: ReturnStatus): 'warning' | 'success' | 'info' | 'error' | 'info' => {
  switch (status) {
    case ReturnStatus.REQUESTED:
      return 'warning';
    case ReturnStatus.APPROVED:
    case ReturnStatus.RETURN_READY_TO_PICK:
    case ReturnStatus.RETURN_SHIPPING:
      return 'info';
    case ReturnStatus.RETURN_DELIVERED:
    case ReturnStatus.ITEM_RECEIVED:
    case ReturnStatus.COMPLETED:
      return 'success';
    case ReturnStatus.REJECTED:
    case ReturnStatus.CANCELLED:
      return 'error';
    default:
      return 'info';
  }
};

const SellerRefundDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setShowNavbar, setShowFooter } = useLayout();
  const { user } = useAuth();
  const { requestId } = useParams<{ requestId: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RefundRequest | null>(null);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({ name: 'N/A', email: 'N/A', phone: 'N/A' });
  const [buyerLoading, setBuyerLoading] = useState(false);
  
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnInstructions, setReturnInstructions] = useState('');
  const [sellerPaysShipping, setSellerPaysShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemCondition, setItemCondition] = useState<ItemCondition>(ItemCondition.GOOD);
  const [conditionNotes, setConditionNotes] = useState('');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState<RefundProcessType>(RefundProcessType.FULL);
  const [partialAmount, setPartialAmount] = useState('');
  const [minRequiredAmount, setMinRequiredAmount] = useState<number | null>(null);
  
  const [ghnStatusData, setGhnStatusData] = useState<any>(null);
  const [fetchingGhn, setFetchingGhn] = useState(false);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const fetchRequestDetail = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const response = await getReturnRequestDetail(requestId);
      if (response.data) {
        setRequest(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch request detail:', error);
      toast.error(getApiErrorMessage(error, 'Unable to load information'));
      navigate('/shop/refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  useEffect(() => {
    const fetchBuyerInfo = async () => {
      if (!request?.userId) return;
      try {
        setBuyerLoading(true);
        const response = await userApi.getUserByIdentifier(request.userId);
        const rawData = response.data as any;
        const u = rawData?.user ?? rawData;
        setBuyerInfo({
          name: u?.fullName || request.buyerName || 'N/A',
          email: u?.email || request.buyerEmail || 'N/A',
          phone: u?.phone || u?.phoneNumber || request.buyerPhone || 'N/A',
        });
      } catch (error) {
        setBuyerInfo({
          name: request.buyerName || 'N/A',
          email: request.buyerEmail || 'N/A',
          phone: request.buyerPhone || 'N/A',
        });
      } finally {
        setBuyerLoading(false);
      }
    };
    fetchBuyerInfo();
  }, [request]);

  const handleOpenReviewDialog = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setRejectionReason('');
    setReturnInstructions('');
    setSellerPaysShipping(false);
  };

  const handleSubmitReview = async () => {
    if (!requestId) return;
    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Reason required');
      return;
    }
    if (reviewAction === 'approve' && !returnInstructions.trim()) {
      toast.error('Instructions required');
      return;
    }
    try {
      setSubmitting(true);
      await reviewReturnRequest(requestId, {
        approved: reviewAction === 'approve',
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
        returnInstruction: reviewAction === 'approve' ? returnInstructions : undefined,
        shopCoverShipping: reviewAction === 'approve' ? sellerPaysShipping : undefined,
      });
      toast.success('Action successful');
      handleCloseReviewDialog();
      await fetchRequestDetail();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Error processing request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!requestId) return;
    try {
      setSubmitting(true);
      await confirmItemReceived(requestId, {
        itemCondition,
        itemConditionNote: conditionNotes,
        meetsReturnCriteria: true,
      });
      toast.success('Received confirmed');
      setConfirmDialogOpen(false);
      await fetchRequestDetail();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Error confirming receipt'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!requestId) return;
    
    // Validation for partial refund
    if (refundType === RefundProcessType.PARTIAL) {
      if (!partialAmount.trim()) {
        toast.error('Please enter partial refund amount');
        return;
      }
      const amount = parseFloat(partialAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Partial amount must be greater than 0');
        return;
      }
      if (amount > (request?.refundAmount || 0)) {
        toast.error(`Partial amount cannot exceed refund amount of ${formatCurrency(request?.refundAmount || 0)}`);
        return;
      }
      if (amount < 0.01) {
        toast.error('Partial amount must be at least 0.01');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      await processRefund(requestId, {
        refundType,
        partialAmount: refundType === RefundProcessType.PARTIAL ? parseFloat(partialAmount) : undefined,
      });
      toast.success('Refund completed');
      setRefundDialogOpen(false);
      setRefundType(RefundProcessType.FULL);
      setPartialAmount('');
      setMinRequiredAmount(null);
      await fetchRequestDetail();
    } catch (error: any) {
      const extractedMinRequiredAmount = getMinRequiredAmountFromError(error);
      if (extractedMinRequiredAmount !== null) {
        setMinRequiredAmount(extractedMinRequiredAmount);
        toast.error(
          `Partial refund amount is too low. Minimum required amount is ${formatCurrency(extractedMinRequiredAmount)}.`
        );
        return;
      }

      toast.error(getApiErrorMessage(error, 'Error processing refund'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackGhnStatus = async () => {
    if (!requestId) return;
    try {
      setFetchingGhn(true);
      const res = await getReturnGhnStatus(requestId);
      setGhnStatusData(res.data);
    } catch (error) {
      toast.error('Tracking failed');
    } finally {
      setFetchingGhn(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isVideoFile = (url: string) => /\.(mp4|mov|webm|ogg|m4v|avi)(\?|#|$)/i.test(url.toLowerCase()) || url.includes('/video/');

  if (loading) return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <ShopOwnerSidebar activeMenu={PAGE_ENDPOINTS.SHOP.REFUND_REVIEW} shopName={user?.shop?.shopName} />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
    </Box>
  );

  if (!request) return <Typography>Not Found</Typography>;

  const canReview = request.status === ReturnStatus.REQUESTED;
  const canConfirmReceived = request.status === ReturnStatus.RETURN_DELIVERED;
  const canProcessRefund = request.status === ReturnStatus.ITEM_RECEIVED && !!request.itemReceivedAt;
  const steps = getStatusSteps(request.status);
  const activeStep = getActiveStep(request.status, steps);
  const evidenceFiles = request.evidenceImages || [];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.REFUND_REVIEW}
        shopName={user?.shop?.shopName}
        shopLogo={user?.shop?.logoUrl}
        ownerName={user?.fullName}
        ownerEmail={user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ 
          maxWidth: 1600, 
          mx: 'auto', 
          px: { xs: 3, md: 6 }, 
          py: 4 
        }}>
          {/* Header Area */}
          <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
            <Box>
              <Button 
                startIcon={<ArrowBack />} 
                onClick={() => navigate('/shop/refunds/review')} 
                sx={{ mb: 1.5, color: theme.palette.custom.neutral[500], '&:hover': { bgcolor: 'transparent', color: theme.palette.custom.neutral[800] } }}
              >
                Back to List
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.custom.neutral[900] }}>
                  Request #{request.requestNumber}
                </Typography>
                <Chip 
                  label={RETURN_STATUS_LABELS[request.status]} 
                  sx={{ 
                    bgcolor: (theme.palette as any)[getStatusColor(request.status)].light, 
                    color: (theme.palette as any)[getStatusColor(request.status)].main,
                    fontWeight: 700,
                    borderRadius: 1.5
                  }} 
                />
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.custom.neutral[500], mt: 1 }}>
                Submitted on {formatDate(request.requestedAt)} • Order <b>#{request.orderNumber}</b>
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              {canReview && (
                <>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={() => handleOpenReviewDialog('reject')}
                    sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600 }}
                  >
                    Reject Request
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => handleOpenReviewDialog('approve')}
                    sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600, bgcolor: theme.palette.custom.neutral[900] }}
                  >
                    Approve & Instructions
                  </Button>
                </>
              )}
              {canConfirmReceived && (
                <Button 
                  variant="contained" 
                  onClick={() => setConfirmDialogOpen(true)}
                  sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600 }}
                >
                  Confirm Item Received
                </Button>
              )}
              {canProcessRefund && (
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={() => setRefundDialogOpen(true)}
                  sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 600 }}
                >
                  Confirm Refund
                </Button>
              )}
            </Stack>
          </Box>

          {/* Stepper Progress */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: 'white' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((s) => (
                <Step key={s.status}>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[700] }}>
                      {s.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Grid container spacing={4}>
            {/* Left Content */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={4}>
                {/* Product Detail Card */}
                <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                  <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], fontSize: 16 }}>
                      Product Information
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3, display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                    <Avatar 
                      src={request.productImageUrl} 
                      variant="rounded" 
                      sx={{ width: 120, height: 120, borderRadius: 3, border: `1px solid ${theme.palette.custom.border.light}` }} 
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{request.productName}</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.custom.neutral[500], fontFamily: 'monospace' }}>
                            SKU: {request.productSku}
                          </Typography>
                        </Box>
                        <Chip label={request.returnType} color="primary" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1 }} />
                      </Box>
                      
                      <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[400], display: 'block' }}>Quantity</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{request.quantity}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[400], display: 'block' }}>Reason</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{RETURN_REASON_LABELS[request.reason]}</Typography>
                        </Grid>
                        {request.exchangeVariantInfo && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[400], display: 'block' }}>Exchange For</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{request.exchangeVariantInfo}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Box>
                </Paper>

                {/* Evidence Section - Higher Up and More Prominent */}
                <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                  <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], fontSize: 16 }}>
                      Customer Evidence & Notes
                    </Typography>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    {request.reasonDetail && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[500], fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                          Customer Note
                        </Typography>
                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f1f5f9', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                          <Typography sx={{ fontSize: 15, color: '#334155', lineHeight: 1.6 }}>{request.reasonDetail}</Typography>
                        </Paper>
                      </Box>
                    )}

                    <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[500], fontWeight: 700, textTransform: 'uppercase', mb: 2, display: 'block' }}>
                      Visual Evidence ({evidenceFiles.length})
                    </Typography>
                    
                    {evidenceFiles.length > 0 ? (
                      <Grid container spacing={2}>
                        {evidenceFiles.map((url, i) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Box 
                              sx={{ 
                                borderRadius: 3, 
                                overflow: 'hidden', 
                                border: `1px solid ${theme.palette.custom.border.light}`,
                                position: 'relative',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' }
                              }}
                            >
                              {isVideoFile(url) ? (
                                <video src={url} controls style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                              ) : (
                                <Box 
                                  component="img" 
                                  src={url} 
                                  sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', cursor: 'zoom-in' }} 
                                  onClick={() => window.open(url, '_blank')}
                                />
                              )}
                              <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                                <Chip 
                                  icon={isVideoFile(url) ? <Videocam sx={{ fontSize: '14px !important' }} /> : <ImageIcon sx={{ fontSize: '14px !important' }} />}
                                  label={isVideoFile(url) ? 'Video' : 'Image'} 
                                  size="small" 
                                  sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 10, height: 20 }} 
                                />
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 3 }}>
                        <Typography color="text.secondary">No visual evidence provided</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Stack>
            </Grid>

            {/* Right Sidebar */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                {/* Financial Card */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4, 
                    bgcolor: '#1e293b', 
                    color: 'white', 
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography sx={{ opacity: 0.6, fontSize: 13, fontWeight: 600 }}>Refund Amount</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>{formatCurrency(request.refundAmount)}</Typography>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ opacity: 0.6, fontSize: 13 }}>Auto Approval</Typography>
                      <Chip 
                        label={request.autoApprovalEligible ? 'Eligible' : 'Not Eligible'} 
                        size="small" 
                        sx={{ bgcolor: request.autoApprovalEligible ? '#22c55e' : '#64748b', color: 'white', fontWeight: 700, fontSize: 10 }} 
                      />
                    </Box>
                  </Box>
                  {/* Decorative background circle */}
                  <Box sx={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />
                </Paper>

                {/* Logistics Info */}
                <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.custom.border.light}`, p: 3 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ color: theme.palette.primary.main }} /> Logistics Details
                  </Typography>
                  {request.returnTrackingNumber ? (
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[400], fontWeight: 700 }}>Tracking ID</Typography>
                        <Typography sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: 18, mt: 0.5 }}>
                          {request.returnTrackingNumber}
                        </Typography>
                      </Box>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={handleTrackGhnStatus} 
                        disabled={fetchingGhn}
                        sx={{ borderRadius: 1.5, textTransform: 'none' }}
                      >
                        {fetchingGhn ? <CircularProgress size={20} /> : 'Track Package Status'}
                      </Button>
                      {ghnStatusData && (
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.primary.main, display: 'block', mb: 0.5 }}>
                            {ghnStatusData.status?.toUpperCase()}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: 12 }}>{ghnStatusData.location || 'Status updated from carrier'}</Typography>
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Waiting for buyer to return item...</Typography>
                  )}
                </Paper>

                {/* Customer Info Card */}
                <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.custom.border.light}`, p: 3 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ color: theme.palette.secondary.main }} /> Buyer Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.light', color: 'secondary.main', fontWeight: 800 }}>
                      {buyerInfo.name[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{buyerLoading ? <Skeleton width={100} /> : buyerInfo.name}</Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.custom.neutral[500] }}>{buyerInfo.email}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ bgcolor: '#f1f5f9', p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[500], fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                      Primary Phone
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>
                      {buyerLoading ? 'Loading...' : buyerInfo.phone || '—'}
                    </Typography>
                  </Box>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Dialogs... same logic but restyle headers */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={handleCloseReviewDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3 }}>
          {reviewAction === 'approve' ? 'Approve Refund Request' : 'Reject Refund Request'}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          {reviewAction === 'approve' ? (
            <Stack spacing={3} sx={{ py: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Approve this request if the item is eligible for return. Provide clear instructions for the customer.
              </Alert>
              <TextField 
                label="Return Instructions" 
                multiline 
                rows={4} 
                fullWidth 
                placeholder="Where should the customer send the item? What items should be included in the package?"
                value={returnInstructions} 
                onChange={(e) => setReturnInstructions(e.target.value)} 
              />
              <FormControlLabel 
                control={<Checkbox checked={sellerPaysShipping} onChange={(e) => setSellerPaysShipping(e.target.checked)} />} 
                label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>Shop will cover the return shipping fee</Typography>} 
              />
            </Stack>
          ) : (
            <Stack spacing={3} sx={{ py: 2 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Rejecting a request should be based on valid policy reasons.
              </Alert>
              <TextField 
                label="Rejection Reason" 
                multiline 
                rows={4} 
                fullWidth 
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseReviewDialog} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            color={reviewAction === 'approve' ? 'primary' : 'error'} 
            onClick={handleSubmitReview} 
            disabled={submitting}
            sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Received Dialog */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, px: 3, pt: 3 }}>Inspect Returned Item</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ py: 2 }}>
            <FormLabel sx={{ fontWeight: 700, color: 'text.primary', mb: 2, display: 'block' }}>Rate Item Condition</FormLabel>
            <RadioGroup value={itemCondition} onChange={(e) => setItemCondition(e.target.value as ItemCondition)}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, bgcolor: itemCondition === ItemCondition.GOOD ? '#eff6ff' : 'transparent', borderColor: itemCondition === ItemCondition.GOOD ? 'primary.main' : 'divider' }}>
                    <FormControlLabel value={ItemCondition.GOOD} control={<Radio size="small" />} label="Good / Resalable" />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, bgcolor: itemCondition === ItemCondition.DAMAGED ? '#fef2f2' : 'transparent', borderColor: itemCondition === ItemCondition.DAMAGED ? 'error.main' : 'divider' }}>
                    <FormControlLabel value={ItemCondition.DAMAGED} control={<Radio size="small" />} label="Damaged" />
                  </Paper>
                </Grid>
              </Grid>
            </RadioGroup>
            
            <TextField 
              label="Inspection Notes" 
              multiline 
              rows={3} 
              fullWidth 
              sx={{ mt: 3 }} 
              placeholder="Describe any damage or issues found during inspection..."
              value={conditionNotes} 
              onChange={(e) => setConditionNotes(e.target.value)} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmReceived} 
            disabled={submitting}
            sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Complete Inspection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog 
        open={refundDialogOpen} 
        onClose={() => {
          setRefundDialogOpen(false);
          setRefundType(RefundProcessType.FULL);
          setPartialAmount('');
          setMinRequiredAmount(null);
        }}
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Finalize Refund</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            Select the refund type and complete the refund process.
          </Typography>
          
          {/* Refund Type Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>Refund Type</FormLabel>
            <RadioGroup 
              value={refundType} 
              onChange={(e) => {
                setRefundType(e.target.value as RefundProcessType);
                setPartialAmount('');
                setMinRequiredAmount(null);
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: refundType === RefundProcessType.FULL ? '#eff6ff' : 'transparent',
                    borderColor: refundType === RefundProcessType.FULL ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <FormControlLabel 
                    value={RefundProcessType.FULL} 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Full Refund</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatCurrency(request?.refundAmount || 0)}
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: refundType === RefundProcessType.PARTIAL ? '#fef3f2' : 'transparent',
                    borderColor: refundType === RefundProcessType.PARTIAL ? 'warning.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'warning.main' }
                  }}
                >
                  <FormControlLabel 
                    value={RefundProcessType.PARTIAL} 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Partial Refund</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Custom amount
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Box>
            </RadioGroup>
          </FormControl>

          {/* Conditional Partial Amount Input */}
          {refundType === RefundProcessType.PARTIAL && (
            <TextField 
              label="Refund Amount" 
              type="number"
              inputProps={{
                step: '0.01',
                min: '0.01',
                max: request?.refundAmount || 0,
              }}
              fullWidth 
              value={partialAmount} 
              onChange={(e) => {
                setPartialAmount(e.target.value);
                setMinRequiredAmount(null);
              }}
              placeholder="Enter amount to refund"
              helperText={
                minRequiredAmount !== null
                  ? `Minimum required: ${formatCurrency(minRequiredAmount)}. Max: ${formatCurrency(request?.refundAmount || 0)}`
                  : `Max: ${formatCurrency(request?.refundAmount || 0)}`
              }
              error={minRequiredAmount !== null}
              sx={{ mb: 2 }}
            />
          )}

          {/* Refund Amount Display */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: theme.palette.custom.neutral[500], fontWeight: 700, textTransform: 'uppercase' }}>
              {refundType === RefundProcessType.FULL ? 'Full Refund Amount' : 'Partial Refund Amount'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: refundType === RefundProcessType.FULL ? '#22c55e' : '#f59e0b', mt: 1 }}>
              {refundType === RefundProcessType.FULL 
                ? formatCurrency(request?.refundAmount || 0)
                : partialAmount 
                  ? formatCurrency(parseFloat(partialAmount))
                  : '—'
              }
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => {
              setRefundDialogOpen(false);
              setRefundType(RefundProcessType.FULL);
              setPartialAmount('');
              setMinRequiredAmount(null);
            }} 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleProcessRefund} 
            disabled={submitting || (refundType === RefundProcessType.PARTIAL && !partialAmount)}
            sx={{ borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 700 }}
          >
            Confirm & Issue Refund
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerRefundDetailPage;
