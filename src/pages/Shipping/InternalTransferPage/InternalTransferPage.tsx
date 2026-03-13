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
  IconButton,
  TableSortLabel,
  Checkbox,
  Tooltip,
  Avatar,
  AvatarGroup,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  SwapHoriz,
  LocalShipping,
  Inventory,
  CheckCircle,
  MoreVert,
  ArrowForward,
  Warehouse,
  Schedule,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/sidebar/Sidebar';
import { useLayout } from '../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

// Interface dựa trên DB schema - bảng internal_transfers
type TransferStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'PICKING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'RECEIVED'
  | 'CANCELLED';

// Interface cho branch (từ bảng branches)
interface Branch {
  branchId: number;
  branchName: string;
  type: 'HUB' | 'FEEDER';
  address: string;
}

// Interface cho transfer item (từ bảng transfer_items)
interface TransferItem {
  transferItemId: number;
  productId: number;
  productName: string;
  qtySent: number;
  qtyReceived: number;
}

// Interface cho internal transfer
interface InternalTransfer {
  transferId: number;
  relatedOrderId: number | null;
  sourceBranch: Branch;
  destBranch: Branch;
  status: TransferStatus;
  trackingCode: string;
  createdByStaffId: number;
  createdByStaffName: string;
  createdAt: string;
  shippedAt: string | null;
  receivedAt: string | null;
  items: TransferItem[];
  // Computed
  totalItems: number;
  receivedItems: number;
}

// Mock data cho branches
const branches: Branch[] = [
  { branchId: 1, branchName: 'HCM - Quận 1 Hub', type: 'HUB', address: '123 Nguyễn Huệ, Q.1' },
  { branchId: 2, branchName: 'HCM - Quận 7 Hub', type: 'HUB', address: '456 Nguyễn Văn Linh, Q.7' },
  { branchId: 3, branchName: 'HCM - Thủ Đức', type: 'FEEDER', address: '789 Võ Văn Ngân, Thủ Đức' },
  { branchId: 4, branchName: 'HCM - Bình Thạnh', type: 'FEEDER', address: '321 Điện Biên Phủ, Bình Thạnh' },
  { branchId: 5, branchName: 'HCM - Tân Bình', type: 'FEEDER', address: '654 Cộng Hòa, Tân Bình' },
];

