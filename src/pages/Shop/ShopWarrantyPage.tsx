import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Switch,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  InputAdornment,
  Select,
  InputLabel,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Build,
  ShoppingBag,
  VerifiedUser,
  LocalShipping,
  CheckCircle,
  Cancel,
  AssignmentTurnedIn,
  Close,
  Warning,
  Person,
  CalendarMonth,
  ZoomIn,
  ArrowForward,
  ArrowBack,
  ReceiptLong,
  Info,
  Description,
  Save,
  Add,
  AttachMoney,
  AddCircleOutline,
  Edit,
} from '@mui/icons-material';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import { warrantyApi } from '@/api/warranty-api';
import type { WarrantyClaimResponse } from '@/api/warranty-api';
import type { ShopDetailResponse } from '@/models/Shop';
import { toast } from 'react-toastify';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  ITEM_RECEIVED: 'Item Received',
  QUOTED: 'Quoted',
  QUOTE_REJECTED: 'Quote Rejected',
  IN_REPAIR: 'In Repair',
  IN_PROGRESS: 'In Progress',
  RETURNING_TO_CUSTOMER: 'Returning',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const ISSUE_TYPE_LABEL: Record<string, string> = {
  BROKEN_FRAME: 'Broken Frame',
  BROKEN_LENS: 'Broken Lens',
  LOOSE_HINGE: 'Loose Hinge',
  COATING_DAMAGE: 'Coating Damage',
  OTHER: 'Other',
};

const RESOLUTION_OPTIONS = [
  { value: 'REPAIR', label: 'Repair', desc: 'Product is repaired and returned to customer' },
  { value: 'REPLACE', label: 'Replacement', desc: 'Product is replaced with a new unit' },
  // { value: 'REFUND', label: 'Refund', desc: 'Customer is refunded for the product' },
];

const FAULT_TYPE_OPTIONS = [
  { value: 'SHOP_FAULT', label: 'Shop/Manufacturer Fault', desc: 'Covered by warranty. Customer pays nothing.' },
  { value: 'CUSTOMER_FAULT', label: 'Customer Fault', desc: 'Not covered by warranty. Customer pays for service and shipping.' },
];

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TABS = [
  { label: 'All', statuses: [] as string[] },
  { label: 'Pending Review', statuses: ['SUBMITTED', 'UNDER_REVIEW'] },
  { label: 'In Progress', statuses: ['APPROVED', 'ITEM_RECEIVED', 'QUOTED', 'QUOTE_REJECTED', 'IN_REPAIR', 'IN_PROGRESS', 'RETURNING_TO_CUSTOMER'] },
  { label: 'Completed', statuses: ['COMPLETED'] },
  { label: 'Rejected', statuses: ['REJECTED'] },
  { label: 'Policies & Pricing', statuses: ['POLICIES'] },
  { label: 'Issue Types', statuses: ['ISSUE_TYPES'] },
];

const isPendingReview = (status: string) => status === 'SUBMITTED' || status === 'UNDER_REVIEW';
const isInProgress = (status: string) => status === 'APPROVED' || status === 'ITEM_RECEIVED' || status === 'QUOTED' || status === 'QUOTE_REJECTED' || status === 'IN_REPAIR' || status === 'IN_PROGRESS' || status === 'RETURNING_TO_CUSTOMER';

const CLAIM_STEPS = ['Submitted', 'Evaluating', 'Repairing', 'Returning', 'Completed'];

const getClaimStepIndex = (status: string): number => {
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 0; // Submitted
    case 'APPROVED':
    case 'QUOTED':
    case 'QUOTE_REJECTED':
      return 1; // Evaluating
    case 'IN_REPAIR':
    case 'IN_PROGRESS':
      return 2; // Repairing
    case 'RETURNING_TO_CUSTOMER':
      return 3; // Returning
    case 'COMPLETED':
      return 4; // Completed
    case 'REJECTED':
      return -1; // Cancelled
    default:
      return 0;
  }
};

const WarrantyStepper = ({ status }: { status: string }) => {
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

  // return (
  //   <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1, mt: 2 }}>
  //     {CLAIM_STEPS.map((label, index) => {
  //       const isCompleted = index <= activeStep;
  //       const isActive = index === activeStep;

  //       return (
  //         <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: index < CLAIM_STEPS.length - 1 ? 1 : 'none' }}>
  //           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
  //             <Box
  //               sx={{
  //                 width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  //                 bgcolor: isCompleted ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[200],
  //                 color: isCompleted ? '#fff' : theme.palette.custom.neutral[400],
  //                 boxShadow: isActive ? `0 0 0 4px ${theme.palette.custom.status.success.light}` : 'none',
  //                 transition: 'all 0.3s',
  //               }}
  //             >
  //               {stepIcons[index]}
  //             </Box>
  //             <Typography sx={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isCompleted ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[400], mt: 0.75, textAlign: 'center' }}>
  //               {label}
  //             </Typography>
  //           </Box>
  //           {index < CLAIM_STEPS.length - 1 && (
  //             <Box sx={{ flex: 1, height: 3, bgcolor: index < activeStep ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[200], mx: 0.5, mb: 2.5, borderRadius: 2 }} />
  //           )}
  //         </Box>
  //       );
  //     })}
  //   </Box>
  // );
};

