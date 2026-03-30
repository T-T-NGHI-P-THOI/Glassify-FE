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

import { adminApi, type AdminWarrantyResponse } from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const WARRANTY_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  IN_REPAIR: 'In Repair',
  SHIPPING_TO_CUSTOMER: 'Shipping to Customer',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'SHIPPING_TO_CUSTOMER', label: 'Shipping to Customer' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'SUBMITTED': return 'warning';
    case 'APPROVED': case 'IN_REPAIR': case 'SHIPPING_TO_CUSTOMER': return 'info';
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

const AdminWarrantiesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [warranties, setWarranties] = useState<AdminWarrantyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const fetchWarranties = async (status: string, pageNum: number) => {
    try {
      setLoading(true);
      const res = await adminApi.getWarranties(status || undefined, pageNum, pageSize);
      if (res.data) {
        setWarranties(res.data.content);
        setTotalElements(res.data.totalElements);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load warranty claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties(statusFilter, page);
  }, [statusFilter, page]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.WARRANTIES} />

      <Box sx={{ flex: 1, p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Warranty Management
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Monitor and manage all warranty claims submitted by customers.
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
              sx={{ minWidth: 200, fontSize: 14 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            <Typography sx={{ ml: 'auto', fontSize: 13, color: theme.palette.custom.neutral[500] }}>
              {totalElements} claims
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : warranties.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: theme.palette.custom.neutral[500] }}>No warranty claims found.</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                      {['Claim', 'Product', 'Shop', 'Customer', 'Issue', 'Status', 'Submitted At', ''].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {warranties.map((w) => (
                      <TableRow
                        key={w.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.WARRANTY_DETAIL.replace(':id', w.id))}
                      >
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>
                            #{w.claimNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {w.productImageUrl && (
                              <Box
                                component="img"
                                src={w.productImageUrl}
                                sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 1 }}
                              />
                            )}
                            <Typography sx={{ fontSize: 13 }}>{w.productName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{w.shopName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{w.customerName}</Typography>
                          <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{w.customerEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{w.issueType}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={WARRANTY_STATUS_LABEL[w.status] ?? w.status}
                            color={getStatusColor(w.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>
                            {formatDate(w.submittedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); navigate(PAGE_ENDPOINTS.ADMIN.WARRANTY_DETAIL.replace(':id', w.id)); }}
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

export default AdminWarrantiesPage;
