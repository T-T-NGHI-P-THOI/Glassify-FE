import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { styled, useTheme, type Theme } from '@mui/material/styles';
import {
  ArrowBack,
  MoreHoriz,
  ExpandMore,
  CheckCircle,
  LocalShipping,
  Inventory,
  Home,
  ReportProblem,
  CheckCircleOutline,
  Cancel,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShopOwnerSidebar } from '../../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import type { ShopOrderResponse } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

// ─── Stepper ─────────────────────────────────────────────────────────────────

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.custom.border.light,
    borderTopWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.custom.status.success.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.custom.status.success.main,
  },
}));

const shipmentSteps = [
  { label: 'Pending',          key: 'PENDING' },
  { label: 'Confirmed',        key: 'CONFIRMED' },
  { label: 'Processing',        key: 'PROCESSING' },
  { label: 'Picked Up',        key: 'PICKED_UP' },
  { label: 'In Transit',       key: 'SHIPPED' },
  { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered',        key: 'DELIVERED' },
];

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PICKED_UP'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {};

const getStatusColor = (status: string, theme: Theme) => {
  const { custom } = theme.palette;
  switch (status) {
    case 'DELIVERED':      return { bg: custom.status.success.light,  color: custom.status.success.main };
    case 'SHIPPED':
    case 'IN_TRANSIT':
    case 'PICKED_UP':      return { bg: custom.status.info.light,     color: custom.status.info.main };
    case 'OUT_FOR_DELIVERY': return { bg: custom.status.warning.light, color: custom.status.warning.main };
    case 'CONFIRMED':
    case 'PROCESSING':     return { bg: custom.status.indigo.light,   color: custom.status.indigo.main };
    case 'PENDING':        return { bg: custom.neutral[100],           color: custom.neutral[500] };
    case 'CANCELLED':      return { bg: custom.status.error.light,    color: custom.status.error.main };
    case 'RETURNED':       return { bg: custom.status.rose.light,     color: custom.status.rose.main };
    default:               return { bg: custom.neutral[100],           color: custom.neutral[500] };
  }
};

const getStatusLabel = (status: string) => {
  const step = shipmentSteps.find(s => s.key === status);
  return step?.label ?? status;
};

const getActiveStep = (status: string) => {
  const idx = shipmentSteps.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

// ─── Next action ──────────────────────────────────────────────────────────────

type ActionConfig = {
  label: string;
  hasApi: boolean;
};

const getNextAction = (status: string): ActionConfig | null => {
  switch (status) {
    case 'PENDING':    return { label: 'Confirm Order',  hasApi: true };
    case 'CONFIRMED':  return { label: 'Start Processing', hasApi: true };
    case 'PROCESSING': return { label: 'Picked Up',      hasApi: false };
    default:           return null;
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ShipmentDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [order, setOrder] = useState<ShopOrderResponse | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReasons, setCancelReasons] = useState<string[]>([]);
  // local UI-only status overrides for steps without API
  const [localStatusOverride, setLocalStatusOverride] = useState<string | null>(null);

  useEffect(() => {
    shopApi.getMyShops().then((res) => {
      const shops = res.data;
      setShop(Array.isArray(shops) && shops.length > 0 ? shops[0] : null);
    }).catch(() => setShop(null));
  }, []);

  useEffect(() => {
    if (!shop || !id) return;
    setLoadingOrder(true);
    shopApi.getShopOrderById(shop.id, id)
      .then((res) => { if (res.data) setOrder(res.data); })
      .catch(console.error)
      .finally(() => setLoadingOrder(false));
  }, [shop, id]);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  if (loadingOrder || !order) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.ORDERS}
          shopName={shop?.shopName}
          shopLogo={shop?.logoUrl}
          ownerName={shop?.ownerName || user?.fullName}
          ownerEmail={shop?.ownerEmail || user?.email}
          ownerAvatar={user?.avatarUrl}
        />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  const currentStatus = localStatusOverride ?? order.status;
  const statusStyle = getStatusColor(currentStatus, theme);
  const activeStep = getActiveStep(currentStatus);
  const nextAction = getNextAction(currentStatus);

  const handleAction = async () => {
    if (!nextAction || !shop) return;
    if (nextAction.hasApi) {
      try {
        setActionLoading(true);
        const apiCall =
          currentStatus === 'PENDING'
            ? shopApi.confirmShopOrder(shop.id, order.id)
            : shopApi.processShopOrder(shop.id, order.id);
        const res = await apiCall;
        if (res.data) setOrder(res.data);
        setLocalStatusOverride(null);
      } catch (err) {
        console.error('Failed to update order:', err);
      } finally {
        setActionLoading(false);
      }
    } else {
      // UI-only transition
      const nextStep = shipmentSteps[activeStep + 1];
      if (nextStep) setLocalStatusOverride(nextStep.key);
    }
  };

  const SHOP_CANCEL_REASONS = [
    'Out of stock',
    'Cannot fulfill the order',
    'Customer requested cancellation',
    'Product quality issue',
    'Incorrect order details',
    'Other',
  ];

  const handleCancel = () => {
    setCancelReasons([]);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!shop || cancelReasons.length === 0) return;
    try {
      setCancelLoading(true);
      const res = await shopApi.cancelShopOrder(shop.id, order.id, cancelReasons.join('; '));
      if (res.data) setOrder(res.data);
      setLocalStatusOverride(null);
      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  const toggleCancelReason = (reason: string) => {
    setCancelReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason],
    );
  };

  return (
    <>
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.ORDERS}
        shopName={shop?.shopName}
        shopLogo={shop?.logoUrl}
        ownerName={shop?.ownerName || user?.fullName}
        ownerEmail={shop?.ownerEmail || user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(PAGE_ENDPOINTS.SHOP.ORDERS)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Order: #{order.shopOrderNumber}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(currentStatus)}
            sx={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 600,
              fontSize: 14,
              px: 2,
              py: 0.5,
            }}
          />
        </Box>

        {/* Progress Stepper */}
        <Paper
          elevation={0}
          sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
        >
          <Stepper activeStep={activeStep} connector={<CustomConnector />} alternativeLabel>
            {shipmentSteps.map((step, index) => (
              <Step key={step.key} completed={index < activeStep}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          index <= activeStep
                            ? theme.palette.custom.status.success.main
                            : theme.palette.custom.border.light,
                        color:
                          index <= activeStep
                            ? theme.palette.primary.contrastText
                            : theme.palette.custom.neutral[400],
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {index < activeStep ? (
                        <CheckCircle sx={{ fontSize: 20 }} />
                      ) : (
                        index + 1
                      )}
                    </Box>
                  )}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: index <= activeStep ? 600 : 400,
                      color:
                        index <= activeStep
                          ? theme.palette.custom.neutral[800]
                          : theme.palette.custom.neutral[400],
                    }}
                  >
                    {step.label}
                  </Typography>
                  {index === 0 && order.orderedAt && (
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                      {formatDate(order.orderedAt)}
                    </Typography>
                  )}
                  {index === 4 && order.shippedAt && (
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                      {formatDate(order.shippedAt)}
                    </Typography>
                  )}
                  {index === 6 && order.deliveredAt && (
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                      {formatDate(order.deliveredAt)}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2.5 }}>
            {currentStatus !== 'CANCELLED' && currentStatus !== 'DELIVERED' && currentStatus !== 'RETURNED' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={cancelLoading ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
                disabled={cancelLoading || actionLoading}
                onClick={handleCancel}
                sx={{ fontWeight: 600, borderRadius: 2, px: 3, textTransform: 'none' }}
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}
            {nextAction && (
              <Button
                variant="contained"
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutline />}
                disabled={actionLoading || cancelLoading}
                onClick={handleAction}
                sx={{
                  bgcolor: theme.palette.custom.status.success.main,
                  '&:hover': { filter: 'brightness(0.92)' },
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                }}
              >
                {nextAction.label}
              </Button>
            )}
          </Box>
        </Paper>

        {/* Information Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 3 }}>
          {/* Order Information */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Inventory sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Order Information
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>ORDERED AT</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formatDate(order.orderedAt)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>DELIVERED AT</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formatDate(order.deliveredAt)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>CUSTOMER NOTE</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {order.customerNote ?? '—'}
              </Typography>
            </Box>
          </Paper>

          {/* Location */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalShipping sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Location
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>RECIPIENT NAME</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {order.shippingName}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>DELIVERY ADDRESS</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {order.shippingAddress}
              </Typography>
            </Box>
          </Paper>

          {/* Customer Information */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Home sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Customer Information
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>FULL NAME</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {order.customerName}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>PHONE NUMBER</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {order.shippingPhone}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>PAYMENT METHOD</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {order.paymentMethod}
              </Typography>
            </Box>
          </Paper>

          {/* Carrier Information */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalShipping sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Carrier Information
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>CARRIER</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                Giao Hàng Nhanh
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>GHN ORDER CODE</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: order.ghnOrderCode ? theme.palette.custom.status.info.main : theme.palette.custom.neutral[400] }}>
                {order.ghnOrderCode ?? '—'}
              </Typography>
            </Box>
            {/* <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>TRACKING NUMBER</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: order.trackingNumber ? theme.palette.custom.status.info.main : theme.palette.custom.neutral[400] }}>
                {order.trackingNumber ?? '—'}
              </Typography>
            </Box> */}
            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>SHIPPED AT</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formatDate(order.shippedAt)}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Item List */}
        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden', mb: 3 }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
              Item List
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>NO</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>PRODUCT</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>LENS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>UNIT PRICE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>LINE TOTAL</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ color: theme.palette.custom.neutral[500] }}>{index + 1}.</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          variant="rounded"
                          src={item.productImageUrl}
                          sx={{ width: 40, height: 40, bgcolor: theme.palette.custom.neutral[100] }}
                        >
                          {item.productName[0]}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {item.productName}
                          </Typography>
                          {item.productSku && (
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              SKU: {item.productSku}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.itemType}
                        size="small"
                        sx={{ fontSize: 11, fontWeight: 600, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.neutral[800] }}>
                      {item.lensName ?? '—'}{item.lensTintName ? ` / ${item.lensTintName}` : ''}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.neutral[800], textAlign: 'center' }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.neutral[800] }}>
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.status.success.main, fontWeight: 600 }}>
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <MoreHoriz sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.custom.border.light}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 4,
            }}
          >
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Shipping Fee: <strong>{formatCurrency(order.shippingFee)}</strong>
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Discount: <strong>{formatCurrency(order.discountAmount)}</strong>
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Total: <strong>{formatCurrency(order.totalAmount)}</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Return & Refund */}
        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}
        >
          <Accordion defaultExpanded={order.status === 'RETURNED' || !!order.returnReason}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ReportProblem
                  sx={{ color: order.returnReason ? theme.palette.custom.status.warning.main : theme.palette.custom.neutral[500] }}
                />
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Return &amp; Refund Information
                </Typography>
                {order.returnReason && (
                  <Chip
                    label="Returned"
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.custom.status.error.light,
                      color: theme.palette.custom.status.error.main,
                      fontWeight: 600,
                      fontSize: 12,
                      height: 24,
                    }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {!order.returnReason ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: theme.palette.custom.status.success.main, mb: 2 }} />
                  <Typography sx={{ color: theme.palette.custom.neutral[500] }}>
                    No return request for this order
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, p: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>RETURN REASON</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{order.returnReason}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>RETURNED AT</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formatDate(order.returnedAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>REFUND AMOUNT</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                      {order.refundAmount != null ? formatCurrency(order.refundAmount) : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>REFUNDED AT</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formatDate(order.refundedAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>RETURN IN TRANSIT AT</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formatDate(order.returnInTransitAt)}</Typography>
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Box>

    {/* ── Cancel Confirmation Dialog ─────────────────────────────── */}
    <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Cancel sx={{ color: theme.palette.error.main, fontSize: 22 }} />
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Cancel Order
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.5 }}>
          Please select the reason(s) for cancellation. This cannot be undone.
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {SHOP_CANCEL_REASONS.map((reason) => (
            <FormControlLabel
              key={reason}
              control={
                <Checkbox
                  size="small"
                  checked={cancelReasons.includes(reason)}
                  onChange={() => toggleCancelReason(reason)}
                  sx={{ color: theme.palette.custom.neutral[400] }}
                />
              }
              label={
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  {reason}
                </Typography>
              }
            />
          ))}
        </Box>
        {cancelReasons.length === 0 && (
          <Typography sx={{ fontSize: 12, color: theme.palette.error.main, mt: 1 }}>
            Please select at least one reason to proceed.
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={() => setCancelDialogOpen(false)}
          sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={cancelReasons.length === 0 || cancelLoading}
          onClick={handleConfirmCancel}
          startIcon={cancelLoading ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

// suppress unused var warning for STATUS_COLORS
void STATUS_COLORS;

export default ShipmentDetailPage;
