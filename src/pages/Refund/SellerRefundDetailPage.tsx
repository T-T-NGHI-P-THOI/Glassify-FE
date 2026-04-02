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
  ImageList,
  ImageListItem,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  CheckCircle,
  Cancel,
  ArrowBack,
  ThumbUp,
  ThumbDown,
  LocalShipping,
  Inventory,
  Info,
  Image as ImageIcon,
  Videocam,
  VerifiedUser,
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
} from '@/api/refund-api';
import { userApi } from '@/api/service/userApi';
import type {
  RefundRequest,
} from '@/models/Refund';
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
    { label: 'Customer Returning Item', status: ReturnStatus.RETURN_SHIPPING },
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
  
  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnInstructions, setReturnInstructions] = useState('');
  const [sellerPaysShipping, setSellerPaysShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Confirm received dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemCondition, setItemCondition] = useState<ItemCondition>(ItemCondition.GOOD);
  const [conditionNotes, setConditionNotes] = useState('');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

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
      toast.error(getApiErrorMessage(error, 'Unable to load return request information'));
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
      if (!request?.userId) {
        return;
      }

      try {
        setBuyerLoading(true);
        const response = await userApi.getUserByIdentifier(request.userId);
        const rawData = response.data as any;
        const user = rawData?.user ?? rawData;

        setBuyerInfo({
          name: user?.fullName || request.buyerName || 'N/A',
          email: user?.email || request.buyerEmail || 'N/A',
          phone: user?.phone || user?.phoneNumber || request.buyerPhone || 'N/A',
        });
      } catch (error) {
        console.error('Failed to fetch buyer info:', error);
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
      toast.error('Please enter rejection reason');
      return;
    }
    
    if (reviewAction === 'approve' && !returnInstructions.trim()) {
      toast.error('Please enter return instructions for the customer');
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
      
      toast.success(
        reviewAction === 'approve'
          ? 'Return request approved'
          : 'Return request rejected'
      );
      handleCloseReviewDialog();
      await fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to review request:', error);
      toast.error(getApiErrorMessage(error, 'Unable to process request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setItemCondition(ItemCondition.GOOD);
    setConditionNotes('');
  };

  const handleConfirmReceived = async () => {
    if (!requestId) return;
    
    if (!conditionNotes.trim()) {
      toast.error('Please describe the condition of the returned item');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await confirmItemReceived(requestId, {
        itemCondition,
        itemConditionNote: conditionNotes,
        meetsReturnCriteria: true, // Seller confirms item meets return criteria
      });

      if (response.data) {
        setRequest({
          ...response.data,
          status: ReturnStatus.ITEM_RECEIVED,
          statusDisplay: RETURN_STATUS_LABELS[ReturnStatus.ITEM_RECEIVED],
          completedAt: undefined,
          itemReceivedAt: response.data.itemReceivedAt || new Date().toISOString(),
        });
      }
      
      toast.success('Return item confirmed. You can now process the refund.');
      handleCloseConfirmDialog();
    } catch (error: any) {
      console.error('Failed to confirm received:', error);
      toast.error(getApiErrorMessage(error, 'Unable to confirm item receipt'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRefundDialog = () => {
    const hasReceivedReturnedItem =
      request?.status === ReturnStatus.ITEM_RECEIVED && Boolean(request?.itemReceivedAt);

    if (!hasReceivedReturnedItem) {
      toast.error('You can only process refund after confirming item received');
      return;
    }

    setRefundDialogOpen(true);
  };

  const handleCloseRefundDialog = () => {
    setRefundDialogOpen(false);
  };

  const handleProcessRefund = async () => {
    if (!requestId) return;

    const hasReceivedReturnedItem =
      request?.status === ReturnStatus.ITEM_RECEIVED && Boolean(request?.itemReceivedAt);

    if (!hasReceivedReturnedItem) {
      toast.error('You can only process refund after confirming item received');
      return;
    }

    try {
      setSubmitting(true);
      await processRefund(requestId);
      toast.success('Refund processed successfully');
      handleCloseRefundDialog();
      await fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      toast.error(getApiErrorMessage(error, 'Unable to process refund'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.REFUND_REVIEW}
          shopName={user?.shop?.shopName}
          shopLogo={user?.shop?.logoUrl}
          ownerName={user?.fullName}
          ownerEmail={user?.email}
          ownerAvatar={user?.avatarUrl}
        />
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.REFUND_REVIEW}
          shopName={user?.shop?.shopName}
          shopLogo={user?.shop?.logoUrl}
          ownerName={user?.fullName}
          ownerEmail={user?.email}
          ownerAvatar={user?.avatarUrl}
        />
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color="text.secondary">Refund request not found.</Typography>
        </Box>
      </Box>
    );
  }

  const canReview = request.status === ReturnStatus.REQUESTED;
  const canConfirmReceived = request.status === ReturnStatus.RETURN_SHIPPING && request.returnTrackingNumber;
  const canProcessRefund =
    request.status === ReturnStatus.ITEM_RECEIVED && Boolean(request.itemReceivedAt);
  const showReceivedAlert =
    request.status === ReturnStatus.ITEM_RECEIVED && Boolean(request.itemReceivedAt);
  const steps = getStatusSteps(request.status);
  const activeStep = getActiveStep(request.status, steps);
  const evidenceFiles = request.evidenceImages || [];
  const isVideoFile = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return /\.(mp4|mov|webm|ogg|m4v|avi)(\?|#|$)/i.test(lowerUrl)
      || lowerUrl.includes('/video/')
      || lowerUrl.includes('resource_type/video');
  };
  const videoFiles = evidenceFiles.filter((fileUrl) => isVideoFile(fileUrl));
  const imageFiles = evidenceFiles.filter((fileUrl) => !isVideoFile(fileUrl));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.REFUND_REVIEW}
        shopName={user?.shop?.shopName}
        shopLogo={user?.shop?.logoUrl}
        ownerName={user?.fullName}
        ownerEmail={user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box
        sx={{
          flex: 1,
          px: { xs: 2, md: 4, xl: 6 },
          py: 4,
        }}
      >
        {/* Header */}
        <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/shop/refunds/review')}
          sx={{ mb: 2 }}
        >
          Back to list
        </Button>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Refund Request Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Request ID: <strong>#{request.requestNumber}</strong>
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.status}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Current Status Alert */}
      {canReview && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            This request requires your review and decision
          </Typography>
        </Alert>
      )}

      {canConfirmReceived && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            Customer has shipped the return. Please verify and confirm when received.
          </Typography>
        </Alert>
      )}

      {showReceivedAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            Returned item has been received. Please process the refund for the customer.
          </Typography>
        </Alert>
      )}

      {request.status === ReturnStatus.REJECTED && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            This request was rejected
          </Typography>
          {request.rejectionReason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reason: {request.rejectionReason}
            </Typography>
          )}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              <Inventory sx={{ verticalAlign: 'middle', mr: 1 }} />
              Request Information
            </Typography>

            {(canReview || canConfirmReceived || canProcessRefund) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                {canReview && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ThumbUp />}
                      onClick={() => handleOpenReviewDialog('approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<ThumbDown />}
                      onClick={() => handleOpenReviewDialog('reject')}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {canConfirmReceived && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<VerifiedUser />}
                    onClick={handleOpenConfirmDialog}
                  >
                    Confirm Received
                  </Button>
                )}

                {canProcessRefund && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleOpenRefundDialog}
                  >
                    Process Refund
                  </Button>
                )}
              </Stack>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={5} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 7 }}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Avatar
                    src={request.productImageUrl}
                    variant="rounded"
                    sx={{ width: '100%', height: 'auto', aspectRatio: '1' }}
                  >
                    <AssignmentReturn />
                  </Avatar>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {request.productName}
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Order Number:</Typography>
                      <Typography variant="body2" fontWeight="medium">{request.orderNumber}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Quantity:</Typography>
                      <Typography variant="body2" fontWeight="medium">{request.quantity}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Request Type:</Typography>
                      <Chip
                        label={request.returnType === 'REFUND' ? 'Refund' : 'Exchange'}
                        color={request.returnType === 'REFUND' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip
                    label={RETURN_STATUS_LABELS[request.status]}
                    color={
                      [ReturnStatus.COMPLETED].includes(request.status)
                        ? 'success'
                        : [ReturnStatus.REJECTED, ReturnStatus.CANCELLED].includes(request.status)
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">Refund Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(request.refundAmount)}
                  </Typography>
                </Box>

                {(request.shopCoverShipping ?? request.sellerPaysShipping) && (
                  <Alert severity="info">
                    <Typography variant="caption">You cover the return shipping fee</Typography>
                  </Alert>
                )}

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  {buyerLoading ? <Skeleton width={120} /> : (
                    <Typography variant="body2" fontWeight="medium" textAlign="right">{buyerInfo.name}</Typography>
                  )}
                </Box>
                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  {buyerLoading ? <Skeleton width={160} /> : (
                    <Typography variant="body2" fontWeight="medium" textAlign="right">{buyerInfo.email}</Typography>
                  )}
                </Box>
                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">Phone:</Typography>
                  {buyerLoading ? <Skeleton width={100} /> : (
                    <Typography variant="body2" fontWeight="medium" textAlign="right">{buyerInfo.phone}</Typography>
                  )}
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
                Request Details
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Return Reason:
                  </Typography>
                  <Chip label={RETURN_REASON_LABELS[request.reason]} variant="outlined" color="primary" />
                </Box>

                {request.reasonDetail && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Details:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{request.reasonDetail}</Typography>
                    </Paper>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Submitted At:</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatDate(request.requestedAt)}</Typography>
                </Box>

                {request.returnTrackingNumber && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">Return Tracking Number:</Typography>
                    <Chip label={request.returnTrackingNumber} size="small" icon={<LocalShipping />} color="info" />
                  </Box>
                )}

                {(request.returnInstruction || request.returnInstructions) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Return Instructions:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                      <Typography variant="body2">{request.returnInstruction || request.returnInstructions}</Typography>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            <ImageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Attached Images/Videos ({evidenceFiles.length})
          </Typography>
          <Divider sx={{ my: 2 }} />

          {evidenceFiles.length === 0 && <Alert severity="info">No images/videos attached</Alert>}

          {imageFiles.length > 0 && (
            <Box sx={{ mb: videoFiles.length > 0 ? 2 : 0 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Evidence Images ({imageFiles.length})
              </Typography>
              <ImageList cols={3} gap={8}>
                {imageFiles.map((image, index) => (
                  <ImageListItem key={`${image}-${index}`}>
                    <img
                      src={image}
                      alt={`Evidence image ${index + 1}`}
                      loading="lazy"
                      style={{ borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => window.open(image, '_blank')}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {videoFiles.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                <Videocam sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                Evidence Videos ({videoFiles.length})
              </Typography>
              <Grid container spacing={2}>
                {videoFiles.map((video, index) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={`${video}-${index}`}>
                    <video
                      src={video}
                      controls
                      style={{ width: '100%', borderRadius: 8, backgroundColor: '#000' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={handleCloseReviewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewAction === 'approve' ? (
            <>
              <ThumbUp color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Approve Refund Request
            </>
          ) : (
            <>
              <ThumbDown color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Reject Refund Request
            </>
          )}
        </DialogTitle>
        <DialogContent>
          {reviewAction === 'approve' ? (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please provide clear return instructions for the customer
              </Alert>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Return Instructions *"
                placeholder="Example: Please ship the item to 123 ABC Street, XYZ District, Ho Chi Minh City. Pack carefully and write order number #12345 on the package..."
                value={returnInstructions}
                onChange={(e) => setReturnInstructions(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sellerPaysShipping}
                      onChange={(e) => setSellerPaysShipping(e.target.checked)}
                    />
                  }
                  label="I will cover return shipping"
                />
              </FormGroup>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Please provide the customer with a clear rejection reason
              </Alert>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason *"
                placeholder="Example: The item is outside the return window, or does not meet return eligibility conditions..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : reviewAction === 'approve' ? (
              'Confirm Approval'
            ) : (
              'Confirm Rejection'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Received Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <VerifiedUser color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Confirm Returned Item
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Please check the item condition carefully before confirming
          </Alert>
          
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend">Received Item Condition:</FormLabel>
            <RadioGroup
              value={itemCondition}
              onChange={(e) => setItemCondition(e.target.value as ItemCondition)}
            >
              <FormControlLabel
                value={ItemCondition.GOOD}
                control={<Radio />}
                label={ITEM_CONDITION_LABELS[ItemCondition.GOOD]}
              />
              <FormControlLabel
                value={ItemCondition.ACCEPTABLE}
                control={<Radio />}
                label={ITEM_CONDITION_LABELS[ItemCondition.ACCEPTABLE]}
              />
              <FormControlLabel
                value={ItemCondition.DAMAGED}
                control={<Radio />}
                label={ITEM_CONDITION_LABELS[ItemCondition.DAMAGED]}
              />
              <FormControlLabel
                value={ItemCondition.NOT_MATCH}
                control={<Radio />}
                label={ITEM_CONDITION_LABELS[ItemCondition.NOT_MATCH]}
              />
            </RadioGroup>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Condition Notes *"
            placeholder="Example: Item is intact and includes all accessories..."
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReceived}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Confirm Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={refundDialogOpen}
        onClose={handleCloseRefundDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Refund Amount: <strong>{formatCurrency(request.refundAmount)}</strong>
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This action will complete the refund for the customer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRefundDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessRefund}
            variant="contained"
            color="success"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default SellerRefundDetailPage;
