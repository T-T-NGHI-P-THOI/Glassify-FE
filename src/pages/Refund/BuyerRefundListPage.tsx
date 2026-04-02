import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  LocalShipping,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Visibility,
  ArrowForward,
  Replay,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { listReturnRequests } from '@/api/refund-api';
import type {
  RefundRequest,
} from '@/models/Refund';
import {
  ReturnStatus,
  RETURN_STATUS_LABELS,
  RETURN_REASON_LABELS,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';
import { getApiErrorMessage } from '@/utils/api-error';

// Status icon mapping
const getStatusIcon = (status: ReturnStatus) => {
  switch (status) {
    case ReturnStatus.REQUESTED:
      return <HourglassEmpty />;
    case ReturnStatus.APPROVED:
    case ReturnStatus.RETURN_SHIPPING:
      return <LocalShipping />;
    case ReturnStatus.ITEM_RECEIVED:
      return <Replay />;
    case ReturnStatus.COMPLETED:
      return <CheckCircle />;
    case ReturnStatus.REJECTED:
    case ReturnStatus.CANCELLED:
      return <Cancel />;
    default:
      return <AssignmentReturn />;
  }
};

// Status color mapping
const getStatusColor = (status: ReturnStatus) => {
  switch (status) {
    case ReturnStatus.REQUESTED:
      return 'warning';
    case ReturnStatus.APPROVED:
    case ReturnStatus.RETURN_SHIPPING:
    case ReturnStatus.ITEM_RECEIVED:
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

const BuyerRefundListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const statusTabs = [
    { label: 'All', value: null },
    { label: 'In Progress', value: ReturnStatus.REQUESTED },
    { label: 'Approved', value: ReturnStatus.APPROVED },
    { label: 'Completed', value: ReturnStatus.COMPLETED },
    { label: 'Cancelled', value: ReturnStatus.CANCELLED },
  ];

  const fetchRequests = async (status?: ReturnStatus | null) => {
    try {
      setLoading(true);
      const response = await listReturnRequests({
        status: status || undefined,
        sortBy: 'requestedAt',
        sortDirection: 'DESC',
      });
      setRequests(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch return requests:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load refund requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentStatus = statusTabs[selectedTab].value;
    fetchRequests(currentStatus);
  }, [selectedTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleViewDetail = (requestId: string) => {
    navigate(`/user/refunds/${requestId}`);
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <AssignmentReturn sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Return & Exchange Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your return and exchange requests
        </Typography>
      </Box>

      {/* Tabs for filtering */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              minWidth: 120,
            },
          }}
        >
          {statusTabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <AssignmentReturn sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No return requests yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Your return requests will appear here
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowForward />}
            onClick={() => navigate('/my-orders')}
          >
            View Orders
          </Button>
        </Paper>
      )}

      {/* Request list */}
      {!loading && requests.length > 0 && (
        <Grid container spacing={3}>
          {requests.map((request) => (
            <Grid size={{ xs: 12 }} key={request.id}>
              <Card
                elevation={2}
                sx={{
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  {/* Header with request number and status */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6" fontWeight="bold">
                        #{request.requestNumber}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(request.status)}
                        label={RETURN_STATUS_LABELS[request.status]}
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.requestedAt)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Product info */}
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Avatar
                        src={request.productImageUrl}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                      >
                        <AssignmentReturn />
                      </Avatar>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {request.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Order Number: {request.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Shop: {request.shopName}
                      </Typography>
                      <Chip
                        label={RETURN_REASON_LABELS[request.reason]}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }} textAlign="right">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Request Type
                      </Typography>
                      <Chip
                        label={request.returnType === 'REFUND' ? 'Refund' : 'Exchange'}
                        color={request.returnType === 'REFUND' ? 'primary' : 'secondary'}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(request.refundAmount)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Progress indicator for certain statuses */}
                  {request.status === ReturnStatus.RETURN_SHIPPING && request.returnTrackingNumber && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Tracking Number: <strong>{request.returnTrackingNumber}</strong>
                      </Typography>
                    </Alert>
                  )}

                  {request.status === ReturnStatus.REJECTED && request.rejectionReason && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Rejection Reason: {request.rejectionReason}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetail(request.id)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default BuyerRefundListPage;
