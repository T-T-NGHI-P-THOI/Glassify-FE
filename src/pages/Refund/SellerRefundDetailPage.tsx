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

type BuyerInfo = {
  name: string;
  email: string;
  phone: string;
};

type StepItem = { label: string; status: ReturnStatus };

const getStatusSteps = (status: ReturnStatus): StepItem[] => {
  const normalSteps: StepItem[] = [
    { label: 'Request Submitted', status: ReturnStatus.REQUESTED },
    { label: 'Seller Reviewing', status: ReturnStatus.SELLER_REVIEWING },
    { label: 'Platform Review', status: ReturnStatus.PLATFORM_REVIEWING },
    { label: 'Shop Approved', status: ReturnStatus.SHOP_APPROVED },
    { label: 'Approved', status: ReturnStatus.APPROVED },
    { label: 'Customer Returning Item', status: ReturnStatus.RETURN_SHIPPING },
    { label: 'Item Received', status: ReturnStatus.ITEM_RECEIVED },
    { label: 'Processing Refund', status: ReturnStatus.REFUNDING },
    { label: 'Completed', status: ReturnStatus.COMPLETED },
  ];

  if (status === ReturnStatus.REJECTED || status === ReturnStatus.CANCELLED) {
    return [
      { label: 'Request Submitted', status: ReturnStatus.REQUESTED },
      { label: 'Seller Reviewing', status: ReturnStatus.SELLER_REVIEWING },
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
      toast.error(error.response?.data?.message || 'Unable to load return request information');
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
        returnInstructions: reviewAction === 'approve' ? returnInstructions : undefined,
        sellerPaysShipping: reviewAction === 'approve' ? sellerPaysShipping : undefined,
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
      toast.error(error.response?.data?.message || 'Unable to process request');
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
          <Typography color="text.secondary">Không tìm thấy yêu cầu hoàn trả.</Typography>
        </Box>
      </Box>
    );
  }

  const canReview = request.status === ReturnStatus.REQUESTED || request.status === ReturnStatus.SELLER_REVIEWING;
  const canConfirmReceived = request.status === ReturnStatus.RETURN_SHIPPING && request.returnTrackingNumber;
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
            Yêu cầu này cần bạn xem xét và phê duyệt
          </Typography>
        </Alert>
      )}

      {canConfirmReceived && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            Khách hàng đã gửi hàng trả. Vui lòng kiểm tra và xác nhận khi nhận được hàng.
          </Typography>
        </Alert>
      )}

      {request.status === ReturnStatus.REJECTED && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            Yêu cầu đã bị từ chối
          </Typography>
          {request.rejectionReason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Lý do: {request.rejectionReason}
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
              Thông tin yêu cầu
            </Typography>

            {(canReview || canConfirmReceived) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                {canReview && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ThumbUp />}
                      onClick={() => handleOpenReviewDialog('approve')}
                    >
                      Chấp thuận
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<ThumbDown />}
                      onClick={() => handleOpenReviewDialog('reject')}
                    >
                      Từ chối
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
                    Đã nhận hàng trả
                  </Button>
                )}
              </Stack>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={5} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Avatar
                    src={request.productImageUrl}
                    variant="rounded"
                    sx={{ width: '100%', height: 'auto', aspectRatio: '1' }}
                  >
                    <AssignmentReturn />
                  </Avatar>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {request.productName}
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Mã đơn hàng:</Typography>
                      <Typography variant="body2" fontWeight="medium">{request.orderNumber}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                      <Typography variant="body2" fontWeight="medium">{request.quantity}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Loại yêu cầu:</Typography>
                      <Chip
                        label={request.returnType === 'REFUND' ? 'Hoàn tiền' : 'Đổi hàng'}
                        color={request.returnType === 'REFUND' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
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
                  <Typography variant="body2" color="text.secondary">Số tiền hoàn:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(request.refundAmount)}
                  </Typography>
                </Box>

                {request.sellerPaysShipping && (
                  <Alert severity="info">
                    <Typography variant="caption">Bạn chịu phí vận chuyển trả hàng</Typography>
                  </Alert>
                )}

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between" gap={2}>
                  <Typography variant="body2" color="text.secondary">Tên:</Typography>
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
                  <Typography variant="body2" color="text.secondary">SĐT:</Typography>
                  {buyerLoading ? <Skeleton width={100} /> : (
                    <Typography variant="body2" fontWeight="medium" textAlign="right">{buyerInfo.phone}</Typography>
                  )}
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
                Chi tiết yêu cầu
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Lý do trả hàng:
                  </Typography>
                  <Chip label={RETURN_REASON_LABELS[request.reason]} variant="outlined" color="primary" />
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
                  <Typography variant="body2" color="text.secondary">Ngày gửi yêu cầu:</Typography>
                  <Typography variant="body2" fontWeight="medium">{formatDate(request.requestedAt)}</Typography>
                </Box>

                {request.returnTrackingNumber && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">Mã vận đơn trả hàng:</Typography>
                    <Chip label={request.returnTrackingNumber} size="small" icon={<LocalShipping />} color="info" />
                  </Box>
                )}

                {request.returnInstructions && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Hướng dẫn trả hàng:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                      <Typography variant="body2">{request.returnInstructions}</Typography>
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
            Ảnh/Video đính kèm ({evidenceFiles.length})
          </Typography>
          <Divider sx={{ my: 2 }} />

          {evidenceFiles.length === 0 && <Alert severity="info">Không có ảnh/video đính kèm</Alert>}

          {imageFiles.length > 0 && (
            <Box sx={{ mb: videoFiles.length > 0 ? 2 : 0 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Ảnh minh chứng ({imageFiles.length})
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
                Video minh chứng ({videoFiles.length})
              </Typography>
              <Grid container spacing={2}>
                {videoFiles.map((video, index) => (
                  <Grid item xs={12} md={6} lg={4} key={`${video}-${index}`}>
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
      </Box>
    </Box>
  );
};

export default SellerRefundDetailPage;