const ShopWarrantyPage = () => {
  const { setShowNavbar, setShowFooter } = useLayout();
  const theme = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [claims, setClaims] = useState<WarrantyClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES) return 5;
    if (location.pathname === PAGE_ENDPOINTS.SHOP.WARRANTY_ISSUE_TYPES) return 6;
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab ? Number(tab) : 0;
  });

  useEffect(() => {
    if (location.pathname === PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES) {
      setActiveTab(5);
    } else if (location.pathname === PAGE_ENDPOINTS.SHOP.WARRANTY_ISSUE_TYPES) {
      setActiveTab(6);
    } else {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(Number(tab));
      else setActiveTab(0);
    }
  }, [location.pathname, location.search]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 5) {
      navigate(PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES);
    } else if (newValue === 6) {
      navigate(PAGE_ENDPOINTS.SHOP.WARRANTY_ISSUE_TYPES);
    } else {
      navigate(`${PAGE_ENDPOINTS.SHOP.WARRANTY}?tab=${newValue}`);
    }
  };

  // Detail dialog
  const [selected, setSelected] = useState<WarrantyClaimResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Approve flow (shown after clicking Approve in detail dialog)
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveStep, setApproveStep] = useState<1 | 2>(1);
  const [resolutionType, setResolutionType] = useState('REPAIR');
  const [faultType, setFaultType] = useState('SHOP_FAULT');
  const [repairCostInput, setRepairCostInput] = useState('');
  const [inspectionNote, setInspectionNote] = useState('');
  const [actioning, setActioning] = useState(false);

  const resetApproveDialog = () => {
    setApproveStep(1);
    setRepairCostInput('');
    setInspectionNote('');
    setFaultType('SHOP_FAULT');
    setResolutionType('REPAIR');
  };

  const handleOpenApproveOrQuote = () => {
    if (!selected) return;
    setResolutionType(selected.resolutionType || 'REPAIR');
    setFaultType(selected.faultType || 'SHOP_FAULT');
    setRepairCostInput(selected.repairCost != null ? selected.repairCost.toString() : '');
    setInspectionNote(selected.inspectionNote || '');

    // When quoting a received item, default to Customer Fault if no fault set yet
    // because Shops usually quote for non-warranty repairs.
    if (selected.status === 'ITEM_RECEIVED' && !selected.faultType) {
      setFaultType('CUSTOMER_FAULT');
    }

    setApproveOpen(true);
  };

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [ghnStatusData, setGhnStatusData] = useState<any>(null);
  const [fetchingGhn, setFetchingGhn] = useState(false);

  // Service Price Management
  const [servicePrices, setServicePrices] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    serviceName: '',
    price: '',
    description: '',
    isActive: true,
  });

  // Warranty Policy Text Management
  const [policies, setPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [policyFormData, setPolicyFormData] = useState({
    name: 'General Warranty Policy',
    durationMonths: 12,
    coverageDescription: 'The product is covered by free warranty if it has technical defects caused by the manufacturer.',
    excludedIssues: [
      'Unauthorized repair or modification by the customer',
      'Repairs performed at service centers not authorized by the manufacturer',
      'Damage caused by user misuse',
      'Issues not covered under the manufacturer’s warranty'
    ] as string[],
    isDefault: true,
    isActive: true,
  });
  const [newExcludedIssue, setNewExcludedIssue] = useState('');

  // Warranty Issue Type Management
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingIssueType, setEditingIssueType] = useState<any | null>(null);
  const [issueFormData, setIssueFormData] = useState({
    typeName: '',
    description: '',
  });

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  useEffect(() => {
    shopApi.getMyShops().then((res) => {
      const shops = res.data;
      setShop(Array.isArray(shops) && shops.length > 0 ? shops[0] : null);
    }).catch(() => setShop(null));
  }, []);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const res = await warrantyApi.getShopClaims({ size: 100 });
      if (res.data) setClaims(res.data);
    } catch {
      console.error('Failed to fetch shop warranty claims');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServicePrices = useCallback(async () => {
    try {
      setLoadingPrices(true);
      const res = await warrantyApi.getMyServicePrices();
      if (res.data) setServicePrices(res.data);
    } catch {
      toast.error('Failed to fetch service prices');
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoadingPolicies(true);
      const res = await warrantyApi.getMyPolicies();
      if (res.data) {
        setPolicies(res.data);
        if (res.data.length > 0) {
          const p = res.data[0];
          setEditingPolicy(p);
          setPolicyFormData({
            name: p.name,
            durationMonths: p.durationMonths,
            coverageDescription: p.coverageDescription || '',
            excludedIssues: p.excludedIssues || [],
            isDefault: p.isDefault,
            isActive: p.isActive,
          });
        }
      }
    } catch {
      toast.error('Failed to fetch warranty policies');
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  const fetchIssueTypes = useCallback(async () => {
    try {
      setLoadingIssueTypes(true);
      const res = await warrantyApi.getMyIssueTypes();
      if (res.data) setIssueTypes(res.data);
    } catch {
      toast.error('Failed to fetch issue types');
    } finally {
      setLoadingIssueTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
    fetchServicePrices();
  }, [fetchClaims, fetchServicePrices]);

  useEffect(() => {
    if (activeTab === 5) {
      fetchServicePrices();
      fetchPolicies();
    } else if (activeTab === 6) {
      fetchIssueTypes();
    }
  }, [activeTab, fetchServicePrices, fetchPolicies, fetchIssueTypes]);

  const handleSavePolicy = async () => {
    try {
      setActioning(true);
      if (editingPolicy) {
        await warrantyApi.updatePolicy(editingPolicy.id, policyFormData);
        toast.success('Warranty policy updated');
      } else {
        await warrantyApi.createPolicy(policyFormData);
        toast.success('Warranty policy created');
      }
      fetchPolicies();
    } catch {
      toast.error('Failed to save warranty policy');
    } finally {
      setActioning(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await warrantyApi.deletePolicy(id);
      toast.success('Warranty policy deleted');
      fetchPolicies();
    } catch {
      toast.error('Failed to delete warranty policy');
    }
  };

  const handleSaveService = async () => {
    try {
      setActioning(true);
      const data = {
        ...serviceFormData,
        price: Number(serviceFormData.price),
      };

      if (editingService) {
        await warrantyApi.updateServicePrice(editingService.id, data);
        toast.success('Service price updated');
      } else {
        await warrantyApi.createServicePrice(data);
        toast.success('Service price added');
      }
      setServiceDialogOpen(false);
      fetchServicePrices();
    } catch {
      toast.error('Failed to save service price');
    } finally {
      setActioning(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await warrantyApi.deleteServicePrice(id);
      toast.success('Service price deleted');
      fetchServicePrices();
    } catch {
      toast.error('Failed to delete service price');
    }
  };

  const handleSaveIssueType = async () => {
    try {
      setActioning(true);
      if (editingIssueType) {
        await warrantyApi.updateIssueType(editingIssueType.id, issueFormData);
        toast.success('Issue type updated');
      } else {
        await warrantyApi.createIssueType(issueFormData);
        toast.success('Issue type created');
      }
      setIssueDialogOpen(false);
      fetchIssueTypes();
    } catch {
      toast.error('Failed to save issue type');
    } finally {
      setActioning(false);
    }
  };

  const handleDeleteIssueType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this issue type?')) return;
    try {
      await warrantyApi.deleteIssueType(id);
      toast.success('Issue type deleted');
      fetchIssueTypes();
    } catch {
      toast.error('Failed to delete issue type');
    }
  };

  const statusCounts = useMemo(() => {
    return TABS.map((tab, i) => {
      if (i === 0) return claims.length;
      if (i === 5) return servicePrices.length;
      if (i === 6) return issueTypes.length;
      return claims.filter((c) => tab.statuses.includes(c.status)).length;
    });
  }, [claims, servicePrices, issueTypes]);

  const getStatusColor = (status: string) => {
    const { custom } = theme.palette;
    switch (status) {
      case 'SUBMITTED': case 'UNDER_REVIEW':
        return { bg: custom.status.warning.light, color: custom.status.warning.main };
      case 'APPROVED': case 'ITEM_RECEIVED': case 'RETURNING_TO_CUSTOMER':
        return { bg: custom.status.info.light, color: custom.status.info.main };
      case 'QUOTED':
        return { bg: custom.status.warning.light, color: custom.status.warning.main };
      case 'IN_REPAIR': case 'IN_PROGRESS':
        return { bg: custom.status.purple.light, color: custom.status.purple.main };
      case 'COMPLETED':
        return { bg: custom.status.success.light, color: custom.status.success.main };
      case 'QUOTE_REJECTED': case 'REJECTED':
        return { bg: custom.status.error.light, color: custom.status.error.main };
      default:
        return { bg: custom.neutral[100], color: custom.neutral[500] };
    }
  };

  const filteredClaims = activeTab === 0
    ? claims
    : claims.filter((c) => TABS[activeTab].statuses.includes(c.status));

  const handleApprove = async () => {
    if (!selected) return;
    try {
      setActioning(true);
      const repairCost = repairCostInput ? Number(repairCostInput) : undefined;

      let res;
      if (selected.status === 'ITEM_RECEIVED' || selected.status === 'QUOTED') {
        res = await warrantyApi.quoteShopClaim(selected.id, resolutionType, faultType, repairCost || 0, inspectionNote);
      } else {
        res = await warrantyApi.approveShopClaim(selected.id, resolutionType, faultType, repairCost);
      }

      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success(res.data?.status === 'QUOTED'
        ? 'Warranty claim quoted — customer will be notified to pay'
        : 'Warranty claim approved — customer will be notified to ship');
      setApproveOpen(false);
      resetApproveDialog();
    } catch {
      toast.error('Failed to process claim');
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    try {
      setActioning(true);
      const res = await warrantyApi.rejectShopClaim(selected.id, rejectReason.trim());
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Warranty claim rejected');
      setRejectOpen(false);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject claim');
    } finally {
      setActioning(false);
    }
  };

  const handleMarkReceived = async () => {
    if (!selected) return;
    try {
      setActioning(true);
      const res = await warrantyApi.markItemReceived(selected.id);
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Item marked as received — repair in progress');
    } catch {
      toast.error('Failed to mark item as received');
    } finally {
      setActioning(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    try {
      setActioning(true);
      const res = await warrantyApi.completeShopClaim(selected.id);
      if (res.data) {
        setClaims((prev) => prev.map((c) => c.id === selected.id ? res.data! : c));
        setSelected(res.data);
      }
      toast.success('Repair completed — product will be shipped back to customer');
    } catch {
      toast.error('Failed to complete claim');
    } finally {
      setActioning(false);
    }
  };

  const handleTrackGhnStatus = async () => {
    if (!selected) return;
    try {
      setFetchingGhn(true);
      const res = await warrantyApi.getWarrantyGhnStatus(selected.id);
      setGhnStatusData(res.data);
    } catch {
      toast.error('Failed to fetch GHN tracking status.');
    } finally {
      setFetchingGhn(false);
    }
  };

  const tabCounts = statusCounts;

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
      {children}
    </Typography>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={location.pathname === PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES ? PAGE_ENDPOINTS.SHOP.WARRANTY_POLICIES : PAGE_ENDPOINTS.SHOP.WARRANTY}
        shopName={shop?.shopName}
        shopLogo={shop?.logoUrl}
        ownerName={shop?.ownerName || user?.fullName}
        ownerEmail={shop?.ownerEmail || user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Build sx={{ color: theme.palette.custom.neutral[600] }} />
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Warranty Claims
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Manage warranty requests from customers. Review, approve, and track repair progress.
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            borderBottom: `1px solid ${theme.palette.custom.border.light}`,
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: theme.palette.primary.main },
          }}
        >
          {TABS.map((tab, i) => (
            <Tab
              key={tab.label}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {tab.label}
                  <Box
                    component="span"
                    sx={{
                      ml: 1, px: 0.75, py: 0.1, borderRadius: 1, fontSize: 11, fontWeight: 700,
                      bgcolor: activeTab === i ? theme.palette.primary.main : theme.palette.custom.neutral[100],
                      color: activeTab === i ? "#fff" : theme.palette.custom.neutral[600],
                    }}
                  >
                    {tabCounts[i]}
                  </Box>
                </Box>
              }
              sx={{
                textTransform: 'none',
                minHeight: 48,
                fontWeight: activeTab === i ? 700 : 500,
                fontSize: 14,
                color: activeTab === i ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            />
          ))}
        </Tabs>

        {/* Main Table Content */}
        {activeTab < 5 && (
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredClaims.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
                <Build sx={{ fontSize: 40, color: theme.palette.custom.neutral[300] }} />
                <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>No warranty claims found</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                      {['Claim No.', 'Product', 'Issue', 'Customer', 'Submitted', 'Status', ''].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', py: 1.5 }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClaims.map((claim) => (
                      <TableRow
                        key={claim.id}
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        onClick={() => { setSelected(claim); setDetailOpen(true); }}
                      >
                        <TableCell sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800], fontFamily: 'monospace' }}>
                          {claim.claimNumber}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              variant="rounded"
                              src={claim.productImageUrl}
                              sx={{ width: 36, height: 36, borderRadius: '6px', bgcolor: theme.palette.custom.neutral[100], flexShrink: 0 }}
                            >
                              <ShoppingBag sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {claim.productName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ISSUE_TYPE_LABEL[claim.issueType] ?? claim.issueType}
                            size="small"
                            sx={{ fontSize: 12, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[700] }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={claim.customerAvatarUrl} sx={{ width: 28, height: 28, fontSize: 12 }}>
                              {claim.customerName?.[0] ?? 'C'}
                            </Avatar>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                              {claim.customerName ?? '—'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                          {formatDate(claim.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={STATUS_LABEL[claim.status] ?? claim.status}
                            size="small"
                            sx={{ fontSize: 12, fontWeight: 600, bgcolor: getStatusColor(claim.status).bg, color: getStatusColor(claim.status).color }}
                          />
                        </TableCell>
                        {/* Action icon */}
                        <TableCell onClick={(e) => e.stopPropagation()} sx={{ width: 40 }}>
                          {isPendingReview(claim.status) && (
                            <Tooltip title="Review claim" arrow>
                              <IconButton
                                size="small"
                                onClick={() => { setSelected(claim); setDetailOpen(true); }}
                                sx={{
                                  bgcolor: theme.palette.custom.status.warning.light,
                                  color: theme.palette.custom.status.warning.main,
                                  '&:hover': { bgcolor: theme.palette.custom.status.warning.main, color: '#fff' },
                                }}
                              >
                                <Warning sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isInProgress(claim.status) && (
                            <Tooltip title="Mark as completed" arrow>
                              <IconButton
                                size="small"
                                disabled={actioning}
                                onClick={() => { setSelected(claim); setDetailOpen(true); }}
                                sx={{
                                  bgcolor: theme.palette.custom.status.purple.light,
                                  color: theme.palette.custom.status.purple.main,
                                  '&:hover': { bgcolor: theme.palette.custom.status.purple.main, color: '#fff' },
                                }}
                              >
                                <Build sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Policies & Pricing Tab Content */}
        {activeTab === 5 && (
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    Repair Price List
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                    Define standard prices for common repairs and services.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Build />}
                  onClick={() => {
                    setEditingService(null);
                    setServiceFormData({ serviceName: '', price: '', description: '', isActive: true });
                    setServiceDialogOpen(true);
                  }}
                  sx={{ bgcolor: theme.palette.custom.neutral[800], borderRadius: 1.5, textTransform: 'none' }}
                >
                  Add Service
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                      {['Service Name', 'Price (VND)', 'Description', 'Status', 'Actions'].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingPrices ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                    ) : servicePrices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No services added yet</TableCell></TableRow>
                    ) : (
                      servicePrices.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ fontSize: 14, fontWeight: 600 }}>{s.serviceName}</TableCell>
                          <TableCell sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.primary.main }}>{Number(s.price).toLocaleString('vi-VN')}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], maxWidth: 300 }}>{s.description || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={s.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{ fontSize: 11, fontWeight: 700, bgcolor: s.isActive ? theme.palette.custom.status.success.light : theme.palette.custom.neutral[100], color: s.isActive ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[500] }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingService(s);
                                setServiceFormData({ serviceName: s.serviceName, price: s.price.toString(), description: s.description || '', isActive: s.isActive });
                                setServiceDialogOpen(true);
                              }}
                            >
                              <Edit sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteService(s.id)}>
                              <Cancel sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    Warranty Policy & Rules
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                    Describe what is covered and what is excluded in your shop's warranty.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      setEditingPolicy(null);
                      setPolicyFormData({ name: '', durationMonths: 12, coverageDescription: '', excludedIssues: [], isDefault: false, isActive: true });
                    }}
                    sx={{ borderRadius: 1.5, textTransform: 'none' }}
                  >
                    Add New
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSavePolicy}
                    disabled={actioning || loadingPolicies || !policyFormData.name}
                    sx={{ bgcolor: theme.palette.custom.neutral[800], borderRadius: 1.5, textTransform: 'none' }}
                  >
                    {actioning ? <CircularProgress size={20} /> : 'Save Policy'}
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    label="Coverage Description"
                    multiline
                    rows={6}
                    placeholder="Describe what is covered under warranty..."
                    value={policyFormData.coverageDescription}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, coverageDescription: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Policy Name"
                    placeholder="e.g. Standard 1-Year Warranty"
                    value={policyFormData.name}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, name: e.target.value })}
                    sx={{ mb: 3 }}
                  />
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Duration (Months)"
                        type="number"
                        value={policyFormData.durationMonths}
                        onChange={(e) => setPolicyFormData({ ...policyFormData, durationMonths: Number(e.target.value) })}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FormControlLabel
                          control={<Checkbox checked={policyFormData.isDefault} onChange={(e) => setPolicyFormData({ ...policyFormData, isDefault: e.target.checked })} />}
                          label={<Typography sx={{ fontSize: 13 }}>Set as Default</Typography>}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={policyFormData.isActive} onChange={(e) => setPolicyFormData({ ...policyFormData, isActive: e.target.checked })} />}
                          label={<Typography sx={{ fontSize: 13 }}>Active</Typography>}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', mb: 1 }}>
                      Excluded Issues
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Accidental drops"
                        value={newExcludedIssue}
                        onChange={(e) => setNewExcludedIssue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), setNewExcludedIssue(''), setPolicyFormData({ ...policyFormData, excludedIssues: [...policyFormData.excludedIssues, newExcludedIssue] }))}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => {
                          if (newExcludedIssue.trim()) {
                            setPolicyFormData({ ...policyFormData, excludedIssues: [...policyFormData.excludedIssues, newExcludedIssue] });
                            setNewExcludedIssue('');
                          }
                        }}
                        sx={{ minWidth: 40, p: 0 }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {policyFormData.excludedIssues.map((issue, i) => (
                        <Chip
                          key={i}
                          label={issue}
                          size="small"
                          onDelete={() => setPolicyFormData({ ...policyFormData, excludedIssues: policyFormData.excludedIssues.filter((_, idx) => idx !== i) })}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Saved Policies List */}
              {policies.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', mb: 1.5, letterSpacing: 0.5 }}>
                    Saved Policies ({policies.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {policies.map((p) => {
                      const isSelected = editingPolicy?.id === p.id;
                      return (
                        <Box
                          key={p.id}
                          onClick={() => {
                            setEditingPolicy(p);
                            setPolicyFormData({
                              name: p.name,
                              durationMonths: p.durationMonths,
                              coverageDescription: p.coverageDescription || '',
                              excludedIssues: p.excludedIssues || [],
                              isDefault: p.isDefault,
                              isActive: p.isActive,
                            });
                          }}
                          sx={{
                            p: 2,
                            overflow: 'hidden',
                            // bgcolor: isSelected ? theme.palette.custom.status.info.light + '30' : theme.palette.custom.neutral[50],
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: theme.palette.primary.main, bgcolor: theme.palette.custom.status.info.light + '20' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800], minWidth: 0, flex: 1, wordBreak: 'break-word' }}>
                              {p.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                              {p.isDefault && (
                                <Chip label="Default" size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#667eea', color: '#fff' }} />
                              )}
                              <Chip
                                label={p.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                sx={{
                                  fontSize: 11, height: 20,
                                  bgcolor: p.isActive ? theme.palette.custom.status.success.light : theme.palette.custom.neutral[100],
                                  color: p.isActive ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[500],
                                }}
                              />
                              <Chip label={`${p.durationMonths}mo`} size="small" sx={{ fontSize: 11, height: 20, bgcolor: theme.palette.custom.neutral[100] }} />
                              <IconButton
                                size="small"
                                color="error"
                                disabled={actioning}
                                onClick={(e) => { e.stopPropagation(); handleDeletePolicy(p.id); }}
                                sx={{ ml: 0.5, p: 0.5 }}
                              >
                                <Cancel sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Box>
                          {p.coverageDescription && (
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: p.excludedIssues?.length > 0 ? 0.75 : 0, wordBreak: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                              {p.coverageDescription}
                            </Typography>
                          )}
                          {p.excludedIssues?.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {p.excludedIssues.map((issue: string, i: number) => (
                                <Chip key={i} label={issue} size="small" sx={{ fontSize: 11, height: 18, bgcolor: '#fee2e2', color: '#991b1b' }} />
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.custom.status.info.light + '20', borderStyle: 'dashed' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Info sx={{ color: theme.palette.custom.status.info.main }} />
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                    Warranty Rules Reminder
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.custom.neutral[600], lineHeight: 1.6 }}>
                    • <strong>Manufacturing Defects:</strong> Repairs are <strong>FREE</strong> for customers. Shop bears shipping and repair costs.<br />
                    • <strong>User Damage:</strong> Repair cost and shipping fees are paid by the <strong>Customer</strong>.<br />
                    • <strong>Unauthorized Repairs:</strong> Warranty is void if the product has been tampered with or repaired by unauthorized centers.
                  </Typography>
                </Box>
              </Box>
            </Paper> */}
          </Box>
        )}

        {/* Issue Types Tab Content */}
        {activeTab === 6 && (
          <Box sx={{ mt: 3 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    Warranty Issue Types
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                    Manage common issues customers can select when requesting warranty.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingIssueType(null);
                    setIssueFormData({ typeName: '', description: '' });
                    setIssueDialogOpen(true);
                  }}
                  sx={{ bgcolor: theme.palette.custom.neutral[800], borderRadius: 1.5, textTransform: 'none' }}
                >
                  Add Issue Type
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                      {['Issue Type Name', 'Description', 'Actions'].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingIssueTypes ? (
                      <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                    ) : issueTypes.length === 0 ? (
                      <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>No issue types added yet. Default types will be available to customers.</TableCell></TableRow>
                    ) : (
                      issueTypes.map((it) => (
                        <TableRow key={it.id} hover>
                          <TableCell sx={{ fontSize: 14, fontWeight: 600 }}>{it.typeName}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], maxWidth: 400 }}>{it.description || '—'}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingIssueType(it);
                                setIssueFormData({ typeName: it.typeName, description: it.description || '' });
                                setIssueDialogOpen(true);
                              }}
                            >
                              <Edit sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteIssueType(it.id)}>
                              <Cancel sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Issue Type Dialog */}
      <Dialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingIssueType ? 'Edit Issue Type' : 'Add Issue Type'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            label="Type Name"
            placeholder="e.g. Scratched Lens"
            value={issueFormData.typeName}
            onChange={(e) => setIssueFormData({ ...issueFormData, typeName: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={issueFormData.description}
            onChange={(e) => setIssueFormData({ ...issueFormData, description: e.target.value })}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIssueDialogOpen(false)} sx={{ color: theme.palette.custom.neutral[500] }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveIssueType}
            disabled={!issueFormData.typeName || actioning}
            sx={{ bgcolor: theme.palette.custom.neutral[800], borderRadius: 1.5 }}
          >
            {actioning ? <CircularProgress size={20} /> : 'Save Issue Type'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Price Dialog */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingService ? 'Edit Service' : 'Add Repair Service'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            label="Service Name"
            placeholder="e.g. Lens Replacement"
            value={serviceFormData.serviceName}
            onChange={(e) => setServiceFormData({ ...serviceFormData, serviceName: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Price (VND)"
            type="text"
            inputMode="numeric"
            value={serviceFormData.price ? Number(serviceFormData.price).toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
              setServiceFormData({ ...serviceFormData, price: raw });
            }}
            size="small"
            placeholder="0"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={serviceFormData.description}
            onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
            size="small"
          />
          <FormControlLabel
            control={<Radio checked={serviceFormData.isActive} onClick={() => setServiceFormData({ ...serviceFormData, isActive: !serviceFormData.isActive })} color="primary" />}
            label="Active"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setServiceDialogOpen(false)} sx={{ color: theme.palette.custom.neutral[500] }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={!serviceFormData.serviceName || !serviceFormData.price || actioning}
            sx={{ bgcolor: theme.palette.custom.neutral[800], borderRadius: 1.5 }}
          >
            {actioning ? <CircularProgress size={20} /> : 'Save Service'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== IMAGE PREVIEW ==================== */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        slotProps={{ paper: { sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{ position: 'absolute', top: -16, right: -16, bgcolor: 'white', boxShadow: 2, zIndex: 1, '&:hover': { bgcolor: theme.palette.custom.neutral[100] } }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
          <Box component="img" src={previewImage ?? ''} sx={{ maxWidth: '85vw', maxHeight: '85vh', display: 'block', borderRadius: '12px', objectFit: 'contain' }} />
        </Box>
      </Dialog>

      {/* ==================== DETAIL DIALOG ==================== */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setGhnStatusData(null); }} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        {selected && (
          <>
            {/* Header */}
            <DialogTitle sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 2.5, background: `linear-gradient(135deg, ${theme.palette.custom.neutral[50]} 0%, white 100%)`, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* Product */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      src={selected.productImageUrl}
                      sx={{ width: 72, height: 72, borderRadius: '12px', bgcolor: theme.palette.custom.neutral[100], border: `1px solid ${theme.palette.custom.border.light}`, flexShrink: 0 }}
                    >
                      <ShoppingBag sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 17, fontWeight: 700, color: theme.palette.custom.neutral[800], lineHeight: 1.3 }}>
                        {selected.productName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {selected.purchasedAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarMonth sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }} />
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              Purchased {formatDate(selected.purchasedAt)}
                            </Typography>
                          </Box>
                        )}
                        {selected.warrantyExpiresAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VerifiedUser sx={{ fontSize: 13, color: theme.palette.custom.status.success.main }} />
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>
                              Warranty until {formatDate(selected.warrantyExpiresAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <IconButton size="small" onClick={() => setDetailOpen(false)}>
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Chip
                      label={STATUS_LABEL[selected.status] ?? selected.status}
                      sx={{ fontWeight: 700, fontSize: 12, height: 26, bgcolor: getStatusColor(selected.status).bg, color: getStatusColor(selected.status).color }}
                    />
                  </Box>
                </Box>

                {/* Claim meta */}
                <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Claim No.</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[700], fontFamily: 'monospace' }}>{selected.claimNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Submitted</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>{formatDate(selected.submittedAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', fontWeight: 600 }}>Customer Pays</Typography>
                    {selected.customerPays != null ? (
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.warning.main }}>{Number(selected.customerPays).toLocaleString('vi-VN')} VND</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[400] }}>TBD after review</Typography>
                    )}
                  </Box>
                </Box>
                <WarrantyStepper status={selected.status} />
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Customer Info */}
                <Box>
                  <SectionLabel>Customer</SectionLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                    <Avatar src={selected.customerAvatarUrl} sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[200] }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                        {selected.customerName ?? '—'}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                        {selected.customerEmail ?? '—'} • {selected.customerPhone ?? '—'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Issue */}
                <Box>
                  <SectionLabel>Issue Details</SectionLabel>
                  <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                    <Chip
                      icon={<Warning sx={{ fontSize: '14px !important' }} />}
                      label={ISSUE_TYPE_LABEL[selected.issueType] ?? selected.issueType}
                      size="small"
                      sx={{
                        mb: 1.5,
                        bgcolor: theme.palette.custom.status.warning.light,
                        color: theme.palette.custom.status.warning.main,
                        fontWeight: 700, fontSize: 12,
                        '& .MuiChip-icon': { color: theme.palette.custom.status.warning.main },
                      }}
                    />
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>
                      {selected.issueDescription}
                    </Typography>
                  </Box>
                </Box>

                {/* Product Photos */}
                {(selected.issueImages ?? []).length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SectionLabel>Product Condition Photos</SectionLabel>
                      <Chip
                        label={selected.issueImages?.length ?? 0}
                        size="small"
                        sx={{ height: 18, fontSize: 11, fontWeight: 700, mb: 1, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }}
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
                      {(selected.issueImages ?? []).map((img, i) => (
                        <Box key={i} sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1/1', cursor: 'zoom-in', border: `1.5px solid ${theme.palette.custom.border.light}` }}
                          onClick={() => setPreviewImage(img)}
                        >
                          <Box component="img" src={img} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }} />
                          <Box sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ZoomIn sx={{ fontSize: 16, color: '#fff' }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Shipping Process (always visible for context) */}
                <Box sx={{ p: 2, borderRadius: '8px', border: `1px dashed ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <LocalShipping sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[700] }}>
                      Warranty Shipping Process
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {[
                      { step: '1', text: 'After approval, customer ships product to your store via GHN' },
                      { step: '2', text: 'You receive and inspect the product, then perform repair / replacement' },
                      { step: '3', text: 'After repair, you ship the product back to the customer via GHN' },
                    ].map(({ step, text }) => (
                      <Box key={step} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: theme.palette.custom.status.info.main, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
                          {step}
                        </Box>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>{text}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mt: 1.5, fontStyle: 'italic' }}>
                    Shipping fees (both directions) will be calculated and included in the total cost estimate sent to the customer.
                  </Typography>
                </Box>

                {/* Resolution (if set) */}
                {selected.resolutionType && (
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.status.success.light, border: `1px solid ${theme.palette.custom.status.success.main}30`, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <AssignmentTurnedIn sx={{ fontSize: 22, color: theme.palette.custom.status.success.main, mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.status.success.main, textTransform: 'uppercase', mb: 0.25 }}>Resolution</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                        {RESOLUTION_OPTIONS.find((r) => r.value === selected.resolutionType)?.label ?? selected.resolutionType}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {selected.inspectionNote && (
                  <Box sx={{ mt: 1.5, p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.neutral[50], border: `1px solid ${theme.palette.custom.border.light}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Info sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>Shop Inspection Note</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{selected.inspectionNote}"
                    </Typography>
                  </Box>
                )}

                {/* Cost Summary */}
                {(selected.repairCost != null || selected.customerShippingFeeToShop != null || selected.customerPays != null) && (
                  <Box>
                    <SectionLabel>Cost Summary</SectionLabel>
                    <Box sx={{ borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden' }}>
                      {selected.repairCost != null && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Service Fee</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{Number(selected.repairCost).toLocaleString('vi-VN')} VND</Typography>
                        </Box>
                      )}
                      {selected.customerShippingFeeToShop != null && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: selected.platformSubsidyToShop != null ? 'none' : `1px solid ${theme.palette.custom.border.light}` }}>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Customer → Shop)</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{Number(selected.customerShippingFeeToShop).toLocaleString('vi-VN')} VND</Typography>
                          </Box>
                          {selected.platformSubsidyToShop != null && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 0.75, borderBottom: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.status.success.light }}>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>↳ Platform support (leg 1)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main }}>−{Number(selected.platformSubsidyToShop).toLocaleString('vi-VN')} VND</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {selected.customerShippingFeeToCustomer != null && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: selected.platformSubsidyToCustomer != null ? 'none' : `1px solid ${theme.palette.custom.border.light}` }}>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping (Shop → Customer)</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>{Number(selected.customerShippingFeeToCustomer).toLocaleString('vi-VN')} VND</Typography>
                          </Box>
                          {selected.platformSubsidyToCustomer != null && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 0.75, borderBottom: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.status.success.light }}>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>↳ Platform support (leg 2)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.status.success.main }}>−{Number(selected.platformSubsidyToCustomer).toLocaleString('vi-VN')} VND</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {selected.customerPays != null && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, bgcolor: theme.palette.custom.neutral[50] }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>Customer Pays</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={selected.paymentStatus === 'PAID' ? 'Paid' : 'Awaiting Payment'}
                              size="small"
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                height: 22,
                                bgcolor: selected.paymentStatus === 'PAID' ? theme.palette.custom.status.success.light : theme.palette.warning.light,
                                color: selected.paymentStatus === 'PAID' ? theme.palette.custom.status.success.main : theme.palette.warning.dark,
                              }}
                            />
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.status.warning.main }}>{Number(selected.customerPays).toLocaleString('vi-VN')} VND</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Tracking Numbers */}
                {(selected.returnTrackingNumber || selected.replacementTrackingNumber) && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: -0.5 }}>
                      <SectionLabel>Live Tracking</SectionLabel>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={fetchingGhn ? <CircularProgress size={14} /> : <LocalShipping sx={{ fontSize: 14 }} />}
                        onClick={handleTrackGhnStatus}
                        disabled={fetchingGhn}
                        sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, p: 0, minWidth: 'auto', mb: 1, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                      >
                        {fetchingGhn ? 'Checking...' : 'Check GHN Status'}
                      </Button>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selected.returnTrackingNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Customer → Shop</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: theme.palette.custom.status.purple.main }}>{selected.returnTrackingNumber}</Typography>
                        </Box>
                      )}
                      {selected.replacementTrackingNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shop → Customer</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: theme.palette.custom.status.success.main }}>{selected.replacementTrackingNumber}</Typography>
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

                {/* Timeline */}
                <Box>
                  <SectionLabel>Activity Timeline</SectionLabel>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { label: 'Claim submitted', date: selected.submittedAt, color: theme.palette.primary.main, always: true },
                      { label: 'Approved by shop', date: selected.approvedAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Package delivered to shop (GHN)', date: selected.returnDeliveredAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Item received — in repair', date: undefined, color: theme.palette.custom.status.purple.main, always: selected.status === 'IN_REPAIR' || selected.status === 'IN_PROGRESS' || selected.status === 'COMPLETED' },
                      { label: 'Repair completed', date: selected.completedAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Product delivered to customer (GHN)', date: selected.replacementDeliveredAt, color: theme.palette.custom.status.success.main, always: false },
                      { label: 'Rejected', date: selected.rejectedAt, color: theme.palette.custom.status.error.main, always: false },
                    ].filter((e) => e.always || e.date).map((event, i, arr) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: event.date ? event.color : theme.palette.custom.neutral[200], border: `2px solid ${event.date ? event.color : theme.palette.custom.neutral[300]}`, mt: 0.5, flexShrink: 0 }} />
                          {i < arr.length - 1 && <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: theme.palette.custom.border.light, my: 0.5 }} />}
                        </Box>
                        <Box sx={{ pb: i < arr.length - 1 ? 1.5 : 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: event.date ? theme.palette.custom.neutral[800] : theme.palette.custom.neutral[400] }}>{event.label}</Typography>
                          {event.date && <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{formatDate(event.date)}</Typography>}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Rejection reason */}
                {selected.rejectionReason && (
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.custom.status.error.light, border: `1px solid ${theme.palette.custom.status.error.main}30`, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Cancel sx={{ fontSize: 22, color: theme.palette.custom.status.error.main, mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.status.error.main, textTransform: 'uppercase', mb: 0.25 }}>Rejection Reason</Typography>
                      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>{selected.rejectionReason}</Typography>
                    </Box>
                  </Box>
                )}

                {/* GHN delivery notification */}
                {selected.status === 'APPROVED' && selected.returnDeliveredAt && (
                  <Box sx={{ p: 2, borderRadius: '10px', bgcolor: theme.palette.custom.status.success.light, border: `1.5px solid ${theme.palette.custom.status.success.main}50`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                        Package delivered to your shop
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], mt: 0.25 }}>
                        GHN confirmed delivery on {formatDateTime(selected.returnDeliveredAt)}. Click "Mark Item Received" to start the repair.
                      </Typography>
                    </Box>
                  </Box>
                )}

              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.custom.border.light}`, gap: 1.5, flexWrap: 'wrap' }}>
              {selected.status === 'QUOTE_REJECTED' && selected.paymentStatus !== 'PAID' && (
                <Alert severity="warning" sx={{ width: '100%', py: 0.5, fontSize: 13 }}>
                  Customer has rejected the quote. Waiting for them to pay the return shipping fee before you can create a return shipment.
                </Alert>
              )}
              {isPendingReview(selected.status) && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => { setDetailOpen(false); handleOpenApproveOrQuote(); }}
                    sx={{
                      textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px',
                      bgcolor: theme.palette.custom.status.success.main,
                      '&:hover': { bgcolor: '#15803d' },
                    }}
                  >
                    Approve Claim
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Cancel />}
                    onClick={() => { setDetailOpen(false); setRejectOpen(true); }}
                    sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.error.main, '&:hover': { bgcolor: '#b91c1c' } }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <Tooltip title={!(ghnStatusData?.status === 'delivered' || selected.returnDeliveredAt) ? "Only available when GHN confirms delivery to shop" : ""}>
                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<LocalShipping />}
                      disabled={actioning || !(ghnStatusData?.status === 'delivered' || selected.returnDeliveredAt)}
                      onClick={handleMarkReceived}
                      sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.purple.main, '&:hover': { bgcolor: '#6d28d9' } }}
                    >
                      {actioning ? <CircularProgress size={18} color="inherit" /> : 'Mark Item Received'}
                    </Button>
                  </Box>
                </Tooltip>
              )}
              {(selected.status === 'ITEM_RECEIVED' || selected.status === 'QUOTED') && (
                <Button
                  variant="contained"
                  startIcon={<Build />}
                  onClick={() => { handleOpenApproveOrQuote(); }}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.warning.main, '&:hover': { bgcolor: '#d97706' } }}
                >
                  {selected.status === 'ITEM_RECEIVED' ? 'Submit Inspection & Quote' : 'Edit Quote'}
                </Button>
              )}
              {(selected.status === 'IN_REPAIR' || selected.status === 'IN_PROGRESS' || selected.status === 'QUOTE_REJECTED') && (
                <Tooltip
                  title={selected.status === 'QUOTE_REJECTED' && selected.paymentStatus !== 'PAID' ? 'Waiting for customer to pay the return shipping fee' : ''}
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<AssignmentTurnedIn />}
                      disabled={actioning || (selected.status === 'QUOTE_REJECTED' && selected.paymentStatus !== 'PAID')}
                      onClick={handleComplete}
                      sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px' }}
                    >
                      {actioning ? <CircularProgress size={18} color="inherit" /> : 'Complete & Return'}
                    </Button>
                  </span>
                </Tooltip>
              )}
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ==================== APPROVE DIALOG ==================== */}
      <Dialog
        open={approveOpen}
        onClose={() => { setApproveOpen(false); resetApproveDialog(); }}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        {selected && (
          <>
            {/* ---- Header ---- */}
            <DialogTitle sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.palette.custom.status.success.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                      {approveStep === 2
                        ? (selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED' ? 'Review Quote' : 'Confirm Approval')
                        : (selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED' ? 'Submit Inspection & Quote' : 'Approve Warranty Claim')}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selected?.claimNumber}</Typography>
                  </Box>
                </Box>
                {/* Step indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {([1, 2] as const).map((s) => (
                    <Box key={s} sx={{ width: s === approveStep ? 20 : 8, height: 8, borderRadius: 4, transition: 'all 0.2s', bgcolor: s === approveStep ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[200] }} />
                  ))}
                </Box>
              </Box>
            </DialogTitle>

            {/* ---- STEP 1: Resolution + Fees ---- */}
            {approveStep === 1 && (
              <>
                <DialogContent sx={{ pt: 2.5 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                    {selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED'
                      ? 'Choose resolution type and enter the estimated fees. The customer will review before work begins.'
                      : 'Review the customer warranty request details below and approve to create a shipping label.'}
                  </Typography>

                  {/* Customer Request Review — Only during initial approval */}
                  {selected && isPendingReview(selected.status) && (
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                        Client Request Details
                      </Typography>
                      <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[500] }}>Issue Type</Typography>
                          <Chip
                            label={selected?.issueType ? (ISSUE_TYPE_LABEL[selected.issueType] || selected.issueType) : ''}
                            size="small"
                            sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800], mb: 2, lineHeight: 1.5 }}>{selected?.issueDescription}</Typography>

                        {selected?.issueImages && selected.issueImages.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {selected.issueImages.map((img, i) => (
                              <Avatar
                                key={i}
                                src={img}
                                variant="rounded"
                                sx={{ width: 64, height: 64, cursor: 'pointer', borderRadius: '6px', border: `1px solid ${theme.palette.custom.border.light}` }}
                                onClick={() => setPreviewImage(img)}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Resolution options — Only during Quoting phase */}
                  {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (
                    <>
                      <Alert severity="info" sx={{ mb: 3, borderRadius: '8px', '& .MuiAlert-message': { fontSize: 13 } }}>
                        <strong>Warranty Policy Reminder:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          <li>The product is covered by free warranty if it has technical defects caused by the manufacturer.</li>
                          <li>Warranty is void if the product is self-repaired or damaged due to user misuse.</li>
                        </ul>
                      </Alert>
                      <SectionLabel>Resolution Type</SectionLabel>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                        {RESOLUTION_OPTIONS.map((opt) => {
                          const isSelected = resolutionType === opt.value;
                          return (
                            <Box
                              key={opt.value}
                              onClick={() => setResolutionType(opt.value)}
                              sx={{
                                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden',
                                border: `2px solid ${isSelected ? theme.palette.custom.status.success.main : theme.palette.custom.border.light}`,
                                bgcolor: 'white',
                                '&:hover': { borderColor: theme.palette.custom.status.success.main },
                              }}
                            >
                              <Box sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{opt.label}</Typography>
                                  {isSelected && <CheckCircle sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />}
                                </Box>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.25 }}>{opt.desc}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}

                  {/* Only show fault type and fees during Quoting phase */}
                  {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (
                    <>
                      <SectionLabel>Fault Type</SectionLabel>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 1.5 }}>
                        Determines who pays for shipping and service fees.
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                        {FAULT_TYPE_OPTIONS.map((opt) => {
                          const isSelected = faultType === opt.value;
                          return (
                            <Box
                              key={opt.value}
                              onClick={() => {
                                setFaultType(opt.value);
                                if (opt.value === 'SHOP_FAULT') setRepairCostInput('0');
                              }}
                              sx={{
                                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden',
                                border: `2px solid ${isSelected ? theme.palette.custom.status.success.main : theme.palette.custom.border.light}`,
                                bgcolor: 'white',
                                '&:hover': { borderColor: theme.palette.custom.status.success.main },
                              }}
                            >
                              <Box sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{opt.label}</Typography>
                                  {isSelected && <CheckCircle sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />}
                                </Box>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mt: 0.25 }}>{opt.desc}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}

                  {/* Service fee selection — Only during Quoting phase */}
                  {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (
                    <Box sx={{ mb: 3, p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: 'white' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1.5 }}>
                        Select Repair / Service Package {faultType === 'SHOP_FAULT' && '(Shop Fault: Internal use only)'}
                      </Typography>

                      {faultType === 'SHOP_FAULT' ? (
                        <Alert severity="success" sx={{ borderRadius: '6px', fontSize: 13, py: 0.5 }}>
                          Manufacturer Defect: Repair fee is waived (0 VND)
                        </Alert>
                      ) : (
                        <FormControl fullWidth size="small">
                          <InputLabel id="service-price-select-label">Select Service Package</InputLabel>
                          <Select
                            labelId="service-price-select-label"
                            value={repairCostInput}
                            label="Select Service Package"
                            onChange={(e) => setRepairCostInput(e.target.value)}
                            disabled={loadingPrices}
                          >
                            {servicePrices.length === 0 ? (
                              <MenuItem disabled value="">
                                <em>No service packages defined</em>
                              </MenuItem>
                            ) : (
                              servicePrices.filter(p => p.isActive).map((ser) => (
                                <MenuItem key={ser.id} value={ser.price.toString()}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ser.serviceName}</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{ser.description}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, ml: 2 }}>
                                      {ser.price.toLocaleString('vi-VN')} VND
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))
                            )}
                            <MenuItem value="0">
                              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>Other / Free of charge (0 VND)</Typography>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      )}

                      {servicePrices.length === 0 && faultType !== 'SHOP_FAULT' && (
                        <Typography sx={{ fontSize: 11, color: theme.palette.error.main, mt: 1 }}>
                          * Tip: Define service packages in the 'Policies & Pricing' tab for faster quoting.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Inspection Note */}
                  {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (
                    <Box sx={{ mb: 3, p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: 'white' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>
                        Inspection Note / Fault Details
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        placeholder="Describe your findings after inspecting the item..."
                        value={inspectionNote}
                        onChange={(e) => setInspectionNote(e.target.value)}
                      />
                    </Box>
                  )}

                  {/* Shipping fee — auto */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: theme.palette.custom.status.info.light, border: `1px solid ${theme.palette.custom.status.info.main}20` }}>
                    <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.status.info.main, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], lineHeight: 1.5 }}>
                      <strong>Shipping fee (2-way)</strong> is calculated automatically via GHN when you submit — leg 1 (customer → shop) is created immediately, leg 2 (shop → customer) is estimated and confirmed on completion.
                    </Typography>
                  </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                  <Button onClick={() => { setApproveOpen(false); resetApproveDialog(); }} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    onClick={() => setApproveStep(2)}
                    sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: '#111', '&:hover': { bgcolor: '#333' } }}
                  >
                    Next: Review
                  </Button>
                </DialogActions>
              </>
            )}

            {/* ---- STEP 2: Summary ---- */}
            {approveStep === 2 && (() => {
              const repair = repairCostInput ? Number(repairCostInput) : null;
              const resolution = RESOLUTION_OPTIONS.find((r) => r.value === resolutionType);
              return (
                <>
                  <DialogContent sx={{ pt: 2.5 }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2.5 }}>
                      Review the details below before sending to the customer.
                    </Typography>

                    {/* Product + claim summary */}
                    <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50], mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar variant="rounded" src={selected?.productImageUrl} sx={{ width: 44, height: 44, borderRadius: '8px', bgcolor: theme.palette.custom.neutral[200] }}>
                          <ShoppingBag sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{selected?.productName}</Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selected?.customerName ?? '—'}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Resolution — Only during Quoting phase */}
                    {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                          Resolution
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.custom.status.success.main}50`, bgcolor: theme.palette.custom.status.success.light }}>
                          <AssignmentTurnedIn sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{resolution?.label}</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{resolution?.desc}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Fault Type */}
                    {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                          Fault Assessment
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: 'white' }}>
                          <Info sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                              {FAULT_TYPE_OPTIONS.find(f => f.value === faultType)?.label}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                              {faultType === 'SHOP_FAULT' ? 'Shop covers all costs' : 'Customer responsible for fees'}
                            </Typography>
                          </Box>
                        </Box>

                        {inspectionNote && (
                          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '8px', bgcolor: theme.palette.custom.neutral[50], border: `1px dashed ${theme.palette.custom.border.light}` }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.palette.custom.neutral[400], textTransform: 'uppercase', mb: 0.5 }}>Note</Typography>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], fontStyle: 'italic' }}>"{inspectionNote}"</Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Cost breakdown */}
                    {(selected?.status === 'ITEM_RECEIVED' || selected?.status === 'QUOTED') && (() => {
                      const maxBuyerFee = 30000; // Standard platform rule
                      // Estimate leg1 and leg2 costs
                      const fee1 = selected.customerShippingFeeToShop || 0;
                      const subsidy1 = selected.platformSubsidyToShop || 0;
                      const totalFee1 = fee1 + subsidy1;

                      // Use 0 for shop fault, otherwise use the calculated split
                      const finalCustomerFee1 = faultType === 'SHOP_FAULT' ? 0 : (faultType === 'UNKNOWN' ? fee1 / 2 : fee1);
                      const finalSubsidy1 = faultType === 'SHOP_FAULT' ? totalFee1 : (faultType === 'UNKNOWN' ? totalFee1 - finalCustomerFee1 : subsidy1);

                      return (
                        <Box sx={{ borderRadius: '8px', border: `1px solid ${theme.palette.custom.border.light}`, overflow: 'hidden', mb: 2.5 }}>
                          <Box sx={{ px: 2, py: 1.25, bgcolor: theme.palette.custom.neutral[50], borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptLong sx={{ fontSize: 15, color: theme.palette.custom.neutral[600] }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.custom.neutral[700], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Financial Summary
                            </Typography>
                          </Box>
                          <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Repair Service Fee</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                                {repair?.toLocaleString('vi-VN')} VND
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping Leg 1 (Actual Cost: {totalFee1.toLocaleString()} VND)</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                {finalCustomerFee1.toLocaleString('vi-VN')} VND
                              </Typography>
                            </Box>
                            {finalSubsidy1 > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -1 }}>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.status.success.main, ml: 1 }}>↳ Platform Support / Shop Covered</Typography>
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                                  −{finalSubsidy1.toLocaleString('vi-VN')} VND
                                </Typography>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Shipping Leg 2</Typography>
                              <Typography sx={{ fontSize: 12, italic: true, color: theme.palette.custom.neutral[400] }}>
                                {faultType === 'SHOP_FAULT' ? '0 VND (Shop pays)' : 'Estimated with subsidy'}
                              </Typography>
                            </Box>

                            <Box sx={{ height: 1, bgcolor: theme.palette.custom.border.light, my: 0.5 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>Customer Total Cost</Typography>
                                <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[500] }}>*Final fees determined on GHN shipment creation</Typography>
                              </Box>
                              <Typography sx={{ fontSize: 16, fontWeight: 800, color: theme.palette.custom.status.warning.main }}>
                                {((repair || 0) + finalCustomerFee1).toLocaleString('vi-VN')} VND + (Leg 2 Est.)
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* What happens next */}
                    <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: theme.palette.custom.status.info.light, border: `1px solid ${theme.palette.custom.status.info.main}30`, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Info sx={{ fontSize: 15, color: theme.palette.custom.status.info.main, mt: 0.1, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600], lineHeight: 1.6 }}>
                        After submitting, the customer will be notified to drop off the product at the nearest GHN point. Tracking numbers will be generated automatically for both legs of the shipment.
                      </Typography>
                    </Box>
                  </DialogContent>

                  <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button startIcon={<ArrowBack sx={{ fontSize: 16 }} />} onClick={() => setApproveStep(1)} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                      Back
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="contained"
                      disabled={actioning}
                      onClick={handleApprove}
                      sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: theme.palette.custom.status.success.main, '&:hover': { bgcolor: '#15803d' } }}
                    >
                      {actioning ? <CircularProgress size={18} color="inherit" /> : 'Submit Approval'}
                    </Button>
                  </DialogActions>
                </>
              );
            })()}
          </>
        )}
      </Dialog>

      {/* ==================== REJECT DIALOG ==================== */}
      <Dialog open={rejectOpen} onClose={() => { setRejectOpen(false); setRejectReason(''); }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.palette.custom.status.error.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cancel sx={{ fontSize: 20, color: theme.palette.custom.status.error.main }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 17, fontWeight: 700 }}>Reject Warranty Claim</Typography>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{selected.claimNumber}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 2 }}>
                Please provide a clear reason. The customer will see this message.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                placeholder="e.g. The damage is not covered under warranty as it appears to be caused by physical impact..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => { setRejectOpen(false); setRejectReason(''); }} sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={actioning || !rejectReason.trim()}
                onClick={handleReject}
                sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px' }}
              >
                {actioning ? <CircularProgress size={18} color="inherit" /> : 'Confirm Reject'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ShopWarrantyPage;
