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
  Badge,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  Visibility,
  Gavel,
  Store,
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
  SHOP_APPEAL_STATUS_LABELS,
  ShopAppealStatus,
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
    case ReturnStatus.ITEM_RECEIVED:
      return <CheckCircle />;
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
      return 'info';
    case ReturnStatus.ITEM_RECEIVED:
      return 'success';
    case ReturnStatus.COMPLETED:
      return 'success';
    case ReturnStatus.REJECTED:
    case ReturnStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

const SellerRefundListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    itemReceived: 0,
    completed: 0,
  });

  const statusTabs = [
    { label: 'All', value: null, count: counts.all },
    { label: 'Pending', value: ReturnStatus.REQUESTED, count: counts.pending },
    { label: 'Approved', value: ReturnStatus.APPROVED, count: counts.approved },
    { label: 'Item Received', value: ReturnStatus.ITEM_RECEIVED, count: counts.itemReceived },
    { label: 'Completed', value: ReturnStatus.COMPLETED, count: counts.completed },
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
      
      // Calculate counts (in real app, this should come from API)
      const allRequests = response.data || [];
      setCounts({
        all: allRequests.length,
        pending: allRequests.filter(r => r.status === ReturnStatus.REQUESTED).length,
        approved: allRequests.filter(r => r.status === ReturnStatus.APPROVED).length,
        itemReceived: allRequests.filter(r => r.status === ReturnStatus.ITEM_RECEIVED).length,
        completed: allRequests.filter(r => r.status === ReturnStatus.COMPLETED).length,
      });
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
    navigate(`/shop/refunds/${requestId}`);
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

  const needsAction = (request: RefundRequest) => {
    return (
      request.status === ReturnStatus.REQUESTED ||
      (request.status === ReturnStatus.RETURN_SHIPPING && !request.returnTrackingNumber)
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              <Store sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
              Refund Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Process customer return and exchange requests
            </Typography>
          </Box>
          {counts.pending > 0 && (
            <Alert severity="warning" variant="outlined">
              <Typography variant="body2" fontWeight="medium">
                <strong>{counts.pending}</strong> requests need attention
              </Typography>
            </Alert>
          )}
        </Stack>
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
          <Typography variant="body2" color="text.secondary">
            Customer return requests will appear here
          </Typography>
        </Paper>
      )}

      {/* Request list */}
      {!loading && requests.length > 0 && (
        <Grid container spacing={3}>
          {requests.map((request) => (
            <Grid item xs={12} key={request.id}>
              <Card
                elevation={needsAction(request) ? 4 : 2}
                sx={{
                  transition: 'all 0.3s',
                  border: needsAction(request) ? `2px solid ${theme.palette.warning.main}` : 'none',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  {/* Urgent action badge */}
                  {needsAction(request) && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Action Required
                      </Typography>
                    </Alert>
                  )}

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
                    <Grid item xs={12} sm={2}>
                      <Avatar
                        src={request.productImageUrl}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                      >
                        <AssignmentReturn />
                      </Avatar>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {request.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Order Number: {request.orderNumber}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                          label={RETURN_REASON_LABELS[request.reason]}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={request.returnType === 'REFUND' ? 'Refund' : 'Exchange'}
                          color={request.returnType === 'REFUND' ? 'primary' : 'secondary'}
                          size="small"
                        />
                        {request.adminDirectRefund && (
                          <Chip
                            label={SHOP_APPEAL_STATUS_LABELS[request.shopAppealStatus ?? ShopAppealStatus.NONE]}
                            color={
                              request.shopAppealStatus === ShopAppealStatus.SUBMITTED
                                ? 'warning'
                                : request.shopAppealStatus === ShopAppealStatus.APPROVED
                                  ? 'success'
                                  : request.shopAppealStatus === ShopAppealStatus.REJECTED || request.shopAppealStatus === ShopAppealStatus.EXPIRED
                                    ? 'error'
                                    : 'default'
                            }
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4} textAlign="right">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Refund Amount
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(request.refundAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Quantity: {request.quantity}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Additional info for tracking */}
                  {request.status === ReturnStatus.RETURN_SHIPPING && request.returnTrackingNumber && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Customer shipped the item - Tracking Number:{' '}
                        <strong>{request.returnTrackingNumber}</strong>
                      </Typography>
                    </Alert>
                  )}

                  {request.status === ReturnStatus.ITEM_RECEIVED && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Confirmed item received - Waiting for refund
                      </Typography>
                    </Alert>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  {needsAction(request) && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<Gavel />}
                      onClick={() => handleViewDetail(request.id)}
                    >
                      Process Now
                    </Button>
                  )}
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

export default SellerRefundListPage;
