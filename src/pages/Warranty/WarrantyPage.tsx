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
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  VerifiedUser,
  Build,
  Schedule,
  CheckCircle,
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
  Image as ImageIcon,
  AttachMoney,
} from '@mui/icons-material';
import { useState, useRef } from 'react';

// ==================== ENUMS (matching backend) ====================
type WarrantyStatus = 'SUBMITTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
type WarrantyIssueType =
  | 'LENS_SCRATCHED'
  | 'LENS_COATING_PEELING'
  | 'FRAME_BROKEN'
  | 'HINGE_ISSUE'
  | 'NOSE_PAD_REPLACEMENT'
  | 'TEMPLE_ARM_ISSUE'
  | 'COLOR_FADING'
  | 'OTHER';

// ==================== INTERFACES (matching backend models) ====================
interface WarrantyPolicy {
  id: string;
  shopName?: string;
  name: string;
  durationMonths: number;
  coverageDescription: string;
  excludedIssues: string[];
  maxClaims?: number;
  isDefault: boolean;
  isActive: boolean;
}

interface WarrantyClaim {
  id: string;
  claimNumber: string;
  orderItemId: string;
  shopOrderId: string;
  shopId: string;
  shopName: string;
  productName: string;
  productImageUrl?: string;
  issueType: WarrantyIssueType;
  issueDescription: string;
  issueImages: string[];
  resolutionType?: string;
  repairCost?: number;
  customerPays?: number;
  returnTrackingNumber?: string;
  replacementTrackingNumber?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  completedAt?: string;
  status: WarrantyStatus;
  warrantyExpiresAt?: string;
}

// ==================== MOCK DATA ====================
const mockWarrantyPolicies: WarrantyPolicy[] = [
  {
    id: 'wp-001',
    name: 'Standard Warranty',
    durationMonths: 12,
    coverageDescription: 'Covers manufacturing defects including frame breakage, hinge issues, and lens coating defects for 12 months from purchase date.',
    excludedIssues: [
      'Damage caused by accidents, misuse, or negligence',
      'Normal wear and tear (scratches from daily use)',
      'Unauthorized repairs or modifications',
      'Color fading due to prolonged sun/chemical exposure',
      'Lost or stolen products',
      'Products purchased from unauthorized retailers',
    ],
    maxClaims: 3,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'wp-002',
    name: 'Premium Warranty',
    durationMonths: 24,
    coverageDescription: 'Extended 24-month coverage including accidental damage protection, free repairs, and priority service for qualifying products.',
    excludedIssues: [
      'Intentional damage',
      'Lost or stolen products',
      'Products purchased from unauthorized retailers',
    ],
    maxClaims: 5,
    isDefault: false,
    isActive: true,
  },
];

