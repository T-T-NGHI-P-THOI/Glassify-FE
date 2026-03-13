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
  Avatar,
  Divider,
  LinearProgress,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  CheckCircle,
  LocalShipping,
  Inventory,
  Warehouse,
  ArrowForward,
  Person,
  CalendarToday,
  MoreHoriz,
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

// Status steps based on transfer flow
const transferSteps = [
  { label: 'Requested', key: 'REQUESTED' },
  { label: 'Approved', key: 'APPROVED' },
  { label: 'Picking', key: 'PICKING' },
  { label: 'In Transit', key: 'IN_TRANSIT' },
  { label: 'Arrived', key: 'ARRIVED' },
  { label: 'Received', key: 'RECEIVED' },
];

type TransferStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'PICKING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'RECEIVED'
  | 'CANCELLED';

interface Branch {
  branchId: number;
  branchName: string;
  type: 'HUB' | 'FEEDER';
  address: string;
  phone: string;
  manager: string;
}

interface TransferItem {
  transferItemId: number;
  productId: number;
  productName: string;
  productImage: string;
  sku: string;
  category: string;
  qtySent: number;
  qtyReceived: number;
  unitPrice: number;
  notes: string | null;
}

interface TransferDetail {
  transferId: number;
  trackingCode: string;
  relatedOrderId: number | null;
  status: TransferStatus;
  sourceBranch: Branch;
  destBranch: Branch;
  createdByStaffId: number;
  createdByStaffName: string;
  approvedByStaffId: number | null;
  approvedByStaffName: string | null;
  createdAt: string;
  approvedAt: string | null;
  shippedAt: string | null;
  arrivedAt: string | null;
  receivedAt: string | null;
  items: TransferItem[];
  totalItems: number;
  receivedItems: number;
  notes: string | null;
}

// Mock data
const mockTransferDetail: TransferDetail = {
  transferId: 1,
  trackingCode: 'TRF-20240619-001',
  relatedOrderId: 1001,
  status: 'IN_TRANSIT',
  sourceBranch: {
    branchId: 1,
    branchName: 'HCM - Quận 1 Hub',
    type: 'HUB',
    address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028-3823-4567',
    manager: 'Nguyễn Văn Minh',
  },
  destBranch: {
    branchId: 3,
    branchName: 'HCM - Thủ Đức',
    type: 'FEEDER',
    address: '789 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '028-3720-1234',
    manager: 'Trần Thị Hoa',
  },
  createdByStaffId: 101,
  createdByStaffName: 'Nguyễn Văn A',
  approvedByStaffId: 102,
  approvedByStaffName: 'Lê Thị B',
  createdAt: '2024-06-19T08:00:00',
  approvedAt: '2024-06-19T08:30:00',
  shippedAt: '2024-06-19T10:00:00',
  arrivedAt: null,
  receivedAt: null,
  items: [
    {
      transferItemId: 1,
      productId: 1,
      productName: 'Kính Rayban Aviator Classic',
      productImage: '/products/rayban-aviator.jpg',
      sku: 'RB-AV-001',
      category: 'Sunglasses',
      qtySent: 5,
      qtyReceived: 0,
      unitPrice: 3500000,
      notes: null,
    },
    {
      transferItemId: 2,
      productId: 2,
      productName: 'Kính Gucci Square Frame',
      productImage: '/products/gucci-square.jpg',
      sku: 'GC-SQ-002',
      category: 'Luxury',
      qtySent: 3,
      qtyReceived: 0,
      unitPrice: 8500000,
      notes: 'Handle with care - Premium items',
    },
    {
      transferItemId: 3,
      productId: 3,
      productName: 'Kính Oakley Sport Pro',
      productImage: '/products/oakley-sport.jpg',
      sku: 'OK-SP-003',
      category: 'Sport',
      qtySent: 10,
      qtyReceived: 0,
      unitPrice: 4200000,
      notes: null,
    },
    {
      transferItemId: 4,
      productId: 4,
      productName: 'Kính Prada Cat Eye',
      productImage: '/products/prada-cat.jpg',
      sku: 'PR-CE-004',
      category: 'Luxury',
      qtySent: 2,
      qtyReceived: 0,
      unitPrice: 9800000,
      notes: 'VIP customer order',
    },
  ],
  totalItems: 20,
  receivedItems: 0,
  notes: 'Chuyển hàng bổ sung cho chi nhánh Thủ Đức theo yêu cầu đơn hàng #1001',
};

