import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  LocalShipping,
  CheckCircle,
  Cancel,
  ArrowBack,
  AttachFile,
  Store,
  Replay,
  Edit,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getReturnRequestDetail,
  updateReturnTracking,
  cancelReturnRequest,
} from '@/api/refund-api';
import type {
  RefundRequest,
  UpdateReturnTrackingDto,
} from '@/models/Refund';
import {
  ReturnStatus,
  RETURN_STATUS_LABELS,
  RETURN_REASON_LABELS,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';
import { getApiErrorMessage } from '@/utils/api-error';

type RefundStep = {
  label: string;
  statuses: ReturnStatus[];
};

// Status steps for progress indicator
const getStatusSteps = (request: RefundRequest) => {
  const baseSteps: RefundStep[] = [
    { label: 'Request Submitted', statuses: [ReturnStatus.REQUESTED] },
    { label: 'Approved', statuses: [ReturnStatus.APPROVED] },
    { label: 'Return Shipping', statuses: [ReturnStatus.RETURN_SHIPPING] },
    { label: 'Item Received', statuses: [ReturnStatus.ITEM_RECEIVED] },
    { label: 'Completed', statuses: [ReturnStatus.COMPLETED] },
  ];

  // Handle rejected/cancelled cases
  if (request.status === ReturnStatus.REJECTED || request.status === ReturnStatus.CANCELLED) {
    const endStatus = request.status;
    return [
      { label: 'Request Submitted', statuses: [ReturnStatus.REQUESTED] },
      {
        label: endStatus === ReturnStatus.REJECTED ? 'Rejected' : 'Cancelled',
        statuses: [endStatus],
      },
    ] satisfies RefundStep[];
  }

  return baseSteps;
};

const getActiveStep = (currentStatus: ReturnStatus, steps: RefundStep[]) => {
  const index = steps.findIndex((step) => step.statuses.includes(currentStatus));
  return index >= 0 ? index : 0;
};

const BuyerRefundDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RefundRequest | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequestDetail = async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      const response = await getReturnRequestDetail(requestId);
      if (response.data) {
        setRequest(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch return request detail:', error);
      toast.error(getApiErrorMessage(error, 'Unable to load request details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const handleUpdateTracking = async () => {
    if (!requestId || !trackingNumber) {
      toast.error('Please enter tracking number');
      return;
    }

    try {
      setSubmitting(true);
      const data: UpdateReturnTrackingDto = {
        trackingNumber,
        carrier: carrier || undefined,
      };
      await updateReturnTracking(requestId, data);
      toast.success('Tracking number updated successfully');
      setTrackingDialogOpen(false);
      fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to update tracking:', error);
      toast.error(getApiErrorMessage(error, 'Unable to update tracking number'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId) return;

    try {
      setSubmitting(true);
      await cancelReturnRequest(requestId);
      toast.success('Refund request cancelled');
      setCancelDialogOpen(false);
      fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
      toast.error(getApiErrorMessage(error, 'Unable to cancel request'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Refund request not found</Alert>
      </Container>
    );
  }

  const steps = getStatusSteps(request);
  const activeStep = getActiveStep(request.status, steps);
  const canCancel = request.status === ReturnStatus.REQUESTED;
  const isApproved = request.status === ReturnStatus.APPROVED;
  const waitingForShopReview =
    request.status === ReturnStatus.REQUESTED;
  const canUpdateTracking = isApproved && !request.returnTrackingNumber;
  const evidenceFiles = request.evidenceImages || [];

  const isVideoFile = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return /\.(mp4|mov|webm|ogg|m4v|avi)(\?|#|$)/i.test(lowerUrl)
      || lowerUrl.includes('/video/')
      || lowerUrl.includes('resource_type/video');
  };

  const isImageFile = (url: string) => {
    const lowerUrl = url.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)(\?|#|$)/i.test(lowerUrl)
      || lowerUrl.includes('/image/')
      || lowerUrl.includes('resource_type/image');
  };

  const videoFiles = evidenceFiles.filter((fileUrl) => isVideoFile(fileUrl));
  const imageFiles = evidenceFiles.filter((fileUrl) => !isVideoFile(fileUrl) && isImageFile(fileUrl));
  const attachmentFiles = evidenceFiles.filter((fileUrl) => !isVideoFile(fileUrl) && !isImageFile(fileUrl));

  const getFileNameFromUrl = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      return decodeURIComponent(parts[parts.length - 1] || 'attachment-file');
    } catch {
      const sanitized = url.split('?')[0].split('#')[0];
      const parts = sanitized.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'attachment-file';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button and header */}
      <Box mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/user/refunds')} sx={{ mb: 2 }}>
          Back to list
        </Button>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight="bold">
              Request Details #{request.requestNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created At: {formatDate(request.requestedAt)}
            </Typography>
          </Stack>
          <Chip
            label={RETURN_STATUS_LABELS[request.status]}
            color={
              request.status === ReturnStatus.COMPLETED
                ? 'success'
                : request.status === ReturnStatus.REJECTED ||
                  request.status === ReturnStatus.CANCELLED
                ? 'error'
                : 'warning'
            }
            size="medium"
          />
        </Box>
      </Box>

      {/* Progress stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Progress
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 3 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Alert messages based on status */}
      {waitingForShopReview && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Waiting for shop review
          </Typography>
          <Typography variant="body2">
            Once approved by the shop, you can ship the item back and update tracking details.
          </Typography>
        </Alert>
      )}

      {isApproved && !request.returnTrackingNumber && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Shop approved your request!
          </Typography>
          <Typography variant="body2">
            Please ship the item back and update tracking number
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LocalShipping />}
            onClick={() => setTrackingDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Update Tracking Number
          </Button>
        </Alert>
      )}

      {request.status === ReturnStatus.REJECTED && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Request was rejected
          </Typography>
          {request.rejectionReason && (
            <Typography variant="body2">Reason: {request.rejectionReason}</Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Product information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Avatar
                    src={request.productImageUrl}
                    variant="rounded"
                    sx={{ width: '100%', height: 120 }}
                  >
                    <AssignmentReturn sx={{ fontSize: 60 }} />
                  </Avatar>
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {request.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    SKU: {request.productSku}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip
                      icon={<Store />}
                      label={request.shopName}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Quantity: ${request.quantity}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Return Information
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Request Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {request.returnType === 'REFUND' ? 'Refund' : 'Exchange'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {RETURN_REASON_LABELS[request.reason]}
                  </Typography>
                </Grid>
                {request.reasonDetail && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      Reason Details
                    </Typography>
                    <Typography variant="body1">{request.reasonDetail}</Typography>
                  </Grid>
                )}
                {(request.returnInstruction || request.returnInstructions) && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      Return Instruction
                    </Typography>
                    <Typography variant="body1">
                      {request.returnInstruction || request.returnInstructions}
                    </Typography>
                  </Grid>
                )}
                {request.returnTrackingNumber && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tracking Number
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {request.returnTrackingNumber}
                      </Typography>
                    </Grid>
                    {request.returnCarrier && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Shipping Carrier
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {request.returnCarrier}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Images/Videos/Attachments ({evidenceFiles.length})
              </Typography>

              {evidenceFiles.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No supporting files attached.
                </Alert>
              )}

              {imageFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Images ({imageFiles.length})
                  </Typography>
                  <ImageList cols={3} gap={8}>
                    {imageFiles.map((url, index) => (
                      <ImageListItem key={`${url}-${index}`}>
                        <img
                          src={url}
                          alt={`Evidence image ${index + 1}`}
                          loading="lazy"
                          style={{ borderRadius: 8, cursor: 'pointer' }}
                          onClick={() => window.open(url, '_blank')}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}

              {videoFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Video ({videoFiles.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {videoFiles.map((video, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${video}-${index}`}>
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

              {attachmentFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Attachments ({attachmentFiles.length})
                  </Typography>
                  <Stack spacing={1}>
                    {attachmentFiles.map((fileUrl, index) => (
                      <Paper key={`${fileUrl}-${index}`} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <AttachFile color="action" fontSize="small" />
                            <Typography variant="body2" noWrap>
                              {getFileNameFromUrl(fileUrl)}
                            </Typography>
                          </Stack>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            Open
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Refund Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Refund Amount
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(request.refundAmount)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Order
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {request.orderNumber}
                  </Typography>
                </Box>
                {request.completedAt && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Completed At
                    </Typography>
                    <Typography variant="body2">{formatDate(request.completedAt)}</Typography>
                  </Box>
                )}
              </Stack>

              {canCancel && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    Cancel Request
                  </Button>
                </>
              )}

              {canUpdateTracking && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LocalShipping />}
                    onClick={() => setTrackingDialogOpen(true)}
                  >
                    Update Tracking Number
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Timeline
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {request.completedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.completedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Completed
                    </Typography>
                  </Box>
                )}
                {request.itemReceivedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.itemReceivedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Seller received item
                    </Typography>
                  </Box>
                )}
                {request.approvedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.approvedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Approved
                    </Typography>
                  </Box>
                )}
                {request.rejectedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.rejectedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="error">
                      Rejected
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(request.requestedAt)}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    Request created
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update tracking dialog */}
      <Dialog
        open={trackingDialogOpen}
        onClose={() => setTrackingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Tracking Number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Enter the tracking number for your return package
          </Typography>
          <TextField
            fullWidth
            label="Tracking Number *"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Shipping Carrier"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            margin="normal"
            placeholder="Example: DHL, FedEx, UPS..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateTracking}
            disabled={submitting || !trackingNumber}
          >
            {submitting ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel request dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to cancel this request? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={submitting}>
            Close
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelRequest}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BuyerRefundDetailPage;