const mockWarrantyClaims: WarrantyClaim[] = [
  {
    id: 'wc-uuid-001',
    claimNumber: 'WC-2024-001',
    orderItemId: 'item-006',
    shopOrderId: 'so-001',
    shopId: 'shop-001',
    shopName: 'Optical Vision Store',
    productName: 'Tom Ford FT0237 Snowdon',
    productImageUrl: 'https://picsum.photos/seed/tomford/80/80',
    issueType: 'LENS_SCRATCHED',
    issueDescription: 'Left lens has a deep scratch affecting visibility. Product was purchased 2 months ago and used with care.',
    issueImages: ['https://picsum.photos/seed/scratch1/200/200', 'https://picsum.photos/seed/scratch2/200/200'],
    status: 'SUBMITTED',
    submittedAt: '2024-01-25T10:00:00Z',
    warrantyExpiresAt: '2026-01-20',
  },
  {
    id: 'wc-uuid-002',
    claimNumber: 'WC-2024-002',
    orderItemId: 'item-004',
    shopOrderId: 'so-002',
    shopId: 'shop-002',
    shopName: 'Lens World',
    productName: 'Gucci GG0061S',
    productImageUrl: 'https://picsum.photos/seed/gucci/80/80',
    issueType: 'FRAME_BROKEN',
    issueDescription: 'Right temple arm broke near the hinge. Normal usage, no impact damage.',
    issueImages: ['https://picsum.photos/seed/broken1/200/200'],
    resolutionType: 'REPAIR',
    repairCost: 350000,
    customerPays: 0,
    returnTrackingNumber: 'GHN-RET-001',
    status: 'APPROVED',
    submittedAt: '2024-01-20T14:30:00Z',
    approvedAt: '2024-01-22T09:00:00Z',
    warrantyExpiresAt: '2026-01-22',
  },
  {
    id: 'wc-uuid-003',
    claimNumber: 'WC-2024-003',
    orderItemId: 'item-011',
    shopOrderId: 'so-003',
    shopId: 'shop-003',
    shopName: 'EyeWear Plus',
    productName: 'Prada PR 17WS',
    productImageUrl: 'https://picsum.photos/seed/prada/80/80',
    issueType: 'NOSE_PAD_REPLACEMENT',
    issueDescription: 'Nose pads have worn out and need replacement. Causing discomfort when wearing.',
    issueImages: ['https://picsum.photos/seed/nosepad1/200/200', 'https://picsum.photos/seed/nosepad2/200/200'],
    resolutionType: 'REPAIR',
    repairCost: 150000,
    customerPays: 50000,
    returnTrackingNumber: 'GHN-RET-002',
    status: 'IN_PROGRESS',
    submittedAt: '2024-01-15T08:00:00Z',
    approvedAt: '2024-01-17T10:00:00Z',
    warrantyExpiresAt: '2026-01-18',
  },
  {
    id: 'wc-uuid-004',
    claimNumber: 'WC-2024-004',
    orderItemId: 'item-003',
    shopOrderId: 'so-004',
    shopId: 'shop-003',
    shopName: 'EyeWear Plus',
    productName: 'Oakley Holbrook OO9102',
    productImageUrl: 'https://picsum.photos/seed/oakley/80/80',
    issueType: 'LENS_COATING_PEELING',
    issueDescription: 'Anti-reflective coating on both lenses is peeling off after 3 months of use.',
    issueImages: ['https://picsum.photos/seed/coating1/200/200'],
    resolutionType: 'REPLACE',
    repairCost: 500000,
    customerPays: 0,
    returnTrackingNumber: 'GHN-RET-003',
    replacementTrackingNumber: 'GHN-REP-003',
    status: 'COMPLETED',
    submittedAt: '2024-01-05T11:00:00Z',
    approvedAt: '2024-01-07T09:00:00Z',
    completedAt: '2024-01-18T16:00:00Z',
    warrantyExpiresAt: '2025-01-24',
  },
  {
    id: 'wc-uuid-005',
    claimNumber: 'WC-2024-005',
    orderItemId: 'item-008',
    shopOrderId: 'so-005',
    shopId: 'shop-004',
    shopName: 'Sun Shades Co.',
    productName: 'Versace VE4361',
    productImageUrl: 'https://picsum.photos/seed/versace/80/80',
    issueType: 'COLOR_FADING',
    issueDescription: 'Frame color is fading unevenly after regular use.',
    issueImages: ['https://picsum.photos/seed/fading1/200/200', 'https://picsum.photos/seed/fading2/200/200', 'https://picsum.photos/seed/fading3/200/200'],
    status: 'REJECTED',
    submittedAt: '2024-01-10T09:30:00Z',
    rejectedAt: '2024-01-12T11:00:00Z',
    rejectionReason: 'Color fading due to prolonged sun exposure is not covered under warranty. Please refer to our warranty policy for details.',
    warrantyExpiresAt: '2024-01-21',
  },
];

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
    title: 'Free Repairs',
    description: 'Repairs for manufacturing defects including frame breakage, hinge issues, and lens coating defects are covered free of charge.',
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  {
    icon: <Schedule sx={{ fontSize: 28 }} />,
    title: '5-7 Business Days',
    description: 'Standard maintenance and repair turnaround time is 5-7 business days from the date we receive your product.',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  {
    icon: <LocalShipping sx={{ fontSize: 28 }} />,
    title: 'Free Shipping',
    description: 'Free two-way shipping for all warranty claims. We will provide a prepaid return label.',
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
const getIssueTypeLabel = (type: WarrantyIssueType) => {
  switch (type) {
    case 'LENS_SCRATCHED': return 'Lens Scratched';
    case 'LENS_COATING_PEELING': return 'Lens Coating Peeling';
    case 'FRAME_BROKEN': return 'Frame Broken';
    case 'HINGE_ISSUE': return 'Hinge Issue';
    case 'NOSE_PAD_REPLACEMENT': return 'Nose Pad Replacement';
    case 'TEMPLE_ARM_ISSUE': return 'Temple Arm Issue';
    case 'COLOR_FADING': return 'Color Fading';
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
const WarrantyPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [claims] = useState<WarrantyClaim[]>(mockWarrantyClaims);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    orderId: '',
    issueType: '' as WarrantyIssueType | '',
    issueDescription: '',
  });

  const getStatusColor = (status: WarrantyStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return { bg: theme.palette.custom.status.warning.light, color: theme.palette.custom.status.warning.main };
      case 'APPROVED':
        return { bg: theme.palette.custom.status.info.light, color: theme.palette.custom.status.info.main };
      case 'IN_PROGRESS':
        return { bg: theme.palette.custom.status.purple.light, color: theme.palette.custom.status.purple.main };
      case 'COMPLETED':
        return { bg: theme.palette.custom.status.success.light, color: theme.palette.custom.status.success.main };
      case 'REJECTED':
        return { bg: theme.palette.custom.status.error.light, color: theme.palette.custom.status.error.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[500] };
    }
  };

  const getStatusLabel = (status: WarrantyStatus) => {
    switch (status) {
      case 'SUBMITTED': return 'Submitted';
      case 'APPROVED': return 'Approved';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VND';
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
    if (activeTab === 1) return claim.status === 'SUBMITTED';
    if (activeTab === 2) return claim.status === 'APPROVED' || claim.status === 'IN_PROGRESS';
    if (activeTab === 3) return claim.status === 'COMPLETED';
    if (activeTab === 4) return claim.status === 'REJECTED';
    return true;
  });

  const submittedCount = claims.filter((c) => c.status === 'SUBMITTED').length;
  const activeCount = claims.filter((c) => c.status === 'APPROVED' || c.status === 'IN_PROGRESS').length;
  const completedCount = claims.filter((c) => c.status === 'COMPLETED').length;
  const rejectedCount = claims.filter((c) => c.status === 'REJECTED').length;

  // Get the default policy for exclusion display
  const defaultPolicy = mockWarrantyPolicies.find((p) => p.isDefault) || mockWarrantyPolicies[0];

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
            onClick={() => setRegisterDialogOpen(true)}
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
              {defaultPolicy.excludedIssues.map((item, index) => (
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
            </Tabs>
          </Box>

          {/* Claim Cards */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredClaims.map((claim) => {
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

                    {/* Repair Cost */}
                    {claim.repairCost !== undefined && (
                      <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                          Repair cost
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                          {formatCurrency(claim.repairCost)}
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: claim.customerPays === 0 ? theme.palette.custom.status.success.main : theme.palette.custom.status.warning.main }}>
                          {claim.customerPays === 0 ? 'Free' : `You pay: ${formatCurrency(claim.customerPays!)}`}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      variant="outlined"
                      endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      onClick={() => {
                        setSelectedClaim(claim);
                        setDetailDialogOpen(true);
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
            {filteredClaims.length === 0 && (
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
        </Paper>
      </Container>

      {/* ==================== CLAIM DETAIL DIALOG ==================== */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedClaim && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    Claim Details
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    {selectedClaim.claimNumber}
                  </Typography>
                </Box>
                <Chip
                  label={getStatusLabel(selectedClaim.status)}
                  sx={{
                    bgcolor: getStatusColor(selectedClaim.status).bg,
                    color: getStatusColor(selectedClaim.status).color,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                />
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              {/* Product Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  variant="rounded"
                  src={selectedClaim.productImageUrl}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: theme.palette.custom.neutral[100],
                    borderRadius: '10px',
                  }}
                >
                  <ShoppingBag sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    {selectedClaim.productName}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                    Shop: {selectedClaim.shopName}
                  </Typography>
                  {selectedClaim.warrantyExpiresAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <VerifiedUser sx={{ fontSize: 14, color: theme.palette.custom.status.success.main }} />
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>
                        Warranty until {formatDate(selectedClaim.warrantyExpiresAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Issue Details */}
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', mb: 1 }}>
                  Issue
                </Typography>
                <Chip
                  label={getIssueTypeLabel(selectedClaim.issueType)}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.custom.neutral[100],
                    color: theme.palette.custom.neutral[700],
                    fontWeight: 600,
                    fontSize: 13,
                    mb: 1,
                  }}
                />
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.6 }}>
                  {selectedClaim.issueDescription}
                </Typography>
              </Box>

              {/* Uploaded Images */}
              {selectedClaim.issueImages.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ImageIcon sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                      Product Images ({selectedClaim.issueImages.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedClaim.issueImages.map((img, index) => (
                      <Box
                        key={index}
                        component="img"
                        src={img}
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: `1px solid ${theme.palette.custom.border.light}`,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          '&:hover': { opacity: 0.8 },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Resolution & Repair Cost */}
              {(selectedClaim.repairCost !== undefined || selectedClaim.resolutionType) && (
                <Box
                  sx={{
                    mb: 2.5,
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: theme.palette.custom.neutral[50],
                    border: `1px solid ${theme.palette.custom.border.light}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <AttachMoney sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                      Resolution & Cost
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {selectedClaim.resolutionType && (
                      <Box>
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Resolution Type</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                          {getResolutionTypeLabel(selectedClaim.resolutionType)}
                        </Typography>
                      </Box>
                    )}
                    {selectedClaim.repairCost !== undefined && (
                      <>
                        <Box>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Total Cost</Typography>
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                            {formatCurrency(selectedClaim.repairCost)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Warranty Covers</Typography>
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.custom.status.success.main }}>
                            {formatCurrency(selectedClaim.repairCost - (selectedClaim.customerPays || 0))}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>You Pay</Typography>
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: selectedClaim.customerPays === 0 ? theme.palette.custom.status.success.main : theme.palette.custom.status.warning.main }}>
                            {selectedClaim.customerPays === 0 ? 'Free' : formatCurrency(selectedClaim.customerPays!)}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              )}

              {/* Tracking Numbers */}
              {(selectedClaim.returnTrackingNumber || selectedClaim.replacementTrackingNumber) && (
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                      Tracking
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {selectedClaim.returnTrackingNumber && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Return Tracking</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.purple.main }}>
                          {selectedClaim.returnTrackingNumber}
                        </Typography>
                      </Box>
                    )}
                    {selectedClaim.replacementTrackingNumber && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Replacement Tracking</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.status.success.main }}>
                          {selectedClaim.replacementTrackingNumber}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Dates */}
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Submitted</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {formatDate(selectedClaim.submittedAt)}
                    </Typography>
                  </Box>
                  {selectedClaim.approvedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Approved</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.status.success.main }}>
                        {formatDate(selectedClaim.approvedAt)}
                      </Typography>
                    </Box>
                  )}
                  {selectedClaim.completedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Completed</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.status.success.main }}>
                        {formatDate(selectedClaim.completedAt)}
                      </Typography>
                    </Box>
                  )}
                  {selectedClaim.rejectedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Rejected</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.status.error.main }}>
                        {formatDate(selectedClaim.rejectedAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Rejection Reason */}
              {selectedClaim.rejectionReason && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: theme.palette.custom.status.error.light,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.palette.custom.status.error.main,
                      mb: 0.5,
                    }}
                  >
                    Rejection Reason
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.6 }}>
                    {selectedClaim.rejectionReason}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
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

      {/* ==================== REGISTER MAINTENANCE DIALOG ==================== */}
      <Dialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: theme.palette.custom.neutral[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Order ID */}
            <TextField
              label="Order ID"
              placeholder="e.g. ORD-2024-001"
              fullWidth
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              InputProps={{
                startAdornment: (
                  <ReceiptLong sx={{ fontSize: 20, color: theme.palette.custom.neutral[400], mr: 1 }} />
                ),
              }}
            />

            {/* Issue Type */}
            <FormControl fullWidth>
              <InputLabel>Issue Type</InputLabel>
              <Select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value as WarrantyIssueType })}
                label="Issue Type"
              >
                <MenuItem value="LENS_SCRATCHED">Lens Scratched</MenuItem>
                <MenuItem value="LENS_COATING_PEELING">Lens Coating Peeling</MenuItem>
                <MenuItem value="FRAME_BROKEN">Frame Broken</MenuItem>
                <MenuItem value="HINGE_ISSUE">Hinge Issue</MenuItem>
                <MenuItem value="NOSE_PAD_REPLACEMENT">Nose Pad Replacement</MenuItem>
                <MenuItem value="TEMPLE_ARM_ISSUE">Temple Arm Issue</MenuItem>
                <MenuItem value="COLOR_FADING">Color Fading</MenuItem>
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
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
            />

            {/* Image Upload */}
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
                Upload Images
              </Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 1.5 }}>
                Please upload clear photos of the damaged/defective area
              </Typography>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {uploadedImages.map((img, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={img.preview}
                      sx={{
                        width: 88,
                        height: 88,
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: `1px solid ${theme.palette.custom.border.light}`,
                      }}
                    />
                    <Box
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: theme.palette.custom.status.error.main,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#b91c1c' },
                      }}
                    >
                      <Close sx={{ fontSize: 14 }} />
                    </Box>
                  </Box>
                ))}

                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: '8px',
                    border: `2px dashed ${theme.palette.custom.border.main}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: theme.palette.custom.neutral[50],
                    },
                  }}
                >
                  <CloudUpload sx={{ fontSize: 22, color: theme.palette.custom.neutral[400], mb: 0.25 }} />
                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                    Add Photo
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Info Note */}
            <Box
              sx={{
                p: 2,
                borderRadius: '10px',
                bgcolor: theme.palette.custom.neutral[50],
                border: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Info sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[600] }}>
                  What happens next?
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], lineHeight: 1.6 }}>
                After submitting, our team will review your request within 1-2 business days. You'll receive an email notification with the result and further instructions.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setRegisterDialogOpen(false)}
            sx={{ textTransform: 'none', color: theme.palette.custom.neutral[600] }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!formData.orderId || !formData.issueType || !formData.issueDescription || uploadedImages.length === 0}
            onClick={() => {
              // TODO: Call API to submit warranty claim
              setRegisterDialogOpen(false);
              setFormData({ orderId: '', issueType: '', issueDescription: '' });
              uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
              setUploadedImages([]);
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#111',
              '&:hover': { bgcolor: '#333' },
            }}
          >
            Submit Claim
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyPage;
