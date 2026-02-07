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
} from '@mui/icons-material';
import { useState } from 'react';

// ==================== ENUMS (matching backend) ====================
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'COD' | 'E_WALLET';
type ItemType = 'FRAME' | 'LENS' | 'ACCESSORY' | 'BUNDLE';

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
}

// ==================== MOCK DATA ====================
const mockOrders: Order[] = [
  {
    id: 'a1b2c3d4-0001',
    orderNumber: 'ORD-2024-001',
    subtotal: 3800000,
    shippingFee: 30000,
    discountAmount: 0,
    totalAmount: 3830000,
    shippingName: 'Nguyen Van An',
    shippingPhone: '0901234567',
    shippingAddress: '123 Nguyen Hue, Quan 1',
    shippingCity: 'Ho Chi Minh',
    customerNote: 'Giao hang buoi sang, goi truoc khi giao',
    orderedAt: '2024-01-25T10:30:00Z',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    items: [
      {
        id: 'item-001',
        productName: 'Ray-Ban Aviator Classic RB3025',
        productSku: 'RB-3025-001-58',
        productImageUrl: 'https://picsum.photos/seed/rayban/80/80',
        variantInfo: { color: 'Gold', size: '58mm', material: 'Metal' },
        lensName: 'Crystal Green Lens',
        unitPrice: 3500000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 3500000,
        isFree: false,
        warrantyMonths: 12,
        warrantyExpiresAt: '2025-01-25',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'FRAME',
        shopId: 'shop-001',
        shopName: 'Luxury Eyewear Store',
        shopLogoUrl: 'https://picsum.photos/seed/shop1/40/40',
      },
      {
        id: 'item-002',
        productName: 'Lens Cleaning Kit Premium',
        productSku: 'ACC-CLN-001',
        productImageUrl: 'https://picsum.photos/seed/kit/80/80',
        unitPrice: 150000,
        quantity: 2,
        discountAmount: 0,
        lineTotal: 300000,
        isFree: false,
        warrantyMonths: 0,
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'ACCESSORY',
        shopId: 'shop-003',
        shopName: 'Glasses Accessories Hub',
        shopLogoUrl: 'https://picsum.photos/seed/shop3/40/40',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0002',
    orderNumber: 'ORD-2024-002',
    subtotal: 4200000,
    shippingFee: 0,
    discountAmount: 200000,
    totalAmount: 4000000,
    shippingName: 'Tran Thi Binh',
    shippingPhone: '0912345678',
    shippingAddress: '456 Le Loi, Hoan Kiem',
    shippingCity: 'Ha Noi',
    orderedAt: '2024-01-24T14:20:00Z',
    paidAt: '2024-01-24T14:25:00',
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    items: [
      {
        id: 'item-003',
        productName: 'Oakley Holbrook OO9102',
        productSku: 'OAK-9102-E5-55',
        productImageUrl: 'https://picsum.photos/seed/oakley/80/80',
        variantInfo: { color: 'Matte Black', size: '55mm' },
        lensName: 'Prizm Sapphire Polarized',
        lensTintName: 'Sapphire Iridium',
        lensFeaturesSnapshot: { polarized: true, uvProtection: '100%', material: 'Plutonite' },
        unitPrice: 4200000,
        quantity: 1,
        discountAmount: 200000,
        lineTotal: 4000000,
        isFree: false,
        warrantyMonths: 12,
        warrantyExpiresAt: '2025-01-24',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'FRAME',
        shopId: 'shop-002',
        shopName: 'Sport Vision Pro',
        shopLogoUrl: 'https://picsum.photos/seed/shop2/40/40',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0003',
    orderNumber: 'ORD-2024-003',
    subtotal: 9200000,
    shippingFee: 0,
    discountAmount: 350000,
    totalAmount: 8850000,
    shippingName: 'Le Van Cuong',
    shippingPhone: '0923456789',
    shippingAddress: '789 Tran Hung Dao, Hai Chau',
    shippingCity: 'Da Nang',
    customerNote: 'Goi dien truoc 30 phut',
    orderedAt: '2024-01-22T09:15:00Z',
    paidAt: '2024-01-22T09:20:00',
    status: 'SHIPPED',
    paymentStatus: 'PAID',
    paymentMethod: 'CREDIT_CARD',
    trackingNumber: 'GHN-123456789',
    items: [
      {
        id: 'item-004',
        productName: 'Gucci GG0061S',
        productSku: 'GUC-0061S-002-56',
        productImageUrl: 'https://picsum.photos/seed/gucci/80/80',
        variantInfo: { color: 'Havana', size: '56mm', material: 'Acetate' },
        lensName: 'Brown Gradient',
        unitPrice: 8500000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 8500000,
        isFree: false,
        warrantyMonths: 24,
        warrantyExpiresAt: '2026-01-22',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'FRAME',
        shopId: 'shop-001',
        shopName: 'Luxury Eyewear Store',
        shopLogoUrl: 'https://picsum.photos/seed/shop1/40/40',
      },
      {
        id: 'item-005',
        productName: 'Premium Glasses Case - Gucci',
        productSku: 'ACC-CASE-GUC',
        productImageUrl: 'https://picsum.photos/seed/case/80/80',
        unitPrice: 350000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 350000,
        isFree: true,
        giftNote: 'Free case with Gucci frame purchase',
        warrantyMonths: 0,
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'ACCESSORY',
        shopId: 'shop-001',
        shopName: 'Luxury Eyewear Store',
        shopLogoUrl: 'https://picsum.photos/seed/shop1/40/40',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0004',
    orderNumber: 'ORD-2024-004',
    subtotal: 12500000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 12500000,
    shippingName: 'Pham Minh Duc',
    shippingPhone: '0934567890',
    shippingAddress: '321 Hai Ba Trung, Quan 3',
    shippingCity: 'Ho Chi Minh',
    orderedAt: '2024-01-20T16:45:00Z',
    paidAt: '2024-01-20T16:50:00',
    completedAt: '2024-01-23T11:00:00',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'CREDIT_CARD',
    trackingNumber: 'GHN-987654321',
    items: [
      {
        id: 'item-006',
        productName: 'Tom Ford FT0237 Snowdon',
        productSku: 'TF-0237-52N-52',
        productImageUrl: 'https://picsum.photos/seed/tomford/80/80',
        variantInfo: { color: 'Dark Havana', size: '52mm', material: 'Acetate' },
        lensName: 'Green Solid Lens',
        unitPrice: 9800000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 9800000,
        isFree: false,
        warrantyMonths: 24,
        warrantyExpiresAt: '2026-01-20',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'FRAME',
        shopId: 'shop-004',
        shopName: 'Designer Frames Boutique',
        shopLogoUrl: 'https://picsum.photos/seed/shop4/40/40',
      },
      {
        id: 'item-007',
        productName: 'Blue Light Blocking Lens Upgrade',
        productSku: 'LENS-BLB-STD',
        productImageUrl: 'https://picsum.photos/seed/lens/80/80',
        lensName: 'Blue Light Filter Lens',
        lensTintName: 'Clear with Blue Block',
        lensFeaturesSnapshot: { blueBlock: true, antiReflective: true, uvProtection: '100%' },
        unitPrice: 2700000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 2700000,
        isFree: false,
        warrantyMonths: 6,
        warrantyExpiresAt: '2024-07-20',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'LENS',
        shopId: 'shop-005',
        shopName: 'LensCraft Vietnam',
        shopLogoUrl: 'https://picsum.photos/seed/shop5/40/40',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0005',
    orderNumber: 'ORD-2024-005',
    subtotal: 6560000,
    shippingFee: 30000,
    discountAmount: 0,
    totalAmount: 6590000,
    shippingName: 'Hoang Thi Em',
    shippingPhone: '0945678901',
    shippingAddress: '555 Pham Van Dong, Thu Duc',
    shippingCity: 'Ho Chi Minh',
    orderedAt: '2024-01-21T08:00:00Z',
    cancelledAt: '2024-01-22T10:15:00',
    status: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    paymentMethod: 'E_WALLET',
    items: [
      {
        id: 'item-008',
        productName: 'Versace VE4361',
        productSku: 'VER-4361-GB1-87',
        productImageUrl: 'https://picsum.photos/seed/versace/80/80',
        variantInfo: { color: 'Black', size: '53mm', material: 'Acetate' },
        lensName: 'Grey Gradient',
        unitPrice: 6200000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 6200000,
        isFree: false,
        warrantyMonths: 12,
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'FRAME',
        shopId: 'shop-001',
        shopName: 'Luxury Eyewear Store',
        shopLogoUrl: 'https://picsum.photos/seed/shop1/40/40',
      },
      {
        id: 'item-009',
        productName: 'Anti-Fog Spray 60ml',
        productSku: 'ACC-FOG-060',
        productImageUrl: 'https://picsum.photos/seed/spray/80/80',
        unitPrice: 120000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 120000,
        isFree: false,
        warrantyMonths: 0,
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'ACCESSORY',
        shopId: 'shop-003',
        shopName: 'Glasses Accessories Hub',
        shopLogoUrl: 'https://picsum.photos/seed/shop3/40/40',
      },
      {
        id: 'item-010',
        productName: 'Microfiber Cloth Set (3pcs)',
        productSku: 'ACC-MCF-003',
        productImageUrl: 'https://picsum.photos/seed/cloth/80/80',
        unitPrice: 80000,
        quantity: 3,
        discountAmount: 0,
        lineTotal: 240000,
        isFree: false,
        warrantyMonths: 0,
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'ACCESSORY',
        shopId: 'shop-003',
        shopName: 'Glasses Accessories Hub',
        shopLogoUrl: 'https://picsum.photos/seed/shop3/40/40',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0006',
    orderNumber: 'ORD-2024-006',
    subtotal: 10200000,
    shippingFee: 0,
    discountAmount: 500000,
    totalAmount: 9700000,
    shippingName: 'Vo Thanh Hung',
    shippingPhone: '0956789012',
    shippingAddress: '88 Nguyen Trai, Quan 5',
    shippingCity: 'Ho Chi Minh',
    orderedAt: '2024-01-18T15:00:00Z',
    paidAt: '2024-01-18T15:05:00',
    completedAt: '2024-01-21T09:30:00',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    trackingNumber: 'GHN-111222333',
    items: [
      {
        id: 'item-011',
        productName: 'Prada PR 17WS',
        productSku: 'PRA-17WS-1AB-49',
        productImageUrl: 'https://picsum.photos/seed/prada/80/80',
        variantInfo: { color: 'Black', size: '49mm', material: 'Metal/Acetate' },
        lensName: 'Grey Gradient',
        unitPrice: 7500000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 7500000,
        isFree: false,
        warrantyMonths: 24,
        warrantyExpiresAt: '2026-01-18',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'FRAME',
        shopId: 'shop-004',
        shopName: 'Designer Frames Boutique',
        shopLogoUrl: 'https://picsum.photos/seed/shop4/40/40',
      },
      {
        id: 'item-012',
        productName: 'Progressive Lens - Essilor Varilux',
        productSku: 'LENS-PRG-ESS',
        productImageUrl: 'https://picsum.photos/seed/progressive/80/80',
        lensName: 'Essilor Varilux Comfort Max',
        lensTintName: 'Clear',
        lensFeaturesSnapshot: { progressive: true, antiReflective: true, uvProtection: '100%', blueBlock: true },
        prescriptionSnapshot: { sphereRight: -2.5, sphereLeft: -3.0, cylinderRight: -0.75, cylinderLeft: -0.5, addPower: 2.0 },
        unitPrice: 2700000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 2700000,
        isFree: false,
        warrantyMonths: 12,
        warrantyExpiresAt: '2025-01-18',
        timesReturned: 0,
        timesWarrantyClaimed: 0,
        itemType: 'LENS',
        shopId: 'shop-005',
        shopName: 'LensCraft Vietnam',
        shopLogoUrl: 'https://picsum.photos/seed/shop5/40/40',
      },
    ],
  },
];

// ==================== HELPERS ====================
const ORDER_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'PENDING': return 0;
    case 'PROCESSING': return 1;
    case 'SHIPPED': return 2;
    case 'DELIVERED': return 3;
    case 'CANCELLED': return -1;
    default: return 0;
  }
};

const getPaymentMethodLabel = (method: PaymentMethod) => {
  switch (method) {
    case 'CREDIT_CARD': return 'Credit Card';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    case 'COD': return 'Cash on Delivery';
    case 'E_WALLET': return 'E-Wallet';
    default: return method;
  }
};

const getPaymentStatusLabel = (status: PaymentStatus) => {
  switch (status) {
    case 'PENDING': return 'Unpaid';
    case 'PAID': return 'Paid';
    case 'FAILED': return 'Failed';
    case 'REFUNDED': return 'Refunded';
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
  const [activeTab, setActiveTab] = useState(0);
  const [orders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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

  const handleViewDetails = (order: Order) => {
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
          {filteredOrders.map((order) => {
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
          {filteredOrders.length === 0 && (
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
                {selectedOrder.status === 'DELIVERED' && (
                  <Button
                    variant="contained"
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
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Cancel Order
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default MyOrdersPage;
