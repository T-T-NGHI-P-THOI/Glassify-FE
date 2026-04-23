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
  Checkbox,
  TextField,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  WarningAmber,
  TaskAlt,
  Science,
  AssignmentTurnedIn,
  Star,
  StarBorder,
  RateReview,
} from '@mui/icons-material';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '@/api/order-api';
import { paymentApi } from '@/api/payment-api';
import { ghnApi } from '@/api/ghnApi';
import { userAddressApi, type UserAddressResponse } from '@/api/user-address-api';
import { reviewApi } from '@/api/review-api';
import { toast } from 'react-toastify';
import CircularProgress from '@mui/material/CircularProgress';
import AccessTime from '@mui/icons-material/AccessTime';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { ReturnReason, ReturnStatus, ReturnType, RETURN_REASON_LABELS } from '@/models/Refund';
import { createReturnRequest, listReturnRequests, uploadRefundEvidenceImages } from '@/api/refund-api';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { getApiErrorMessage } from '@/utils/api-error';
import { getCurrentPlatformSetting, type PlatformSetting } from '@/api/platform-settings-api';

// ==================== ENUMS (matching backend) ====================
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'TRANSPORTING' | 'DELIVERED' | 'COMPLETED' | 'DELIVERY_FAILED' | 'CANCELLED' | 'REFUNDED' | 'RETURN_IN_TRANSIT' | 'REJECTED_BY_CUSTOMER';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'COD' | 'E_WALLET' | 'PAYPAL' | 'VNPAY';
type ItemType = 'FRAME' | 'LENS' | 'ACCESSORY' | 'BUNDLE' | 'GIFT';

// ==================== INTERFACES (matching backend models) ====================
interface OrderItem {
  id: string;
  productId?: string;
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
  toDistrictId?: number;
  toWardCode?: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  refundRequestId?: string;
  refundRequestedAt?: string;
  refundStatus?: ReturnStatus;
}

interface ReturnItemForm {
  reason: ReturnReason;
  description: string;
  images: { file: File; preview: string }[];
}

interface ItemRefundLookup {
  id: string;
  status?: ReturnStatus;
}

// Mock data removed - using real API

// ==================== HELPERS ====================
const ORDER_STEPS = ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Completed'];

const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'PENDING':              return 0;
    case 'CONFIRMED':            return 1;
    case 'PROCESSING':
    case 'READY_TO_SHIP':
    case 'SHIPPED':              return 2;
    case 'TRANSPORTING':
    case 'DELIVERED':            return 3;
    case 'COMPLETED':            return 4;
    case 'RETURN_IN_TRANSIT':
    case 'REJECTED_BY_CUSTOMER': return 3;
    case 'DELIVERY_FAILED':      return -2;
    case 'CANCELLED':            return -1;
    case 'REFUNDED':             return -1;
    default:                     return 0;
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
      return 'Request Submitted';
    case ReturnStatus.APPROVED:
      return 'Approved';
    case ReturnStatus.REJECTED:
      return 'Rejected';
    case ReturnStatus.RETURN_READY_TO_PICK:
      return 'Ready for Pickup';
    case ReturnStatus.RETURN_SHIPPING:
      return 'Return Shipping';
    case ReturnStatus.RETURN_DELIVERED:
      return 'Item Returned';
    case ReturnStatus.ITEM_RECEIVED:
      return 'Item Received';
    case ReturnStatus.COMPLETED:
      return 'Completed';
    case ReturnStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Request Submitted';
  }
};

// ==================== ORDER STEPPER ====================
interface OrderStepperProps {
  status: OrderStatus;
}

