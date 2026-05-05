import {
  Box,
  Typography,
  Paper,
  Container,
  Tabs,
  Tab,
  Chip,
  Button,
  TextField,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  VerifiedUser,
  Build,
  Schedule,
  Cancel,
  ArrowForward,
  ShoppingBag,
  CalendarMonth,
  Description,
  LocalShipping,
  ReceiptLong,
  Info,
  Warning,
  Handyman,
  AssignmentTurnedIn,
  CloudUpload,
  Close,
  LocationOn,
  Edit,
  Person,
  Payment,
  AccountBalanceWallet,
  CheckCircle,
} from '@mui/icons-material';
import { useState, useRef, useEffect, useCallback } from 'react';
import { warrantyApi } from '@/api/warranty-api';
import ShopWarrantyPolicies from '@/components/Warranty/ShopWarrantyPolicies';
import { paymentApi } from '@/api/payment-api';
import { userWalletApi } from '@/api/user-wallet-api';
import type { UserWalletResponse } from '@/api/user-wallet-api';
import { orderApi } from '@/api/order-api';
import type { OrderResponse } from '@/api/order-api';
import { userAddressApi } from '@/api/user-address-api';
import type { UserAddressResponse } from '@/api/user-address-api';
import { ghnApi } from '@/api/ghnApi';
import type { GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';
import CircularProgress from '@mui/material/CircularProgress';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

// ==================== ENUMS (matching backend) ====================
type WarrantyStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ITEM_RECEIVED' | 'REJECTED' | 'QUOTED' | 'QUOTE_REJECTED' | 'IN_REPAIR' | 'IN_PROGRESS' | 'RETURNING_TO_CUSTOMER' | 'COMPLETED' | 'DELIVERED';
type WarrantyIssueType = string;

// ==================== INTERFACES (matching backend models) ====================
interface WarrantyClaim {
  id: string;
  claimNumber: string;
  orderItemId: string;
  productName: string;
  productImageUrl?: string;
  shopId: string;
  shopName: string;
  issueType: WarrantyIssueType;
  issueDescription: string;
  issueImages: string[] | null;
  resolutionType?: string;
  repairCost?: number | null;
  customerPays?: number | null;
  returnTrackingNumber?: string;
  returnDeliveredAt?: string;
  replacementTrackingNumber?: string;
  replacementDeliveredAt?: string;
  customerShippingFeeToShop?: number | null;
  platformSubsidyToShop?: number | null;
  customerShippingFeeToCustomer?: number | null;
  platformSubsidyToCustomer?: number | null;
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  completedAt?: string;
  status: WarrantyStatus;
  paymentStatus?: string;
  warrantyExpiresAt?: string;
}

// Mock data removed - using real API

// ==================== WARRANTY POLICY DISPLAY DATA ====================
const policyFeatures = [
  {
    icon: <VerifiedUser sx={{ fontSize: 28 }} />,
    title: 'Up to 24-Month Warranty',
    description: 'All eyewear products come with warranty coverage from the date of purchase, covering manufacturing defects.',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    icon: <Build sx={{ fontSize: 28 }} />,
    title: 'Transparent Repair Cost',
    description: 'Repair costs depend on the shop and type of damage. You will receive a cost estimate after the shop reviews your claim before any work begins.',
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  {
    icon: <Schedule sx={{ fontSize: 28 }} />,
    title: '5-7 Business Days',
    description: 'Standard maintenance and repair turnaround time is 5-7 business days from the date the shop receives your product.',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  {
    icon: <LocalShipping sx={{ fontSize: 28 }} />,
    title: 'Two-Way Shipping',
    description: 'Shipping costs (customer → shop and shop → customer) are calculated based on distance and included in the total fee estimate.',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
];

const maintenanceProcess = [
  {
    step: 1,
    title: 'Submit Request',
    description: 'Fill in the warranty registration form with your order details and describe the issue.',
    icon: <Description sx={{ fontSize: 24 }} />,
  },
  {
    step: 2,
    title: 'Review & Approval',
    description: 'Our team will review your request within 1-2 business days and notify you via email.',
    icon: <AssignmentTurnedIn sx={{ fontSize: 24 }} />,
  },
  {
    step: 3,
    title: 'Ship Your Product',
    description: 'Once approved, ship the product using our prepaid label to our service center.',
    icon: <LocalShipping sx={{ fontSize: 24 }} />,
  },
  {
    step: 4,
    title: 'Repair & Return',
    description: 'We repair your product and ship it back within 5-7 business days.',
    icon: <Handyman sx={{ fontSize: 24 }} />,
  },
];

// ==================== HELPERS ====================
const getIssueTypeLabel = (type: string) => {
  switch (type) {
    case 'BROKEN_FRAME': return 'Broken Frame';
    case 'BROKEN_LENS': return 'Broken Lens';
    case 'LOOSE_HINGE': return 'Loose Hinge';
    case 'COATING_DAMAGE': return 'Coating Damage';
    case 'OTHER': return 'Other';
    default: return type;
  }
};

const getResolutionTypeLabel = (type?: string) => {
  switch (type) {
    case 'REPAIR': return 'Repair';
    case 'REPLACE': return 'Replacement';
    case 'REFUND': return 'Refund';
    default: return type || '-';
  }
};

// ==================== MAIN PAGE ====================
const CLAIM_STEPS = ['Submitted', 'Evaluating', 'Repairing', 'Returning', 'Completed'];

const getClaimStepIndex = (status: WarrantyStatus): number => {
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 0;
    case 'APPROVED':
    case 'ITEM_RECEIVED':
    case 'QUOTED':
    case 'QUOTE_REJECTED':
      return 1;
    case 'IN_REPAIR':
    case 'IN_PROGRESS':
      return 2;
    case 'RETURNING_TO_CUSTOMER':
      return 3;
    case 'COMPLETED':
      return 4;
    case 'REJECTED':
      return -1;
    default:
      return 0;
  }
};

const WarrantyStepper = ({ status }: { status: WarrantyStatus }) => {
  const theme = useTheme();
  const activeStep = getClaimStepIndex(status);

  if (status === 'REJECTED') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, px: 2, borderRadius: 1.5, bgcolor: theme.palette.custom.status.error.light, mt: 2 }}>
        <Cancel sx={{ fontSize: 20, color: theme.palette.custom.status.error.main }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.error.main }}>
          Warranty claim was rejected
        </Typography>
      </Box>
    );
  }

  const stepIcons = [
    <Description key="0" sx={{ fontSize: 18 }} />,
    <VerifiedUser key="1" sx={{ fontSize: 18 }} />,
    <Build key="2" sx={{ fontSize: 18 }} />,
    <LocalShipping key="3" sx={{ fontSize: 18 }} />,
    <CheckCircle key="4" sx={{ fontSize: 18 }} />,
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1, mt: 2 }}>
      {CLAIM_STEPS.map((label, index) => {
        const isCompleted = index <= activeStep;
        const isActive = index === activeStep;

        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: index < CLAIM_STEPS.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isCompleted ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[200],
                  color: isCompleted ? '#fff' : theme.palette.custom.neutral[400],
                  boxShadow: isActive ? `0 0 0 4px ${theme.palette.custom.status.success.light}` : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {stepIcons[index]}
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isCompleted ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[400], mt: 0.75, textAlign: 'center' }}>
                {label}
              </Typography>
            </Box>
            {index < CLAIM_STEPS.length - 1 && (
              <Box sx={{ flex: 1, height: 3, bgcolor: index < activeStep ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[200], mx: 0.5, mb: 2.5, borderRadius: 2 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const WarrantyPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [ghnStatusData, setGhnStatusData] = useState<any>(null);
  const [fetchingGhn, setFetchingGhn] = useState(false);

  // Payment dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'VNPAY' | 'E_WALLET'>('VNPAY');
  const [wallet, setWallet] = useState<UserWalletResponse | null>(null);
  const [paying, setPaying] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    orderItemId: '',
    issueType: '' as WarrantyIssueType | '',
    issueDescription: '',
  });

  const [shopIssueTypes, setShopIssueTypes] = useState<{ id: string; typeName: string }[]>([]);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);

  // Order selection state
  const [deliveredOrders, setDeliveredOrders] = useState<OrderResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  // Pickup address state
  const [savedAddresses, setSavedAddresses] = useState<UserAddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupAddressLine, setPickupAddressLine] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [wardName, setWardName] = useState('');
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [pickupErrors, setPickupErrors] = useState<Record<string, string>>({});
  const skipWardReset = useRef(false);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const response = await warrantyApi.getMyClaims();
      if (response.data) {
        setClaims(response.data as WarrantyClaim[]);
      }
    } catch (error) {
      console.error('Failed to fetch warranty claims:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLayoutConfig({ showNavbar: true, showFooter: true });
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleOpenPay = async () => {
    setPayOpen(true);
    try {
      const res = await userWalletApi.getMyWallet();
      if (res.data) setWallet(res.data);
    } catch {
      setWallet(null);
    }
  };

  const handlePay = async () => {
    if (!selectedClaim) return;
    try {
      setPaying(true);
      if (payMethod === 'VNPAY') {
        const res = await warrantyApi.payClaimVnpay(selectedClaim.id);
        const url = res.data;
        if (url) { window.location.href = url; return; }
      } else {
        await warrantyApi.payClaimWallet(selectedClaim.id);
        toast.success('Payment successful!');
        setPayOpen(false);
        fetchClaims();
      }
    } catch {
      toast.error('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleTrackGhnStatus = async () => {
    if (!selectedClaim) return;
    try {
      setFetchingGhn(true);
      const res = await warrantyApi.getWarrantyGhnStatus(selectedClaim.id);
      setGhnStatusData(res.data);
    } catch {
      toast.error('Failed to fetch GHN tracking status.');
    } finally {
      setFetchingGhn(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!selectedClaim) return;
    try {
      await warrantyApi.rejectQuote(selectedClaim.id);
      toast.success('Quote rejected successfully. Please pay the return shipping fee to get your item back.');
      setDetailDialogOpen(false);
      fetchClaims();
    } catch {
      toast.error('Failed to reject quote. Please try again.');
    }
  };

  const handleConfirmReceipt = async () => {
    if (!selectedClaim) return;
    try {
      await warrantyApi.markCustomerReceived(selectedClaim.id);
      toast.success('Received item confirmed!');
      setDetailDialogOpen(false);
      fetchClaims();
    } catch {
      toast.error('Failed to confirm receipt. Please try again.');
    }
  };

  const fetchDeliveredOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const response = await orderApi.getMyOrders({ status: 'COMPLETED', size: 100 });
      if (response.data) {
        setDeliveredOrders(response.data.orders ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Load GHN provinces once; re-trigger district load if province already selected
  useEffect(() => {
    ghnApi.getProvinces().then((res) => {
      setProvinces(res.data || []);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) { setDistricts([]); return; }
    ghnApi.getDistricts(selectedProvinceId).then((res) => {
      const list = res.data || [];
      setDistricts(list);
    }).catch(() => { });
    if (!skipWardReset.current) { setSelectedDistrictId(''); setDistrictName(''); setSelectedWardCode(''); setWardName(''); }
    skipWardReset.current = false;
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedDistrictId) { setWards([]); return; }
    ghnApi.getWards(selectedDistrictId as number).then((res) => {
      setWards(res.data || []);
    }).catch(() => { });
    if (!skipWardReset.current) { setSelectedWardCode(''); setWardName(''); }
  }, [selectedDistrictId]);

  const applyAddress = (addr: UserAddressResponse) => {
    skipWardReset.current = true;
    setSelectedAddressId(addr.id);
    setPickupName(addr.recipientName);
    setPickupPhone(addr.recipientPhone);
    setPickupAddressLine(addr.addressLine1);
    setSelectedProvinceId(addr.ghnProvinceId);
    setProvinceName(addr.city);
    setSelectedDistrictId(addr.ghnDistrictId);
    setDistrictName(addr.district);
    setSelectedWardCode(addr.ghnWardCode);
    setWardName(addr.ward);
    setPickupErrors({});
  };

  const handleOpenRegisterDialog = async () => {
    setRegisterDialogOpen(true);
    fetchDeliveredOrders();

    // Ensure provinces are loaded before applying a saved address
    // (provinces may already be in state from the mount effect)
    const ensureProvinces = provinces.length > 0
      ? Promise.resolve(provinces)
      : ghnApi.getProvinces().then((res) => { const list = res.data || []; setProvinces(list); return list; }).catch(() => provinces);

    const [, addressRes] = await Promise.all([
      ensureProvinces,
      userAddressApi.getAll().catch(() => ({ data: [] as typeof savedAddresses })),
    ]);

    const list = (addressRes as { data: typeof savedAddresses }).data || [];
    setSavedAddresses(list);
    const defaultAddr = list.find((a) => a.isDefault) || list[0];
    if (defaultAddr) applyAddress(defaultAddr);
    else if (user) setPickupName(user.fullName || '');
  };

  const handleCloseRegisterDialog = () => {
    setRegisterDialogOpen(false);
    setFormData({ orderItemId: '', issueType: '', issueDescription: '' });
    setSelectedOrderId('');
    setSelectedOrder(null);
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    // Reset address fields
    setSelectedAddressId(null);
    setPickupName(''); setPickupPhone(''); setPickupAddressLine('');
    setSelectedProvinceId(''); setSelectedDistrictId(''); setSelectedWardCode('');
    setProvinceName(''); setDistrictName(''); setWardName('');
    setPickupErrors({});
    setLoadingIssueTypes(false);
    setShopIssueTypes([]);
    setShowAddressSelector(false);
  };

  const fetchShopIssueTypes = async (shopId: string) => {
    try {
      setLoadingIssueTypes(true);
      const res = await warrantyApi.getShopIssueTypes(shopId);
      if (res.data) {
        setShopIssueTypes(res.data);
      }
    } catch {
      toast.error('Failed to load issue types for this shop');
    } finally {
      setLoadingIssueTypes(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!formData.orderItemId || !formData.issueType || !formData.issueDescription) return;
    if (!pickupName || !pickupPhone || !pickupAddressLine || !selectedDistrictId || !selectedWardCode) {
      toast.error('Please fill in all pickup contact fields');
      return;
    }
    try {
      setSubmitting(true);

      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const uploadRes = await warrantyApi.uploadWarrantyImages(uploadedImages.map(img => img.file));
        if (uploadRes.data) imageUrls = uploadRes.data;
      }

      const result = await warrantyApi.submitClaim({
        orderItemId: formData.orderItemId,
        issueType: formData.issueType,
        issueDescription: formData.issueDescription,
        issueImages: imageUrls,
        customerName: pickupName,
        customerPhone: pickupPhone,
        customerAddress: pickupAddressLine,
        customerDistrictId: selectedDistrictId as number,
        customerWardCode: selectedWardCode,
      });
      if (!result.data || result.status >= 400) {
        const errMsg = Array.isArray(result.errors) ? result.errors[0] : result.message;
        toast.error(errMsg || 'Failed to submit warranty claim');
        return;
      }
      toast.success('Warranty claim submitted successfully');
      handleCloseRegisterDialog();
      await fetchClaims();
    } catch (error) {
      console.error('Failed to submit warranty claim:', error);
      toast.error('Failed to submit warranty claim');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: WarrantyStatus) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'APPROVED':
      case 'ITEM_RECEIVED':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'QUOTED':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'QUOTE_REJECTED':
      case 'REJECTED':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      case 'IN_PROGRESS':
      case 'IN_REPAIR':
        return { bg: theme.palette.custom.status.purple.light, color: theme.palette.custom.status.purple.main };
      case 'RETURNING_TO_CUSTOMER':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'COMPLETED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'DELIVERED':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const getStatusLabel = (status: WarrantyStatus) => {
    switch (status) {
      case 'SUBMITTED': return 'Submitted';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'APPROVED': return 'Approved';
      case 'ITEM_RECEIVED': return 'Item Received at Shop';
      case 'QUOTED': return 'Quoted';
      case 'QUOTE_REJECTED': return 'Quote Rejected';
      case 'IN_PROGRESS': return 'In Progress';
      case 'IN_REPAIR': return 'In Repair';
      case 'RETURNING_TO_CUSTOMER': return 'Returning';
      case 'COMPLETED': return 'Completed';
      case 'DELIVERED': return 'Awaiting Payment';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const filteredClaims = claims.filter((claim) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW';
    if (activeTab === 2) return claim.status === 'APPROVED' || claim.status === 'ITEM_RECEIVED' || claim.status === 'QUOTED' || claim.status === 'QUOTE_REJECTED' || claim.status === 'IN_PROGRESS' || claim.status === 'IN_REPAIR' || claim.status === 'RETURNING_TO_CUSTOMER';
    if (activeTab === 3) return claim.status === 'COMPLETED' || claim.status === 'DELIVERED';
    if (activeTab === 4) return claim.status === 'REJECTED';
    return true;
  });

  const submittedCount = claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;
  const activeCount = claims.filter((c) => c.status === 'APPROVED' || c.status === 'QUOTED' || c.status === 'QUOTE_REJECTED' || c.status === 'IN_PROGRESS' || c.status === 'IN_REPAIR' || c.status === 'RETURNING_TO_CUSTOMER').length;
  const completedCount = claims.filter((c) => c.status === 'COMPLETED' || c.status === 'DELIVERED').length;
  const rejectedCount = claims.filter((c) => c.status === 'REJECTED').length;

  // Static warranty exclusion list for display
  const warrantyExclusions = [
    'Damage caused by accidents, misuse, or negligence',
    'Normal wear and tear (scratches from daily use)',
    'Unauthorized repairs or modifications',
    'Color fading due to prolonged sun/chemical exposure',
    'Lost or stolen products',
    'Products purchased from unauthorized retailers',
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}
            >
              Warranty & Maintenance
            </Typography>
            <Typography sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }}>
              Warranty policy, maintenance process, and service requests
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Build />}
            onClick={handleOpenRegisterDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              borderRadius: '10px',
              px: 3,
              py: 1.2,
              bgcolor: '#111',
              '&:hover': { bgcolor: '#333' },
            }}
          >
            Request Maintenance
          </Button>
        </Box>

        {/* ==================== WARRANTY POLICY ==================== */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.custom.border.light}`,
            p: 3,
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
            Warranty Policy
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
            All Glassify products are backed by our comprehensive warranty program
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {policyFeatures.map((policy, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '10px',
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    height: '100%',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: policy.bgColor,
                      color: policy.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                    }}
                  >
                    {policy.icon}
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                    {policy.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], lineHeight: 1.5 }}>
                    {policy.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Exclusions from default policy */}
          <Box
            sx={{
              p: 2,
              borderRadius: '10px',
              bgcolor: theme.palette.custom.status.warning.light,
              border: `1px solid #fde68a`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Warning sx={{ fontSize: 18, color: theme.palette.custom.status.warning.main }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.status.warning.main }}>
                Not Covered Under Warranty
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {warrantyExclusions.map((item: string, index: number) => (
                <Chip
                  key={index}
                  label={item}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.7)',
                    color: theme.palette.custom.neutral[700],
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* ==================== MAINTENANCE PROCESS ==================== */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.custom.border.light}`,
            p: 3,
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
            Maintenance Process
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
            Follow these simple steps to get your product repaired
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {maintenanceProcess.map((item, index) => (
              <Box key={item.step} sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 200 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: theme.palette.custom.neutral[800],
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </Box>
                    {index < maintenanceProcess.length - 1 && (
                      <Box
                        sx={{
                          flex: 1,
                          height: 2,
                          bgcolor: theme.palette.custom.neutral[200],
                          display: { xs: 'none', md: 'block' },
                        }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], lineHeight: 1.5, pr: 2 }}>
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* ==================== MY WARRANTY CLAIMS ==================== */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box sx={{ px: 3, pt: 3, pb: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
              My Warranty Claims
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 2 }}>
              Track the status of your warranty and maintenance requests
            </Typography>
          </Box>

          <Box sx={{ borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                  minHeight: 48,
                },
              }}
            >
              <Tab label={`All (${claims.length})`} />
              <Tab label={`Submitted (${submittedCount})`} />
              <Tab label={`Active (${activeCount})`} />
              <Tab label={`Completed (${completedCount})`} />
              <Tab label={`Rejected (${rejectedCount})`} />
              <Tab label="Warranty Policies" />
            </Tabs>
          </Box>

          {/* Warranty Policies Tab */}
          {activeTab === 5 && (
            <Box sx={{ p: 3 }}>
              {claims.length === 0 ? (
                <Typography sx={{ fontSize: 14, color: '#6b7280', textAlign: 'center', py: 4 }}>
                  No warranty claims found. Policies will appear here after you submit a claim.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Array.from(new Map(claims.map(c => [c.shopId, { shopId: c.shopId, shopName: c.shopName }])).values()).map(({ shopId, shopName }) => (
                    <ShopWarrantyPolicies key={shopId} shopId={shopId} shopName={shopName} />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Claim Cards */}
          {activeTab !== 5 && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={36} sx={{ color: theme.palette.custom.neutral[400] }} />
              </Box>
            )}
            {!loading && filteredClaims.map((claim) => {
              const statusStyle = getStatusColor(claim.status);
              return (
                <Paper
                  key={claim.id}
                  elevation={0}
                  sx={{
                    borderRadius: '10px',
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
                  }}
                >
                  {/* Claim Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2.5,
                      py: 1.5,
                      bgcolor: theme.palette.custom.neutral[50],
                      borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[600] }}>
                        {claim.claimNumber}
                      </Typography>
                      <Chip
                        label={getStatusLabel(claim.status)}
                        size="small"
                        sx={{
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                          fontWeight: 600,
                          fontSize: 12,
                          height: 24,
                          '& .MuiChip-icon': { color: statusStyle.color },
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarMonth sx={{ fontSize: 14, color: theme.palette.custom.neutral[400] }} />
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                        {formatDate(claim.submittedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Claim Body */}
                  <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      src={claim.productImageUrl}
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
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                        {claim.productName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={getIssueTypeLabel(claim.issueType)}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.custom.neutral[100],
                            color: theme.palette.custom.neutral[700],
                            fontWeight: 500,
                            fontSize: 12,
                            height: 22,
                          }}
                        />
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          Shop: {claim.shopName}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: theme.palette.custom.neutral[500],
                          mt: 0.75,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {claim.issueDescription}
                      </Typography>
                    </Box>

                    {/* Cost summary */}
                    <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
                      {claim.customerPays != null ? (
                        <>
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Total</Typography>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: claim.customerPays === 0 ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[800] }}>
                            {claim.customerPays === 0 ? 'Free' : `${claim.customerPays.toLocaleString('vi-VN')} VND`}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Cost</Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>
                            Pending review
                          </Typography>
                        </>
                      )}
                    </Box>

                    <Button
                      variant="outlined"
                      endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      onClick={async () => {
                        setDetailDialogOpen(true);
                        setSelectedClaim(claim);
                        try {
                          setLoadingDetail(true);
                          const res = await warrantyApi.getClaimDetail(claim.id);
                          if (res.data) setSelectedClaim(res.data as WarrantyClaim);
                        } catch {
                          // giữ nguyên data từ list nếu fetch detail thất bại
                        } finally {
                          setLoadingDetail(false);
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        borderColor: theme.palette.custom.border.main,
                        color: theme.palette.custom.neutral[700],
                        borderRadius: '8px',
                        px: 2,
                        flexShrink: 0,
                        '&:hover': {
                          borderColor: theme.palette.custom.neutral[400],
                          bgcolor: theme.palette.custom.neutral[50],
                        },
                      }}
                    >
                      Details
                    </Button>
                  </Box>

                  {/* Rejection Reason (for rejected claims) */}
                  {claim.status === 'REJECTED' && claim.rejectionReason && (
                    <Box
                      sx={{
                        mx: 2.5,
                        mb: 2,
                        px: 2,
                        py: 1.5,
                        borderRadius: '8px',
                        bgcolor: theme.palette.custom.status.error.light,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Cancel sx={{ fontSize: 16, color: theme.palette.custom.status.error.main, mt: 0.25 }} />
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], lineHeight: 1.5 }} noWrap>
                        {claim.rejectionReason}
                      </Typography>
                    </Box>
                  )}

                  {/* Tracking Info (for approved/in-progress) */}
                  {(claim.status === 'APPROVED' || claim.status === 'IN_PROGRESS') && claim.returnTrackingNumber && (
                    <Box
                      sx={{
                        mx: 2.5,
                        mb: 2,
                        px: 2,
                        py: 1.5,
                        borderRadius: '8px',
                        bgcolor: theme.palette.custom.status.info.light,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.status.info.main, mt: 0.25 }} />
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                        Return tracking: <span style={{ fontWeight: 600 }}>{claim.returnTrackingNumber}</span>
                        {claim.resolutionType && <span> | Resolution: <span style={{ fontWeight: 600 }}>{getResolutionTypeLabel(claim.resolutionType)}</span></span>}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              );
            })}

            {/* Empty State */}
            {!loading && filteredClaims.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Build sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[500], mb: 1 }}>
                  No claims found
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[400] }}>
                  You don't have any warranty claims in this category.
                </Typography>
              </Box>
            )}
          </Box>
          )}
        </Paper>
      </Container>

      {/* ==================== IMAGE PREVIEW DIALOG ==================== */}
      <Dialog
        open={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        maxWidth="lg"
        slotProps={{ paper: { sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImageUrl(null)}
            sx={{
              position: 'absolute',
              top: -16,
              right: -16,
              bgcolor: 'white',
              boxShadow: 2,
              zIndex: 1,
              '&:hover': { bgcolor: theme.palette.custom.neutral[100] },
            }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
          <Box
            component="img"
            src={previewImageUrl ?? ''}
            sx={{ maxWidth: '85vw', maxHeight: '85vh', display: 'block', borderRadius: '12px', objectFit: 'contain' }}
          />
        </Box>
      </Dialog>

      {/* ==================== CLAIM DETAIL DIALOG ==================== */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setGhnStatusData(null);
        }}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        {selectedClaim && (
          <>
            {/* ---- Header ---- */}
            <DialogTitle sx={{ p: 0 }}>
              <Box
                sx={{
                  px: 3,
                  pt: 3,
                  pb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.custom.neutral[50]} 0%, white 100%)`,
                  borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: 17, fontWeight: 700, color: theme.palette.custom.neutral[800], lineHeight: 1.3 }}>
                        {selectedClaim.productName}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.25 }}>
                        {selectedClaim.shopName}
                      </Typography>
                      {selectedClaim.warrantyExpiresAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <VerifiedUser sx={{ fontSize: 13, color: theme.palette.custom.status.success.main }} />
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>
                            Warranty valid until {formatDate(selectedClaim.warrantyExpiresAt)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Chip
                      label={getStatusLabel(selectedClaim.status)}
                      sx={{
                        bgcolor: getStatusColor(selectedClaim.status).bg,
                        color: getStatusColor(selectedClaim.status).color,
                        fontWeight: 700,
                        fontSize: 12,
                        height: 26,
                      }}
                    />
                  </Box>
                </Box>

                {/* Claim meta row */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Claim No.</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[700], fontFamily: 'monospace' }}>
                      {selectedClaim.claimNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Submitted</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>
                      {formatDate(selectedClaim.submittedAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Service Cost</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>
                      Pending shop review
                    </Typography>
                  </Box>
                </Box>
                <WarrantyStepper status={selectedClaim.status} />
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              {loadingDetail ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={36} />
                </Box>
              ) : (
                <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                  {/* ---- Issue Section ---- */}
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                      Issue Details
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        bgcolor: theme.palette.custom.neutral[50],
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Chip
                          icon={<Warning sx={{ fontSize: '14px !important' }} />}
                          label={getIssueTypeLabel(selectedClaim.issueType)}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.custom.status.warning.light,
                            color: theme.palette.custom.status.warning.main,
                            fontWeight: 700,
                            fontSize: 12,
                            '& .MuiChip-icon': { color: theme.palette.custom.status.warning.main },
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>
                        {selectedClaim.issueDescription}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ---- Cost Breakdown ---- */}
                  <Box sx={{ borderRadius: '12px', border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: theme.palette.custom.neutral[50], borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptLong sx={{ fontSize: 15, color: theme.palette.custom.neutral[600] }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[600], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Cost Breakdown
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Repair / Service Cost</Typography>
                        {selectedClaim.repairCost != null ? (
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            {selectedClaim.repairCost === 0 ? 'Free' : `${Number(selectedClaim.repairCost).toLocaleString('vi-VN')} VND`}
                          </Typography>
                        ) : (
                          <Chip label="Pending shop review" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }} />
                        )}
                      </Box>
                      {/* Shipping Fee breakdown */}
                      {selectedClaim.customerShippingFeeToShop == null && selectedClaim.customerShippingFeeToCustomer == null ? (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping Fee (2-way)</Typography>
                          <Chip label="Pending shop review" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }} />
                        </Box>
                      ) : (
                        <>
                          {/* Leg 1: Customer → Shop */}
                          {selectedClaim.customerShippingFeeToShop != null && (
                            <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Customer → Shop)</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                  {selectedClaim.platformSubsidyToShop != null && (
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                      {(Number(selectedClaim.customerShippingFeeToShop) + Number(selectedClaim.platformSubsidyToShop)).toLocaleString('vi-VN')} VND
                                    </Typography>
                                  )}
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                    {Number(selectedClaim.customerShippingFeeToShop).toLocaleString('vi-VN')} VND
                                  </Typography>
                                </Box>
                              </Box>
                              {selectedClaim.platformSubsidyToShop != null && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 1.5 }}>
                                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>↳ Platform support</Typography>
                                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                                    −{Number(selectedClaim.platformSubsidyToShop).toLocaleString('vi-VN')} VND
                                  </Typography>
                                </Box>
                              )}
                            </>
                          )}
                          {/* Leg 2: Shop → Customer */}
                          {selectedClaim.customerShippingFeeToCustomer != null ? (
                            <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Shop → Customer)</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                  {selectedClaim.platformSubsidyToCustomer != null && (
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                      {(Number(selectedClaim.customerShippingFeeToCustomer) + Number(selectedClaim.platformSubsidyToCustomer)).toLocaleString('vi-VN')} VND
                                    </Typography>
                                  )}
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                    {Number(selectedClaim.customerShippingFeeToCustomer).toLocaleString('vi-VN')} VND
                                  </Typography>
                                </Box>
                              </Box>
                              {selectedClaim.platformSubsidyToCustomer != null && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 1.5 }}>
                                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>↳ Platform support</Typography>
                                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                                    −{Number(selectedClaim.platformSubsidyToCustomer).toLocaleString('vi-VN')} VND
                                  </Typography>
                                </Box>
                              )}
                            </>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Shop → Customer)</Typography>
                              <Chip label="After repair" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main }} />
                            </Box>
                          )}
                        </>
                      )}
                      <Box sx={{ height: 1, bgcolor: theme.palette.custom.border.light }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>Total</Typography>
                        {selectedClaim.customerPays != null ? (
                          <Typography sx={{ fontSize: 15, fontWeight: 700, color: selectedClaim.customerPays === 0 ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[800] }}>
                            {selectedClaim.customerPays === 0 ? 'Free' : `${Number(selectedClaim.customerPays).toLocaleString('vi-VN')} VND`}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>
                            Will be notified after review
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* ---- Submitted Photos ---- */}
                  {(selectedClaim.issueImages ?? []).length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Submitted Photos
                        </Typography>
                        <Chip
                          label={selectedClaim.issueImages?.length ?? 0}
                          size="small"
                          sx={{ height: 18, fontSize: 11, fontWeight: 700, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                          gap: 1.5,
                        }}
                      >
                        {(selectedClaim.issueImages ?? []).map((img, index) => (
                          <Tooltip key={index} title="Click to view full size" placement="top" arrow>
                            <Box
                              component="img"
                              src={img}
                              onClick={() => setPreviewImageUrl(img)}
                              sx={{
                                width: '100%',
                                aspectRatio: '1 / 1',
                                borderRadius: '10px',
                                objectFit: 'cover',
                                border: `1.5px solid ${theme.palette.custom.border.light}`,
                                cursor: 'zoom-in',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.03)',
                                  boxShadow: `0 4px 16px rgba(0,0,0,0.15)`,
                                  border: `1.5px solid ${theme.palette.primary.main}`,
                                },
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* ---- Timeline ---- */}
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                      Activity Timeline
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { label: 'Claim submitted', date: selectedClaim.submittedAt, color: theme.palette.primary.main, always: true },
                        { label: 'Approved by shop', date: selectedClaim.approvedAt, color: theme.palette.custom.status.success.main, always: false },
                        { label: 'Product delivered to shop', date: selectedClaim.returnDeliveredAt, color: theme.palette.custom.status.info.main, always: false },
                        { label: 'Repair completed', date: selectedClaim.completedAt, color: theme.palette.custom.status.success.main, always: false },
                        { label: 'Product delivered back to you', date: selectedClaim.replacementDeliveredAt, color: theme.palette.custom.status.success.main, always: false },
                        { label: 'Rejected', date: selectedClaim.rejectedAt, color: theme.palette.custom.status.error.main, always: false },
                      ]
                        .filter((e) => e.always || e.date)
                        .map((event, i, arr) => (
                          <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: event.date ? event.color : theme.palette.custom.neutral[200],
                                  border: `2px solid ${event.date ? event.color : theme.palette.custom.neutral[300]}`,
                                  mt: 0.5,
                                  flexShrink: 0,
                                }}
                              />
                              {i < arr.length - 1 && (
                                <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: theme.palette.custom.border.light, my: 0.5 }} />
                              )}
                            </Box>
                            <Box sx={{ pb: i < arr.length - 1 ? 1.5 : 0 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: event.date ? theme.palette.custom.neutral[800] : theme.palette.custom.neutral[400] }}>
                                {event.label}
                              </Typography>
                              {event.date && (
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                  {formatDate(event.date)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                    </Box>
                  </Box>

                  {/* ---- Resolution ---- */}
                  {selectedClaim.resolutionType && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: theme.palette.custom.status.success.light,
                        border: `1px solid ${theme.palette.custom.status.success.main}30`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                      }}
                    >
                      <AssignmentTurnedIn sx={{ fontSize: 22, color: theme.palette.custom.status.success.main, mt: 0.25 }} />
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.status.success.main, textTransform: 'uppercase', mb: 0.25 }}>
                          Resolution
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                          {getResolutionTypeLabel(selectedClaim.resolutionType)}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.25 }}>
                          Cost breakdown will be updated once confirmed by shop
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* ---- Tracking Numbers ---- */}
                  {(selectedClaim.returnTrackingNumber || selectedClaim.replacementTrackingNumber) && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Live Tracking
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          startIcon={fetchingGhn ? <CircularProgress size={14} /> : <LocalShipping sx={{ fontSize: 14 }} />}
                          onClick={handleTrackGhnStatus}
                          disabled={fetchingGhn}
                          sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, p: 0, minWidth: 'auto', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                        >
                          {fetchingGhn ? 'Checking...' : 'Check GHN Status'}
                        </Button>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '10px',
                          border: `1px solid ${theme.palette.custom.border.light}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {selectedClaim.returnTrackingNumber && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Return Tracking</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.status.purple.main, fontFamily: 'monospace' }}>
                              {selectedClaim.returnTrackingNumber}
                            </Typography>
                          </Box>
                        )}
                        {selectedClaim.replacementTrackingNumber && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Replacement Tracking</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.status.success.main, fontFamily: 'monospace' }}>
                              {selectedClaim.replacementTrackingNumber}
                            </Typography>
                          </Box>
                        )}

                        {ghnStatusData && (
                          <Box sx={{ mt: 1, p: 1.5, borderRadius: '8px', bgcolor: theme.palette.custom.neutral[50], border: `1px dashed ${theme.palette.custom.border.main}` }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>Active Leg:</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{ghnStatusData.activeLeg}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>Tracking No:</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{ghnStatusData.trackingCode || '—'}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>Status:</Typography>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.primary.main, textTransform: 'capitalize' }}>
                                  {ghnStatusData.status || 'UNKNOWN'}
                                </Typography>
                              </Box>
                              {(ghnStatusData.message || ghnStatusData.ghnData?.Reason) && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>Note:</Typography>
                                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                    {ghnStatusData.message || ghnStatusData.ghnData?.Reason}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* ---- Rejection Reason ---- */}
                  {selectedClaim.rejectionReason && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: theme.palette.custom.status.error.light,
                        border: `1px solid ${theme.palette.custom.status.error.main}30`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                      }}
                    >
                      <Cancel sx={{ fontSize: 22, color: theme.palette.custom.status.error.main, mt: 0.25 }} />
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.status.error.main, textTransform: 'uppercase', mb: 0.25 }}>
                          Rejection Reason
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>
                          {selectedClaim.rejectionReason}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.custom.border.light}`, gap: 1 }}>
              {(selectedClaim.status === 'QUOTED' || selectedClaim.status === 'QUOTE_REJECTED') && selectedClaim.customerPays != null && selectedClaim.paymentStatus !== 'PAID' && (
                <Button
                  variant="contained"
                  startIcon={<Payment />}
                  onClick={() => { setDetailDialogOpen(false); handleOpenPay(); }}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.warning.main, '&:hover': { bgcolor: '#b45309' } }}
                >
                  Pay Shipping Fee — {selectedClaim.customerPays === 0 ? 'Free' : `${Number(selectedClaim.customerPays).toLocaleString('vi-VN')} VND`}
                </Button>
              )}
              {selectedClaim.status === 'QUOTED' && (
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleRejectQuote}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', color: theme.palette.custom.status.error.main, borderColor: theme.palette.custom.status.error.main, '&:hover': { bgcolor: theme.palette.custom.status.error.light, borderColor: theme.palette.custom.status.error.main } }}
                >
                  Reject Quote
                </Button>
              )}
              {selectedClaim.status === 'RETURNING_TO_CUSTOMER' && (
                <Button
                  variant="contained"
                  startIcon={<AssignmentTurnedIn />}
                  onClick={handleConfirmReceipt}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.success.main, '&:hover': { bgcolor: '#15803d' } }}
                >
                  Confirm Receipt
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                onClick={() => setDetailDialogOpen(false)}
                sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ==================== ADDRESS SELECTOR DIALOG ==================== */}
      <Dialog open={showAddressSelector} onClose={() => setShowAddressSelector(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>My Saved Addresses</Typography>
          <IconButton size="small" onClick={() => setShowAddressSelector(false)}><Close sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {savedAddresses.map((addr) => (
            <Box
              key={addr.id}
              onClick={() => { applyAddress(addr); setShowAddressSelector(false); }}
              sx={{
                px: 2.5, py: 2, cursor: 'pointer', borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                bgcolor: selectedAddressId === addr.id ? theme.palette.custom.neutral[50] : 'white',
                '&:hover': { bgcolor: theme.palette.custom.neutral[50] },
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  {addr.label && <Chip label={addr.label} size="small" sx={{ fontSize: 11, height: 20, bgcolor: theme.palette.custom.neutral[100] }} />}
                  {addr.isDefault && <Chip label="Default" size="small" color="primary" sx={{ fontSize: 11, height: 20 }} />}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{addr.recipientName}</Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>{addr.recipientPhone}</Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  {[addr.addressLine1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                </Typography>
              </Box>
              {selectedAddressId === addr.id && <AssignmentTurnedIn sx={{ fontSize: 18, color: theme.palette.primary.main, flexShrink: 0, mt: 0.25 }} />}
            </Box>
          ))}
        </DialogContent>
      </Dialog>

      {/* ==================== REGISTER MAINTENANCE DIALOG ==================== */}
      <Dialog
        open={registerDialogOpen}
        onClose={handleCloseRegisterDialog}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', maxHeight: '92vh' } } }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: `1px solid ${theme.palette.custom.border.light}`, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: theme.palette.custom.neutral[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Build sx={{ fontSize: 22, color: theme.palette.custom.neutral[700] }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  Request Maintenance
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                  Submit a warranty or maintenance request for your product
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleCloseRegisterDialog}><Close sx={{ fontSize: 18 }} /></IconButton>
          </Box>
        </DialogTitle>

        {/* Two-column body — scrolls as a whole */}
        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', minHeight: 0 }}>

            {/* ===== LEFT: Issue Info ===== */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, p: 3, borderRight: `1px solid ${theme.palette.custom.border.light}` }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Issue Details
              </Typography>

              {/* Select Order */}
              <FormControl fullWidth size="small">
                <InputLabel>Select Order</InputLabel>
                <Select
                  value={selectedOrderId}
                  onChange={async (e) => {
                    const orderId = e.target.value;
                    setSelectedOrderId(orderId);
                    setSelectedOrder(null);
                    setFormData({ ...formData, orderItemId: '', issueType: '' });
                    setShopIssueTypes([]);
                    if (!orderId) return;
                    try {
                      setLoadingOrderDetail(true);
                      const res = await orderApi.getOrderDetail(orderId);
                      setSelectedOrder(res.data ?? null);
                    } catch {
                      toast.error('Failed to load order details');
                    } finally {
                      setLoadingOrderDetail(false);
                    }
                  }}
                  label="Select Order"
                  disabled={loadingOrders || loadingOrderDetail}
                  startAdornment={<ReceiptLong sx={{ fontSize: 18, color: theme.palette.custom.neutral[400], mr: 1 }} />}
                >
                  {loadingOrders && <MenuItem disabled>Loading orders...</MenuItem>}
                  {!loadingOrders && deliveredOrders.length === 0 && <MenuItem disabled>No delivered orders found</MenuItem>}
                  {deliveredOrders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{order.orderNumber}</Typography>
                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                          {new Date(order.orderedAt).toLocaleDateString('vi-VN')} · {(order.items ?? []).length} item(s)
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Loading order detail */}
              {loadingOrderDetail && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <CircularProgress size={14} />
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Loading order items...</Typography>
                </Box>
              )}

              {/* Select Item */}
              {selectedOrder && (
                <FormControl fullWidth size="small">
                  <InputLabel>Select Item</InputLabel>
                  <Select
                    value={formData.orderItemId}
                    onChange={(e) => {
                      const itemId = e.target.value;
                      setFormData({ ...formData, orderItemId: itemId, issueType: '' });
                      setShopIssueTypes([]);
                      const item = selectedOrder.items.find((i) => i.id === itemId);
                      if (item) {
                        fetchShopIssueTypes(item.shopId);
                      }
                    }}
                    label="Select Item"
                  >
                    {(selectedOrder.items ?? []).map((item) => {
                      const expired = Boolean(item.warrantyExpiresAt) && new Date(item.warrantyExpiresAt!) < new Date();
                      return (
                        <MenuItem key={item.id} value={item.id} disabled={expired}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: expired ? theme.palette.custom.neutral[400] : 'inherit' }}>
                                {item.productName}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                {item.shopName}{item.warrantyExpiresAt && ` · Warranty until ${new Date(item.warrantyExpiresAt).toLocaleDateString('vi-VN')}`}
                              </Typography>
                            </Box>
                            {expired && (
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.error.main, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                Warranty expired
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}

              {/* Issue Type */}
              <FormControl fullWidth size="small">
                <InputLabel>Issue Type</InputLabel>
                <Select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  label="Issue Type"
                  disabled={loadingIssueTypes || !formData.orderItemId}
                >
                  {loadingIssueTypes && <MenuItem disabled>Loading options...</MenuItem>}
                  {!loadingIssueTypes && shopIssueTypes.length === 0 && formData.orderItemId && (
                    <MenuItem disabled>No issue types defined by shop</MenuItem>
                  )}
                  {shopIssueTypes.map((type) => (
                    <MenuItem key={type.id} value={type.typeName}>
                      {type.typeName}
                    </MenuItem>
                  ))}
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>

              {/* Description */}
              <TextField
                label="Issue Description"
                placeholder="Please describe the issue in detail..."
                fullWidth
                multiline
                rows={4}
                size="small"
                value={formData.issueDescription}
                onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              />

              {/* Image Upload */}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
                  Upload Images
                </Typography>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple style={{ display: 'none' }} />
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {uploadedImages.map((img, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <Box component="img" src={img.preview} sx={{ width: 76, height: 76, borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.palette.custom.border.light}` }} />
                      <Box onClick={() => handleRemoveImage(index)} sx={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', bgcolor: theme.palette.custom.status.error.main, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#b91c1c' } }}>
                        <Close sx={{ fontSize: 13 }} />
                      </Box>
                    </Box>
                  ))}
                  <Box onClick={() => fileInputRef.current?.click()} sx={{ width: 76, height: 76, borderRadius: '8px', border: `2px dashed ${theme.palette.custom.border.main}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: theme.palette.primary.main, bgcolor: theme.palette.custom.neutral[50] } }}>
                    <CloudUpload sx={{ fontSize: 20, color: theme.palette.custom.neutral[400], mb: 0.25 }} />
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>Add Photo</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Fee Estimate — pushed to bottom */}
              <Box sx={{ mt: 'auto', borderRadius: '10px', border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.25, bgcolor: theme.palette.custom.neutral[50], borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLong sx={{ fontSize: 15, color: theme.palette.custom.neutral[600] }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[700] }}>Estimated Cost</Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.75, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>Repair / Service Cost</Typography>
                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Depends on shop & damage type</Typography>
                    </Box>
                    <Chip label="TBD by shop" size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main, height: 22 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>Shipping Fee (2-way via GHN)</Typography>
                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Customer → Shop + Shop → Customer</Typography>
                    </Box>
                    <Chip label="TBD by distance" size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main, height: 22 }} />
                  </Box>
                  <Box sx={{ height: 1, bgcolor: theme.palette.custom.border.light }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>Total</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>Notified after shop review</Typography>
                  </Box>
                </Box>
                <Box sx={{ px: 2, py: 1.25, bgcolor: theme.palette.custom.status.info.light, borderTop: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Info sx={{ fontSize: 14, color: theme.palette.custom.status.info.main, mt: 0.1 }} />
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], lineHeight: 1.5 }}>
                    Full cost breakdown sent via email after shop review. Your approval is required before any repair begins.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* ===== RIGHT: Pickup Contact ===== */}
            <Box sx={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Pickup Contact
                </Typography>
                {savedAddresses.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<LocationOn sx={{ fontSize: 14 }} />}
                    onClick={() => setShowAddressSelector(true)}
                    sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, borderRadius: '8px', borderColor: theme.palette.custom.border.main, color: theme.palette.custom.neutral[700], py: 0.5, px: 1.5 }}
                  >
                    {selectedAddressId ? 'Change' : 'My Addresses'}
                  </Button>
                )}
              </Box>

              {/* GHN info banner */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: theme.palette.custom.status.info.light, border: `1px solid ${theme.palette.custom.status.info.main}20` }}>
                <LocalShipping sx={{ fontSize: 15, color: theme.palette.custom.status.info.main, mt: 0.1 }} />
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], lineHeight: 1.5 }}>
                  GHN shipper will pick up from this address. Make sure name & phone are reachable.
                </Typography>
              </Box>

              {/* Selected address badge */}
              {selectedAddressId && (() => {
                const addr = savedAddresses.find((a) => a.id === selectedAddressId);
                return addr ? (
                  <Box sx={{ p: 1.75, bgcolor: theme.palette.custom.neutral[50], borderRadius: '10px', border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
                        {addr.label && <Chip label={addr.label} size="small" sx={{ fontSize: 11, height: 20, bgcolor: theme.palette.custom.neutral[200] }} />}
                        {addr.isDefault && <Chip label="Default" size="small" color="primary" sx={{ fontSize: 11, height: 20 }} />}
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{addr.recipientName}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{addr.recipientPhone}</Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                        {[addr.addressLine1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setShowAddressSelector(true)} sx={{ color: theme.palette.custom.neutral[500] }}>
                      <Edit sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                ) : null;
              })()}

              {/* Recipient Name + Phone side-by-side */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  label="Recipient Name"
                  size="small"
                  sx={{ flex: 1 }}
                  value={pickupName}
                  onChange={(e) => { setPickupName(e.target.value); setSelectedAddressId(null); }}
                  error={!!pickupErrors.pickupName}
                  helperText={pickupErrors.pickupName}
                  slotProps={{ input: { startAdornment: <Person sx={{ fontSize: 16, color: theme.palette.custom.neutral[400], mr: 0.75 }} /> } }}
                />
                <TextField
                  label="Phone"
                  size="small"
                  sx={{ width: 140 }}
                  value={pickupPhone}
                  onChange={(e) => { setPickupPhone(e.target.value.replace(/\D/g, '')); setSelectedAddressId(null); }}
                  error={!!pickupErrors.pickupPhone}
                  helperText={pickupErrors.pickupPhone}
                  slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 11 } }}
                  placeholder="0xxxxxxxxx"
                />
              </Box>

              {/* Street address */}
              <TextField
                label="Street Address"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={pickupAddressLine}
                onChange={(e) => { setPickupAddressLine(e.target.value); setSelectedAddressId(null); }}
                error={!!pickupErrors.pickupAddressLine}
                helperText={pickupErrors.pickupAddressLine}
                placeholder="Street number, building, ward..."
              />

              {/* Province + District side-by-side */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Province / City</InputLabel>
                  <Select
                    value={provinces.some((p) => p.ProvinceID === selectedProvinceId) ? selectedProvinceId : ''}
                    label="Province / City"
                    onChange={(e) => {
                      const id = e.target.value as number;
                      setSelectedProvinceId(id);
                      setProvinceName(provinces.find((p) => p.ProvinceID === id)?.ProvinceName ?? '');
                      setSelectedAddressId(null);
                    }}
                  >
                    {provinces.map((p) => (
                      <MenuItem key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ flex: 1 }} disabled={!selectedProvinceId}>
                  <InputLabel>District</InputLabel>
                  <Select
                    value={districts.some((d) => d.DistrictID === selectedDistrictId) ? selectedDistrictId : ''}
                    label="District"
                    onChange={(e) => {
                      const id = e.target.value as number;
                      setSelectedDistrictId(id);
                      setDistrictName(districts.find((d) => d.DistrictID === id)?.DistrictName ?? '');
                      setSelectedAddressId(null);
                    }}
                  >
                    {districts.map((d) => (
                      <MenuItem key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Ward — full width */}
              <FormControl fullWidth size="small" disabled={!selectedDistrictId}>
                <InputLabel>Ward</InputLabel>
                <Select
                  value={wards.some((w) => w.WardCode === selectedWardCode) ? selectedWardCode : ''}
                  label="Ward"
                  onChange={(e) => {
                    const code = e.target.value as string;
                    setSelectedWardCode(code);
                    setWardName(wards.find((w) => w.WardCode === code)?.WardName ?? '');
                    setSelectedAddressId(null);
                  }}
                >
                  {wards.map((w) => (
                    <MenuItem key={w.WardCode} value={w.WardCode}>{w.WardName}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Full address preview */}
              {(pickupAddressLine || wardName || districtName || provinceName) && (
                <Box sx={{ p: 1.5, bgcolor: theme.palette.custom.neutral[50], borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}` }}>
                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], fontWeight: 600, mb: 0.5 }}>Pickup address</Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                    {[pickupAddressLine, wardName, districtName, provinceName].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.custom.border.light}`, gap: 1, flexShrink: 0 }}>
          <Button onClick={handleCloseRegisterDialog} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={!formData.orderItemId || !formData.issueType || !formData.issueDescription || !pickupName || !pickupPhone || !pickupAddressLine || !selectedDistrictId || !selectedWardCode || submitting}
            onClick={handleSubmitClaim}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '10px', bgcolor: '#111', '&:hover': { bgcolor: '#333' } }}
          >
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Submit Claim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== PAYMENT DIALOG ==================== */}
      <Dialog
        open={payOpen}
        onClose={() => !paying && setPayOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.palette.custom.status.warning.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Payment sx={{ fontSize: 20, color: theme.palette.custom.status.warning.main }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                  {selectedClaim?.status === 'QUOTE_REJECTED' ? 'Pay Return Shipping Fee' : 'Pay for Warranty Service'}
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selectedClaim?.claimNumber}</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setPayOpen(false)} disabled={paying}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {/* Amount */}
          <Box sx={{ p: 2, borderRadius: '10px', bgcolor: theme.palette.custom.status.warning.light, border: `1px solid ${theme.palette.custom.status.warning.main}40`, mb: 2.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mb: 0.5 }}>Total amount due</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: theme.palette.custom.status.warning.main }}>
              {selectedClaim?.customerPays != null ? `${Number(selectedClaim.customerPays).toLocaleString('vi-VN')} VND` : '—'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mt: 0.5 }}>
              {selectedClaim?.productName}
            </Typography>
          </Box>

          {/* Payment method */}
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>
            Payment method
          </Typography>
          <RadioGroup value={payMethod} onChange={(e) => setPayMethod(e.target.value as 'VNPAY' | 'E_WALLET')}>
            <Paper
              variant="outlined"
              onClick={() => setPayMethod('VNPAY')}
              sx={{ mb: 1.25, p: 1.5, borderRadius: '10px', cursor: 'pointer', borderColor: payMethod === 'VNPAY' ? theme.palette.primary.main : theme.palette.custom.border.light, borderWidth: payMethod === 'VNPAY' ? 2 : 1 }}
            >
              <FormControlLabel
                value="VNPAY"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>VNPay</Typography>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>Pay via VNPay gateway — you will be redirected</Typography>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.25 } }}
              />
            </Paper>
            <Paper
              variant="outlined"
              onClick={() => setPayMethod('E_WALLET')}
              sx={{ p: 1.5, borderRadius: '10px', cursor: 'pointer', borderColor: payMethod === 'E_WALLET' ? theme.palette.primary.main : theme.palette.custom.border.light, borderWidth: payMethod === 'E_WALLET' ? 2 : 1 }}
            >
              <FormControlLabel
                value="E_WALLET"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <AccountBalanceWallet sx={{ fontSize: 16, color: theme.palette.custom.neutral[600] }} />
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Glassify Wallet</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                      {wallet ? `Balance: ${Number(wallet.availableBalance).toLocaleString('vi-VN')} VND` : 'Loading balance...'}
                    </Typography>
                    {wallet && selectedClaim?.customerPays != null && wallet.availableBalance < Number(selectedClaim.customerPays) && (
                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.error.main, fontWeight: 600 }}>Insufficient balance</Typography>
                    )}
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.25 } }}
              />
            </Paper>
          </RadioGroup>

          {payMethod === 'VNPAY' && (
            <Alert severity="info" sx={{ mt: 2, fontSize: 12, borderRadius: '8px' }}>
              You will be redirected to VNPay to complete payment.
            </Alert>
          )}
          {payMethod === 'E_WALLET' && wallet && selectedClaim?.customerPays != null && wallet.availableBalance < Number(selectedClaim.customerPays) && (
            <Alert severity="warning" sx={{ mt: 2, fontSize: 12, borderRadius: '8px' }}>
              Your wallet balance is insufficient. Please top up first.
            </Alert>
          )}
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setPayOpen(false)} disabled={paying} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={paying || (payMethod === 'E_WALLET' && !!wallet && !!selectedClaim?.customerPays && wallet.availableBalance < Number(selectedClaim.customerPays))}
            onClick={handlePay}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.warning.main, '&:hover': { bgcolor: '#b45309' } }}
          >
            {paying ? <CircularProgress size={18} color="inherit" /> : payMethod === 'VNPAY' ? 'Pay via VNPay' : 'Pay from Wallet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyPage;
