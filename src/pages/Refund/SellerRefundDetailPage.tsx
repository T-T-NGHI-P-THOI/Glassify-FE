import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Avatar,
  Stack,
  CircularProgress,
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
  VerifiedUser,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getReturnRequestDetail,
  reviewReturnRequest,
  confirmItemReceived,
} from '@/api/refund-api';
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

const getStatusSteps = () => [
  'Yêu cầu gửi',
  'Đang xem xét',
  'Chấp thuận',
  'Khách gửi hàng',
  'Nhận hàng trả',
  'Đang hoàn tiền',
  'Hoàn tất',
];

const getActiveStep = (status: ReturnStatus) => {
  switch (status) {
    case ReturnStatus.REQUESTED:
      return 0;
    case ReturnStatus.SELLER_REVIEWING:
      return 1;
    case ReturnStatus.APPROVED:
      return 2;
    case ReturnStatus.RETURN_SHIPPING:
      return 3;
    case ReturnStatus.ITEM_RECEIVED:
      return 4;
    case ReturnStatus.REFUNDING:
      return 5;
    case ReturnStatus.COMPLETED:
      return 6;
    default:
      return 0;
  }
};

const SellerRefundDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RefundRequest | null>(null);
  
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
  const [actualRefundAmount, setActualRefundAmount] = useState<number>(0);

  const fetchRequestDetail = async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      const response = await getReturnRequestDetail(requestId);
      if (response.data) {
        setRequest(response.data);
      }
      if (response.data?.refundAmount) {
        setActualRefundAmount(response.data.refundAmount);
      }
    } catch (error: any) {
      console.error('Failed to fetch request detail:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thông tin yêu cầu hoàn trả');
      navigate('/shop/refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

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
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    if (reviewAction === 'approve' && !returnInstructions.trim()) {
      toast.error('Vui lòng nhập hướng dẫn trả hàng cho khách');
      return;
    }
    
    try {
      setSubmitting(true);
      await reviewReturnRequest(requestId, {
        approved: reviewAction === 'approve',
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
        returnInstructions: reviewAction === 'approve' ? returnInstructions : undefined,
        sellerPaysShipping: reviewAction === 'approve' ? sellerPaysShipping : undefined,
      });
      
      toast.success(
        reviewAction === 'approve'
          ? 'Đã chấp thuận yêu cầu hoàn trả'
          : 'Đã từ chối yêu cầu hoàn trả'
      );
      handleCloseReviewDialog();
      await fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to review request:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý yêu cầu');
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
      toast.error('Vui lòng mô tả tình trạng sản phẩm nhận được');
      return;
    }
    
    try {
      setSubmitting(true);
      await confirmItemReceived(requestId, {
        itemCondition,
        conditionNotes,
        meetsReturnCriteria: true, // Seller confirms item meets return criteria
      });
      
      toast.success('Đã xác nhận nhận hàng trả, chờ hệ thống xử lý hoàn tiền');
      handleCloseConfirmDialog();
      await fetchRequestDetail();
    } catch (error: any) {
      console.error('Failed to confirm received:', error);
      toast.error(error.response?.data?.message || 'Không thể xác nhận nhận hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return null;
  }

  const canReview = request.status === ReturnStatus.REQUESTED || request.status === ReturnStatus.SELLER_REVIEWING;
  const canConfirmReceived = request.status === ReturnStatus.RETURN_SHIPPING && request.returnTrackingNumber;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/shop/refunds')}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách
        </Button>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Chi tiết yêu cầu hoàn trả
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mã yêu cầu: <strong>#{request.requestNumber}</strong>
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={getActiveStep(request.status)} alternativeLabel>
          {getStatusSteps().map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Current Status Alert */}
      {canReview && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            ⚠️ Yêu cầu này cần bạn xem xét và phê duyệt
          </Typography>
        </Alert>
      )}

      {canConfirmReceived && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            📦 Khách hàng đã gửi hàng trả. Vui lòng kiểm tra và xác nhận khi nhận được hàng.
          </Typography>
        </Alert>
      )}

      {request.status === ReturnStatus.REJECTED && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            ❌ Yêu cầu đã bị từ chối
          </Typography>
          {request.rejectionReason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Lý do: {request.rejectionReason}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Product & Request Info */}
        <Grid item xs={12} md={8}>
          {/* Product Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <Inventory sx={{ verticalAlign: 'middle', mr: 1 }} />
                Thông tin sản phẩm
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Avatar
                    src={request.productImageUrl}
                    variant="rounded"
                    sx={{ width: '100%', height: 'auto', aspectRatio: '1' }}
                  >
                    <AssignmentReturn />
                  </Avatar>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {request.productName}
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Mã đơn hàng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {request.orderNumber}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Số lượng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {request.quantity}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Loại yêu cầu:
                      </Typography>
                      <Chip
                        label={request.returnType === 'REFUND' ? 'Hoàn tiền' : 'Đổi hàng'}
                        color={request.returnType === 'REFUND' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Return Request Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
                Chi tiết yêu cầu
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Lý do trả hàng:
                  </Typography>
                  <Chip
                    label={RETURN_REASON_LABELS[request.reason]}
                    variant="outlined"
                    color="primary"
                  />
                </Box>
                
                {request.reasonDetail && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mô tả chi tiết:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{request.reasonDetail}</Typography>
                    </Paper>
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Ngày gửi yêu cầu:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(request.requestedAt)}
                  </Typography>
                </Box>
                
                {request.returnTrackingNumber && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Mã vận đơn trả hàng:
                    </Typography>
                    <Chip
                      label={request.returnTrackingNumber}
                      size="small"
                      icon={<LocalShipping />}
                      color="info"
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Evidence Images */}
          {request.evidenceImages && request.evidenceImages.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  <ImageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Hình ảnh minh chứng ({request.evidenceImages.length})
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <ImageList cols={3} gap={8}>
                  {request.evidenceImages.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Evidence ${index + 1}`}
                        loading="lazy"
                        style={{ borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => window.open(image, '_blank')}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </CardContent>
            </Card>
          )}

          {/* Return Instructions (if approved) */}
          {request.returnInstructions && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  <LocalShipping sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Hướng dẫn trả hàng
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                  <Typography variant="body2">{request.returnInstructions}</Typography>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Status & Actions */}
        <Grid item xs={12} md={4}>
          {/* Status Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Trạng thái
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Chip
                label={RETURN_STATUS_LABELS[request.status]}
                color={
                  [ReturnStatus.COMPLETED].includes(request.status)
                    ? 'success'
                    : [ReturnStatus.REJECTED, ReturnStatus.CANCELLED].includes(request.status)
                    ? 'error'
                    : 'warning'
                }
                sx={{ width: '100%', py: 2 }}
              />
            </CardContent>
          </Card>

          {/* Refund Amount Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Số tiền hoàn
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h4" color="primary" fontWeight="bold" textAlign="center">
                {formatCurrency(request.refundAmount)}
              </Typography>
              
              {request.sellerPaysShipping && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Bạn chịu phí vận chuyển trả hàng
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {canReview && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Xử lý yêu cầu
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<ThumbUp />}
                    onClick={() => handleOpenReviewDialog('approve')}
                    fullWidth
                  >
                    Chấp thuận
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<ThumbDown />}
                    onClick={() => handleOpenReviewDialog('reject')}
                    fullWidth
                  >
                    Từ chối
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {canConfirmReceived && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Xác nhận nhận hàng
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<VerifiedUser />}
                  onClick={handleOpenConfirmDialog}
                  fullWidth
                >
                  Đã nhận hàng trả
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Customer Info Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thông tin khách hàng
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tên:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {request.buyerName || 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {request.buyerEmail || 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    SĐT:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {request.buyerPhone || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              Chấp thuận yêu cầu hoàn trả
            </>
          ) : (
            <>
              <ThumbDown color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Từ chối yêu cầu hoàn trả
            </>
          )}
        </DialogTitle>
        <DialogContent>
          {reviewAction === 'approve' ? (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Vui lòng cung cấp hướng dẫn chi tiết để khách hàng biết cách trả hàng
              </Alert>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Hướng dẫn trả hàng *"
                placeholder="Ví dụ: Vui lòng gửi hàng về địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM. Đóng gói cẩn thận và ghi mã đơn hàng #12345 bên ngoài..."
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
                  label="Tôi chịu phí vận chuyển trả hàng"
                />
              </FormGroup>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Vui lòng cho khách hàng biết lý do từ chối yêu cầu hoàn trả
              </Alert>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lý do từ chối *"
                placeholder="Ví dụ: Sản phẩm đã quá thời hạn trả hàng, hoặc không đủ điều kiện hoàn trả..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog} disabled={submitting}>
            Hủy
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
              'Xác nhận chấp thuận'
            ) : (
              'Xác nhận từ chối'
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
          Xác nhận nhận hàng trả
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Vui lòng kiểm tra kỹ tình trạng sản phẩm trước khi xác nhận
          </Alert>
          
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend">Tình trạng sản phẩm nhận được:</FormLabel>
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
            label="Mô tả tình trạng sản phẩm *"
            placeholder="Ví dụ: Sản phẩm còn nguyên vẹn, đầy đủ phụ kiện..."
            value={conditionNotes}
            onChange={(e) => setConditionNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            type="number"
            label="Số tiền hoàn trả thực tế"
            value={actualRefundAmount}
            onChange={(e) => setActualRefundAmount(Number(e.target.value))}
            InputProps={{
              endAdornment: 'VNĐ',
            }}
            helperText="Có thể điều chỉnh nếu sản phẩm bị hư hỏng"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmReceived}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Xác nhận nhận hàng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SellerRefundDetailPage;
