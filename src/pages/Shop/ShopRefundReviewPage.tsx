import {
  Alert,
  Badge,
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
  Visibility,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { listReturnRequests } from '@/api/refund-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import {
  RETURN_REASON_LABELS,
  RefundReviewDecision,
  RETURN_STATUS_LABELS,
  ReturnStatus,
  type RefundRequest,
} from '@/models/Refund';
import { formatCurrency } from '@/utils/formatCurrency';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { getApiErrorMessage } from '@/utils/api-error';
import type { ShopDetailResponse } from '@/models/Shop';
import { shopApi } from '@/api/shopApi';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { margin } from '@mui/system';

const ShopRefundReviewPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    itemReceived: 0,
    completed: 0,
    returnReady: 0,
    returnShipping: 0,
    returnDelivered: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [requests, setRequests] = useState<RefundRequest[]>([]);

  const statusTabs = [
    { label: 'All', value: null, count: counts.all },
    { label: 'Pending', value: ReturnStatus.REQUESTED, count: counts.pending },
    { label: 'Approved', value: ReturnStatus.APPROVED, count: counts.approved },
    { label: 'Item Received', value: ReturnStatus.ITEM_RECEIVED, count: counts.itemReceived },
    { label: 'Return Ready', value: ReturnStatus.RETURN_READY_TO_PICK, count: counts.returnReady },
    { label: 'Return Shipping', value: ReturnStatus.RETURN_SHIPPING, count: counts.returnShipping },
    { label: 'Item Returned', value: ReturnStatus.RETURN_DELIVERED, count: counts.returnDelivered },
    { label: 'Completed', value: ReturnStatus.COMPLETED, count: counts.completed },
    { label: 'Rejected', value: ReturnStatus.REJECTED, count: counts.rejected },
    { label: 'Cancelled', value: ReturnStatus.CANCELLED, count: counts.cancelled },
  ];

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const fetchRequests = async (status?: ReturnStatus | null) => {
    try {
      setLoading(true);
      const response = await listReturnRequests({
        // status: status || undefined,
        shopId: shop?.id,
        viewAsShop: true,
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
        returnReady: allRequests.filter(r => r.status === ReturnStatus.RETURN_READY_TO_PICK).length,
        returnShipping: allRequests.filter(r => r.status === ReturnStatus.RETURN_SHIPPING).length,
        returnDelivered: allRequests.filter(r => r.status === ReturnStatus.RETURN_DELIVERED).length,
        rejected: allRequests.filter(r => r.status === ReturnStatus.REJECTED).length,
        cancelled: allRequests.filter(r => r.status === ReturnStatus.CANCELLED).length,
      });
    } catch (error: any) {
      console.error('Failed to fetch return requests:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load refund requests'));
    } finally {
      setLoading(false);
    }
  };

  const fetchShopDetail = async () => {
    try {
      setLoading(true);
      const response = await shopApi.getMyShops();
      if (response.data?.[0]) {
        setShop(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch shop detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopDetail();
  }, []);

  useEffect(() => {
    if (shop?.id) {
      const currentStatus = statusTabs[selectedTab].value;
      fetchRequests(currentStatus);
    }
  }, [shop, selectedTab]);

  const sidebarProps = {
    activeMenu: PAGE_ENDPOINTS.REFUND.SELLER_LIST,
    shopName: user?.shop?.shopName,
    shopLogo: user?.shop?.logoUrl,
    ownerName: user?.fullName,
    ownerEmail: user?.email,
    ownerAvatar: user?.avatarUrl
  };

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === ReturnStatus.REQUESTED),
    [requests]
  );

  // derive filtered requests based on selected tab's status value from statusTabs
  const filteredRequests = useMemo(() => {
    const tab = statusTabs[selectedTab];
    if (!tab) return requests;
    const statusValue = tab.value;
    if (statusValue === null || statusValue === undefined) return requests;
    return requests.filter((item) => item.status === statusValue);
  }, [requests, selectedTab, statusTabs]);

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

  const adminDecisionLabel = (decision: RefundReviewDecision): string => {
    switch (decision) {
      case RefundReviewDecision.REFUND_WITHOUT_RETURN:
        return 'Refund Without Return';
      case RefundReviewDecision.RETURN_AND_REFUND:
        return 'Return and Refund';
      case RefundReviewDecision.REJECT:
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar {...sidebarProps} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar {...sidebarProps} />

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
            {statusTabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{tab.label}</span>
                    {tab.count > 0 && <Badge badgeContent={tab.count} color="primary" sx={{ pl: 1 }}/>}
                  </Stack>
                }
              />
            ))}
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
                const resolvedAdminDecision = request.adminDecision;

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
                          {resolvedAdminDecision ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={adminDecisionLabel(resolvedAdminDecision)}
                              color={
                                resolvedAdminDecision === RefundReviewDecision.REJECT
                                  ? 'error'
                                  : 'info'
                              }
                            />
                          ) : (
                            <Chip size="small" variant="outlined" label="Pending Review" />
                          )}
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
