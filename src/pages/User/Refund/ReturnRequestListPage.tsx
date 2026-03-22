import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { listReturnRequests } from '../../../api/refund-api';
import { RefundRequest, ReturnStatus, RETURN_STATUS_LABELS } from '../../../models/Refund';
import { formatCurrency } from '../../../utils/formatCurrency';

const ReturnRequestListPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReturnStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchReturnRequests();
  }, [activeTab]);

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const filter = activeTab !== 'ALL' ? { status: activeTab } : {};
      const response = await listReturnRequests(filter);
      setRequests(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách yêu cầu hoàn trả');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ReturnStatus) => {
    switch (status) {
      case ReturnStatus.REQUESTED:
      case ReturnStatus.SELLER_REVIEWING:
        return 'warning';
      case ReturnStatus.APPROVED:
      case ReturnStatus.RETURN_SHIPPING:
        return 'info';
      case ReturnStatus.COMPLETED:
        return 'success';
      case ReturnStatus.REJECTED:
      case ReturnStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: ReturnStatus | 'ALL') => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Yêu cầu hoàn trả / Đổi hàng</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Tất cả" value="ALL" />
        <Tab label="Đang chờ" value={ReturnStatus.REQUESTED} />
        <Tab label="Đã duyệt" value={ReturnStatus.APPROVED} />
        <Tab label="Đang vận chuyển" value={ReturnStatus.RETURN_SHIPPING} />
        <Tab label="Hoàn tất" value={ReturnStatus.COMPLETED} />
        <Tab label="Đã từ chối" value={ReturnStatus.REJECTED} />
      </Tabs>

      {requests.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Không có yêu cầu hoàn trả nào
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {requests.map((request) => (
            <Grid item xs={12} key={request.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 },
                  transition: 'box-shadow 0.3s',
                }}
                onClick={() => navigate(`/user/refunds/${request.id}`)}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                      <img
                        src={request.productImageUrl || '/placeholder.png'}
                        alt={request.productName}
                        style={{
                          width: '100%',
                          height: 'auto',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={7}>
                      <Typography variant="h6" gutterBottom>
                        {request.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Mã yêu cầu: {request.requestNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Đơn hàng: {request.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Cửa hàng: {request.shopName}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Loại: {request.returnType === 'REFUND' ? 'Hoàn tiền' : 'Đổi hàng'}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Số tiền hoàn:</strong> {formatCurrency(request.refundAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3} textAlign="right">
                      <Chip
                        label={RETURN_STATUS_LABELS[request.status]}
                        color={getStatusColor(request.status)}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Ngày yêu cầu: {new Date(request.requestedAt).toLocaleDateString('vi-VN')}
                      </Typography>
                      {request.approvedAt && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Ngày duyệt: {new Date(request.approvedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/refunds/${request.id}`);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ReturnRequestListPage;
