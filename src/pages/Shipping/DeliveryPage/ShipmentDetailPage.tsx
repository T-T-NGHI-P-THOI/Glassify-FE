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
} from '@mui/material';
import { styled, useTheme, type Theme } from '@mui/material/styles';
import {
  ArrowBack,
  MoreHoriz,
  ExpandMore,
  Warning,
  CheckCircle,
  LocalShipping,
  Inventory,
  Home,
  ReportProblem,
  Phone,
  Language,
  Star,
  StarBorder,
  StarHalf,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../../components/sidebar/Sidebar';
import { useLayout } from '../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

// Custom Step Connector
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

// Status steps based on shipment flow
const shipmentSteps = [
  { label: 'Ready to Ship', key: 'READY_TO_SHIP' },
  { label: 'Picked Up', key: 'PICKED_UP' },
  { label: 'In Transit', key: 'IN_TRANSIT' },
  { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', key: 'DELIVERED' },
];

type ShipmentStatus =
  | 'READY_TO_SHIP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

type IncidentType = 'DAMAGED' | 'LOST' | 'DELAYED' | 'WRONG_ITEM';
type ResolutionStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';

interface ShipmentIncident {
  incidentId: number;
  incidentType: IncidentType;
  description: string;
  evidenceImageUrl: string | null;
  resolutionStatus: ResolutionStatus;
  compensationAmount: number;
  reportedAt: string;
  resolvedAt: string | null;
}

interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  weight: number;
  isFragile: boolean;
}

interface ShipmentDetail {
  shipmentId: number;
  orderId: number;
  trackingCode: string;
  status: ShipmentStatus;
  deliveryAddress: string;
  pickupAddress: string;
  codAmount: number;
  shippingFee: number;
  weightGram: number;
  estimatedDeliveryAt: string;
  createdAt: string;
  updatedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  carrier: {
    carrierId: number;
    carrierName: string;
    carrierCode: string;
    rating: number;
    contactHotline: string;
    logoUrl: string;
    website: string;
    serviceType: 'EXPRESS' | 'STANDARD' | 'ECONOMY';
    averageDeliveryDays: number;
    trackingUrl: string;
  };
  customer: {
    customerId: number;
    fullName: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
  incidents: ShipmentIncident[];
  hasInsurance: boolean;
  estimatedDays: number;
}

// Mock data for shipment detail
const mockShipmentDetail: ShipmentDetail = {
  shipmentId: 1,
  orderId: 21312,
  trackingCode: 'GHTK-AJ001JN12',
  status: 'IN_TRANSIT',
  deliveryAddress: 'Jl. jalan ke tanah abang No. 20, Jakarta Pusat, Jakarta',
  pickupAddress: 'Jl. Magelang No. 20, Tridadi, Sleman, Yogyakarta',
  codAmount: 500000,
  shippingFee: 25000,
  weightGram: 2050,
  estimatedDeliveryAt: '2024-06-25T10:00:00',
  createdAt: '2024-06-17T14:40:15',
  updatedAt: '2024-06-18T10:00:00',
  pickedUpAt: '2024-06-17T16:00:00',
  deliveredAt: null,
  carrier: {
    carrierId: 1,
    carrierName: 'Giao Hàng Tiết Kiệm',
    carrierCode: 'GHTK',
    rating: 4.5,
    contactHotline: '1900-636-688',
    logoUrl: '/carriers/ghtk-logo.png',
    website: 'https://giaohangtietkiem.vn',
    serviceType: 'STANDARD',
    averageDeliveryDays: 3,
    trackingUrl: 'https://giaohangtietkiem.vn/tracking',
  },
  customer: {
    customerId: 101,
    fullName: 'Darrell Steward',
    phone: '+62 894 9696 9000',
    email: 'darellsteward@yahoo.co.id',
  },
  items: [
    {
      productId: 1,
      productName: 'Handphone',
      productImage: '/products/iphone.jpg',
      category: 'Electronic',
      quantity: 1,
      weight: 450,
      isFragile: true,
    },
    {
      productId: 2,
      productName: 'Camera',
      productImage: '/products/camera.jpg',
      category: 'Electronic',
      quantity: 1,
      weight: 700,
      isFragile: true,
    },
    {
      productId: 3,
      productName: 'Lensa',
      productImage: '/products/lens.jpg',
      category: 'Electronic',
      quantity: 2,
      weight: 900,
      isFragile: true,
    },
  ],
  incidents: [
    {
      incidentId: 1,
      incidentType: 'DELAYED',
      description: 'Shipment delayed due to weather conditions in transit area.',
      evidenceImageUrl: null,
      resolutionStatus: 'INVESTIGATING',
      compensationAmount: 0,
      reportedAt: '2024-06-19T10:00:00',
      resolvedAt: null,
    },
  ],
  hasInsurance: true,
  estimatedDays: 7,
};

const getStatusColor = (status: ShipmentStatus, theme: Theme) => {
  const { custom } = theme.palette;
  switch (status) {
    case 'DELIVERED':
      return { bg: custom.status.success.light, color: custom.status.success.main };
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return { bg: custom.status.info.light, color: custom.status.info.main };
    case 'OUT_FOR_DELIVERY':
      return { bg: custom.status.warning.light, color: custom.status.warning.main };
    case 'READY_TO_SHIP':
      return { bg: custom.neutral[100], color: custom.neutral[500] };
    case 'FAILED':
      return { bg: custom.status.error.light, color: custom.status.error.main };
    case 'RETURNED':
      return { bg: custom.status.rose.light, color: custom.status.rose.main };
    default:
      return { bg: custom.neutral[100], color: custom.neutral[500] };
  }
};

const getStatusLabel = (status: ShipmentStatus) => {
  switch (status) {
    case 'READY_TO_SHIP':
      return 'Ready to Ship';
    case 'PICKED_UP':
      return 'Picked Up';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'DELIVERED':
      return 'Delivered';
    case 'FAILED':
      return 'Failed';
    case 'RETURNED':
      return 'Returned';
    default:
      return status;
  }
};

const getIncidentTypeLabel = (type: IncidentType) => {
  switch (type) {
    case 'DAMAGED':
      return 'Damaged';
    case 'LOST':
      return 'Lost';
    case 'DELAYED':
      return 'Delayed';
    case 'WRONG_ITEM':
      return 'Wrong Item';
    default:
      return type;
  }
};

const getIncidentStatusColor = (status: ResolutionStatus, theme: Theme) => {
  const { custom } = theme.palette;
  switch (status) {
    case 'REPORTED':
      return { bg: custom.status.warning.light, color: custom.status.warning.main };
    case 'INVESTIGATING':
      return { bg: custom.status.info.light, color: custom.status.info.main };
    case 'RESOLVED':
      return { bg: custom.status.success.light, color: custom.status.success.main };
    case 'REJECTED':
      return { bg: custom.status.error.light, color: custom.status.error.main };
    default:
      return { bg: custom.neutral[100], color: custom.neutral[500] };
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getActiveStep = (status: ShipmentStatus) => {
  const stepIndex = shipmentSteps.findIndex((step) => step.key === status);
  return stepIndex >= 0 ? stepIndex : 0;
};

const getServiceTypeLabel = (type: 'EXPRESS' | 'STANDARD' | 'ECONOMY') => {
  switch (type) {
    case 'EXPRESS':
      return 'Express';
    case 'STANDARD':
      return 'Standard';
    case 'ECONOMY':
      return 'Economy';
    default:
      return type;
  }
};

const RatingStars = ({ rating, theme }: { rating: number; theme: Theme }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <StarHalf key={i} sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
      );
    } else {
      stars.push(
        <StarBorder key={i} sx={{ fontSize: 16, color: theme.palette.custom.neutral[300] }} />
      );
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {stars}
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[600], ml: 0.5 }}>
        ({rating})
      </Typography>
    </Box>
  );
};

const ShipmentDetailPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();

  // In real app, fetch shipment by id
  const shipment = mockShipmentDetail;

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const statusStyle = getStatusColor(shipment.status, theme);
  const activeStep = getActiveStep(shipment.status);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.DELIVERY} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.DELIVERY)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Order ID: #{shipment.orderId}BA
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(shipment.status)}
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
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Stepper
            activeStep={activeStep}
            connector={<CustomConnector />}
            alternativeLabel
          >
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
                          index <= activeStep ? theme.palette.custom.status.success.main : theme.palette.custom.border.light,
                        color: index <= activeStep ? theme.palette.primary.contrastText : theme.palette.custom.neutral[400],
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
                      color: index <= activeStep ? theme.palette.custom.neutral[800] : theme.palette.custom.neutral[400],
                    }}
                  >
                    {step.label}
                  </Typography>
                  {index === 0 && shipment.createdAt && (
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                      {formatDate(shipment.createdAt)}
                    </Typography>
                  )}
                  {index === 1 && shipment.pickedUpAt && (
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                      {formatDate(shipment.pickedUpAt)}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Information Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 3 }}>
          {/* Order Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Inventory sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Order Information
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                PICK UP DATE
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formatDate(shipment.createdAt)}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                DROP OFF ESTIMATION
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shipment.estimatedDays} days
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                INSURANCE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {shipment.hasInsurance ? 'FRAGILE INSURANCE' : 'NO INSURANCE'}
                </Typography>
                {shipment.hasInsurance && (
                  <CheckCircle sx={{ fontSize: 16, color: theme.palette.custom.status.success.main }} />
                )}
              </Box>
            </Box>
          </Paper>

          {/* Location */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalShipping sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Location
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                PICK UP LOCATION
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shipment.pickupAddress}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                DROP OFF LOCATION
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shipment.deliveryAddress}
              </Typography>
            </Box>
          </Paper>

          {/* Customer Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Home sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Customer Information
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                FULL NAME
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shipment.customer.fullName}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                EMAIL
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shipment.customer.email}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                PHONE NUMBER
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shipment.customer.phone}
              </Typography>
            </Box>
          </Paper>

          {/* Carrier Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalShipping sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Carrier Information
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                variant="rounded"
                src={shipment.carrier.logoUrl}
                sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[100] }}
              >
                {shipment.carrier.carrierCode}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  {shipment.carrier.carrierName}
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                  Code: {shipment.carrier.carrierCode}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                RATING
              </Typography>
              <RatingStars rating={shipment.carrier.rating} theme={theme} />
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                SERVICE TYPE
              </Typography>
              <Chip
                label={getServiceTypeLabel(shipment.carrier.serviceType)}
                size="small"
                sx={{
                  backgroundColor:
                    shipment.carrier.serviceType === 'EXPRESS'
                      ? theme.palette.custom.status.error.light
                      : shipment.carrier.serviceType === 'STANDARD'
                      ? theme.palette.custom.status.info.light
                      : theme.palette.custom.status.success.light,
                  color:
                    shipment.carrier.serviceType === 'EXPRESS'
                      ? theme.palette.custom.status.error.main
                      : shipment.carrier.serviceType === 'STANDARD'
                      ? theme.palette.custom.status.info.main
                      : theme.palette.custom.status.success.main,
                  fontWeight: 500,
                  fontSize: 12,
                }}
              />
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                HOTLINE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.status.info.main }}>
                  {shipment.carrier.contactHotline}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                WEBSITE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Language sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }} />
                <Typography
                  component="a"
                  href={shipment.carrier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: theme.palette.custom.status.info.main,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {shipment.carrier.website.replace('https://', '')}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Item List */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
            mb: 3,
          }}
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
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    NO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    ITEM NAME
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    CATEGORY
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    FRAGILE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    QUANTITY
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    WEIGHT
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {shipment.items.map((item, index) => (
                  <TableRow key={item.productId} hover>
                    <TableCell sx={{ color: theme.palette.custom.neutral[500] }}>{index + 1}.</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          variant="rounded"
                          src={item.productImage}
                          sx={{ width: 40, height: 40, bgcolor: theme.palette.custom.neutral[100] }}
                        >
                          {item.productName[0]}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                            {item.productName}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                            {item.category}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.neutral[800] }}>{item.category}</TableCell>
                    <TableCell>
                      {item.isFragile ? (
                        <Chip
                          label="Yes"
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.custom.status.warning.light,
                            color: theme.palette.custom.status.warning.main,
                            fontWeight: 500,
                            fontSize: 12,
                          }}
                        />
                      ) : (
                        <Typography sx={{ color: theme.palette.custom.neutral[500] }}>No</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.neutral[800], textAlign: 'center' }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.custom.neutral[800] }}>{item.weight} g</TableCell>
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

          {/* Total Weight */}
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
              Total Weight: <strong>{shipment.weightGram} g</strong>
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Shipping Fee: <strong>{formatCurrency(shipment.shippingFee)}</strong>
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              COD Amount: <strong>{shipment.codAmount > 0 ? formatCurrency(shipment.codAmount) : 'Paid'}</strong>
            </Typography>
          </Box>
        </Paper>

        {/* Shipment Incidents */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Accordion defaultExpanded={shipment.incidents.length > 0}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ReportProblem sx={{ color: shipment.incidents.length > 0 ? theme.palette.custom.status.warning.main : theme.palette.custom.neutral[500] }} />
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Shipment Incidents
                </Typography>
                {shipment.incidents.length > 0 && (
                  <Chip
                    label={shipment.incidents.length}
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.custom.status.error.light,
                      color: theme.palette.custom.status.error.main,
                      fontWeight: 600,
                      fontSize: 12,
                      minWidth: 24,
                      height: 24,
                    }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {shipment.incidents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: theme.palette.custom.status.success.main, mb: 2 }} />
                  <Typography sx={{ color: theme.palette.custom.neutral[500] }}>
                    No incidents reported for this shipment
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                          INCIDENT ID
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                          TYPE
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                          DESCRIPTION
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                          REPORTED AT
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                          STATUS
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                          COMPENSATION
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shipment.incidents.map((incident) => {
                        const incidentStatusStyle = getIncidentStatusColor(incident.resolutionStatus, theme);
                        return (
                          <TableRow key={incident.incidentId} hover>
                            <TableCell>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.pink.main }}>
                                #INC-{incident.incidentId.toString().padStart(4, '0')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={<Warning sx={{ fontSize: 14 }} />}
                                label={getIncidentTypeLabel(incident.incidentType)}
                                size="small"
                                sx={{
                                  backgroundColor: theme.palette.custom.status.warning.light,
                                  color: theme.palette.custom.status.warning.main,
                                  fontWeight: 500,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 300 }}>
                              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800] }}>
                                {incident.description}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.custom.neutral[500] }}>
                              {formatDate(incident.reportedAt)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={incident.resolutionStatus}
                                size="small"
                                sx={{
                                  backgroundColor: incidentStatusStyle.bg,
                                  color: incidentStatusStyle.color,
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: incident.compensationAmount > 0 ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[500],
                                }}
                              >
                                {incident.compensationAmount > 0
                                  ? formatCurrency(incident.compensationAmount)
                                  : 'Pending'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Box>
  );
};

export default ShipmentDetailPage;