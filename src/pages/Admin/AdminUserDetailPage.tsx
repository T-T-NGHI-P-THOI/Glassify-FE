import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, Visibility } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  adminApi,
  type AdminOrderResponse,
  type AdminRefundResponse,
  type AdminWarrantyResponse,
} from '@/api/adminApi';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatCurrency } from '@/utils/formatCurrency';
import type { UserResponse } from '@/models/User';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  PICKED_UP: 'Picked Up', SHIPPED: 'In Transit', OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', RETURNED: 'Returned',
};

const REFUND_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Requested', APPROVED: 'Approved', REJECTED: 'Rejected',
  RETURN_SHIPPING: 'Return Shipping', ITEM_RECEIVED: 'Item Received',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const WARRANTY_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted', APPROVED: 'Approved', REJECTED: 'Rejected',
  IN_REPAIR: 'In Repair', SHIPPING_TO_CUSTOMER: 'Shipping to Customer',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const getRoleColor = (role: string): 'default' | 'primary' | 'error' | 'warning' =>
  role === 'ADMIN' ? 'error' : role === 'SHOP_OWNER' ? 'primary' : role === 'STAFF' ? 'warning' : 'default';

const orderStatusColor = (s: string): 'warning' | 'info' | 'success' | 'error' | 'default' =>
  s === 'PENDING' ? 'warning' : s === 'DELIVERED' ? 'success' : s === 'CANCELLED' || s === 'RETURNED' ? 'error' : 'info';

const refundStatusColor = (s: string): 'warning' | 'info' | 'success' | 'error' | 'default' =>
  s === 'REQUESTED' ? 'warning' : s === 'COMPLETED' ? 'success' : s === 'REJECTED' || s === 'CANCELLED' ? 'error' : 'info';

const warrantyStatusColor = (s: string): 'warning' | 'info' | 'success' | 'error' | 'default' =>
  s === 'SUBMITTED' ? 'warning' : s === 'COMPLETED' ? 'success' : s === 'REJECTED' || s === 'CANCELLED' ? 'error' : 'info';

