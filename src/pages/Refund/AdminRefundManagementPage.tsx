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
  Tabs,
  Tab,
  Badge,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  Gavel,
  AttachMoney,
  CheckCircle,
  Cancel,
  ArrowBack,
  AdminPanelSettings,
  Image as ImageIcon,
  Info,
  Visibility,
  LocalShipping,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getReturnRequestDetail,
  platformReview,
  processRefund,
  listReturnRequests,
} from '@/api/refund-api';
import type {
  RefundRequest,
} from '@/models/Refund';
import {
  ReturnStatus,
  RETURN_STATUS_LABELS,
  RETURN_REASON_LABELS,
  DisputeDecision,
  ItemCondition,
  ITEM_CONDITION_LABELS,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';

const AdminRefundManagementPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  
  // List view states
  const [selectedTab, setSelectedTab] = useState(0);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [counts, setCounts] = useState({
    all: 0,
    needsReview: 0,
    disputes: 0,
    pendingRefund: 0,
  });
  
  // Detail view states
  const [request, setRequest] = useState<RefundRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Dialogs
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Review form
  const [disputeDecision, setDisputeDecision] = useState<DisputeDecision>(DisputeDecision.APPROVE_BUYER);
  const [adminNotes, setAdminNotes] = useState('');
  const [finalRefundAmount, setFinalRefundAmount] = useState<number>(0);
  
  // Refund form
  const [refundMethod, setRefundMethod] = useState('WALLET');
  const [refundNotes, setRefundNotes] = useState('');

  const statusTabs = [
    { label: 'Tất cả', value: null, count: counts.all },
    { label: 'Cần xem xét', value: 'NEEDS_REVIEW', count: counts.needsReview },
    { label: 'Tranh chấp', value: 'DISPUTE', count: counts.disputes },
    { label: 'Chờ hoàn tiền', value: ReturnStatus.REFUNDING, count: counts.pendingRefund },
  ];

  const fetchRequests = async () => {
    try {
      setListLoading(true);
      const currentTab = statusTabs[selectedTab];
      const response = await listReturnRequests({
        status: currentTab.value === 'NEEDS_REVIEW'
          ? ReturnStatus.ITEM_RECEIVED
          : currentTab.value === 'DISPUTE'
          ? undefined // Filter disputes on client side
          : (currentTab.value as ReturnStatus) || undefined,
        sortBy: 'requestedAt',
        sortDirection: 'DESC',
      });
      
      let filteredRequests = response.data || [];
      
      // Client-side filtering for disputes
      if (currentTab.value === 'DISPUTE') {
        filteredRequests = filteredRequests.filter(r => r.hasDispute);
      }
      
      setRequests(filteredRequests);
      
      // Calculate counts
      const allRequests = response.data || [];
      setCounts({
        all: allRequests.length,
        needsReview: allRequests.filter(r => r.status === ReturnStatus.ITEM_RECEIVED).length,
        disputes: allRequests.filter(r => r.hasDispute).length,
        pendingRefund: allRequests.filter(r => r.status === ReturnStatus.REFUNDING).length,
      });
    } catch (error: any) {
      console.error('Failed to fetch requests:', error);
      toast.error('Không thể tải danh sách yêu cầu hoàn trả');
    } finally {
      setListLoading(false);
    }
  };

  const fetchRequestDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const response = await getReturnRequestDetail(id);
      if (response.data) {
        setRequest(response.data);
        setFinalRefundAmount(response.data.refundAmount || 0);
      }
    } catch (error: any) {
      console.error('Failed to fetch request detail:', error);
      toast.error('Không thể tải thông tin yêu cầu');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedTab]);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetail(requestId);
    } else {
      setRequest(null);
    }
  }, [requestId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleViewDetail = (id: string) => {
    navigate(`/admin/refunds/${id}`);
  };

  const handleBackToList = () => {
    navigate('/admin/refunds');
  };

  const handleOpenReviewDialog = () => {
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setAdminNotes('');
  };

  const handleSubmitReview = async () => {
    if (!requestId) return;
    
    if (!adminNotes.trim()) {
      toast.error('Vui lòng nhập ghi chú xét duyệt');
      return;
    }
    
    try {
      setSubmitting(true);
      // platformReview expects (requestId, approved: boolean, reason?: string)
      const approved = disputeDecision === DisputeDecision.APPROVE_BUYER || 
                       disputeDecision === DisputeDecision.PARTIAL_REFUND;
      await platformReview(requestId, approved, adminNotes);
      
      toast.success('Đã hoàn tất xét duyệt yêu cầu hoàn trả');
      handleCloseReviewDialog();
      await fetchRequestDetail(requestId);
      await fetchRequests();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.message || 'Không thể xét duyệt yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRefundDialog = () => {
    setRefundDialogOpen(true);
  };

  const handleCloseRefundDialog = () => {
    setRefundDialogOpen(false);
    setRefundNotes('');
  };

  const handleProcessRefund = async () => {
    if (!requestId) return;
    
    try {
      setSubmitting(true);
      // processRefund only takes requestId, no additional params
      await processRefund(requestId);
      
      toast.success('Đã xử lý hoàn tiền thành công');
      handleCloseRefundDialog();
      await fetchRequestDetail(requestId);
      await fetchRequests();
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý hoàn tiền');
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

  // List View
  if (!requestId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <AdminPanelSettings sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
            Quản lý Hoàn trả (Admin)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xét duyệt và quản lý các yêu cầu hoàn trả, xử lý tranh chấp
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {statusTabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge badgeContent={tab.count} color="primary" />
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>
        </Paper>

        {/* Loading */}
        {listLoading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty state */}
        {!listLoading && requests.length === 0 && (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <AssignmentReturn sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Không có yêu cầu hoàn trả nào
            </Typography>
          </Paper>
        )}

        {/* Request list */}
        {!listLoading && requests.length > 0 && (
          <Grid container spacing={3}>
            {requests.map((req) => (
              <Grid item xs={12} key={req.id}>
                <Card
                  elevation={req.hasDispute ? 4 : 2}
                  sx={{
                    border: req.hasDispute ? `2px solid ${theme.palette.error.main}` : 'none',
                  }}
                >
                  <CardContent>
                    {req.hasDispute && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="medium">
                          🚨 Có tranh chấp - Cần xem xét
                        </Typography>
                      </Alert>
                    )}
                    
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Avatar
                          src={req.productImageUrl}
                          variant="rounded"
                          sx={{ width: 80, height: 80 }}
                        >
                          <AssignmentReturn />
                        </Avatar>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          #{req.requestNumber}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {req.productName}
                        </Typography>
                        <Chip
                          label={RETURN_STATUS_LABELS[req.status]}
                          size="small"
                          color={
                            req.status === ReturnStatus.COMPLETED ? 'success' :
                            req.status === ReturnStatus.REJECTED ? 'error' : 'warning'
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4} textAlign="right">
                        <Typography variant="h6" color="primary">
                          {formatCurrency(req.refundAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(req.requestedAt)}
                        </Typography>
                        <Box mt={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDetail(req.id)}
                          >
                            Xem chi tiết
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  // Detail View
  if (detailLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return null;
  }

  const canReview = request.status === ReturnStatus.ITEM_RECEIVED || request.hasDispute;
  const canProcessRefund = request.status === ReturnStatus.REFUNDING;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToList}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách
        </Button>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Chi tiết yêu cầu hoàn trả (Admin)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mã yêu cầu: <strong>#{request.requestNumber}</strong>
        </Typography>
      </Box>

      {/* Alerts */}
      {request.hasDispute && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            🚨 Yêu cầu này có tranh chấp và cần được xem xét
          </Typography>
        </Alert>
      )}

      {canReview && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            ⚠️ Yêu cầu chờ xét duyệt từ admin
          </Typography>
        </Alert>
      )}

      {canProcessRefund && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            💰 Chờ xử lý hoàn tiền cho khách hàng
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Product Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thông tin sản phẩm
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
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
                  <Typography variant="h6" gutterBottom>
                    {request.productName}
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Đơn hàng:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {request.orderNumber}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Số lượng:
                      </Typography>
                      <Typography variant="body2">{request.quantity}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Loại:
                      </Typography>
                      <Chip
                        label={request.returnType === 'REFUND' ? 'Hoàn tiền' : 'Đổi hàng'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Request Details */}
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
                    Lý do:
                  </Typography>
                  <Chip label={RETURN_REASON_LABELS[request.reason]} variant="outlined" />
                </Box>
                
                {request.reasonDetail && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mô tả:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{request.reasonDetail}</Typography>
                    </Paper>
                  </Box>
                )}
                
                {request.returnTrackingNumber && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Mã vận đơn:
                    </Typography>
                    <Chip
                      label={request.returnTrackingNumber}
                      icon={<LocalShipping />}
                      size="small"
                      color="info"
                    />
                  </Box>
                )}
                
                {request.itemCondition && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tình trạng hàng nhận:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {ITEM_CONDITION_LABELS[request.itemCondition]}
                    </Typography>
                  </Box>
                )}
                
                {request.conditionNotes && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ghi chú tình trạng (Seller):
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                      <Typography variant="body2">{request.conditionNotes}</Typography>
                    </Paper>
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
                  Hình ảnh minh chứng
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

          {/* Admin Notes */}
          {request.adminNotes && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  <AdminPanelSettings sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Ghi chú Admin
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50' }}>
                  <Typography variant="body2">{request.adminNotes}</Typography>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Trạng thái
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Chip
                label={RETURN_STATUS_LABELS[request.status]}
                color={
                  request.status === ReturnStatus.COMPLETED ? 'success' :
                  request.status === ReturnStatus.REJECTED ? 'error' : 'warning'
                }
                sx={{ width: '100%', py: 2 }}
              />
            </CardContent>
          </Card>

          {/* Refund Amount */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Số tiền hoàn
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h4" color="primary" textAlign="center">
                {formatCurrency(request.refundAmount)}
              </Typography>
            </CardContent>
          </Card>

          {/* Actions */}
          {canReview && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Xét duyệt Admin
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Gavel />}
                  onClick={handleOpenReviewDialog}
                  fullWidth
                >
                  Xét duyệt yêu cầu
                </Button>
              </CardContent>
            </Card>
          )}

          {canProcessRefund && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Xử lý hoàn tiền
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<AttachMoney />}
                  onClick={handleOpenRefundDialog}
                  fullWidth
                >
                  Hoàn tiền
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Parties Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Các bên liên quan
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Khách hàng:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {request.buyerName || 'N/A'}
                <br />
                {request.buyerEmail || 'N/A'}
              </Typography>
              
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Cửa hàng:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {request.shopName || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Gavel sx={{ verticalAlign: 'middle', mr: 1 }} />
          Xét duyệt yêu cầu hoàn trả
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Đưa ra quyết định cuối cùng cho yêu cầu hoàn trả này
          </Alert>
          
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel>Quyết định:</FormLabel>
            <RadioGroup
              value={disputeDecision}
              onChange={(e) => setDisputeDecision(e.target.value as DisputeDecision)}
            >
              <FormControlLabel
                value={DisputeDecision.APPROVE_BUYER}
                control={<Radio />}
                label="Chấp thuận phía khách hàng - Hoàn tiền đầy đủ"
              />
              <FormControlLabel
                value={DisputeDecision.APPROVE_SELLER}
                control={<Radio />}
                label="Chấp thuận phía cửa hàng - Từ chối hoàn tiền"
              />
              <FormControlLabel
                value={DisputeDecision.PARTIAL_REFUND}
                control={<Radio />}
                label="Hoàn tiền một phần"
              />
            </RadioGroup>
          </FormControl>
          
          {disputeDecision === DisputeDecision.PARTIAL_REFUND && (
            <TextField
              fullWidth
              type="number"
              label="Số tiền hoàn cuối cùng"
              value={finalRefundAmount}
              onChange={(e) => setFinalRefundAmount(Number(e.target.value))}
              InputProps={{ endAdornment: 'VNĐ' }}
              sx={{ mb: 2 }}
            />
          )}
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Ghi chú xét duyệt *"
            placeholder="Giải thích lý do quyết định..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Xác nhận quyết định'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onClose={handleCloseRefundDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <AttachMoney sx={{ verticalAlign: 'middle', mr: 1 }} />
          Xử lý hoàn tiền
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Số tiền hoàn: <strong>{formatCurrency(request.refundAmount)}</strong>
            </Typography>
          </Alert>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel>Phương thức hoàn tiền:</FormLabel>
            <RadioGroup
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
            >
              <FormControlLabel
                value="WALLET"
                control={<Radio />}
                label="Hoàn vào ví Glassify"
              />
              <FormControlLabel
                value="BANK"
                control={<Radio />}
                label="Hoàn vào tài khoản ngân hàng"
              />
              <FormControlLabel
                value="ORIGINAL"
                control={<Radio />}
                label="Hoàn theo phương thức gốc"
              />
            </RadioGroup>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Ghi chú"
            placeholder="Ghi chú về việc hoàn tiền..."
            value={refundNotes}
            onChange={(e) => setRefundNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRefundDialog} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleProcessRefund}
            variant="contained"
            color="success"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Xác nhận hoàn tiền'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminRefundManagementPage;
