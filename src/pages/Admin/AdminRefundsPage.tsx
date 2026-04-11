import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Visibility } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { adminApi, type AdminRefundResponse } from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';
import { SHOP_APPEAL_STATUS_LABELS, ShopAppealStatus } from '@/models/Refund';

const REFUND_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURN_SHIPPING: 'Return Shipping',
  ITEM_RECEIVED: 'Item Received',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'RETURN_SHIPPING', label: 'Return Shipping' },
  { value: 'ITEM_RECEIVED', label: 'Item Received' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const RETURN_TYPE_LABEL: Record<string, string> = {
  REFUND: 'Refund',
  EXCHANGE: 'Exchange',
};

const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'REQUESTED': return 'warning';
    case 'APPROVED': case 'RETURN_SHIPPING': case 'ITEM_RECEIVED': return 'info';
    case 'COMPLETED': return 'success';
    case 'REJECTED': case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const AdminRefundsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [refunds, setRefunds] = useState<AdminRefundResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const fetchRefunds = async (status: string, pageNum: number) => {
    try {
      setLoading(true);
      const res = await adminApi.getRefunds(status || undefined, pageNum, pageSize);
      if (res.data) {
        setRefunds(res.data.content);
        setTotalElements(res.data.totalElements);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(statusFilter, page);
  }, [statusFilter, page]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.REFUNDS} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Refund Management
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Monitor and manage all customer refund and return requests.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[600] }}>
              Status:
            </Typography>
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 180, fontSize: 14 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            <Typography sx={{ ml: 'auto', fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              {totalElements} requests
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : refunds.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: theme.palette.custom.neutral[500] }}>No refund requests found.</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                      {['Request', 'Product', 'Shop', 'Customer', 'Amount', 'Type', 'Status', 'Appeal', 'Requested At', ''].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {refunds.map((r) => (
                      <TableRow
                        key={r.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.REFUND_DETAIL.replace(':id', r.id))}
                      >
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>
                            #{r.requestNumber}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                            Order: {r.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{r.productName}</Typography>
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{r.productSku}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{r.shopName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{r.userId}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(r.refundAmount)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" variant="outlined" label={RETURN_TYPE_LABEL[r.returnType] ?? r.returnType} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={REFUND_STATUS_LABEL[r.status] ?? r.status}
                            color={getStatusColor(r.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={SHOP_APPEAL_STATUS_LABELS[r.shopAppealStatus ?? ShopAppealStatus.NONE]}
                            color={
                              r.shopAppealStatus === ShopAppealStatus.SUBMITTED
                                ? 'warning'
                                : r.shopAppealStatus === ShopAppealStatus.APPROVED
                                  ? 'success'
                                  : r.shopAppealStatus === ShopAppealStatus.REJECTED || r.shopAppealStatus === ShopAppealStatus.EXPIRED
                                    ? 'error'
                                    : 'default'
                            }
                            variant={r.shopAppealStatus ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>
                            {formatDate(r.requestedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate(PAGE_ENDPOINTS.ADMIN.REFUND_DETAIL.replace(':id', r.id)); }}
                          >
                            <Visibility sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalElements}
                page={page}
                rowsPerPage={pageSize}
                rowsPerPageOptions={[pageSize]}
                onPageChange={(_e, newPage) => setPage(newPage)}
              />
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminRefundsPage;
