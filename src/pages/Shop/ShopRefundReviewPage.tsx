import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AssignmentReturn,
  Gavel,
  Visibility,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { listReturnRequests } from '@/api/refund-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { useLayout } from '@/layouts/LayoutContext';
import {
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  ReturnStatus,
  type RefundRequest,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { getApiErrorMessage } from '@/utils/api-error';

const ShopRefundReviewPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setShowNavbar, setShowFooter } = useLayout();

  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [requests, setRequests] = useState<RefundRequest[]>([]);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await listReturnRequests({
        sortBy: 'requestedAt',
        sortDirection: 'DESC',
      });
      setRequests(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch refund requests:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load refund requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const pendingRequests = useMemo(
    () =>
      requests.filter((item) => item.status === ReturnStatus.REQUESTED),
    [requests]
  );

  const returnShippingRequests = useMemo(
    () => requests.filter((item) => item.status === ReturnStatus.RETURN_SHIPPING),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    switch (selectedTab) {
      case 1:
        return pendingRequests;
      case 2:
        return returnShippingRequests;
      default:
        return requests;
    }
  }, [pendingRequests, requests, returnShippingRequests, selectedTab]);

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusColor = (status: ReturnStatus): 'warning' | 'success' | 'info' | 'error' | 'default' => {
    switch (status) {
      case ReturnStatus.REQUESTED:
        return 'warning';
      case ReturnStatus.APPROVED:
      case ReturnStatus.RETURN_SHIPPING:
        return 'info';
      case ReturnStatus.ITEM_RECEIVED:
      case ReturnStatus.COMPLETED:
        return 'success';
      case ReturnStatus.REJECTED:
      case ReturnStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

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

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Refund Tracking
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Track refund requests after admin review and follow the next required step.
          </Typography>
        </Box>

        {pendingRequests.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
                There are <strong>{pendingRequests.length}</strong> refund requests waiting for admin decision.
            </Typography>
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            mb: 3,
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(_event, value) => setSelectedTab(value)}
            sx={{
              px: 2,
              borderBottom: `1px solid ${theme.palette.custom.border.light}`,
              '& .MuiTab-root': { textTransform: 'none' },
            }}
          >
            <Tab label={`All (${requests.length})`} />
            <Tab label={`Waiting for Admin Decision (${pendingRequests.length})`} />
            <Tab label={`Return Shipping (${returnShippingRequests.length})`} />
          </Tabs>

          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : filteredRequests.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <AssignmentReturn sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 1.5 }} />
              <Typography sx={{ fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 0.5 }}>
                No matching refund requests
              </Typography>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                Requests will appear here when customers submit refund requests.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ p: 2 }}>
              {filteredRequests.map((request) => {
                const isPendingReview = request.status === ReturnStatus.REQUESTED;

                return (
                  <Paper
                    key={request.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderColor: isPendingReview ? theme.palette.warning.main : theme.palette.custom.border.light,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2}
                      justifyContent="space-between"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>#{request.requestNumber}</Typography>
                          <Chip
                            size="small"
                            label={RETURN_STATUS_LABELS[request.status]}
                            color={getStatusColor(request.status)}
                          />
                          <Chip size="small" variant="outlined" label={RETURN_REASON_LABELS[request.reason]} />
                        </Stack>

                        <Typography sx={{ fontWeight: 600, mb: 0.25 }}>{request.productName}</Typography>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                          Order: {request.orderNumber} | Requested: {formatDateTime(request.requestedAt)}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], mt: 0.5 }}>
                          Refund amount: <strong>{formatCurrency(request.refundAmount)}</strong>
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() =>
                            navigate(PAGE_ENDPOINTS.REFUND.SELLER_DETAIL.replace(':requestId', request.id))
                          }
                        >
                          View Detail
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopRefundReviewPage;
