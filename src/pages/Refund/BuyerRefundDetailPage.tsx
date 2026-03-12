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

// Status steps for progress indicator
const getStatusSteps = (request: RefundRequest) => {
  const baseSteps = [
    { label: 'Yêu cầu đã gửi', status: ReturnStatus.REQUESTED },
    { label: 'Đang xem xét', status: ReturnStatus.SELLER_REVIEWING },
    { label: 'Đã chấp thuận', status: ReturnStatus.APPROVED },
    { label: 'Đang gửi trả', status: ReturnStatus.RETURN_SHIPPING },
    { label: 'Đã nhận hàng', status: ReturnStatus.ITEM_RECEIVED },
    { label: 'Hoàn tiền', status: ReturnStatus.REFUNDING },
    { label: 'Hoàn tất', status: ReturnStatus.COMPLETED },
  ];

  // Handle rejected/cancelled cases
  if (request.status === ReturnStatus.REJECTED || request.status === ReturnStatus.CANCELLED) {
    return [
      { label: 'Yêu cầu đã gửi', status: ReturnStatus.REQUESTED },
      { label: 'Đang xem xét', status: ReturnStatus.SELLER_REVIEWING },
      {
        label: request.status === ReturnStatus.REJECTED ? 'Đã từ chối' : 'Đã hủy',
        status: request.status,
      },
    ];
  }

  return baseSteps;
};

const getActiveStep = (currentStatus: ReturnStatus, steps: any[]) => {
  const index = steps.findIndex((step) => step.status === currentStatus);
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
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const handleUpdateTracking = async () => {
    if (!requestId || !trackingNumber) {
      toast.error('Vui lòng nhập mã vận đơn');
      return;
    }

    try {
      setSubmitting(true);
      const data: UpdateReturnTrackingDto = {
        trackingNumber,
        carrier: carrier || undefined,
      };
      await updateReturnTracking(requestId, data);
      toast.success('Cập nhật mã vận đơn thành công');
      setTrackingDialogOpen(false);
      fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to update tracking:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật mã vận đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId) return;

    try {
      setSubmitting(true);
      await cancelReturnRequest(requestId);
      toast.success('Đã hủy yêu cầu hoàn trả');
      setCancelDialogOpen(false);
      fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
        <Alert severity="error">Không tìm thấy yêu cầu hoàn trả</Alert>
      </Container>
    );
  }

  const steps = getStatusSteps(request);
  const activeStep = getActiveStep(request.status, steps);
  const canCancel = request.status === ReturnStatus.REQUESTED;
  const canUpdateTracking =
    request.status === ReturnStatus.APPROVED && !request.returnTrackingNumber;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button and header */}
      <Box mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/user/refunds')} sx={{ mb: 2 }}>
          Quay lại danh sách
        </Button>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight="bold">
              Chi tiết yêu cầu #{request.requestNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ngày tạo: {formatDate(request.requestedAt)}
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
          Tiến trình xử lý
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
      {request.status === ReturnStatus.APPROVED && !request.returnTrackingNumber && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Yêu cầu đã được chấp thuận!
          </Typography>
          <Typography variant="body2">
            Vui lòng gửi trả sản phẩm và cập nhật mã vận đơn
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LocalShipping />}
            onClick={() => setTrackingDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Cập nhật mã vận đơn
          </Button>
        </Alert>
      )}

      {request.status === ReturnStatus.REJECTED && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Yêu cầu đã bị từ chối
          </Typography>
          {request.rejectionReason && (
            <Typography variant="body2">Lý do: {request.rejectionReason}</Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Product information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin sản phẩm
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Avatar
                    src={request.productImageUrl}
                    variant="rounded"
                    sx={{ width: '100%', height: 120 }}
                  >
                    <AssignmentReturn sx={{ fontSize: 60 }} />
                  </Avatar>
                </Grid>
                <Grid item xs={12} sm={9}>
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
                      label={`Số lượng: ${request.quantity}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Thông tin hoàn trả
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Loại yêu cầu
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {request.returnType === 'REFUND' ? 'Hoàn tiền' : 'Đổi hàng'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Lý do
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {RETURN_REASON_LABELS[request.reason]}
                  </Typography>
                </Grid>
                {request.reasonDetail && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Chi tiết lý do
                    </Typography>
                    <Typography variant="body1">{request.reasonDetail}</Typography>
                  </Grid>
                )}
                {request.returnTrackingNumber && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Mã vận đơn
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {request.returnTrackingNumber}
                      </Typography>
                    </Grid>
                    {request.returnCarrier && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Đơn vị vận chuyển
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {request.returnCarrier}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>

              {/* Evidence images */}
              {request.evidenceImages && request.evidenceImages.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Hình ảnh bằng chứng
                  </Typography>
                  <ImageList cols={3} gap={8} sx={{ mt: 2 }}>
                    {request.evidenceImages.map((url, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          loading="lazy"
                          style={{ borderRadius: 8 }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tóm tắt hoàn tiền
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Số tiền hoàn
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(request.refundAmount)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Đơn hàng
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {request.orderNumber}
                  </Typography>
                </Box>
                {request.completedAt && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Hoàn tất lúc
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
                    Hủy yêu cầu
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
                    Cập nhật mã vận đơn
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lịch sử xử lý
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {request.completedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.completedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Hoàn tất
                    </Typography>
                  </Box>
                )}
                {request.itemReceivedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.itemReceivedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Người bán đã nhận hàng
                    </Typography>
                  </Box>
                )}
                {request.approvedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.approvedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Đã chấp thuận
                    </Typography>
                  </Box>
                )}
                {request.rejectedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.rejectedAt)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="error">
                      Đã từ chối
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(request.requestedAt)}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    Yêu cầu đã tạo
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
        <DialogTitle>Cập nhật mã vận đơn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Vui lòng nhập mã vận đơn của gói hàng trả về
          </Typography>
          <TextField
            fullWidth
            label="Mã vận đơn *"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Đơn vị vận chuyển"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            margin="normal"
            placeholder="VD: GHN, GHTK, Viettel Post..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingDialogOpen(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateTracking}
            disabled={submitting || !trackingNumber}
          >
            {submitting ? <CircularProgress size={24} /> : 'Xác nhận'}
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
        <DialogTitle>Xác nhận hủy yêu cầu</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Bạn có chắc chắn muốn hủy yêu cầu hoàn trả này? Hành động này không thể hoàn tác.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={submitting}>
            Đóng
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelRequest}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Xác nhận hủy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BuyerRefundDetailPage;
