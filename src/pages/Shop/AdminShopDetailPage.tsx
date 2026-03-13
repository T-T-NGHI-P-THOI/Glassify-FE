import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Grid,
  Divider,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tab,
  Tabs,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  LinearProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  ArrowBack,
  LocationOn,
  Business,
  Person,
  Phone,
  Email,
  Inventory,
  Star,
  Verified,
  PowerSettingsNew,
  CheckCircle,
  ShoppingCart,
  CalendarToday,
  Badge,
  LocalShipping,
  AttachMoney,
  TrendingUp,
  ToggleOff,
  Close,
  Image as ImageIcon,
  WorkspacePremium,
  Receipt,
  LocalMall,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { toast } from 'react-toastify';
import ProductAPI, { type ApiProduct } from '@/api/product-api';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';


const AdminShopDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'close'>('deactivate');
  const [actionReason, setActionReason] = useState('');
  const [deactivateEndDate, setDeactivateEndDate] = useState('');
  const [closeShopConfirm, setCloseShopConfirm] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  const fetchShop = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await adminApi.getShopById(id);
      if (response.data) {
        setShop(response.data);
      } else {
        toast.error('Shop not found');
        navigate(PAGE_ENDPOINTS.TRACKING.SHOPS, { replace: true });
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error);
      toast.error('Failed to load shop details');
      navigate(PAGE_ENDPOINTS.TRACKING.SHOPS, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void fetchShop();
  }, [fetchShop]);

  const fetchProducts = useCallback(async (shopId: string) => {
    try {
      setProductsLoading(true);
      const data = await ProductAPI.getAllProducts({ shopId, unitPerPage: 200 });
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shop?.id) void fetchProducts(shop.id);
  }, [shop?.id, fetchProducts]);

  const DEACTIVATION_REASONS = [
    'Violation of Terms of Service',
    'Suspicious or Fraudulent Activity',
    'Excessive Customer Complaints',
    'Selling Counterfeit Products',
    'Inactive Shop',
    'Other',
  ];

  const isWithinCancelWindow = () => {
    if (!shop?.updatedAt) return false;
    return Date.now() - new Date(shop.updatedAt).getTime() < 60 * 60 * 1000;
  };

  const resetActionDialog = () => {
    setActionDialogOpen(false);
    setActionReason('');
    setDeactivateEndDate('');
    setCloseShopConfirm(false);
  };

  const handleAction = async () => {
    if (!shop || !actionReason) return;
    try {
      setTogglingStatus(true);
      if (actionType === 'deactivate') {
        if (!deactivateEndDate) return;
        await adminApi.deactivateShop(shop.id, actionReason, deactivateEndDate);
        toast.success('Shop deactivated — status is now Pending');
      } else {
        if (!closeShopConfirm) return;
        await adminApi.closeShop(shop.id, actionReason, closeShopConfirm);
        toast.success('Close shop request submitted — status is now Closing');
      }
      resetActionDialog();
      void fetchShop();
    } catch {
      toast.error('Failed to perform action');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleCancelAction = async () => {
    if (!shop) return;
    try {
      setTogglingStatus(true);
      if (shop.status === 'PENDING') {
        await adminApi.cancelDeactivateShop(shop.id);
      } else {
        await adminApi.cancelCloseShop(shop.id);
      }
      toast.success('Action cancelled successfully');
      void fetchShop();
    } catch {
      toast.error('Failed to cancel action');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleReactivate = async () => {
    if (!shop) return;
    try {
      setTogglingStatus(true);
      await adminApi.reactivateShop(shop.id);
      toast.success('Shop reactivated successfully');
      setReactivateDialogOpen(false);
      void fetchShop();
    } catch {
      toast.error('Failed to reactivate shop');
    } finally {
      setTogglingStatus(false);
    }
  };

  const formatDate = (dateString: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'N/A';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return { color: '#7C3AED', bg: '#EDE9FE' };
      case 'GOLD': return { color: '#D97706', bg: '#FEF3C7' };
      case 'SILVER': return { color: '#64748B', bg: '#F1F5F9' };
      default: return { color: '#92400E', bg: '#FEF9C3' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light, label: 'Active' };
      case 'INACTIVE': return { color: theme.palette.custom.status.error.main, bg: theme.palette.custom.status.error.light, label: 'Inactive' };
      case 'CLOSING': return { color: theme.palette.custom.status.error.main, bg: theme.palette.custom.status.error.light, label: 'Closing' };
      case 'PENDING': return { color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light, label: 'Pending' };
      default: return { color: theme.palette.custom.neutral[500], bg: theme.palette.custom.neutral[100], label: status };
    }
  };

  const getProductStatusConfig = (isActive: boolean, stockQuantity: number) => {
    if (stockQuantity === 0) return { color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light, label: 'Out of Stock' };
    if (isActive) return { color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light, label: 'Active' };
    return { color: theme.palette.custom.status.error.main, bg: theme.palette.custom.status.error.light, label: 'Draft' };
  };

  if (loading && !shop) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>Loading shop details...</Typography>
        </Box>
      </Box>
    );
  }

  if (!shop) return null;

  const statusCfg = getStatusConfig(shop.status);
  const tierCfg = getTierConfig(shop.tier);
  const mockRevenue = (shop.totalOrders ?? 0) * 285000;
  const mockCommissionEarned = mockRevenue * (shop.commissionRate / 100);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>

        {/* Hero Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 60%, #ffffff 100%)', px: 4, pt: 3, pb: 0 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(PAGE_ENDPOINTS.TRACKING.SHOPS)}
            sx={{
              mb: 2,
              fontWeight: 500,
              backgroundColor: 'transparent',
              color: '#000000',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                boxShadow: 'none',
              },
            }}
          >
            Back to Shops
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pb: 3 }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  variant="rounded"
                  src={shop.logoUrl ?? undefined}
                  sx={{ width: 88, height: 88, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, border: '2px solid rgba(255,255,255,0.25)' }}
                >
                  <Store sx={{ fontSize: 40, color: 'rgba(255,255,255,0.6)' }} />
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute', bottom: -7, right: -7,
                    bgcolor: tierCfg.bg, color: tierCfg.color,
                    borderRadius: 1, px: 0.75, py: 0.25,
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 0.4,
                    border: `1px solid ${tierCfg.color}50`,
                  }}
                >
                  <WorkspacePremium sx={{ fontSize: 11 }} />
                  {shop.tier}
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                    {shop.shopName}
                  </Typography>
                  {shop.isVerified && (
                    <Tooltip title="Verified shop">
                      <Verified sx={{ fontSize: 22, color: '#0EA5E9' }} />
                    </Tooltip>
                  )}
                  {loading && <CircularProgress size={16} sx={{ color: '#94A3B8' }} />}
                </Box>

                <Typography sx={{ fontSize: 13, color: '#94A3B8', mb: 1.25, letterSpacing: 0.5 }}>
                  {shop.shopCode}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={statusCfg.label}
                    size="small"
                    sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: 11, height: 22 }}
                  />
                  {shop.isVerified && (
                    <Chip
                      label="Verified"
                      size="small"
                      icon={<Verified sx={{ fontSize: 12, color: '#0EA5E9 !important' }} />}
                      sx={{ bgcolor: '#F0F9FF', color: '#0369A1', fontWeight: 600, fontSize: 11, height: 22 }}
                    />
                  )}
                  <Chip
                    label={`${shop.commissionRate}% commission`}
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 500, fontSize: 11, height: 22 }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, pb: 3 }}>
              {(shop.status === 'PENDING' || shop.status === 'CLOSING') && (
                isWithinCancelWindow() ? (
                  <Button
                    variant="outlined"
                    startIcon={togglingStatus ? <CircularProgress size={15} /> : <Close />}
                    onClick={handleCancelAction}
                    disabled={togglingStatus}
                    sx={{ borderColor: '#FCD34D', color: '#FCD34D', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={togglingStatus ? <CircularProgress size={15} /> : <CheckCircle />}
                    onClick={() => setReactivateDialogOpen(true)}
                    disabled={togglingStatus}
                    sx={{ borderColor: '#4ADE80', color: '#4ADE80', '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34,197,94,0.1)' } }}
                  >
                    Reactivate
                  </Button>
                )
              )}
              {shop.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<ToggleOff />}
                    onClick={() => { setActionType('deactivate'); setActionDialogOpen(true); }}
                    disabled={togglingStatus}
                    sx={{ borderColor: '#FCA5A5', color: '#FCA5A5', '&:hover': { borderColor: '#F87171', bgcolor: 'rgba(248,113,113,0.1)' } }}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PowerSettingsNew />}
                    onClick={() => { setActionType('close'); setActionDialogOpen(true); }}
                    disabled={togglingStatus}
                    sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}
                  >
                    Close Shop
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, v: number) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': { color: 'rgba(0, 0, 0, 0.5)', fontWeight: 500, fontSize: 14, minWidth: 0, mr: 1 },
              '& .Mui-selected': { color: '#000000 !important', fontWeight: 600 },
              '& .MuiTabs-indicator': { bgcolor: '#000000', height: 2 },
            }}
          >
            <Tab label="Overview" />
            <Tab label={`Products (${products.length})`} />
          </Tabs>
        </Box>

        {/* Stats Row */}
        <Box sx={{ px: 4, py: 2.5, display: 'flex', gap: 2, bgcolor: '#fff', borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
          {[
            { icon: <ShoppingCart sx={{ fontSize: 19 }} />, label: 'Total Orders', value: (shop.totalOrders ?? 0).toLocaleString(), color: theme.palette.custom.status.info.main, bg: theme.palette.custom.status.info.light },
            { icon: <Inventory sx={{ fontSize: 19 }} />, label: 'Total Products', value: (shop.totalProducts ?? 0).toLocaleString(), color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light },
            { icon: <Star sx={{ fontSize: 19 }} />, label: 'Avg Rating', value: shop.avgRating != null && shop.avgRating > 0 ? shop.avgRating.toFixed(1) : '—', color: '#F59E0B', bg: '#FEF3C7' },
            { icon: <AttachMoney sx={{ fontSize: 19 }} />, label: 'Est. Revenue', value: formatCurrency(mockRevenue), color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light },
            { icon: <Receipt sx={{ fontSize: 19 }} />, label: 'Commission Earned', value: formatCurrency(mockCommissionEarned), color: '#7C3AED', bg: '#EDE9FE' },
            { icon: <TrendingUp sx={{ fontSize: 19 }} />, label: 'Member Since', value: formatDate(shop.joinedAt), color: theme.palette.custom.neutral[600], bg: theme.palette.custom.neutral[100] },
          ].map((s) => (
            <Box key={s.label} sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500], whiteSpace: 'nowrap' }}>{s.label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 4 }}>

          {/* OVERVIEW TAB */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, height: '100%' }}>
                  <SectionHeader icon={<Business />} title="Shop Information" />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <InfoRow label="Shop Code" value={shop.shopCode} icon={<Badge sx={{ fontSize: 15, color: theme.palette.custom.neutral[400] }} />} />
                    <InfoRow label="Email" value={shop.email} icon={<Email sx={{ fontSize: 15, color: theme.palette.custom.status.info.main }} />} />
                    <InfoRow label="Phone" value={shop.phone} icon={<Phone sx={{ fontSize: 15, color: theme.palette.custom.status.success.main }} />} />
                    <Divider />
                    <InfoRow label="License Number" value={shop.businessLicense?.licenseNumber || '—'} />
                    <InfoRow label="Business Name" value={shop.businessLicense?.businessName || '—'} />
                    <InfoRow label="Tax ID" value={shop.businessLicense?.taxId || '—'} />
                    <InfoRow label="Business Type" value={shop.businessLicense?.businessType || '—'} />
                    {shop.businessLicense?.licenseImageUrl && (
                      <Box>
                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          License Image URL
                        </Typography>
                        <Typography
                          component="a"
                          href={shop.businessLicense.licenseImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: theme.palette.primary.main,
                            wordBreak: 'break-all',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {shop.businessLicense.licenseImageUrl}
                        </Typography>
                      </Box>
                    )}
                    <Divider />
                    <InfoRow label="Commission Rate" value={`${shop.commissionRate}%`} />
                    <InfoRow label="Joined At" value={formatDate(shop.joinedAt)} icon={<CalendarToday sx={{ fontSize: 15, color: theme.palette.custom.neutral[400] }} />} />
                    <InfoRow label="Created At" value={formatDate(shop.createdAt)} icon={<CalendarToday sx={{ fontSize: 15, color: theme.palette.custom.neutral[400] }} />} />
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, height: '100%' }}>
                  <SectionHeader icon={<Person />} title="Owner Information" />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
                    <InfoRow label="Owner Name" value={shop.ownerName ?? '—'} />
                    <InfoRow label="Owner Email" value={shop.ownerEmail ?? '—'} icon={<Email sx={{ fontSize: 15, color: theme.palette.custom.status.info.main }} />} />
                    <InfoRow label="Owner ID" value={shop.ownerId ?? '—'} />
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <SectionHeader icon={<LocationOn />} title="Address" />
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.7 }}>
                    {shop.address}
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[600], mt: 0.5 }}>
                    {shop.city}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                  <SectionHeader icon={<LocalShipping />} title="GHN Shipping Configuration" />
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                    <InfoRow label="GHN Shop ID" value={shop.ghnShopId ? String(shop.ghnShopId) : '—'} />
                    <InfoRow label="Province ID" value={shop.ghnProvinceId ? String(shop.ghnProvinceId) : '—'} />
                    <InfoRow label="District ID" value={shop.ghnDistrictId ? String(shop.ghnDistrictId) : '—'} />
                    <InfoRow label="Ward Code" value={shop.ghnWardCode ?? '—'} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 1 && (
            <Box>
              {productsLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              ) : products.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <Inventory sx={{ fontSize: 56, color: theme.palette.custom.neutral[300], mb: 1.5 }} />
                  <Typography sx={{ fontSize: 15, color: theme.palette.custom.neutral[500] }}>No products found for this shop</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {products.map((product) => {
                    const pStatus = getProductStatusConfig(product.isActive, product.stockQuantity);
                    const imgUrl = product.fileResponses?.[0]?.url;
                    const hasDiscount = product.compareAtPrice > product.basePrice;
                    return (
                      <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card
                          elevation={0}
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.custom.border.light}`,
                            transition: 'all 0.18s ease',
                            '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.09)', borderColor: theme.palette.custom.border.main, transform: 'translateY(-2px)' },
                          }}
                        >
                          <CardActionArea onClick={() => setSelectedProduct(product)}>
                            <Box sx={{ position: 'relative' }}>
                              {imgUrl ? (
                                <CardMedia component="img" height={160} image={imgUrl} alt={product.name} sx={{ objectFit: 'cover' }} />
                              ) : (
                                <Box sx={{ height: 160, bgcolor: theme.palette.custom.neutral[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon sx={{ fontSize: 48, color: theme.palette.custom.neutral[300] }} />
                                </Box>
                              )}
                              <Chip
                                label={pStatus.label}
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: pStatus.bg, color: pStatus.color, fontWeight: 700, fontSize: 10, height: 20 }}
                              />
                              {hasDiscount && (
                                <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#EF4444', color: '#fff', borderRadius: 1, px: 0.75, py: 0.25, fontSize: 10, fontWeight: 700 }}>
                                  -{Math.round((1 - product.basePrice / product.compareAtPrice) * 100)}%
                                </Box>
                              )}
                            </Box>

                            <CardContent sx={{ p: 2 }}>
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500], mb: 0.25 }}>
                                {product.categoryName}{product.productType ? ` · ${product.productType}` : ''}
                              </Typography>
                              <Typography
                                sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.75, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                              >
                                {product.name}
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <Star sx={{ fontSize: 13, color: '#F59E0B' }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                                  {product.avgRating > 0 ? product.avgRating.toFixed(1) : '—'}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>({product.reviewCount})</Typography>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], ml: 'auto' }}>{product.soldCount} sold</Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1.5 }}>
                                <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.status.error.main }}>
                                  {formatCurrency(product.basePrice)}
                                </Typography>
                                {hasDiscount && (
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                    {formatCurrency(product.compareAtPrice)}
                                  </Typography>
                                )}
                              </Box>

                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>Stock</Typography>
                                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: product.stockQuantity === 0 ? theme.palette.custom.status.error.main : theme.palette.custom.neutral[700] }}>
                                    {product.stockQuantity}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min((product.stockQuantity / 50) * 100, 100)}
                                  sx={{
                                    height: 4, borderRadius: 2,
                                    bgcolor: theme.palette.custom.neutral[100],
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      bgcolor: product.stockQuantity === 0 ? theme.palette.custom.status.error.main
                                        : product.stockQuantity <= product.lowStockThreshold ? theme.palette.custom.status.warning.main
                                          : theme.palette.custom.status.success.main,
                                    },
                                  }}
                                />
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <AdminProductDetailDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Unified Deactivate / Close Shop Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => !togglingStatus && resetActionDialog()} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          {actionType === 'deactivate' ? 'Deactivate Shop' : 'Close Shop Permanently'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {/* Action type toggle */}
          <ToggleButtonGroup
            value={actionType}
            exclusive
            onChange={(_, val: 'deactivate' | 'close') => { if (val) { setActionType(val); setActionReason(''); setDeactivateEndDate(''); setCloseShopConfirm(false); } }}
            fullWidth
            size="small"
            sx={{ mb: 2.5 }}
          >
            <ToggleButton value="deactivate" sx={{ flex: 1, textTransform: 'none', fontWeight: 600, gap: 0.75 }}>
              <ToggleOff sx={{ fontSize: 18 }} /> Deactivate
            </ToggleButton>
            <ToggleButton value="close" sx={{ flex: 1, textTransform: 'none', fontWeight: 600, gap: 0.75 }}>
              <PowerSettingsNew sx={{ fontSize: 18 }} /> Close Shop
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Description */}
          {actionType === 'deactivate' ? (
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 2.5 }}>
              Shop <strong>{shop.shopName}</strong> sẽ chuyển sang trạng thái <strong>Pending</strong>. Bạn có thể huỷ trong vòng <strong>1 giờ</strong>.
            </Typography>
          ) : (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              Shop <strong>{shop.shopName}</strong> sẽ chuyển sang trạng thái <strong>Closing</strong>. Bạn có thể huỷ trong vòng <strong>1 giờ</strong>, sau đó shop sẽ bị đóng vĩnh viễn.
            </Alert>
          )}

          {/* Shared: Reason dropdown */}
          <FormControl fullWidth required sx={{ mb: 2.5 }}>
            <InputLabel>Reason</InputLabel>
            <Select
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              label="Reason"
              disabled={togglingStatus}
            >
              {DEACTIVATION_REASONS.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Deactivate-specific: end date */}
          {actionType === 'deactivate' && (
            <TextField
              fullWidth type="date"
              label="End Date"
              value={deactivateEndDate}
              onChange={(e) => setDeactivateEndDate(e.target.value)}
              disabled={togglingStatus}
              required
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: new Date().toISOString().split('T')[0] } }}
              helperText="Ngày hết hiệu lực tạm ngưng"
            />
          )}

          {/* Close-specific: confirmation checkbox */}
          {actionType === 'close' && (
            <FormControlLabel
              control={<Checkbox checked={closeShopConfirm} onChange={(e) => setCloseShopConfirm(e.target.checked)} disabled={togglingStatus} />}
              label={
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                  Tôi hiểu rằng shop sẽ bị đóng vĩnh viễn sau khi hết thời gian huỷ.
                </Typography>
              }
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={resetActionDialog} disabled={togglingStatus}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={handleAction}
            disabled={
              togglingStatus || !actionReason ||
              (actionType === 'deactivate' && !deactivateEndDate) ||
              (actionType === 'close' && !closeShopConfirm)
            }
            startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}
          >
            {togglingStatus ? 'Processing...' : actionType === 'deactivate' ? 'Confirm Deactivate' : 'Close Shop'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialogOpen} onClose={() => !togglingStatus && setReactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Reactivate Shop</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
            Are you sure you want to reactivate <strong>{shop.shopName}</strong>? Customers will be able to view and order from this shop again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReactivateDialogOpen(false)} disabled={togglingStatus}>Cancel</Button>
          <Button
            variant="contained" color="success"
            onClick={handleReactivate}
            disabled={togglingStatus}
            startIcon={togglingStatus ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {togglingStatus ? 'Reactivating...' : 'Reactivate Shop'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ==================== Admin Product Detail Dialog ====================

interface AdminProductDetailDialogProps {
  product: ApiProduct;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

const AdminProductDetailDialog = ({ product, onClose, formatCurrency }: AdminProductDetailDialogProps) => {
  const theme = useTheme();

  const estimatedRevenue = product.soldCount * product.basePrice;

  const getPerformance = () => {
    if (product.avgRating >= 4.5) return 'Excellent';
    if (product.avgRating >= 3.5) return 'Good';
    if (product.avgRating >= 2.5) return 'Average';
    return 'Poor';
  };

  const insights = [
    { label: 'Total Sales', value: product.soldCount, unit: 'Unit', icon: <LocalMall sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} /> },
    { label: 'Total Revenue', value: `${estimatedRevenue.toLocaleString('vi-VN')}₫`, icon: <TrendingUp sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} /> },
    { label: 'Avg Rating', value: product.avgRating > 0 ? product.avgRating.toFixed(1) : '—', unit: `(${product.reviewCount} reviews)`, icon: <Star sx={{ fontSize: 18, color: '#F59E0B' }} /> },
    { label: 'Performance', value: getPerformance(), icon: <TrendingUp sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }} /> },
  ];

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );

  const FieldBox = ({ children }: { children: React.ReactNode }) => (
    <Box
      sx={{
        border: `1px solid ${theme.palette.custom.border.light}`,
        borderRadius: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: '#fff',
        fontSize: 14,
        color: theme.palette.custom.neutral[700],
      }}
    >
      {children}
    </Box>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 0, pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Product Detail
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], mt: 0.25 }}>
              This is all product information.
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.custom.neutral[500] }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider sx={{ mt: 2 }} />

      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: 480 }}>
          {/* Left panel */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ p: 3, bgcolor: theme.palette.custom.neutral[50], borderRight: `1px solid ${theme.palette.custom.border.light}` }}
          >
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: 2,
                bgcolor: theme.palette.custom.neutral[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                mb: 2.5,
              }}
            >
              {product.fileResponses?.[0]?.url ? (
                <img
                  src={product.fileResponses[0].url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Inventory sx={{ fontSize: 64, color: theme.palette.custom.neutral[300] }} />
              )}
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, p: 2, bgcolor: '#fff' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                Product Insight
              </Typography>
              <Grid container spacing={1.5}>
                {insights.map((item) => (
                  <Grid key={item.label} size={{ xs: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: `1px solid ${theme.palette.custom.border.light}`,
                        bgcolor: theme.palette.custom.neutral[50],
                      }}
                    >
                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: theme.palette.custom.neutral[800], lineHeight: 1.2 }}>
                        {item.value}
                        {item.unit && (
                          <Typography component="span" sx={{ fontSize: 11, fontWeight: 400, color: theme.palette.custom.neutral[400], ml: 0.5 }}>
                            {item.unit}
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Right panel */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, overflowY: 'auto', maxHeight: 560 }}>
            <Field label="ID and Product Name">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], fontFamily: 'monospace' }}>
                    #{product.id.slice(0, 6).toUpperCase()}
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {product.name}
                  </Typography>
                </Box>
              </FieldBox>
            </Field>

            <Field label="Description">
              <FieldBox>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {product.description || 'No description provided.'}
                </Typography>
              </FieldBox>
            </Field>

            <Field label="Categories">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                    {product.categoryName || '—'}
                  </Typography>
                  <Chip
                    label={product.productType}
                    size="small"
                    sx={{ fontSize: 11, bgcolor: theme.palette.custom.neutral[100], color: theme.palette.custom.neutral[600] }}
                  />
                </Box>
              </FieldBox>
            </Field>

            <Field label="Price & Discount">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>Base Price</Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                    {formatCurrency(product.basePrice)}
                  </Typography>
                  {product.compareAtPrice > product.basePrice && (
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                      {formatCurrency(product.compareAtPrice)}
                    </Typography>
                  )}
                </Box>
              </FieldBox>
            </Field>

            <Field label="Status">
              <FieldBox>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                    {product.isActive ? 'Published' : 'Draft'}
                  </Typography>
                  <Chip
                    label={product.isActive ? 'Active' : 'Draft'}
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      bgcolor: product.isActive ? theme.palette.custom.status.success.light : theme.palette.custom.status.warning.light,
                      color: product.isActive ? theme.palette.custom.status.success.main : theme.palette.custom.status.warning.main,
                    }}
                  />
                </Box>
              </FieldBox>
            </Field>

            <Field label="Stock & SKU">
              <FieldBox>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25 }}>SKU</Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: theme.palette.custom.neutral[700] }}>
                      {product.sku}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25 }}>In Stock</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: product.stockQuantity === 0 ? theme.palette.custom.status.error.main : theme.palette.custom.neutral[800] }}>
                      {product.stockQuantity}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Sold</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {product.soldCount}
                    </Typography>
                  </Box>
                </Box>
              </FieldBox>
            </Field>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
      <Box sx={{ color: theme.palette.custom.neutral[500], display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>{title}</Typography>
    </Box>
  );
};

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Box>
      <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mb: 0.25, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {icon}
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{value}</Typography>
      </Box>
    </Box>
  );
};

export default AdminShopDetailPage;
