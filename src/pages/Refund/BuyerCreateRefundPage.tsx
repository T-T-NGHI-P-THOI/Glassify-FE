import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  Grid,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Avatar,
  Divider,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  CloudUpload,
  Delete,
  AssignmentReturn,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  checkReturnEligibility,
  createReturnRequest,
} from '@/api/refund-api';
import type {
  CreateRefundRequestDto,
  ReturnEligibility,
} from '@/models/Refund';
import {
  ReturnType,
  ReturnReason,
  RETURN_REASON_LABELS,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  shopName: string;
}

const steps = ['Check Eligibility', 'Select Reason', 'Confirm'];

const BuyerCreateRefundPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const orderItem = location.state?.orderItem as OrderItem;

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [eligibility, setEligibility] = useState<ReturnEligibility | null>(null);

  // Form state
  const [returnType, setReturnType] = useState<ReturnType>(ReturnType.REFUND);
  const [reason, setReason] = useState<ReturnReason>(ReturnReason.CHANGED_MIND);
  const [reasonDetail, setReasonDetail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!orderItem?.id) {
      toast.error('Không tìm thấy thông tin sản phẩm');
      navigate('/my-orders');
      return;
    }
    
    checkEligibilityForReturn();
  }, [orderItem]);

  const checkEligibilityForReturn = async () => {
    if (!orderItem?.id) return;

    try {
      setLoadingEligibility(true);
      const response = await checkReturnEligibility(orderItem.id);
      setEligibility(response.data || null);
      
      if (!response.data?.eligible) {
        toast.error(response.data?.ineligibilityReason || 'Product is not eligible for return');
      }
    } catch (error: any) {
      console.error('Failed to check eligibility:', error);
      toast.error('Unable to check return eligibility');
    } finally {
      setLoadingEligibility(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !eligibility?.eligible) {
      toast.error('Product is not eligible for return');
      return;
    }
    if (activeStep === 1 && !reason) {
      toast.error('Please select a return reason');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Limit to 5 images
    if (imageFiles.length + newFiles.length > 5) {
      toast.error('Maximum 5 images can be uploaded');
      return;
    }

    // TODO: Upload images to server and get URLs
    // For now, create preview URLs
    const previewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImageFiles([...imageFiles, ...newFiles]);
    setEvidenceImages([...evidenceImages, ...previewUrls]);
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = [...imageFiles];
    const newUrls = [...evidenceImages];
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    setImageFiles(newFiles);
    setEvidenceImages(newUrls);
  };

  const handleSubmit = async () => {
    if (!orderItem?.id) return;

    try {
      setLoading(true);
      
      const requestData: CreateRefundRequestDto = {
        orderItemId: orderItem.id,
        returnType,
        reason,
        reasonDetail: reasonDetail || undefined,
        quantity,
        evidenceImages,
      };

      const response = await createReturnRequest(requestData);
      toast.success('Return request submitted successfully');
      navigate(`/user/refunds/${response.data?.id || ''}`);
    } catch (error: any) {
      console.error('Failed to create return request:', error);
      toast.error(error.response?.data?.message || 'Unable to create return request');
    } finally {
      setLoading(false);
    }
  };

  if (!orderItem) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy thông tin sản phẩm</Alert>
      </Container>
    );
  }

  if (loadingEligibility) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <AssignmentReturn sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Return / Exchange Request
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Product info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Thông tin sản phẩm
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Avatar
                src={orderItem.productImageUrl}
                variant="rounded"
                sx={{ width: '100%', height: 100 }}
              >
                <AssignmentReturn />
              </Avatar>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography variant="subtitle1" fontWeight="bold">
                {orderItem.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                SKU: {orderItem.productSku}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Shop: {orderItem.shopName}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                {formatCurrency(orderItem.unitPrice)} x {orderItem.quantity}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Step content */}
      <Paper sx={{ p: 3 }}>
        {/* Step 1: Eligibility check */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kiểm tra điều kiện hoàn trả
            </Typography>
            {eligibility && (
              <Box sx={{ mt: 3 }}>
                {eligibility.eligible ? (
                  <>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Sản phẩm đủ điều kiện để hoàn trả
                      </Typography>
                      <Typography variant="body2">
                        Thời gian còn lại: {eligibility.daysRemaining} ngày
                      </Typography>
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Số tiền hoàn tối đa
                          </Typography>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            {formatCurrency(eligibility.maxRefundAmount)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Hoàn phí vận chuyển
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {eligibility.shippingRefundable ? 'Có' : 'Không'}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Thời gian còn lại
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {eligibility.daysRemaining} ngày
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Hạn chót
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {new Date(eligibility.returnDeadline!).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      Sản phẩm không đủ điều kiện hoàn trả
                    </Typography>
                    <Typography variant="body2">
                      Lý do: {eligibility.ineligibilityReason}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Select reason and type */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn loại và lý do hoàn trả
            </Typography>
            
            {/* Return type */}
            <FormControl fullWidth sx={{ mt: 3 }}>
              <FormLabel>Loại yêu cầu</FormLabel>
              <RadioGroup
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as ReturnType)}
                sx={{ mt: 1 }}
              >
                <FormControlLabel
                  value={ReturnType.REFUND}
                  control={<Radio />}
                  label="Hoàn tiền - Trả lại sản phẩm và nhận hoàn tiền"
                />
                <FormControlLabel
                  value={ReturnType.EXCHANGE}
                  control={<Radio />}
                  label="Đổi hàng - Đổi sang sản phẩm khác (cùng giá trị)"
                />
              </RadioGroup>
            </FormControl>

            {/* Return reason */}
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Lý do hoàn trả *</InputLabel>
              <Select
                value={reason}
                label="Lý do hoàn trả *"
                onChange={(e) => setReason(e.target.value as ReturnReason)}
              >
                {Object.values(ReturnReason).map((reasonValue) => (
                  <MenuItem key={reasonValue} value={reasonValue}>
                    {RETURN_REASON_LABELS[reasonValue]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Detailed reason */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Mô tả chi tiết (Tùy chọn)"
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              sx={{ mt: 3 }}
              placeholder="Mô tả chi tiết về lý do hoàn trả..."
            />

            {/* Quantity */}
            <TextField
              fullWidth
              type="number"
              label="Số lượng"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Number(e.target.value), orderItem.quantity))}
              inputProps={{ min: 1, max: orderItem.quantity }}
              sx={{ mt: 3 }}
            />

            {/* Evidence images */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" gutterBottom>
                Hình ảnh bằng chứng (Tối đa 5 ảnh)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={imageFiles.length >= 5}
                sx={{ mt: 1 }}
              >
                Tải lên hình ảnh
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
              </Button>
              
              {/* Image preview */}
              {evidenceImages.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {evidenceImages.map((url, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box position="relative">
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 8,
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'white',
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        )}

        {/* Step 3: Confirmation */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xác nhận thông tin
            </Typography>
            <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
              Vui lòng kiểm tra kỹ thông tin trước khi gửi yêu cầu
            </Alert>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Loại yêu cầu
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {returnType === ReturnType.REFUND ? 'Hoàn tiền' : 'Đổi hàng'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Lý do
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {RETURN_REASON_LABELS[reason]}
                </Typography>
              </Box>
              {reasonDetail && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mô tả chi tiết
                  </Typography>
                  <Typography variant="body1">{reasonDetail}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Số lượng
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {quantity}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Số tiền hoàn (dự kiến)
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency((eligibility?.maxRefundAmount || 0))}
                </Typography>
              </Box>
              {evidenceImages.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Hình ảnh ({evidenceImages.length})
                  </Typography>
                  <Grid container spacing={1}>
                    {evidenceImages.map((url, index) => (
                      <Grid item xs={3} key={index}>
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Navigation buttons */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Quay lại
          </Button>
          <Box>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={activeStep === 0 && !eligibility?.eligible}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default BuyerCreateRefundPage;
