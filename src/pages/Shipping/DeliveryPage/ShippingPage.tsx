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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LocalShipping,
  FlightTakeoff,
  Inventory,
  PendingActions,
  MoreVert,
  Warning,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/sidebar/Sidebar';
import { useLayout } from '../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

// Interface dựa trên DB schema - bảng shipments
type ShipmentStatus =
  | 'READY_TO_SHIP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

interface Shipment {
  shipmentId: number;
  orderId: number;
  trackingCode: string;
  status: ShipmentStatus;
  deliveryAddress: string;
  codAmount: number;
  shippingFee: number;
  weightGram: number;
  estimatedDeliveryAt: string;
  createdAt: string;
  updatedAt: string;
  carrier: {
    carrierId: number;
    carrierName: string;
    carrierCode: string;
    rating: number;
  };
  customer: {
    customerId: number;
    fullName: string;
    phone: string;
  };
  hasIncident: boolean;
}

// Mock data dựa trên schema
const shipmentsData: Shipment[] = [
  {
    shipmentId: 1,
    orderId: 1001,
    trackingCode: 'GHTK-AJ001JN12',
    status: 'DELIVERED',
    deliveryAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
    codAmount: 500000,
    shippingFee: 25000,
    weightGram: 500,
    estimatedDeliveryAt: '2024-06-20T10:00:00',
    createdAt: '2024-06-19T19:02:00',
    updatedAt: '2024-06-20T09:30:00',
    carrier: { carrierId: 1, carrierName: 'Giao Hàng Tiết Kiệm', carrierCode: 'GHTK', rating: 4.5 },
    customer: { customerId: 101, fullName: 'Nguyễn Văn An', phone: '0901234567' },
    hasIncident: false,
  },
  {
    shipmentId: 2,
    orderId: 1002,
    trackingCode: 'GHN-NJ213KJ09',
    status: 'IN_TRANSIT',
    deliveryAddress: '456 Lê Lợi, Q.3, TP.HCM',
    codAmount: 1200000,
    shippingFee: 30000,
    weightGram: 800,
    estimatedDeliveryAt: '2024-06-21T14:00:00',
    createdAt: '2024-06-19T15:21:00',
    updatedAt: '2024-06-19T18:00:00',
    carrier: { carrierId: 2, carrierName: 'Giao Hàng Nhanh', carrierCode: 'GHN', rating: 4.2 },
    customer: { customerId: 102, fullName: 'Trần Thị Bình', phone: '0912345678' },
    hasIncident: false,
  },
  {
    shipmentId: 3,
    orderId: 1003,
    trackingCode: 'VTP-NR831LM21',
    status: 'DELIVERED',
    deliveryAddress: '789 Trần Hưng Đạo, Q.5, TP.HCM',
    codAmount: 0,
    shippingFee: 20000,
    weightGram: 300,
    estimatedDeliveryAt: '2024-06-19T16:00:00',
    createdAt: '2024-06-19T08:12:00',
    updatedAt: '2024-06-19T15:45:00',
    carrier: { carrierId: 3, carrierName: 'Viettel Post', carrierCode: 'VTP', rating: 4.0 },
    customer: { customerId: 103, fullName: 'Lê Văn Cường', phone: '0923456789' },
    hasIncident: false,
  },
  {
    shipmentId: 4,
    orderId: 1004,
    trackingCode: 'GHTK-PN666CR66',
    status: 'READY_TO_SHIP',
    deliveryAddress: '321 Võ Văn Tần, Q.10, TP.HCM',
    codAmount: 750000,
    shippingFee: 25000,
    weightGram: 450,
    estimatedDeliveryAt: '2024-06-22T10:00:00',
    createdAt: '2024-06-18T23:32:00',
    updatedAt: '2024-06-18T23:32:00',
    carrier: { carrierId: 1, carrierName: 'Giao Hàng Tiết Kiệm', carrierCode: 'GHTK', rating: 4.5 },
    customer: { customerId: 104, fullName: 'Phạm Thị Dung', phone: '0934567890' },
    hasIncident: false,
  },
  {
    shipmentId: 5,
    orderId: 1005,
    trackingCode: 'GHN-PA087BK87',
    status: 'OUT_FOR_DELIVERY',
    deliveryAddress: '654 Cách Mạng Tháng 8, Q.Tân Bình, TP.HCM',
    codAmount: 2500000,
    shippingFee: 35000,
    weightGram: 1200,
    estimatedDeliveryAt: '2024-06-19T18:00:00',
    createdAt: '2024-06-18T19:45:00',
    updatedAt: '2024-06-19T14:00:00',
    carrier: { carrierId: 2, carrierName: 'Giao Hàng Nhanh', carrierCode: 'GHN', rating: 4.2 },
    customer: { customerId: 105, fullName: 'Hoàng Văn Em', phone: '0945678901' },
    hasIncident: false,
  },
  {
    shipmentId: 6,
    orderId: 1006,
    trackingCode: 'GRAB-RF702SD12',
    status: 'DELIVERED',
    deliveryAddress: '987 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
    codAmount: 350000,
    shippingFee: 40000,
    weightGram: 200,
    estimatedDeliveryAt: '2024-06-17T12:00:00',
    createdAt: '2024-06-17T07:01:00',
    updatedAt: '2024-06-17T11:30:00',
    carrier: { carrierId: 4, carrierName: 'Grab Express', carrierCode: 'GRAB', rating: 4.3 },
    customer: { customerId: 106, fullName: 'Ngô Thị Phương', phone: '0956789012' },
    hasIncident: false,
  },
  {
    shipmentId: 7,
    orderId: 1007,
    trackingCode: 'VTP-JK982QI80',
    status: 'PICKED_UP',
    deliveryAddress: '147 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
    codAmount: 1800000,
    shippingFee: 28000,
    weightGram: 650,
    estimatedDeliveryAt: '2024-06-20T16:00:00',
    createdAt: '2024-06-17T03:33:00',
    updatedAt: '2024-06-17T10:00:00',
    carrier: { carrierId: 3, carrierName: 'Viettel Post', carrierCode: 'VTP', rating: 4.0 },
    customer: { customerId: 107, fullName: 'Đặng Văn Giang', phone: '0967890123' },
    hasIncident: false,
  },
  {
    shipmentId: 8,
    orderId: 1008,
    trackingCode: 'GHTK-PB002SS99',
    status: 'FAILED',
    deliveryAddress: '258 Lý Thường Kiệt, Q.10, TP.HCM',
    codAmount: 900000,
    shippingFee: 25000,
    weightGram: 400,
    estimatedDeliveryAt: '2024-06-17T14:00:00',
    createdAt: '2024-06-16T22:44:00',
    updatedAt: '2024-06-17T16:00:00',
    carrier: { carrierId: 1, carrierName: 'Giao Hàng Tiết Kiệm', carrierCode: 'GHTK', rating: 4.5 },
    customer: { customerId: 108, fullName: 'Vũ Thị Hương', phone: '0978901234' },
    hasIncident: true,
  },
  {
    shipmentId: 9,
    orderId: 1009,
    trackingCode: 'GHN-HG762VF69',
    status: 'IN_TRANSIT',
    deliveryAddress: '369 Hai Bà Trưng, Q.1, TP.HCM',
    codAmount: 0,
    shippingFee: 32000,
    weightGram: 550,
    estimatedDeliveryAt: '2024-06-18T10:00:00',
    createdAt: '2024-06-16T19:28:00',
    updatedAt: '2024-06-17T08:00:00',
    carrier: { carrierId: 2, carrierName: 'Giao Hàng Nhanh', carrierCode: 'GHN', rating: 4.2 },
    customer: { customerId: 109, fullName: 'Bùi Văn Khoa', phone: '0989012345' },
    hasIncident: false,
  },
  {
    shipmentId: 10,
    orderId: 1010,
    trackingCode: 'AHAMOVE-GB402RQ44',
    status: 'RETURNED',
    deliveryAddress: '741 Phan Xích Long, Q.Phú Nhuận, TP.HCM',
    codAmount: 1500000,
    shippingFee: 45000,
    weightGram: 900,
    estimatedDeliveryAt: '2024-06-16T16:00:00',
    createdAt: '2024-06-16T12:12:00',
    updatedAt: '2024-06-17T10:00:00',
    carrier: { carrierId: 5, carrierName: 'Ahamove', carrierCode: 'AHAMOVE', rating: 4.1 },
    customer: { customerId: 110, fullName: 'Trịnh Thị Lan', phone: '0990123456' },
    hasIncident: true,
  },
];

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ShippingPage = () => {
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const theme = useTheme();

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: theme.palette.success.light, color: theme.palette.success.main };
      case 'IN_TRANSIT':
      case 'PICKED_UP':
        return { bg: theme.palette.info.light, color: theme.palette.info.main };
      case 'OUT_FOR_DELIVERY':
        return { bg: theme.palette.custom.status.indigo.light, color: theme.palette.custom.status.indigo.main };
      case 'READY_TO_SHIP':
        return { bg: theme.palette.warning.light, color: theme.palette.warning.main };
      case 'FAILED':
        return { bg: theme.palette.error.light, color: theme.palette.error.main };
      case 'RETURNED':
        return { bg: theme.palette.custom.status.rose.light, color: theme.palette.custom.status.rose.main };
      default:
        return { bg: theme.palette.custom.neutral[100], color: theme.palette.text.secondary };
    }
  };

  const handleRowClick = (shipmentId: number) => {
    navigate(PAGE_ENDPOINTS.TRACKING.SHIPMENT_DETAIL.replace(':id', shipmentId.toString()));
  };

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const totalShipments = shipmentsData.length;
  const outForDelivery = shipmentsData.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
  const inTransit = shipmentsData.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'PICKED_UP').length;
  const readyToShip = shipmentsData.filter((s) => s.status === 'READY_TO_SHIP').length;

  const stats = [
    {
      icon: <LocalShipping sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Total Shipments',
      value: totalShipments.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
    {
      icon: <FlightTakeoff sx={{ color: theme.palette.custom.status.purple.main }} />,
      label: 'Out for Delivery',
      value: outForDelivery.toLocaleString(),
      bgColor: theme.palette.custom.status.purple.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.warning.main }} />,
      label: 'In Transit',
      value: inTransit.toLocaleString(),
      bgColor: theme.palette.warning.light,
    },
    {
      icon: <PendingActions sx={{ color: theme.palette.custom.status.pink.main }} />,
      label: 'Ready to Ship',
      value: readyToShip.toLocaleString(),
      bgColor: theme.palette.custom.status.pink.light,
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.DELIVERY} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
            Shipment Management
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
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
                <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.text.primary }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.text.primary }}>
              Shipment List
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.custom.neutral[50] }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        Tracking Code
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        Customer
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        Carrier
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        Delivery Address
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        COD Amount
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                        Est. Delivery
                      </Typography>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.secondary }}>
                      Status
                    </Typography>
                  </TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {shipmentsData.map((row) => {
                  const statusStyle = getStatusColor(row.status);
                  return (
                    <TableRow
                      key={row.shipmentId}
                      hover
                      onClick={() => handleRowClick(row.shipmentId)}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: theme.palette.custom.status.pink.main,
                            }}
                          >
                            {row.trackingCode}
                          </Typography>
                          {row.hasIncident && (
                            <Tooltip title="Có sự cố">
                              <Warning sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography sx={{ fontSize: 14, color: theme.palette.text.primary, fontWeight: 500 }}>
                            {row.customer.fullName}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                            {row.customer.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography sx={{ fontSize: 14, color: theme.palette.text.primary, fontWeight: 500 }}>
                            {row.carrier.carrierCode}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                            ⭐ {row.carrier.rating}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={row.deliveryAddress}>
                          <Typography
                            sx={{
                              fontSize: 14,
                              color: theme.palette.text.primary,
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.deliveryAddress}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 14,
                            color: row.codAmount > 0 ? theme.palette.text.primary : theme.palette.custom.neutral[400],
                            fontWeight: row.codAmount > 0 ? 500 : 400,
                          }}
                        >
                          {row.codAmount > 0 ? formatCurrency(row.codAmount) : 'Đã thanh toán'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                          {formatDate(row.estimatedDeliveryAt)}
                        </Typography>
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
                          <MoreVert sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
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

export default ShippingPage;
