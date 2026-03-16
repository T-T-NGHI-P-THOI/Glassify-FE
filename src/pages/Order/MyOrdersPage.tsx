import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Tabs,
  Tab,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Cancel,
  Inventory,
  HourglassEmpty,
  LocationOn,
  CreditCard,
  ArrowForward,
  Person,
  Phone,
  VerifiedUser,
  LocalOffer,
  Description,
  Store,
  Visibility,
  AssignmentReturn,
  Close,
  CloudUpload,
  Delete,
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/api/order-api';
import { toast } from 'react-toastify';
import CircularProgress from '@mui/material/CircularProgress';
import { ReturnReason, ReturnStatus, ReturnType, RETURN_REASON_LABELS } from '@/models/Refund';
import { checkReturnEligibility, createReturnRequest } from '@/api/refund-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

// ==================== ENUMS (matching backend) ====================
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'COD' | 'E_WALLET' | 'PAYPAL' | 'VNPAY';
type ItemType = 'FRAME' | 'LENS' | 'ACCESSORY' | 'BUNDLE' | 'GIFT';

// ==================== INTERFACES (matching backend models) ====================
interface OrderItem {
  id: string;
  productName: string;
  productSku?: string;
  productImageUrl?: string;
  variantInfo?: Record<string, any>;
  lensName?: string;
  lensTintName?: string;
  lensFeaturesSnapshot?: Record<string, any>;
  prescriptionSnapshot?: Record<string, any>;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  lineTotal: number;
  isFree: boolean;
  giftNote?: string;
  warrantyMonths: number;
  warrantyExpiresAt?: string;
  timesReturned: number;
  timesWarrantyClaimed: number;
  itemType: ItemType;
  shopId: string;
  shopName: string;
  shopLogoUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string;
  customerNote?: string;
  orderedAt: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  trackingNumber?: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  refundRequestId?: string;
  refundRequestedAt?: string;
  refundStatus?: ReturnStatus;
}

// Mock data removed - using real API

// ==================== HELPERS ====================
const ORDER_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'PENDING': return 0;
    case 'CONFIRMED': return 1;
    case 'PROCESSING': return 1;
    case 'SHIPPED': return 2;
    case 'DELIVERED': return 3;
    case 'CANCELLED': return -1;
    case 'REFUNDED': return -1;
    default: return 0;
  }
};

const getPaymentMethodLabel = (method: PaymentMethod) => {
  switch (method) {
    case 'CREDIT_CARD': return 'Credit Card';
    case 'DEBIT_CARD': return 'Debit Card';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    case 'COD': return 'Cash on Delivery';
    case 'E_WALLET': return 'E-Wallet';
    case 'PAYPAL': return 'PayPal';
    case 'VNPAY': return 'VNPay';
    default: return method;
  }
};

const getPaymentStatusLabel = (status: PaymentStatus) => {
  switch (status) {
    case 'PENDING': return 'Unpaid';
    case 'PAID': return 'Paid';
    case 'FAILED': return 'Failed';
    case 'REFUNDED': return 'Refunded';
    case 'PARTIALLY_REFUNDED': return 'Partially Refunded';
    default: return status;
  }
};

const getItemTypeLabel = (type: ItemType) => {
  switch (type) {
    case 'FRAME': return 'Frame';
    case 'LENS': return 'Lens';
    case 'ACCESSORY': return 'Accessory';
    case 'BUNDLE': return 'Bundle';
    default: return type;
  }
};

const formatVariantInfo = (variantInfo?: Record<string, any>) => {
  if (!variantInfo) return '';
  return Object.values(variantInfo).join(' / ');
};

const groupItemsByShop = (items: OrderItem[]) => {
  const shopMap = new Map<string, { shopId: string; shopName: string; shopLogoUrl?: string; items: OrderItem[] }>();
  items.forEach((item) => {
    const existing = shopMap.get(item.shopId);
    if (existing) {
      existing.items.push(item);
    } else {
      shopMap.set(item.shopId, {
        shopId: item.shopId,
        shopName: item.shopName,
        shopLogoUrl: item.shopLogoUrl,
        items: [item],
      });
    }
  });
  return Array.from(shopMap.values());
};

