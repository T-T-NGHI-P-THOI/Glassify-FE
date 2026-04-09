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
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';
import { getApiErrorMessage } from '@/utils/api-error';

type BuyerInfo = {
  name: string;
  email: string;
  phone: string;
};

type StepItem = { label: string; status: ReturnStatus };

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
    try {
      setSubmitting(true);
      await processRefund(requestId);
      toast.success('Refund completed');
      setRefundDialogOpen(false);
      await fetchRequestDetail();
    } catch (error: any) {
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

      <Box sx={{ flex: 1, px: { xs: 2, md: 5 }, py: 4, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/shop/refunds/review')} sx={{ mb: 1, textTransform: 'none' }}>Back</Button>
            <Typography variant="h4" fontWeight={800}>Refund Request</Typography>
            <Typography variant="body2" color="text.secondary">Order: <b>#{request.orderNumber}</b> • ID: {request.requestNumber}</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {canReview && (
              <>
                <Button variant="outlined" color="error" onClick={() => handleOpenReviewDialog('reject')}>Reject</Button>
                <Button variant="contained" onClick={() => handleOpenReviewDialog('approve')}>Approve</Button>
              </>
            )}
            {canConfirmReceived && (
              <Button variant="contained" onClick={() => setConfirmDialogOpen(true)}>Confirm Received</Button>
            )}
            {canProcessRefund && (
              <Button variant="contained" color="success" onClick={() => setRefundDialogOpen(true)}>Process Refund</Button>
            )}
          </Stack>
        </Box>

        {/* Stepper */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((s) => (
              <Step key={s.status}>
                <StepLabel><Typography variant="caption" fontWeight={600}>{s.label}</Typography></StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Grid container spacing={4}>
          {/* Main Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={4}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory fontSize="small" color="primary" /> Refund Item
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Avatar src={request.productImageUrl} variant="rounded" sx={{ width: 100, height: 100 }} />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{request.productName}</Typography>
                      <Typography variant="body2" color="text.secondary">SKU: {request.productSku}</Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                        <Box><Typography variant="caption" color="text.secondary">Qty</Typography><Typography variant="body2" fontWeight={600}>{request.quantity}</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">Type</Typography><Chip label={request.returnType} size="small" variant="outlined" /></Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Reason & Evidence</Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">Reason</Typography>
                    <Typography variant="body2" fontWeight={600}>{RETURN_REASON_LABELS[request.reason]}</Typography>
                  </Box>
                  {request.reasonDetail && (
                    <Box sx={{ mb: 3 }}><Typography variant="caption" color="text.secondary">Details</Typography><Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>{request.reasonDetail}</Paper></Box>
                  )}
                  {evidenceFiles.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Evidence Preview</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto', pb: 1 }}>
                        {evidenceFiles.map((url, i) => (
                          <Avatar
                            key={i}
                            src={isVideoFile(url) ? undefined : url}
                            variant="rounded"
                            sx={{ width: 56, height: 56, cursor: 'pointer', border: '1px solid #e2e8f0', bgcolor: isVideoFile(url) ? 'black' : 'grey.100' }}
                            onClick={() => window.open(url, '_blank')}
                          >
                            {isVideoFile(url) && <Videocam fontSize="small" />}
                          </Avatar>
                        ))}
                      </Box>
                      <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => {
                        const el = document.getElementById('evidence-gallery');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}>
                        View all evidence below
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <Card elevation={0} sx={{ borderRadius: 3, bgcolor: '#0f172a', color: 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Amount to Refund</Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ my: 1 }}>{formatCurrency(request.refundAmount)}</Typography>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Status</Typography>
                    <Chip label={RETURN_STATUS_LABELS[request.status]} size="small" sx={{ bgcolor: 'white', fontWeight: 700 }} />
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Logistics</Typography>
                  {request.returnTrackingNumber ? (
                    <Stack spacing={2}>
                      <Box><Typography variant="caption" color="text.secondary">GHN Tracking</Typography><Typography variant="body2" fontWeight={700} color="primary">{request.returnTrackingNumber}</Typography></Box>
                      <Button fullWidth size="small" variant="outlined" onClick={handleTrackGhnStatus} loading={fetchingGhn}>Refresh Status</Button>
                      {ghnStatusData && <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}><Typography variant="caption" fontWeight={700}>{ghnStatusData.status?.toUpperCase()}</Typography></Box>}
                    </Stack>
                  ) : <Typography variant="caption">Pending buyer tracking info</Typography>}
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Customer</Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{buyerInfo.name[0]}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{buyerLoading ? '...' : buyerInfo.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{buyerInfo.email}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}><Typography variant="caption">Phone: <b>{buyerInfo.phone}</b></Typography></Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Full Gallery Section */}
        {evidenceFiles.length > 0 && (
          <Card id="evidence-gallery" elevation={0} sx={{ mt: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFile color="primary" />
                Detailed Evidence Gallery ({evidenceFiles.length})
              </Typography>
              <Grid container spacing={2}>
                {evidenceFiles.map((url, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: isVideoFile(url) ? 'black' : 'white' }}>
                      {isVideoFile(url) ? (
                        <video src={url} controls style={{ width: '100%', aspectRatio: '16/9', display: 'block' }} />
                      ) : (
                        <Box
                          component="img"
                          src={url}
                          sx={{ width: '100%', aspectRatio: '4/3', objectFit: 'contain', cursor: 'pointer', display: 'block' }}
                          onClick={() => window.open(url, '_blank')}
                        />
                      )}
                      <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary">Evidence #{i + 1}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Dialogs */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{reviewAction === 'approve' ? 'Approve' : 'Reject'}</DialogTitle>
        <DialogContent dividers>
          {reviewAction === 'approve' ? (
            <Stack spacing={3} sx={{ py: 1 }}>
              <TextField label="Instructions" multiline rows={4} fullWidth value={returnInstructions} onChange={(e) => setReturnInstructions(e.target.value)} />
              <FormControlLabel control={<Checkbox checked={sellerPaysShipping} onChange={(e) => setSellerPaysShipping(e.target.checked)} />} label="Shop covers shipping" />
            </Stack>
          ) : (
            <TextField label="Rejection Reason" multiline rows={4} fullWidth value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} sx={{ mt: 2 }} />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button variant="contained" color={reviewAction === 'approve' ? 'primary' : 'error'} onClick={handleSubmitReview} disabled={submitting}>Confirm</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Inspect Item Condition</DialogTitle>
        <DialogContent dividers>
          <RadioGroup value={itemCondition} onChange={(e) => setItemCondition(e.target.value as ItemCondition)}>
            <FormControlLabel value={ItemCondition.GOOD} control={<Radio />} label="Good" />
            <FormControlLabel value={ItemCondition.DAMAGED} control={<Radio />} label="Damaged" />
          </RadioGroup>
          <TextField label="Notes" multiline rows={3} fullWidth sx={{ mt: 2 }} value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmReceived} disabled={submitting}>Confirm Receipt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)}>
        <DialogTitle>Finalize Refund</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2">Issue refund of <b>{formatCurrency(request?.refundAmount || 0)}</b>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleProcessRefund} disabled={submitting}>Issue Refund</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerRefundDetailPage;