const getActiveStep = (status: TransferStatus) => {
  if (status === 'CANCELLED') return -1;
  const stepIndex = transferSteps.findIndex((step) => step.key === status);
  return stepIndex >= 0 ? stepIndex : 0;
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

const InternalTransferDetailPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams();

  // In real app, fetch transfer by id
  const transfer = mockTransferDetail;

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const activeStep = getActiveStep(transfer.status);
  const progress = transfer.totalItems > 0 ? (transfer.receivedItems / transfer.totalItems) * 100 : 0;

  const getStatusColor = (status: TransferStatus) => {
    const { custom } = theme.palette;
    switch (status) {
      case 'RECEIVED':
        return { bg: custom.status.success.light, color: custom.status.success.main };
      case 'ARRIVED':
        return { bg: custom.status.teal.light, color: custom.status.teal.main };
      case 'IN_TRANSIT':
        return { bg: custom.status.info.light, color: custom.status.info.main };
      case 'PICKING':
        return { bg: custom.status.indigo.light, color: custom.status.indigo.main };
      case 'APPROVED':
        return { bg: custom.status.warning.light, color: custom.status.warning.main };
      case 'REQUESTED':
        return { bg: custom.neutral[100], color: custom.neutral[500] };
      case 'CANCELLED':
        return { bg: custom.status.error.light, color: custom.status.error.main };
      default:
        return { bg: custom.neutral[100], color: custom.neutral[500] };
    }
  };

  const getBranchTypeColor = (type: 'HUB' | 'FEEDER') => {
    const { custom } = theme.palette;
    return type === 'HUB'
      ? { bg: custom.status.info.light, color: custom.status.info.main }
      : { bg: custom.status.warning.light, color: custom.status.warning.main };
  };

  const statusStyle = getStatusColor(transfer.status);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Transfer: {transfer.trackingCode}
            </Typography>
            {transfer.relatedOrderId && (
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                Related Order: #{transfer.relatedOrderId}
              </Typography>
            )}
          </Box>
          <Chip
            label={transfer.status.replace('_', ' ')}
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
        {transfer.status !== 'CANCELLED' && (
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
              {transferSteps.map((step, index) => (
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
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        )}

        {/* Branch Information Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 3, mb: 3, alignItems: 'stretch' }}>
          {/* Source Branch */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warehouse sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Source Branch
              </Typography>
              <Chip
                label={transfer.sourceBranch.type}
                size="small"
                sx={{
                  ...getBranchTypeColor(transfer.sourceBranch.type),
                  backgroundColor: getBranchTypeColor(transfer.sourceBranch.type).bg,
                  color: getBranchTypeColor(transfer.sourceBranch.type).color,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 20,
                }}
              />
            </Box>

            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 1 }}>
              {transfer.sourceBranch.branchName}
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                ADDRESS
              </Typography>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                {transfer.sourceBranch.address}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  PHONE
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  {transfer.sourceBranch.phone}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  MANAGER
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  {transfer.sourceBranch.manager}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Arrow */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: theme.palette.custom.status.info.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowForward sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }} />
            </Box>
          </Box>

          {/* Destination Branch */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warehouse sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Destination Branch
              </Typography>
              <Chip
                label={transfer.destBranch.type}
                size="small"
                sx={{
                  ...getBranchTypeColor(transfer.destBranch.type),
                  backgroundColor: getBranchTypeColor(transfer.destBranch.type).bg,
                  color: getBranchTypeColor(transfer.destBranch.type).color,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 20,
                }}
              />
            </Box>

            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 1 }}>
              {transfer.destBranch.branchName}
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                ADDRESS
              </Typography>
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                {transfer.destBranch.address}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  PHONE
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  {transfer.destBranch.phone}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  MANAGER
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  {transfer.destBranch.manager}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Transfer Info & Timeline */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
          {/* Transfer Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Transfer Information
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  CREATED BY
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {transfer.createdByStaffName}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  APPROVED BY
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {transfer.approvedByStaffName || '-'}
                </Typography>
              </Box>
            </Box>

            {transfer.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  NOTES
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], fontStyle: 'italic' }}>
                  {transfer.notes}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Timeline */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarToday sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase' }}>
                Timeline
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Created</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formatDate(transfer.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Approved</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formatDate(transfer.approvedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Shipped</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formatDate(transfer.shippedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Arrived</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formatDate(transfer.arrivedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Received</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: transfer.receivedAt ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[800] }}>
                  {formatDate(transfer.receivedAt)}
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
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Inventory sx={{ fontSize: 20, color: theme.palette.custom.neutral[500] }} />
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                Transfer Items
              </Typography>
              <Chip
                label={`${transfer.items.length} products`}
                size="small"
                sx={{
                  backgroundColor: theme.palette.custom.neutral[100],
                  color: theme.palette.custom.neutral[600],
                  fontWeight: 500,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                Progress: {transfer.receivedItems}/{transfer.totalItems} items received
              </Typography>
              <Box sx={{ width: 120 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.palette.custom.border.light,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: progress === 100 ? theme.palette.custom.status.success.main : theme.palette.custom.status.info.main,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    NO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    PRODUCT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    SKU
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    CATEGORY
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    QTY SENT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    QTY RECEIVED
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    UNIT PRICE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.custom.neutral[500], fontSize: 13 }}>
                    TOTAL VALUE
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {transfer.items.map((item, index) => {
                  const itemProgress = item.qtySent > 0 ? (item.qtyReceived / item.qtySent) * 100 : 0;
                  const totalValue = item.qtySent * item.unitPrice;

                  return (
                    <TableRow key={item.transferItemId} hover>
                      <TableCell sx={{ color: theme.palette.custom.neutral[500] }}>{index + 1}.</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={item.productImage}
                            sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[100] }}
                          >
                            {item.productName[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                              {item.productName}
                            </Typography>
                            {item.notes && (
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.warning.main, fontStyle: 'italic' }}>
                                {item.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600], fontFamily: 'monospace' }}>
                          {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.custom.neutral[100],
                            color: theme.palette.custom.neutral[700],
                            fontWeight: 500,
                            fontSize: 12,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.custom.neutral[800], fontWeight: 500 }}>
                        {item.qtySent}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: itemProgress === 100 ? theme.palette.custom.status.success.main : theme.palette.custom.neutral[800],
                            }}
                          >
                            {item.qtyReceived}
                          </Typography>
                          {itemProgress === 100 && (
                            <CheckCircle sx={{ fontSize: 16, color: theme.palette.custom.status.success.main }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.custom.neutral[800] }}>
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.custom.neutral[800], fontWeight: 600 }}>
                        {formatCurrency(totalValue)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <MoreHoriz sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total Summary */}
          <Box
            sx={{
              p: 2.5,
              borderTop: `1px solid ${theme.palette.custom.border.light}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 4,
              backgroundColor: theme.palette.custom.neutral[50],
            }}
          >
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Total Quantity: <strong>{transfer.totalItems} items</strong>
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800], fontWeight: 600 }}>
              Total Value: {formatCurrency(transfer.items.reduce((sum, item) => sum + item.qtySent * item.unitPrice, 0))}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default InternalTransferDetailPage;