const getRefundStatusLabel = (status?: ReturnStatus) => {
  switch (status) {
    case ReturnStatus.REQUESTED:
      return 'Đã gửi yêu cầu';
    case ReturnStatus.SELLER_REVIEWING:
      return 'Người bán đang xem xét';
    case ReturnStatus.PLATFORM_REVIEWING:
      return 'Sàn đang xem xét';
    case ReturnStatus.APPROVED:
      return 'Đã duyệt';
    case ReturnStatus.REJECTED:
      return 'Đã từ chối';
    case ReturnStatus.RETURN_SHIPPING:
      return 'Đang trả hàng';
    case ReturnStatus.ITEM_RECEIVED:
      return 'Người bán đã nhận hàng';
    case ReturnStatus.REFUNDING:
      return 'Đang hoàn tiền';
    case ReturnStatus.COMPLETED:
      return 'Hoàn tất';
    case ReturnStatus.CANCELLED:
      return 'Đã hủy';
    default:
      return 'Đã gửi yêu cầu';
  }
};

// ==================== ORDER STEPPER ====================
interface OrderStepperProps {
  status: OrderStatus;
}

const OrderStepper = ({ status }: OrderStepperProps) => {
  const theme = useTheme();
  const activeStep = getStepIndex(status);
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 2,
          borderRadius: 1.5,
          bgcolor: theme.palette.custom.status.error.light,
        }}
      >
        <Cancel sx={{ fontSize: 20, color: theme.palette.custom.status.error.main }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.error.main }}>
          Order has been cancelled
        </Typography>
      </Box>
    );
  }

  const stepIcons = [
    <HourglassEmpty key="pending" sx={{ fontSize: 18 }} />,
    <Inventory key="processing" sx={{ fontSize: 18 }} />,
    <LocalShipping key="shipped" sx={{ fontSize: 18 }} />,
    <CheckCircle key="delivered" sx={{ fontSize: 18 }} />,
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
      {ORDER_STEPS.map((label, index) => {
        const isCompleted = index <= activeStep;
        const isActive = index === activeStep;

        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: index < ORDER_STEPS.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isCompleted
                    ? theme.palette.custom.status.success.main
                    : theme.palette.custom.neutral[200],
                  color: isCompleted ? '#fff' : theme.palette.custom.neutral[400],
                  transition: 'all 0.3s',
                  boxShadow: isActive ? `0 0 0 4px ${theme.palette.custom.status.success.light}` : 'none',
                }}
              >
                {stepIcons[index]}
              </Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isCompleted
                    ? theme.palette.custom.status.success.main
                    : theme.palette.custom.neutral[400],
                  mt: 0.75,
                  textAlign: 'center',
                }}
              >
                {label}
              </Typography>
            </Box>

            {index < ORDER_STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  bgcolor: index < activeStep
                    ? theme.palette.custom.status.success.main
                    : theme.palette.custom.neutral[200],
                  mx: 0.5,
                  mb: 2.5,
                  borderRadius: 2,
                  transition: 'all 0.3s',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// ==================== MAIN PAGE ====================
const MyOrdersPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Return Request Dialog States
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedOrderItemForReturn, setSelectedOrderItemForReturn] = useState<OrderItem | null>(null);
  const [returnReason, setReturnReason] = useState<ReturnReason>(ReturnReason.DEFECTIVE_LENS);
  const [returnDescription, setReturnDescription] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderApi.getMyOrders({ size: 50 });
      if (response.data) {
        setOrders((response.data.orders || []) as Order[]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrderId(orderId);
      await orderApi.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setDetailDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReOrder = async (orderId: string) => {
    try {
      await orderApi.reOrder(orderId);
      toast.success('Re-order created successfully');
      await fetchOrders();
    } catch (error) {
      console.error('Failed to re-order:', error);
      toast.error('Failed to re-order');
    }
  };

  // Return Request Handlers
  const handleOpenReturnDialog = (orderItem: OrderItem) => {
    setSelectedOrderItemForReturn(orderItem);
    setReturnReason(ReturnReason.DEFECTIVE_LENS);
    setReturnDescription('');
    setReturnImages([]);
    setReturnDialogOpen(true);
  };

  const handleCloseReturnDialog = () => {
    setReturnDialogOpen(false);
    setSelectedOrderItemForReturn(null);
    setReturnDescription('');
    setReturnImages([]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Convert files to base64 or upload to server
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReturnImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setReturnImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturnRequest = async () => {
    if (!selectedOrderItemForReturn || !selectedOrder) {
      toast.error('Không tìm thấy thông tin sản phẩm');
      return;
    }

    if (!returnDescription.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết lý do trả hàng');
      return;
    }

    try {
      setSubmittingReturn(true);

      const requestData = {
        orderItemId: selectedOrderItemForReturn.id,
        returnType: ReturnType.REFUND,
        reason: returnReason,
        reasonDetail: returnDescription,
        quantity: selectedOrderItemForReturn.quantity,
        evidenceImages: returnImages,
      };

      const response = await createReturnRequest(requestData);
      toast.success('Tạo yêu cầu trả hàng thành công');
      handleCloseReturnDialog();
      setDetailDialogOpen(false);
      
      // Navigate to refund detail page
      if (response.data?.id) {
        navigate(`${PAGE_ENDPOINTS.REFUND.BUYER_DETAIL.replace(':requestId', response.data.id)}`);
      }
    } catch (error: any) {
      console.error('Failed to create return request:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo yêu cầu trả hàng');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'PROCESSING':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'SHIPPED':
        return { bg: theme.palette.custom.status.purple.light, color: theme.palette.custom.status.purple.main };
      case 'DELIVERED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'CANCELLED':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      case 'REFUNDED':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'CONFIRMED':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'PAID':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'FAILED':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      case 'REFUNDED':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const getItemTypeColor = (type: ItemType) => {
    switch (type) {
      case 'FRAME':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'LENS':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'ACCESSORY':
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] };
      case 'BUNDLE':
        return { bg: theme.palette.custom.status.purple.light, color: theme.palette.custom.status.purple.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      case 'CONFIRMED': return 'Confirmed';
      case 'REFUNDED': return 'Refunded';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return order.status === 'PENDING';
    if (activeTab === 2) return order.status === 'PROCESSING';
    if (activeTab === 3) return order.status === 'SHIPPED';
    if (activeTab === 4) return order.status === 'DELIVERED';
    if (activeTab === 5) return order.status === 'CANCELLED';
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.custom.neutral[800],
              mb: 0.5,
            }}
          >
            My Orders
          </Typography>
          <Typography sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }}>
            Track and manage your orders
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.custom.border.light}`,
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: 14,
                minHeight: 48,
              },
            }}
          >
            <Tab label={`All (${orders.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Processing (${processingCount})`} />
            <Tab label={`Shipped (${shippedCount})`} />
            <Tab label={`Delivered (${deliveredCount})`} />
            <Tab label={`Cancelled (${cancelledCount})`} />
          </Tabs>
        </Paper>

        {/* Order Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={40} sx={{ color: theme.palette.custom.neutral[400] }} />
            </Box>
          )}
          {!loading && filteredOrders.map((order) => {
            const statusStyle = getStatusColor(order.status);
            const paymentStyle = getPaymentStatusColor(order.paymentStatus);
            return (
              <Paper
                key={order.id}
                elevation={0}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.custom.border.light}`,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  },
                }}
              >
                {/* Card Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 1.5,
                    bgcolor: theme.palette.custom.neutral[50],
                    borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {order.orderNumber}
                    </Typography>
                    <Chip
                      label={getStatusLabel(order.status)}
                      size="small"
                      sx={{
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 600,
                        fontSize: 12,
                        height: 24,
                      }}
                    />
                    <Chip
                      label={getPaymentStatusLabel(order.paymentStatus)}
                      size="small"
                      sx={{
                        bgcolor: paymentStyle.bg,
                        color: paymentStyle.color,
                        fontWeight: 600,
                        fontSize: 11,
                        height: 22,
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    {formatDate(order.orderedAt)}
                  </Typography>
                </Box>

                {/* Card Body */}
                <Box sx={{ px: 3, py: 2 }}>
                  {/* Product Items grouped by Shop */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    {(() => {
                      const shopGroups = groupItemsByShop(order.items);
                      const isMultiShop = shopGroups.length > 1;
                      return shopGroups.map((shopGroup, groupIndex) => (
                        <Box key={shopGroup.shopId}>
                          {/* Shop Header - only show if multi-shop */}
                          {isMultiShop && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                                ...(groupIndex > 0 && {
                                  pt: 1.5,
                                  borderTop: `1px dashed ${theme.palette.custom.border.light}`,
                                }),
                              }}
                            >
                              <Store sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                                {shopGroup.shopName}
                              </Typography>
                            </Box>
                          )}

                          {/* Items in this shop */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {shopGroup.items.map((item) => {
                              const typeStyle = getItemTypeColor(item.itemType);
                              return (
                                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar
                                    variant="rounded"
                                    src={item.productImageUrl}
                                    sx={{
                                      width: 64,
                                      height: 64,
                                      bgcolor: theme.palette.custom.neutral[100],
                                      border: `1px solid ${theme.palette.custom.border.light}`,
                                      borderRadius: '10px',
                                    }}
                                  >
                                    <ShoppingBag sx={{ fontSize: 28, color: theme.palette.custom.neutral[300] }} />
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }} noWrap>
                                        {item.productName}
                                      </Typography>
                                      <Chip
                                        label={getItemTypeLabel(item.itemType)}
                                        size="small"
                                        sx={{
                                          bgcolor: typeStyle.bg,
                                          color: typeStyle.color,
                                          fontWeight: 500,
                                          fontSize: 11,
                                          height: 20,
                                          flexShrink: 0,
                                        }}
                                      />
                                      {item.isFree && (
                                        <Chip
                                          label="FREE"
                                          size="small"
                                          sx={{
                                            bgcolor: theme.palette.custom.status.success.light,
                                            color: theme.palette.custom.status.success.main,
                                            fontWeight: 700,
                                            fontSize: 10,
                                            height: 20,
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mt: 0.25 }}>
                                      {formatVariantInfo(item.variantInfo)}
                                      {item.lensName && (formatVariantInfo(item.variantInfo) ? ' | ' : '') + item.lensName}
                                    </Typography>
                                    {item.prescriptionSnapshot && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                        <Visibility sx={{ fontSize: 13, color: theme.palette.custom.status.info.main }} />
                                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.info.main, fontWeight: 500 }}>
                                          R: SPH {item.prescriptionSnapshot.sphereRight ?? '—'} | CYL {item.prescriptionSnapshot.cylinderRight ?? '—'}
                                          {' / '}
                                          L: SPH {item.prescriptionSnapshot.sphereLeft ?? '—'} | CYL {item.prescriptionSnapshot.cylinderLeft ?? '—'}
                                          {item.prescriptionSnapshot.addPower != null && ` | ADD +${item.prescriptionSnapshot.addPower}`}
                                        </Typography>
                                      </Box>
                                    )}
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                                      x{item.quantity}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                      {item.isFree ? 'Free' : formatCurrency(item.lineTotal)}
                                    </Typography>
                                    {item.discountAmount > 0 && (
                                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.error.main }}>
                                        -{formatCurrency(item.discountAmount)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      ));
                    })()}
                  </Box>

                  {/* Tracking Number */}
                  {order.trackingNumber && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.status.purple.main }} />
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                        Tracking: <span style={{ fontWeight: 600, color: theme.palette.custom.status.purple.main }}>{order.trackingNumber}</span>
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Card Footer */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${theme.palette.custom.border.light}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                      {order.items.length} {order.items.length > 1 ? 'items' : 'item'} | Total:
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    onClick={() => handleViewDetails(order)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                      borderColor: theme.palette.custom.border.main,
                      color: theme.palette.custom.neutral[700],
                      borderRadius: '10px',
                      px: 2.5,
                      '&:hover': {
                        borderColor: theme.palette.custom.neutral[400],
                        bgcolor: theme.palette.custom.neutral[50],
                      },
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Paper>
            );
          })}

          {/* Empty State */}
          {!loading && filteredOrders.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: '12px',
                border: `1px solid ${theme.palette.custom.border.light}`,
                p: 6,
                textAlign: 'center',
              }}
            >
              <ShoppingBag sx={{ fontSize: 72, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[500], mb: 1 }}>
                No orders found
              </Typography>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[400] }}>
                You don't have any orders in this category yet.
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      {/* ==================== ORDER DETAIL DIALOG ==================== */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (() => {
          const paymentStyle = getPaymentStatusColor(selectedOrder.paymentStatus);
          return (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                      Order Details
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                      {selectedOrder.orderNumber} | {formatDate(selectedOrder.orderedAt)}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    sx={{
                      bgcolor: getStatusColor(selectedOrder.status).bg,
                      color: getStatusColor(selectedOrder.status).color,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  />
                </Box>
              </DialogTitle>

              <DialogContent dividers>
                {/* Progress Stepper */}
                <Box sx={{ mb: 3, px: 2 }}>
                  <OrderStepper status={selectedOrder.status} />
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {/* Shipping Info */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <LocationOn sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[600], textTransform: 'uppercase' }}>
                        Shipping Info
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                          {selectedOrder.shippingName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                          {selectedOrder.shippingPhone}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], pl: 3.25 }}>
                        {selectedOrder.shippingAddress}
                        {selectedOrder.shippingCity && `, ${selectedOrder.shippingCity}`}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Payment & Dates */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <CreditCard sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[600], textTransform: 'uppercase' }}>
                        Payment & Dates
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Payment Method</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                          {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Payment Status</Typography>
                        <Chip
                          label={getPaymentStatusLabel(selectedOrder.paymentStatus)}
                          size="small"
                          sx={{
                            bgcolor: paymentStyle.bg,
                            color: paymentStyle.color,
                            fontWeight: 600,
                            fontSize: 11,
                            height: 22,
                          }}
                        />
                      </Box>
                      {selectedOrder.trackingNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Tracking</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.purple.main }}>
                            {selectedOrder.trackingNumber}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Ordered</Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>{formatDate(selectedOrder.orderedAt)}</Typography>
                      </Box>
                      {selectedOrder.paidAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Paid</Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>{formatDate(selectedOrder.paidAt)}</Typography>
                        </Box>
                      )}
                      {selectedOrder.completedAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Completed</Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>{formatDate(selectedOrder.completedAt)}</Typography>
                        </Box>
                      )}
                      {selectedOrder.cancelledAt && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Cancelled</Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.error.main }}>{formatDate(selectedOrder.cancelledAt)}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Customer Note */}
                  {selectedOrder.customerNote && (
                    <Grid size={{ xs: 12 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '10px',
                          bgcolor: theme.palette.custom.status.info.light,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                      >
                        <Description sx={{ fontSize: 16, color: theme.palette.custom.status.info.main, mt: 0.25 }} />
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.info.main, mb: 0.25 }}>
                            Customer Note
                          </Typography>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                            {selectedOrder.customerNote}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {/* Order Items */}
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Inventory sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[600], textTransform: 'uppercase' }}>
                        Items ({selectedOrder.items.length})
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {(() => {
                        const shopGroups = groupItemsByShop(selectedOrder.items);
                        const isMultiShop = shopGroups.length > 1;
                        return shopGroups.map((shopGroup) => (
                          <Box key={shopGroup.shopId}>
                            {/* Shop Header - only show if multi-shop */}
                            {isMultiShop && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 1.5,
                                  pb: 1,
                                  borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                                }}
                              >
                                <Avatar
                                  src={shopGroup.shopLogoUrl}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: theme.palette.custom.neutral[200],
                                  }}
                                >
                                  <Store sx={{ fontSize: 14 }} />
                                </Avatar>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                                  {shopGroup.shopName}
                                </Typography>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {shopGroup.items.map((item) => {
                                const typeStyle = getItemTypeColor(item.itemType);
                                return (
                                  <Box
                                    key={item.id}
                                    sx={{
                                      p: 2,
                                      borderRadius: '10px',
                                      border: `1px solid ${theme.palette.custom.border.light}`,
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                      <Avatar
                                        variant="rounded"
                                        src={item.productImageUrl}
                                        sx={{
                                          width: 56,
                                          height: 56,
                                          bgcolor: theme.palette.custom.neutral[100],
                                          borderRadius: '8px',
                                        }}
                                      >
                                        <ShoppingBag sx={{ fontSize: 24 }} />
                                      </Avatar>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                            {item.productName}
                                          </Typography>
                                          <Chip
                                            label={getItemTypeLabel(item.itemType)}
                                            size="small"
                                            sx={{ bgcolor: typeStyle.bg, color: typeStyle.color, fontWeight: 500, fontSize: 11, height: 20 }}
                                          />
                                          {item.isFree && (
                                            <Chip
                                              label="FREE"
                                              size="small"
                                              sx={{ bgcolor: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main, fontWeight: 700, fontSize: 10, height: 20 }}
                                            />
                                          )}
                                        </Box>

                                        {/* Variant & Lens info */}
                                        {(formatVariantInfo(item.variantInfo) || item.lensName) && (
                                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 0.25 }}>
                                            {formatVariantInfo(item.variantInfo)}
                                            {item.lensName && (formatVariantInfo(item.variantInfo) ? ' | ' : '') + item.lensName}
                                            {item.lensTintName && ` (${item.lensTintName})`}
                                          </Typography>
                                        )}

                                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                                          x{item.quantity} | {formatCurrency(item.unitPrice)}/item
                                        </Typography>

                                        {item.prescriptionSnapshot && (
                                          <Box
                                            sx={{
                                              mt: 0.75,
                                              p: 1,
                                              borderRadius: '6px',
                                              bgcolor: theme.palette.custom.status.info.light,
                                              display: 'flex',
                                              alignItems: 'flex-start',
                                              gap: 0.75,
                                            }}
                                          >
                                            <Visibility sx={{ fontSize: 14, color: theme.palette.custom.status.info.main, mt: 0.125 }} />
                                            <Box>
                                              <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.custom.status.info.main, mb: 0.25 }}>
                                                Prescription
                                              </Typography>
                                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[700] }}>
                                                R: SPH {item.prescriptionSnapshot.sphereRight ?? '—'} | CYL {item.prescriptionSnapshot.cylinderRight ?? '—'}
                                              </Typography>
                                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[700] }}>
                                                L: SPH {item.prescriptionSnapshot.sphereLeft ?? '—'} | CYL {item.prescriptionSnapshot.cylinderLeft ?? '—'}
                                              </Typography>
                                              {item.prescriptionSnapshot.addPower != null && (
                                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[700] }}>
                                                  ADD: +{item.prescriptionSnapshot.addPower}
                                                </Typography>
                                              )}
                                            </Box>
                                          </Box>
                                        )}

                                        {item.giftNote && (
                                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main, fontStyle: 'italic', mt: 0.25 }}>
                                            {item.giftNote}
                                          </Typography>
                                        )}

                                        {/* Warranty info */}
                                        {item.warrantyMonths > 0 && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                            <VerifiedUser sx={{ fontSize: 13, color: theme.palette.custom.status.success.main }} />
                                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>
                                              {item.warrantyMonths}-month warranty
                                              {item.warrantyExpiresAt && ` (until ${new Date(item.warrantyExpiresAt).toLocaleDateString('vi-VN')})`}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                                          {item.isFree ? 'Free' : formatCurrency(item.lineTotal)}
                                        </Typography>
                                        {item.discountAmount > 0 && (
                                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.error.main }}>
                                            -{formatCurrency(item.discountAmount)}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        ));
                      })()}
                    </Box>

                    {/* Price Breakdown */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: '10px',
                        bgcolor: theme.palette.custom.neutral[50],
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Subtotal</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {formatCurrency(selectedOrder.subtotal)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Shipping Fee</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {selectedOrder.shippingFee === 0 ? 'Free' : formatCurrency(selectedOrder.shippingFee)}
                          </Typography>
                        </Box>
                        {selectedOrder.discountAmount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocalOffer sx={{ fontSize: 14, color: theme.palette.custom.status.error.main }} />
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.error.main }}>Discount</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.status.error.main }}>
                              -{formatCurrency(selectedOrder.discountAmount)}
                            </Typography>
                          </Box>
                        )}
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                            Total Amount
                          </Typography>
                          <Typography sx={{ fontSize: 22, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                            {formatCurrency(selectedOrder.totalAmount)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                  onClick={() => setDetailDialogOpen(false)}
                  sx={{
                    textTransform: 'none',
                    color: theme.palette.custom.neutral[600],
                  }}
                >
                  Close
                </Button>
                {selectedOrder.status === 'DELIVERED' && (() => {
                  const hasRefundRequest = Boolean(selectedOrder.refundRequestId);
                  const refundStatus = selectedOrder.refundStatus;
                  const refundStatusChipColor =
                    refundStatus === ReturnStatus.COMPLETED
                      ? { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main }
                      : refundStatus === ReturnStatus.REJECTED || refundStatus === ReturnStatus.CANCELLED
                        ? { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main }
                        : { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
                  
                  return (
                  <>
                    {hasRefundRequest && (
                      <Chip
                        label={getRefundStatusLabel(refundStatus)}
                        size="small"
                        sx={{
                          bgcolor: refundStatusChipColor.bg,
                          color: refundStatusChipColor.color,
                          fontWeight: 600,
                          fontSize: 11,
                          height: 24,
                        }}
                      />
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<AssignmentReturn />}
                      onClick={() => {
                        if (hasRefundRequest && selectedOrder.refundRequestId) {
                          // Navigate to return request detail page
                          navigate(PAGE_ENDPOINTS.REFUND.BUYER_DETAIL.replace(':requestId', selectedOrder.refundRequestId));
                        } else if (selectedOrder.items.length > 0) {
                          // Open return dialog for the first item
                          handleOpenReturnDialog(selectedOrder.items[0]);
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: hasRefundRequest
                          ? theme.palette.custom.status.info.main
                          : theme.palette.custom.status.warning.main,
                        color: hasRefundRequest
                          ? theme.palette.custom.status.info.main
                          : theme.palette.custom.status.warning.main,
                        '&:hover': {
                          borderColor: hasRefundRequest
                            ? theme.palette.custom.status.info.main
                            : theme.palette.custom.status.warning.main,
                          bgcolor: hasRefundRequest
                            ? theme.palette.custom.status.info.light
                            : theme.palette.custom.status.warning.light,
                        },
                        '&.Mui-disabled': {
                          borderColor: theme.palette.custom.neutral[300],
                          color: theme.palette.custom.neutral[400],
                        },
                      }}
                    >
                      {hasRefundRequest ? 'Xem yêu cầu' : 'Tạo yêu cầu hoàn tiền'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleReOrder(selectedOrder.id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#111',
                        '&:hover': { bgcolor: '#333' },
                      }}
                    >
                      Buy Again
                    </Button>
                  </>
                  );
                })()}
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={cancellingOrderId === selectedOrder.id}
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {cancellingOrderId === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* ==================== RETURN REQUEST DIALOG ==================== */}
      <Dialog
        open={returnDialogOpen}
        onClose={handleCloseReturnDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentReturn sx={{ fontSize: 24, color: theme.palette.custom.status.warning.main }} />
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                Yêu cầu trả hàng / hoàn tiền
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleCloseReturnDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedOrderItemForReturn && (
            <>
              {/* Product Info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.custom.neutral[50], borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar
                    variant="rounded"
                    src={selectedOrderItemForReturn.productImageUrl}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: theme.palette.custom.neutral[100],
                      border: `1px solid ${theme.palette.custom.border.light}`,
                    }}
                  >
                    <ShoppingBag />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {selectedOrderItemForReturn.productName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mt: 0.5 }}>
                      {formatVariantInfo(selectedOrderItemForReturn.variantInfo)}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], mt: 0.5 }}>
                      Số lượng: {selectedOrderItemForReturn.quantity}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Return Reason */}
              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 600, mb: 1.5, color: theme.palette.custom.neutral[700] }}>
                  Lý do trả hàng *
                </FormLabel>
                <RadioGroup value={returnReason} onChange={(e) => setReturnReason(e.target.value as ReturnReason)}>
                  {Object.values(ReturnReason).map((reason) => (
                    <FormControlLabel
                      key={reason}
                      value={reason}
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          {RETURN_REASON_LABELS[reason]}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Description */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mô tả chi tiết *"
                placeholder="Vui lòng mô tả chi tiết lý do trả hàng, tình trạng sản phẩm..."
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Evidence Images */}
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5, color: theme.palette.custom.neutral[700] }}>
                  Hình ảnh minh chứng
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                  {returnImages.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.custom.border.light}`,
                      }}
                    >
                      <img
                        src={image}
                        alt={`Evidence ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                  
                  {returnImages.length < 5 && (
                    <Button
                      component="label"
                      variant="outlined"
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      <CloudUpload sx={{ fontSize: 24 }} />
                      <Typography sx={{ fontSize: 10 }}>Thêm ảnh</Typography>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </Button>
                  )}
                </Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                  Tối đa 5 ảnh. Hỗ trợ: JPG, PNG
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography sx={{ fontSize: 13 }}>
                  Yêu cầu trả hàng sẽ được gửi đến người bán để xem xét. Bạn sẽ nhận được thông báo khi có phản hồi.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseReturnDialog}
            disabled={submittingReturn}
            sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReturnRequest}
            disabled={submittingReturn || !returnDescription.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: theme.palette.custom.status.warning.main,
              '&:hover': { bgcolor: theme.palette.custom.status.warning.main },
            }}
          >
            {submittingReturn ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyOrdersPage;