// Mock data cho internal transfers
const transfersData: InternalTransfer[] = [
  {
    transferId: 1,
    relatedOrderId: 1001,
    sourceBranch: branches[0],
    destBranch: branches[2],
    status: 'RECEIVED',
    trackingCode: 'TRF-20240619-001',
    createdByStaffId: 101,
    createdByStaffName: 'Nguyễn Văn A',
    createdAt: '2024-06-19T08:00:00',
    shippedAt: '2024-06-19T10:00:00',
    receivedAt: '2024-06-19T14:30:00',
    items: [
      { transferItemId: 1, productId: 1, productName: 'Kính Rayban Aviator', qtySent: 5, qtyReceived: 5 },
      { transferItemId: 2, productId: 2, productName: 'Kính Gucci Square', qtySent: 3, qtyReceived: 3 },
    ],
    totalItems: 8,
    receivedItems: 8,
  },
  {
    transferId: 2,
    relatedOrderId: 1002,
    sourceBranch: branches[1],
    destBranch: branches[3],
    status: 'IN_TRANSIT',
    trackingCode: 'TRF-20240619-002',
    createdByStaffId: 102,
    createdByStaffName: 'Trần Thị B',
    createdAt: '2024-06-19T09:30:00',
    shippedAt: '2024-06-19T11:00:00',
    receivedAt: null,
    items: [
      { transferItemId: 3, productId: 3, productName: 'Kính Oakley Sport', qtySent: 10, qtyReceived: 0 },
    ],
    totalItems: 10,
    receivedItems: 0,
  },
  {
    transferId: 3,
    relatedOrderId: null,
    sourceBranch: branches[0],
    destBranch: branches[4],
    status: 'PICKING',
    trackingCode: 'TRF-20240619-003',
    createdByStaffId: 103,
    createdByStaffName: 'Lê Văn C',
    createdAt: '2024-06-19T10:00:00',
    shippedAt: null,
    receivedAt: null,
    items: [
      { transferItemId: 4, productId: 4, productName: 'Kính Prada Cat Eye', qtySent: 2, qtyReceived: 0 },
      { transferItemId: 5, productId: 5, productName: 'Kính Dior Round', qtySent: 4, qtyReceived: 0 },
      { transferItemId: 6, productId: 6, productName: 'Kính Versace Bold', qtySent: 3, qtyReceived: 0 },
    ],
    totalItems: 9,
    receivedItems: 0,
  },
  {
    transferId: 4,
    relatedOrderId: 1005,
    sourceBranch: branches[2],
    destBranch: branches[0],
    status: 'APPROVED',
    trackingCode: 'TRF-20240619-004',
    createdByStaffId: 104,
    createdByStaffName: 'Phạm Thị D',
    createdAt: '2024-06-19T11:00:00',
    shippedAt: null,
    receivedAt: null,
    items: [
      { transferItemId: 7, productId: 7, productName: 'Kính Tom Ford Classic', qtySent: 6, qtyReceived: 0 },
    ],
    totalItems: 6,
    receivedItems: 0,
  },
  {
    transferId: 5,
    relatedOrderId: 1008,
    sourceBranch: branches[3],
    destBranch: branches[1],
    status: 'ARRIVED',
    trackingCode: 'TRF-20240618-001',
    createdByStaffId: 105,
    createdByStaffName: 'Hoàng Văn E',
    createdAt: '2024-06-18T14:00:00',
    shippedAt: '2024-06-18T16:00:00',
    receivedAt: null,
    items: [
      { transferItemId: 8, productId: 8, productName: 'Kính Burberry Check', qtySent: 4, qtyReceived: 0 },
      { transferItemId: 9, productId: 9, productName: 'Kính Chanel Pearl', qtySent: 2, qtyReceived: 0 },
    ],
    totalItems: 6,
    receivedItems: 0,
  },
  {
    transferId: 6,
    relatedOrderId: null,
    sourceBranch: branches[4],
    destBranch: branches[2],
    status: 'REQUESTED',
    trackingCode: 'TRF-20240619-005',
    createdByStaffId: 106,
    createdByStaffName: 'Ngô Thị F',
    createdAt: '2024-06-19T13:00:00',
    shippedAt: null,
    receivedAt: null,
    items: [
      { transferItemId: 10, productId: 10, productName: 'Kính Fendi Logo', qtySent: 8, qtyReceived: 0 },
    ],
    totalItems: 8,
    receivedItems: 0,
  },
  {
    transferId: 7,
    relatedOrderId: 1010,
    sourceBranch: branches[0],
    destBranch: branches[3],
    status: 'CANCELLED',
    trackingCode: 'TRF-20240617-001',
    createdByStaffId: 107,
    createdByStaffName: 'Đặng Văn G',
    createdAt: '2024-06-17T09:00:00',
    shippedAt: null,
    receivedAt: null,
    items: [
      { transferItemId: 11, productId: 11, productName: 'Kính Cartier Gold', qtySent: 1, qtyReceived: 0 },
    ],
    totalItems: 1,
    receivedItems: 0,
  },
  {
    transferId: 8,
    relatedOrderId: 1012,
    sourceBranch: branches[1],
    destBranch: branches[4],
    status: 'IN_TRANSIT',
    trackingCode: 'TRF-20240619-006',
    createdByStaffId: 108,
    createdByStaffName: 'Vũ Thị H',
    createdAt: '2024-06-19T07:00:00',
    shippedAt: '2024-06-19T09:00:00',
    receivedAt: null,
    items: [
      { transferItemId: 12, productId: 12, productName: 'Kính Saint Laurent', qtySent: 3, qtyReceived: 0 },
      { transferItemId: 13, productId: 13, productName: 'Kính Balenciaga Bold', qtySent: 5, qtyReceived: 0 },
    ],
    totalItems: 8,
    receivedItems: 0,
  },
];