const formatDate = (v?: string) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const AdminUserDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id: userId } = useParams<{ id: string }>();

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const [user, setUser] = useState<UserResponse | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Orders
  const [orders, setOrders] = useState<AdminOrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalElements, setOrdersTotalElements] = useState(0);

  // Refunds
  const [refunds, setRefunds] = useState<AdminRefundResponse[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundsPage, setRefundsPage] = useState(0);
  const [refundsTotalElements, setRefundsTotalElements] = useState(0);

  // Warranties
  const [warranties, setWarranties] = useState<AdminWarrantyResponse[]>([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(false);
  const [warrantiesPage, setWarrantiesPage] = useState(0);
  const [warrantiesTotalElements, setWarrantiesTotalElements] = useState(0);

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!userId) return;
    setUserLoading(true);
    adminApi.getUserById(userId)
      .then((res) => { if (res.data) setUser(res.data); })
      .catch(() => toast.error('Failed to load user'))
      .finally(() => setUserLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId || activeTab !== 0) return;
    setOrdersLoading(true);
    adminApi.getUserOrders(userId, ordersPage, PAGE_SIZE)
      .then((res) => {
        if (res.data) {
          setOrders(res.data.content);
          setOrdersTotalElements(res.data.totalElements);
        }
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setOrdersLoading(false));
  }, [userId, activeTab, ordersPage]);

  useEffect(() => {
    if (!userId || activeTab !== 1) return;
    setRefundsLoading(true);
    adminApi.getUserRefunds(userId, refundsPage, PAGE_SIZE)
      .then((res) => {
        if (res.data) {
          setRefunds(res.data.content);
          setRefundsTotalElements(res.data.totalElements);
        }
      })
      .catch(() => toast.error('Failed to load refunds'))
      .finally(() => setRefundsLoading(false));
  }, [userId, activeTab, refundsPage]);

  useEffect(() => {
    if (!userId || activeTab !== 2) return;
    setWarrantiesLoading(true);
    adminApi.getUserWarranties(userId, warrantiesPage, PAGE_SIZE)
      .then((res) => {
        if (res.data) {
          setWarranties(res.data.content);
          setWarrantiesTotalElements(res.data.totalElements);
        }
      })
      .catch(() => toast.error('Failed to load warranties'))
      .finally(() => setWarrantiesLoading(false));
  }, [userId, activeTab, warrantiesPage]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.ADMIN.USER_MANAGEMENT} />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Back */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton size="small" onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.USER_MANAGEMENT)}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>Back to User Management</Typography>
        </Box>

        {/* User card */}
        {userLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : user ? (
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, mb: 3 }}
          >
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 64, height: 64, fontSize: 24 }}>
                {(user.fullName ?? user.username ?? '?')[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 18, color: theme.palette.custom.neutral[800] }}>
                  {user.fullName ?? user.username}
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>{user.email}</Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap">
                  {(user.roles ?? []).map((role) => (
                    <Chip key={role} label={role} size="small" color={getRoleColor(role)} sx={{ fontWeight: 600, fontSize: 11 }} />
                  ))}
                  <Chip
                    label={user.enabled ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: user.enabled ? theme.palette.custom.status.success.light : theme.palette.custom.status.error.light,
                      color: user.enabled ? theme.palette.custom.status.success.main : theme.palette.custom.status.error.main,
                    }}
                  />
                </Stack>
              </Box>
              {user.createdAt && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Member since</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(user.createdAt)}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        ) : null}

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ px: 2, borderBottom: `1px solid ${theme.palette.custom.border.light}`, '& .MuiTab-root': { textTransform: 'none' } }}
          >
            <Tab label={`Orders (${ordersTotalElements})`} />
            <Tab label={`Refunds (${refundsTotalElements})`} />
            <Tab label={`Warranties (${warrantiesTotalElements})`} />
          </Tabs>

          {/* --- Orders tab --- */}
          {activeTab === 0 && (
            ordersLoading ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : orders.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: theme.palette.custom.neutral[400] }}>No orders found.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                        {['Order', 'Amount', 'Payment', 'Status', 'Ordered At', ''].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((o) => (
                        <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.ORDER_DETAIL.replace(':id', o.id))}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>#{o.orderNumber}</Typography>
                            {o.trackingNumber && <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{o.trackingNumber}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={o.paymentStatus} color={o.paymentStatus === 'PAID' ? 'success' : o.paymentStatus === 'PENDING' ? 'warning' : 'default'} />
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mt: 0.25 }}>{o.paymentMethod}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={ORDER_STATUS_LABEL[o.status] ?? o.status} color={orderStatusColor(o.status)} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>{formatDate(o.orderedAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(PAGE_ENDPOINTS.ADMIN.ORDER_DETAIL.replace(':id', o.id)); }}>
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
                  count={ordersTotalElements}
                  page={ordersPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setOrdersPage(p)}
                />
              </>
            )
          )}

          {/* --- Refunds tab --- */}
          {activeTab === 1 && (
            refundsLoading ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : refunds.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: theme.palette.custom.neutral[400] }}>No refund requests found.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                        {['Request', 'Product', 'Shop', 'Amount', 'Type', 'Status', 'Requested At', ''].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {refunds.map((r) => (
                        <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.REFUND_DETAIL.replace(':id', r.id))}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>#{r.requestNumber}</Typography>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>Order: {r.orderNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{r.productName}</Typography>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{r.productSku}</Typography>
                          </TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{r.shopName}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(r.refundAmount)}</Typography></TableCell>
                          <TableCell><Chip size="small" variant="outlined" label={r.returnType} /></TableCell>
                          <TableCell><Chip size="small" label={REFUND_STATUS_LABEL[r.status] ?? r.status} color={refundStatusColor(r.status)} /></TableCell>
                          <TableCell><Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>{formatDate(r.requestedAt)}</Typography></TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(PAGE_ENDPOINTS.ADMIN.REFUND_DETAIL.replace(':id', r.id)); }}>
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
                  count={refundsTotalElements}
                  page={refundsPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setRefundsPage(p)}
                />
              </>
            )
          )}

          {/* --- Warranties tab --- */}
          {activeTab === 2 && (
            warrantiesLoading ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : warranties.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: theme.palette.custom.neutral[400] }}>No warranty claims found.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.custom.neutral[50] }}>
                        {['Claim', 'Product', 'Shop', 'Issue', 'Status', 'Submitted At', ''].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: theme.palette.custom.neutral[500] }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {warranties.map((w) => (
                        <TableRow key={w.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(PAGE_ENDPOINTS.ADMIN.WARRANTY_DETAIL.replace(':id', w.id))}>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>#{w.claimNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {w.productImageUrl && (
                                <Box component="img" src={w.productImageUrl} sx={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 1 }} />
                              )}
                              <Typography sx={{ fontSize: 13 }}>{w.productName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{w.shopName}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{w.issueType}</Typography></TableCell>
                          <TableCell><Chip size="small" label={WARRANTY_STATUS_LABEL[w.status] ?? w.status} color={warrantyStatusColor(w.status)} /></TableCell>
                          <TableCell><Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[600] }}>{formatDate(w.submittedAt)}</Typography></TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(PAGE_ENDPOINTS.ADMIN.WARRANTY_DETAIL.replace(':id', w.id)); }}>
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
                  count={warrantiesTotalElements}
                  page={warrantiesPage}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  onPageChange={(_, p) => setWarrantiesPage(p)}
                />
              </>
            )
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminUserDetailPage;