const OrderStepper = ({ status }: OrderStepperProps) => {
  const theme = useTheme();
  const activeStep = getStepIndex(status);
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const isDeliveryFailed = status === 'DELIVERY_FAILED';
  const isReturned = status === 'REJECTED_BY_CUSTOMER' || status === 'RETURN_IN_TRANSIT';

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
          {status === 'REFUNDED' ? 'Order has been refunded' : 'Order has been cancelled'}
        </Typography>
      </Box>
    );
  }

  if (isDeliveryFailed) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 2,
          borderRadius: 1.5,
          bgcolor: theme.palette.custom.status.warning.light,
        }}
      >
        <WarningAmber sx={{ fontSize: 20, color: theme.palette.custom.status.warning.main }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>
          Delivery attempt failed — awaiting re-attempt or return
        </Typography>
      </Box>
    );
  }

  if (isReturned) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 2,
          borderRadius: 1.5,
          bgcolor: theme.palette.custom.status.rose.light,
        }}
      >
        <AssignmentReturn sx={{ fontSize: 20, color: theme.palette.custom.status.rose.main }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.rose.main }}>
          {status === 'RETURN_IN_TRANSIT' ? 'Return in transit' : 'Order rejected — return in progress'}
        </Typography>
      </Box>
    );
  }

  const stepIcons = [
    <HourglassEmpty key="pending" sx={{ fontSize: 18 }} />,
    <VerifiedUser key="confirmed" sx={{ fontSize: 18 }} />,
    <Inventory key="processing" sx={{ fontSize: 18 }} />,
    <CheckCircle key="delivered" sx={{ fontSize: 18 }} />,
    <TaskAlt key="completed" sx={{ fontSize: 18 }} />,
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReasons, setCancelReasons] = useState<string[]>([]);
  const [leadTime, setLeadTime] = useState<string | null>(null);
  const [leadTimeLoading, setLeadTimeLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState<UserAddressResponse[]>([]);

  const CUSTOMER_CANCEL_REASONS = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Item no longer needed',
    'Delivery time is too long',
    'Other',
  ];

  useLayoutConfig({ showNavbar: true, showFooter: true });

  const [confirmingReceivedId, setConfirmingReceivedId] = useState<string | null>(null);
  const [demoActionId, setDemoActionId] = useState<string | null>(null);

  // Platform settings (used to determine refund/return windows)
  const [platformSetting, setPlatformSetting] = useState<PlatformSetting | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchPlatformSetting = async () => {
      try {
        const setting = await getCurrentPlatformSetting();
        if (mounted) setPlatformSetting(setting);
      } catch (error) {
        console.error('Failed to load platform settings:', error);
      }
    };
    fetchPlatformSetting();
    return () => { mounted = false; };
  }, []);

  // Review Dialog States
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTargetItem, setReviewTargetItem] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<{ file: File; preview: string }[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(new Set());

  // Return Request Dialog States
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedReturnItemIds, setSelectedReturnItemIds] = useState<string[]>([]);
  const [returnItemForms, setReturnItemForms] = useState<Record<string, ReturnItemForm>>({});
  const [itemRefundLookup, setItemRefundLookup] = useState<Record<string, ItemRefundLookup>>({});
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
    userAddressApi.getAll().then((res) => {
      if (res.data) setUserAddresses(res.data);
    }).catch(() => {});
    reviewApi.getMyReviewedOrderItemIds().then((ids) => {
      setReviewedItemIds(new Set(ids));
    }).catch(() => {});
  }, [fetchOrders]);

  const openCancelDialog = (orderId: string) => {
    setCancelTargetId(orderId);
    setCancelReasons([]);
    setCancelDialogOpen(true);
  };

  const toggleCancelReason = (reason: string) => {
    setCancelReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason],
    );
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId || cancelReasons.length === 0) return;
    try {
      setCancellingOrderId(cancelTargetId);
      await orderApi.cancelOrder(cancelTargetId, { reason: cancelReasons.join(', ') });
      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      await fetchOrders();
      if (selectedOrder?.id === cancelTargetId) {
        setDetailDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      toast.error(error?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
      setCancelTargetId(null);
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

  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const handlePayNow = async (order: Order) => {
    try {
      setPayingOrderId(order.id);
      if (order.paymentMethod === 'VNPAY') {
        const res = await paymentApi.createVnpayPayment({ orderId: order.id });
        if (res.data) {
          window.location.href = res.data;
        }
      } else if (order.paymentMethod === 'E_WALLET') {
        await paymentApi.payFromWallet({ orderId: order.id });
        toast.success('Payment successful!');
        await fetchOrders();
        setDetailDialogOpen(false);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Payment failed');
    } finally {
      setPayingOrderId(null);
    }
  };

  const getPaymentDeadline = (orderedAt: string): Date => {
    const d = new Date(orderedAt);
    d.setHours(d.getHours() + 24);
    return d;
  };

  const isUnpaidPrePayment = (order: Order) =>
    order.status === 'PENDING' &&
    order.paymentStatus === 'PENDING' &&
    (order.paymentMethod === 'VNPAY' || order.paymentMethod === 'E_WALLET');

  const handleConfirmReceived = async (orderId: string) => {
    try {
      setConfirmingReceivedId(orderId);
      await orderApi.confirmReceived(orderId);
      toast.success('Order confirmed as received');
      await fetchOrders();
      if (selectedOrder?.id === orderId) setDetailDialogOpen(false);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to confirm receipt'));
    } finally {
      setConfirmingReceivedId(null);
    }
  };

  const handleDemoDeliveryFailed = async (orderId: string) => {
    try {
      setDemoActionId(orderId);
      await orderApi.markDeliveryFailed(orderId);
      toast.info('[DEMO] Delivery marked as failed');
      await fetchOrders();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Demo action failed'));
    } finally {
      setDemoActionId(null);
    }
  };

  const handleDemoRefuseDelivery = async (orderId: string) => {
    try {
      setDemoActionId(orderId);
      await orderApi.refuseDelivery(orderId);
      toast.info('[DEMO] Delivery refused — order returned');
      await fetchOrders();
      if (selectedOrder?.id === orderId) setDetailDialogOpen(false);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Demo action failed'));
    } finally {
      setDemoActionId(null);
    }
  };

  const handleDemoReattempt = async (orderId: string) => {
    try {
      setDemoActionId(orderId);
      await orderApi.forceStatus(orderId, 'SHIPPED');
      toast.info('[DEMO] Re-attempt scheduled — status back to Shipped');
      await fetchOrders();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Demo action failed'));
    } finally {
      setDemoActionId(null);
    }
  };

  const handleDemoReturn = async (orderId: string) => {
    try {
      setDemoActionId(orderId);
      await orderApi.refuseDelivery(orderId);
      toast.info('[DEMO] Order returned to sender');
      await fetchOrders();
      if (selectedOrder?.id === orderId) setDetailDialogOpen(false);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Demo action failed'));
    } finally {
      setDemoActionId(null);
    }
  };

  const fetchItemRefundLookup = useCallback(async (orderId: string) => {
    try {
      const response = await listReturnRequests({
        orderId,
        unitPerPage: 200,
        sortBy: 'requestedAt',
        sortDirection: 'DESC',
      });

      const lookup: Record<string, ItemRefundLookup> = {};
      (response.data || []).forEach((request) => {
        if (!request.orderItemId) return;
        if (!lookup[request.orderItemId]) {
          lookup[request.orderItemId] = {
            id: request.id,
            status: request.status,
          };
        }
      });

      setItemRefundLookup(lookup);
    } catch (error) {
      console.error('Failed to fetch refund requests for order items:', error);
      setItemRefundLookup({});
    }
  }, []);

  // Review Handlers
  const handleOpenReviewDialog = (item: OrderItem) => {
    setReviewTargetItem(item);
    setReviewRating(5);
    setReviewComment('');
    setReviewImages([]);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    reviewImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setReviewImages([]);
    setReviewDialogOpen(false);
    setReviewTargetItem(null);
  };

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      setReviewImages((prev) => {
        if (prev.length >= 3) return prev;
        return [...prev, { file, preview: URL.createObjectURL(file) }];
      });
    });
    e.target.value = '';
  };

  const handleRemoveReviewImage = (index: number) => {
    setReviewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewTargetItem) return;
    try {
      setSubmittingReview(true);
      await reviewApi.createReview({
        orderItemId: reviewTargetItem.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        images: reviewImages.map((img) => img.file),
      });
      setReviewedItemIds(prev => new Set(prev).add(reviewTargetItem.id));
      handleCloseReviewDialog();
      toast.success('Review submitted successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Return Request Handlers
  const createDefaultReturnItemForm = (): ReturnItemForm => ({
    reason: ReturnReason.DEFECTIVE,
    description: '',
    images: [],
  });

  const handleOpenReturnDialog = (orderItem: OrderItem) => {
    if (!selectedOrder) {
      toast.error('Order information not found');
      return;
    }

    if (selectedOrder.status !== 'COMPLETED') {
      toast.error('Cannot create return request: order is not in a suitable state.');
      return;
    }

    const returnWindowDays = platformSetting?.returnWindowDays ?? null;
    if (selectedOrder.completedAt && returnWindowDays != null) {
      const completedTime = new Date(selectedOrder.completedAt).getTime();
      const expiryTime = completedTime + returnWindowDays * 24 * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        toast.error('Return window has expired.');
        return;
      }
    }

    setSelectedReturnItemIds([orderItem.id]);
    setReturnItemForms({
      [orderItem.id]: createDefaultReturnItemForm(),
    });
    setReturnDialogOpen(true);
  };

  const handleCloseReturnDialog = () => {
    Object.values(returnItemForms).forEach((form) => {
      form.images.forEach((img) => URL.revokeObjectURL(img.preview));
    });
    setReturnDialogOpen(false);
    setSelectedReturnItemIds([]);
    setReturnItemForms({});
  };

  const handleReturnItemFieldChange = (
    itemId: string,
    field: 'reason' | 'description',
    value: ReturnReason | string
  ) => {
    setReturnItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || createDefaultReturnItemForm()),
        [field]: value,
      },
    }));
  };

  const handleImageUpload = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Keep File objects for server upload and use object URL only for preview.
    Array.from(files).forEach((file) => {
      const preview = URL.createObjectURL(file);
      setReturnItemForms((prev) => {
        const current = prev[itemId] || createDefaultReturnItemForm();
        return {
          ...prev,
          [itemId]: {
            ...current,
            images: [...current.images, { file, preview }],
          },
        };
      });
    });

    event.target.value = '';
  };

  const handleRemoveImage = (itemId: string, index: number) => {
    setReturnItemForms((prev) => {
      const current = prev[itemId] || createDefaultReturnItemForm();
      const imageToRemove = current.images[index];
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          images: current.images.filter((_, i) => i !== index),
        },
      };
    });
  };

  const handleSubmitReturnRequest = async () => {
    if (!selectedOrder) {
      toast.error('Order information not found');
      return;
    }

    if (selectedReturnItemIds.length === 0) {
      toast.error('Please select at least 1 product to create a request');
      return;
    }

    // Ensure order status is valid for return requests
    if (selectedOrder.status !== 'COMPLETED') {
      toast.error('Cannot create return request: order is not in a suitable state.');
      return;
    }

    // Enforce platform-configured return window if available (based on completedAt)
    const returnWindowDays = platformSetting?.returnWindowDays ?? null;
    if (selectedOrder.completedAt && returnWindowDays != null) {
      const completedTime = new Date(selectedOrder.completedAt).getTime();
      const expiryTime = completedTime + returnWindowDays * 24 * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        toast.error('Return window has expired.');
        return;
      }
    }

    try {
      setSubmittingReturn(true);

      const itemMap = new Map(selectedOrder.items.map((item) => [item.id, item]));
      const createdRequestIds: string[] = [];
      let failedCount = 0;
      let firstFailureMessage: string | null = null;

      for (const itemId of selectedReturnItemIds) {
        const item = itemMap.get(itemId);
        const form = returnItemForms[itemId];
        if (!item) {
          failedCount += 1;
          continue;
        }

        if (!form || !form.description.trim()) {
          failedCount += 1;
          continue;
        }

        const requestData = {
          orderItemId: item.id,
          returnType: ReturnType.REFUND,
          reason: form.reason,
          reasonDetail: form.description,
          quantity: item.quantity,
          evidenceImages: [],
        };

        try {
          const response = await createReturnRequest(requestData);
          if (response.data?.id) {
            createdRequestIds.push(response.data.id);

            if (form.images.length > 0) {
              await uploadRefundEvidenceImages(
                response.data.id,
                form.images.map((img) => img.file)
              );
            }
          }
        } catch (error) {
          failedCount += 1;
          if (!firstFailureMessage) {
            firstFailureMessage = getApiErrorMessage(error, 'Unable to create return request');
          }
          console.error(`Failed to create return request for item ${item.id}:`, error);
        }
      }

      if (createdRequestIds.length === 0) {
        toast.error(firstFailureMessage || 'Unable to create return requests for the selected products');
        return;
      }

      toast.success(`Successfully created ${createdRequestIds.length} return request(s)`);
      if (failedCount > 0) {
        toast.warning(`Could not create requests for ${failedCount} product(s)`);
      }

      handleCloseReturnDialog();
      setDetailDialogOpen(false);

      if (createdRequestIds.length === 1) {
        navigate(PAGE_ENDPOINTS.REFUND.BUYER_DETAIL.replace(':requestId', createdRequestIds[0]));
      } else {
        navigate(PAGE_ENDPOINTS.REFUND.BUYER_LIST);
      }
    } catch (error: any) {
      console.error('Failed to create return request:', error);
      toast.error(getApiErrorMessage(error, 'Unable to create return request'));
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'PROCESSING':
      case 'READY_TO_SHIP':
        return { bg: theme.palette.custom.status.indigo.light, color: theme.palette.custom.status.indigo.main };
      case 'SHIPPED':
      case 'TRANSPORTING':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'DELIVERED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'COMPLETED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'DELIVERY_FAILED':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'CANCELLED':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      case 'REFUNDED':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'RETURN_IN_TRANSIT':
      case 'REJECTED_BY_CUSTOMER':
        return { bg: theme.palette.custom.status.rose.light, color: theme.palette.custom.status.rose.main };
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
      case 'PENDING':              return 'Pending';
      case 'CONFIRMED':            return 'Confirmed';
      case 'PROCESSING':           return 'Processing';
      case 'READY_TO_SHIP':        return 'Ready to Ship';
      case 'SHIPPED':              return 'Shipped';
      case 'TRANSPORTING':         return 'Transporting';
      case 'DELIVERED':            return 'Delivered';
      case 'CANCELLED':            return 'Cancelled';
      case 'REFUNDED':             return 'Refunded';
      case 'RETURN_IN_TRANSIT':    return 'Return in Transit';
      case 'REJECTED_BY_CUSTOMER': return 'Rejected by Customer';
      case 'DELIVERY_FAILED':      return 'Delivery Failed';
      case 'COMPLETED':            return 'Completed';
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

  const DemoActionButton = ({
    onClick,
    loading,
    children,
  }: {
    onClick: () => void;
    loading?: boolean;
    children: ReactNode;
  }) => (
    <Button
      variant="outlined"
      size="small"
      disabled={loading}
      onClick={onClick}
      startIcon={<Science sx={{ fontSize: 14 }} />}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 12,
        borderRadius: '10px',
        borderStyle: 'dashed',
        borderColor: '#f59e0b',
        color: '#b45309',
        bgcolor: '#fffbeb',
        px: 2,
        '&:hover': { bgcolor: '#fef3c7', borderColor: '#d97706' },
      }}
    >
      {children}
    </Button>
  );

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return order.status === 'PENDING';
    if (activeTab === 2) return order.status === 'CONFIRMED';
    if (activeTab === 3) return order.status === 'PROCESSING';
    if (activeTab === 4) return ['READY_TO_SHIP', 'SHIPPED', 'TRANSPORTING'].includes(order.status);
    if (activeTab === 5) return order.status === 'DELIVERED';
    if (activeTab === 6) return order.status === 'CANCELLED';
    if (activeTab === 7) return order.status === 'DELIVERY_FAILED';
    if (activeTab === 8) return order.status === 'COMPLETED';
    if (activeTab === 9) return ['REJECTED_BY_CUSTOMER', 'RETURN_IN_TRANSIT'].includes(order.status);
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const shippedCount = orders.filter((o) => ['READY_TO_SHIP', 'SHIPPED', 'TRANSPORTING'].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;
  const deliveryFailedCount = orders.filter((o) => o.status === 'DELIVERY_FAILED').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const returnedCount = orders.filter((o) => ['REJECTED_BY_CUSTOMER', 'RETURN_IN_TRANSIT'].includes(o.status)).length;

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setLeadTime(null);
    setDetailDialogOpen(true);
    setItemRefundLookup({});
    fetchItemRefundLookup(order.id);

    const shopId = order.items[0]?.shopId;
    // toDistrictId/toWardCode may not be in order response — fall back to matched user address
    const toDistrictId = order.toDistrictId
      ?? userAddresses.find(
          (a) => a.recipientPhone === order.shippingPhone && a.recipientName === order.shippingName,
        )?.ghnDistrictId;
    const toWardCode = order.toWardCode
      ?? userAddresses.find(
          (a) => a.recipientPhone === order.shippingPhone && a.recipientName === order.shippingName,
        )?.ghnWardCode;

    if (shopId && toDistrictId && toWardCode) {
      setLeadTimeLoading(true);
      ghnApi.getLeadTime({ shopId, toDistrictId, toWardCode })
        .then((res) => {
          if (res.data?.expectedDeliveryTime) setLeadTime(res.data.expectedDeliveryTime);
        })
        .catch(() => {})
        .finally(() => setLeadTimeLoading(false));
    }
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
            <Tab label={`Confirmed (${confirmedCount})`} />
            <Tab label={`Processing (${processingCount})`} />
            <Tab label={`Shipped (${shippedCount})`} />
            <Tab label={`Delivered (${deliveredCount})`} />
            <Tab label={`Cancelled (${cancelledCount})`} />
            <Tab label={`Delivery Failed (${deliveryFailedCount})`} />
            <Tab label={`Completed (${completedCount})`} />
            <Tab label={`Returned (${returnedCount})`} />
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
                    <Store sx={{ fontSize: 16, color: theme.palette.custom.neutral[600] }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {[...new Set(order.items.map(i => i.shopName).filter(Boolean))].join(', ') || order.orderNumber}
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
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => openCancelDialog(order.id)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: 13,
                          borderRadius: '10px',
                          px: 2.5,
                        }}
                      >
                        {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <>
                        <DemoActionButton
                          loading={demoActionId === order.id}
                          onClick={() => handleDemoDeliveryFailed(order.id)}
                        >
                          Delivery Failed
                        </DemoActionButton>
                        <DemoActionButton
                          loading={demoActionId === order.id}
                          onClick={() => handleDemoRefuseDelivery(order.id)}
                        >
                          Refuse Delivery
                        </DemoActionButton>
                      </>
                    )}
                    {order.status === 'DELIVERY_FAILED' && (
                      <>
                        <DemoActionButton
                          loading={demoActionId === order.id}
                          onClick={() => handleDemoReattempt(order.id)}
                        >
                          Re-attempt
                        </DemoActionButton>
                        <DemoActionButton
                          loading={demoActionId === order.id}
                          onClick={() => handleDemoReturn(order.id)}
                        >
                          Return
                        </DemoActionButton>
                      </>
                    )}
                    {order.status === 'DELIVERED' && (
                      <Button
                        variant="contained"
                        color="success"
                        disabled={confirmingReceivedId === order.id}
                        startIcon={<AssignmentTurnedIn sx={{ fontSize: 16 }} />}
                        onClick={() => handleConfirmReceived(order.id)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: 13,
                          borderRadius: '10px',
                          px: 2.5,
                        }}
                      >
                        {confirmingReceivedId === order.id ? 'Confirming...' : 'Confirm Received'}
                      </Button>
                    )}
                    {order.status === 'COMPLETED' && (
                      <Button
                        variant="contained"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => handleReOrder(order.id)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: 13,
                          borderRadius: '10px',
                          px: 2.5,
                          bgcolor: '#111',
                          '&:hover': { bgcolor: '#333' },
                        }}
                      >
                        Buy Again
                      </Button>
                    )}
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

                {/* Payment Deadline Alert */}
                {isUnpaidPrePayment(selectedOrder) && (() => {
                  const deadline = getPaymentDeadline(selectedOrder.orderedAt);
                  const now = new Date();
                  const msLeft = deadline.getTime() - now.getTime();
                  const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
                  const minutesLeft = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
                  return (
                    <Alert
                      severity="warning"
                      sx={{ mb: 2, fontSize: 13 }}
                      icon={<AccessTime fontSize="small" />}
                    >
                      <strong>Chờ thanh toán</strong> — Đơn hàng sẽ tự động huỷ sau{' '}
                      <strong>{hoursLeft}h {minutesLeft}m</strong> nếu không thanh toán.
                      Hạn chót: {deadline.toLocaleString('vi-VN')}.
                    </Alert>
                  );
                })()}

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
                      {(leadTimeLoading || leadTime) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                          {leadTimeLoading ? (
                            <CircularProgress size={12} sx={{ color: theme.palette.custom.neutral[400] }} />
                          ) : leadTime ? (
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                              Estimated delivery:{' '}
                              <span style={{ fontWeight: 600 }}>
                                {new Date(leadTime).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            </Typography>
                          ) : null}
                        </Box>
                      )}
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
                                        {selectedOrder.status === 'COMPLETED' && (
                                          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                                            {itemRefundLookup[item.id]?.status && (
                                              <Chip
                                                label={getRefundStatusLabel(itemRefundLookup[item.id].status)}
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: 10,
                                                  fontWeight: 600,
                                                  bgcolor: theme.palette.custom.status.info.light,
                                                  color: theme.palette.custom.status.info.main,
                                                }}
                                              />
                                            )}
                                            {reviewedItemIds.has(item.id) ? (
                                              <Chip
                                                label="Reviewed"
                                                size="small"
                                                sx={{
                                                  height: 22,
                                                  fontSize: 10,
                                                  fontWeight: 600,
                                                  bgcolor: theme.palette.custom.status.success.light,
                                                  color: theme.palette.custom.status.success.main,
                                                }}
                                              />
                                            ) : (
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                // startIcon={<RateReview sx={{ fontSize: 12 }} />}
                                                onClick={() => handleOpenReviewDialog(item)}
                                                sx={{
                                                  textTransform: 'none',
                                                  fontWeight: 600,
                                                  fontSize: 10,
                                                  lineHeight: 1,
                                                  minHeight: 22,
                                                  height: 22,
                                                  minWidth: 'unset',
                                                  px: 1.25,
                                                  py: 0,
                                                  borderRadius: '8px',
                                                  borderColor: theme.palette.custom.status.warning.main,
                                                  color: theme.palette.custom.status.warning.main,
                                                }}
                                              >
                                                Write Review
                                              </Button>
                                            )}
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={() => {
                                                const existingRequest = itemRefundLookup[item.id];
                                                if (existingRequest?.id) {
                                                  navigate(PAGE_ENDPOINTS.REFUND.BUYER_DETAIL.replace(':requestId', existingRequest.id));
                                                  return;
                                                }
                                                handleOpenReturnDialog(item);
                                              }}
                                              sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: 10,
                                                lineHeight: 1,
                                                minHeight: 22,
                                                height: 22,
                                                minWidth: 'unset',
                                                px: 1.25,
                                                py: 0,
                                                borderRadius: '8px',
                                                borderColor: itemRefundLookup[item.id]?.id
                                                  ? theme.palette.custom.status.info.main
                                                  : theme.palette.custom.status.warning.main,
                                                color: itemRefundLookup[item.id]?.id
                                                  ? theme.palette.custom.status.info.main
                                                  : theme.palette.custom.status.warning.main,
                                              }}
                                            >
                                              {itemRefundLookup[item.id]?.id ? 'View Request' : 'Request Return'}
                                            </Button>
                                          </Box>
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
                {selectedOrder.status === 'DELIVERED' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      disabled={confirmingReceivedId === selectedOrder.id}
                      startIcon={<AssignmentTurnedIn sx={{ fontSize: 16 }} />}
                      onClick={() => handleConfirmReceived(selectedOrder.id)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {confirmingReceivedId === selectedOrder.id ? 'Confirming...' : 'Confirm Received'}
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
                )}
                {selectedOrder.status === 'COMPLETED' && (
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
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <>
                    <DemoActionButton
                      loading={demoActionId === selectedOrder.id}
                      onClick={() => handleDemoDeliveryFailed(selectedOrder.id)}
                    >
                      Delivery Failed
                    </DemoActionButton>
                    <DemoActionButton
                      loading={demoActionId === selectedOrder.id}
                      onClick={() => handleDemoRefuseDelivery(selectedOrder.id)}
                    >
                      Refuse Delivery
                    </DemoActionButton>
                  </>
                )}
                {selectedOrder.status === 'DELIVERY_FAILED' && (
                  <>
                    <DemoActionButton
                      loading={demoActionId === selectedOrder.id}
                      onClick={() => handleDemoReattempt(selectedOrder.id)}
                    >
                      Re-attempt
                    </DemoActionButton>
                    <DemoActionButton
                      loading={demoActionId === selectedOrder.id}
                      onClick={() => handleDemoReturn(selectedOrder.id)}
                    >
                      Return
                    </DemoActionButton>
                  </>
                )}
                {isUnpaidPrePayment(selectedOrder) && (
                  <Button
                    variant="contained"
                    disabled={payingOrderId === selectedOrder.id}
                    onClick={() => handlePayNow(selectedOrder)}
                    startIcon={payingOrderId === selectedOrder.id ? <CircularProgress size={16} color="inherit" /> : <CreditCard />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#111',
                      '&:hover': { bgcolor: '#333' },
                    }}
                  >
                    {payingOrderId === selectedOrder.id ? 'Processing...' : 'Pay Now'}
                  </Button>
                )}
                {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'CONFIRMED') && (
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={cancellingOrderId === selectedOrder.id}
                    onClick={() => openCancelDialog(selectedOrder.id)}
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

      {/* ── Cancel Confirmation Dialog ───────────────────────────── */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Cancel sx={{ color: theme.palette.custom.status.error.main, fontSize: 22 }} />
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Cancel Order
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.5 }}>
            Please tell us why you'd like to cancel. This action cannot be undone.
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {CUSTOMER_CANCEL_REASONS.map((reason) => (
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
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.error.main, mt: 1 }}>
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
            disabled={cancelReasons.length === 0 || !!cancellingOrderId}
            onClick={handleConfirmCancel}
            startIcon={cancellingOrderId ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {cancellingOrderId ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== REVIEW DIALOG ==================== */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RateReview sx={{ fontSize: 22, color: theme.palette.custom.status.warning.main }} />
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                Write a Review
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleCloseReviewDialog}><Close /></IconButton>
          </Box>
          {reviewTargetItem && (
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.5, pl: 0.5 }}>
              {reviewTargetItem.productName}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            {/* Star Rating */}
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
              Rating
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2.5 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton
                  key={star}
                  size="small"
                  onClick={() => setReviewRating(star)}
                  sx={{ p: 0.25 }}
                >
                  {star <= reviewRating
                    ? <Star sx={{ fontSize: 32, color: '#f59e0b' }} />
                    : <StarBorder sx={{ fontSize: 32, color: theme.palette.custom.neutral[300] }} />
                  }
                </IconButton>
              ))}
            </Box>

            {/* Comment */}
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
              Review <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: theme.palette.custom.neutral[400] }}>(optional)</Typography>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Share your experience..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value.slice(0, 50))}
              inputProps={{ maxLength: 50 }}
              helperText={`${reviewComment.length}/50`}
              size="small"
              sx={{ mb: 2.5 }}
            />

            {/* Photos */}
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
              Photos{' '}
              <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: theme.palette.custom.neutral[400] }}>
                (optional, max 3)
              </Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {reviewImages.map((img, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    width: 72, height: 72,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    flexShrink: 0,
                  }}
                >
                  <img src={img.preview} alt={`review-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveReviewImage(index)}
                    sx={{
                      position: 'absolute', top: 2, right: 2,
                      bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', p: 0.25,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    }}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
              {reviewImages.length < 3 && (
                <Button
                  component="label"
                  variant="outlined"
                  sx={{
                    width: 72, height: 72, borderRadius: 2, borderStyle: 'dashed',
                    display: 'flex', flexDirection: 'column', gap: 0.5,
                    minWidth: 'unset', p: 0,
                  }}
                >
                  <CloudUpload sx={{ fontSize: 22, color: theme.palette.custom.neutral[400] }} />
                  <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400] }}>Add</Typography>
                  <input type="file" hidden accept="image/*" multiple onChange={handleReviewImageUpload} />
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseReviewDialog} disabled={submittingReview} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={submittingReview || reviewRating === 0}
            startIcon={submittingReview ? <CircularProgress size={16} color="inherit" /> : <RateReview />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
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
                Return / Refund Request
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleCloseReturnDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedOrder && (
            <>
              {selectedOrder.items
                .filter((item) => selectedReturnItemIds.includes(item.id))
                .map((item) => {
                  const itemForm = returnItemForms[item.id] || {
                    reason: ReturnReason.DEFECTIVE,
                    description: '',
                    images: [],
                  };

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.custom.border.light}`,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5, color: theme.palette.custom.neutral[700] }}>
                        Request Details For: {item.productName}
                      </Typography>

                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id={`return-reason-label-${item.id}`}>Return Reason *</InputLabel>
                        <Select
                          labelId={`return-reason-label-${item.id}`}
                          value={itemForm.reason}
                          label="Return Reason *"
                          onChange={(e) => handleReturnItemFieldChange(item.id, 'reason', e.target.value as ReturnReason)}
                        >
                          {Object.values(ReturnReason).map((reason) => (
                            <MenuItem key={reason} value={reason}>
                              {RETURN_REASON_LABELS[reason]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Detailed Description *"
                        placeholder="Please describe the issue and item condition in detail..."
                        value={itemForm.description}
                        onChange={(e) => handleReturnItemFieldChange(item.id, 'description', e.target.value)}
                        sx={{ mb: 2 }}
                      />

                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: theme.palette.custom.neutral[700] }}>
                          Evidence Images For This Item
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                          {itemForm.images.map((image, index) => (
                            <Box
                              key={`${item.id}-${index}`}
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
                                src={image.preview}
                                alt={`Evidence ${index + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveImage(item.id, index)}
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

                          {itemForm.images.length < 5 && (
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
                              <Typography sx={{ fontSize: 10 }}>Add</Typography>
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageUpload(item.id, e)}
                              />
                            </Button>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          Up to 5 images per item. Supported: JPG, PNG
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography sx={{ fontSize: 13 }}>
                  Return requests will be sent to the seller for review. You will receive updates when the status changes.
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
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReturnRequest}
            disabled={
              submittingReturn
              || selectedReturnItemIds.length === 0
              || selectedReturnItemIds.some((itemId) => !(returnItemForms[itemId]?.description || '').trim())
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: theme.palette.custom.status.warning.main,
              '&:hover': { bgcolor: theme.palette.custom.status.warning.main },
            }}
          >
            {submittingReturn ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyOrdersPage;