const getStatusLabel = (status: TransferStatus) => {
  switch (status) {
    case 'REQUESTED':
      return 'Requested';
    case 'APPROVED':
      return 'Approved';
    case 'PICKING':
      return 'Picking';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'ARRIVED':
      return 'Arrived';
    case 'RECEIVED':
      return 'Received';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InternalTransferPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setShowNavbar, setShowFooter } = useLayout();

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  // Tính toán stats từ data
  const totalTransfers = transfersData.length;
  const inTransitCount = transfersData.filter(
    (t) => t.status === 'IN_TRANSIT'
  ).length;
  const pendingCount = transfersData.filter(
    (t) => t.status === 'REQUESTED' || t.status === 'APPROVED' || t.status === 'PICKING'
  ).length;
  const completedCount = transfersData.filter(
    (t) => t.status === 'RECEIVED'
  ).length;

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

  const handleRowClick = (transferId: number) => {
    navigate(PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER_DETAIL.replace(':id', transferId.toString()));
  };

  const stats = [
    {
      icon: <SwapHoriz sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Transfers',
      value: totalTransfers.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <LocalShipping sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'In Transit',
      value: inTransitCount.toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <Schedule sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Pending',
      value: pendingCount.toLocaleString(),
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <CheckCircle sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Completed',
      value: completedCount.toLocaleString(),
      bgColor: theme.palette.custom.status.success.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.INTERNAL_TRANSFER} />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800], mb: 1 }}
          >
            Internal Transfers
          </Typography>
          <Typography sx={{ color: theme.palette.custom.neutral[500], fontSize: 14 }}>
            Quản lý điều chuyển hàng hóa giữa các chi nhánh
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography
                  sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}
                >
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Transfer List */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800] }}
            >
              Transfer List
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                      >
                        Transfer Code
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                      >
                        Route
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                      >
                        Items
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                      >
                        Related Order
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                      >
                        Created By
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography
                        sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                      >
                        Timeline
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[500] }}
                    >
                      Status
                    </Typography>
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {transfersData.map((row) => {
                  const statusStyle = getStatusColor(row.status);
                  const sourceTypeStyle = getBranchTypeColor(row.sourceBranch.type);
                  const destTypeStyle = getBranchTypeColor(row.destBranch.type);
                  const progress = row.totalItems > 0
                    ? (row.receivedItems / row.totalItems) * 100
                    : 0;

                  return (
                    <TableRow
                      key={row.transferId}
                      hover
                      onClick={() => handleRowClick(row.transferId)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.custom.neutral[50],
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: theme.palette.custom.status.pink.main,
                          }}
                        >
                          {row.trackingCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* Source Branch */}
                          <Tooltip title={row.sourceBranch.address}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Warehouse sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                  {row.sourceBranch.branchName}
                                </Typography>
                                <Chip
                                  label={row.sourceBranch.type}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    backgroundColor: sourceTypeStyle.bg,
                                    color: sourceTypeStyle.color,
                                  }}
                                />
                              </Box>
                            </Box>
                          </Tooltip>

                          <ArrowForward sx={{ fontSize: 16, color: theme.palette.custom.neutral[400], mx: 1 }} />

                          {/* Dest Branch */}
                          <Tooltip title={row.destBranch.address}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Warehouse sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                  {row.destBranch.branchName}
                                </Typography>
                                <Chip
                                  label={row.destBranch.type}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    backgroundColor: destTypeStyle.bg,
                                    color: destTypeStyle.color,
                                  }}
                                />
                              </Box>
                            </Box>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Inventory sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                              {row.receivedItems}/{row.totalItems} items
                            </Typography>
                          </Box>
                          {row.status !== 'CANCELLED' && row.status !== 'REQUESTED' && (
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: theme.palette.custom.border.light,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: progress === 100 ? theme.palette.custom.status.success.main : theme.palette.custom.status.info.main,
                                },
                              }}
                            />
                          )}
                          <Tooltip title={row.items.map(i => `${i.productName} (${i.qtySent})`).join(', ')}>
                            <AvatarGroup max={3} sx={{ mt: 0.5, justifyContent: 'flex-start' }}>
                              {row.items.map((item) => (
                                <Avatar
                                  key={item.transferItemId}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    fontSize: 10,
                                    bgcolor: theme.palette.custom.border.light,
                                    color: theme.palette.custom.neutral[700],
                                  }}
                                >
                                  {item.qtySent}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {row.relatedOrderId ? (
                          <Chip
                            label={`#${row.relatedOrderId}`}
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.custom.neutral[100],
                              color: theme.palette.custom.neutral[700],
                              fontWeight: 500,
                            }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                            Stock transfer
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[800], fontWeight: 500 }}>
                          {row.createdByStaffName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ fontSize: 12 }}>
                          <Box sx={{ display: 'flex', gap: 1, color: theme.palette.custom.neutral[500] }}>
                            <Typography sx={{ fontSize: 12, minWidth: 60 }}>Created:</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[800] }}>
                              {formatDate(row.createdAt)}
                            </Typography>
                          </Box>
                          {row.shippedAt && (
                            <Box sx={{ display: 'flex', gap: 1, color: theme.palette.custom.neutral[500] }}>
                              <Typography sx={{ fontSize: 12, minWidth: 60 }}>Shipped:</Typography>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[800] }}>
                                {formatDate(row.shippedAt)}
                              </Typography>
                            </Box>
                          )}
                          {row.receivedAt && (
                            <Box sx={{ display: 'flex', gap: 1, color: theme.palette.custom.neutral[500] }}>
                              <Typography sx={{ fontSize: 12, minWidth: 60 }}>Received:</Typography>
                              <Typography sx={{ fontSize: 12, color: theme.palette.custom.status.success.main }}>
                                {formatDate(row.receivedAt)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(row.status)}
                          size="small"
                          sx={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 600,
                            fontSize: 12,
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          <MoreVert sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default InternalTransferPage;
