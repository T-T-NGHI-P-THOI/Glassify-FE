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
  Visibility,
  ToggleOff,
  Close,
  Image as ImageIcon,
  WorkspacePremium,
  Receipt,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/sidebar/Sidebar';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { adminApi } from '@/api/adminApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { toast } from 'react-toastify';

interface ShopProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  category: string;
  brand: string;
  imageUrl?: string;
  description: string;
  createdAt: string;
}

const MOCK_PRODUCTS: ShopProduct[] = [
  { id: '1', name: 'Ray-Ban Aviator Classic', sku: 'RB3025-001', price: 3200000, originalPrice: 3800000, stock: 12, sold: 148, rating: 4.8, reviewCount: 93, status: 'ACTIVE', category: 'Sunglasses', brand: 'Ray-Ban', description: 'The iconic aviator sunglasses with classic teardrop lenses. UV400 protection, metal frame, crystal green lenses.', createdAt: '2024-06-01' },
  { id: '2', name: 'Oakley Holbrook Polarized', sku: 'OO9102-01', price: 4500000, stock: 5, sold: 67, rating: 4.6, reviewCount: 41, status: 'ACTIVE', category: 'Sunglasses', brand: 'Oakley', description: 'Lightweight O Matter frame with Unobtainium earsocks. Polarized Prizm lenses reduce glare.', createdAt: '2024-07-12' },
  { id: '3', name: 'Warby Parker Crane', sku: 'WP-CRANE-200', price: 2100000, stock: 0, sold: 29, rating: 4.3, reviewCount: 18, status: 'OUT_OF_STOCK', category: 'Eyeglasses', brand: 'Warby Parker', description: 'Lightweight acetate frame with adjustable silicone nose pads. Blue light blocking lens available.', createdAt: '2024-08-03' },
  { id: '4', name: 'Gucci GG0010S', sku: 'GG0010S-006', price: 12500000, originalPrice: 14000000, stock: 3, sold: 15, rating: 4.9, reviewCount: 12, status: 'ACTIVE', category: 'Luxury Sunglasses', brand: 'Gucci', description: 'Rectangular acetate frame with signature GG logo on temples. 100% UV protection.', createdAt: '2024-05-20' },
  { id: '5', name: 'Tom Ford FT0237', sku: 'TF0237-01B', price: 9800000, stock: 7, sold: 22, rating: 4.7, reviewCount: 19, status: 'ACTIVE', category: 'Luxury Sunglasses', brand: 'Tom Ford', description: 'Full-rim round acetate frame with T logo on temples. Gradient grey lenses.', createdAt: '2024-09-15' },
  { id: '6', name: 'Persol PO3166S', sku: 'PO3166S-95', price: 5600000, stock: 9, sold: 44, rating: 4.5, reviewCount: 31, status: 'ACTIVE', category: 'Sunglasses', brand: 'Persol', description: 'Supreme Vision System with meflecto hinges. Crystal brown gradient lens.', createdAt: '2024-04-28' },
  { id: '7', name: 'Zenni Blokz Blue Light', sku: 'ZN-BLOKZ-001', price: 850000, stock: 45, sold: 210, rating: 4.1, reviewCount: 152, status: 'ACTIVE', category: 'Blue Light Glasses', brand: 'Zenni', description: 'Blue light filtering lens for screen use. Lightweight TR90 frame, flexible hinges.', createdAt: '2024-03-11' },
  { id: '8', name: 'Maui Jim Breakwall', sku: 'MJ-432-02', price: 6200000, stock: 0, sold: 38, rating: 4.4, reviewCount: 27, status: 'INACTIVE', category: 'Sunglasses', brand: 'Maui Jim', description: 'PolarizedPlus2 lenses eliminate glare. Lightweight titanium frame, perfect for outdoor use.', createdAt: '2024-10-01' },
];

const AdminShopDetailPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateEndDate, setDeactivateEndDate] = useState('');
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [closeShopDialogOpen, setCloseShopDialogOpen] = useState(false);
  const [closeShopReason, setCloseShopReason] = useState('');
  const [closeShopConfirm, setCloseShopConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

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

  const handleDeactivate = async () => {
    if (!shop || !deactivateReason.trim() || !deactivateEndDate) return;
    try {
      setTogglingStatus(true);
      await adminApi.deactivateShop(shop.id, deactivateReason, deactivateEndDate);
      toast.success('Shop deactivated successfully');
      setDeactivateDialogOpen(false);
      setDeactivateReason('');
      setDeactivateEndDate('');
      void fetchShop();
    } catch {
      toast.error('Failed to deactivate shop');
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

  const handleCloseShop = async () => {
    if (!shop || !closeShopReason.trim() || !closeShopConfirm) return;
    try {
      setTogglingStatus(true);
      await adminApi.closeShop(shop.id, closeShopReason, closeShopConfirm);
      toast.success('Close shop request submitted');
      setCloseShopDialogOpen(false);
      setCloseShopReason('');
      setCloseShopConfirm(false);
      void fetchShop();
    } catch {
      toast.error('Failed to close shop');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleCancelCloseShop = async () => {
    if (!shop) return;
    try {
      setTogglingStatus(true);
      await adminApi.cancelCloseShop(shop.id);
      toast.success('Close request cancelled');
      void fetchShop();
    } catch {
      toast.error('Failed to cancel close shop request');
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

  const getProductStatusConfig = (status: ShopProduct['status']) => {
    switch (status) {
      case 'ACTIVE': return { color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light, label: 'Active' };
      case 'OUT_OF_STOCK': return { color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light, label: 'Out of Stock' };
      default: return { color: theme.palette.custom.status.error.main, bg: theme.palette.custom.status.error.light, label: 'Inactive' };
    }
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
              {shop.status === 'CLOSING' && (
                <Button
                  variant="outlined"
                  startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />}
                  onClick={handleCancelCloseShop}
                  disabled={togglingStatus}
                  sx={{ borderColor: '#FCD34D', color: '#FCD34D', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}
                >
                  Cancel Close
                </Button>
              )}
              {shop.status === 'INACTIVE' && (
                <Button
                  variant="outlined"
                  startIcon={togglingStatus ? <CircularProgress size={15} /> : <CheckCircle />}
                  onClick={() => setReactivateDialogOpen(true)}
                  disabled={togglingStatus}
                  sx={{ borderColor: '#4ADE80', color: '#4ADE80', '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34,197,94,0.1)' } }}
                >
                  Reactivate
                </Button>
              )}
              {shop.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<ToggleOff />}
                    onClick={() => setDeactivateDialogOpen(true)}
                    disabled={togglingStatus}
                    sx={{ borderColor: '#FCA5A5', color: '#FCA5A5', '&:hover': { borderColor: '#F87171', bgcolor: 'rgba(248,113,113,0.1)' } }}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PowerSettingsNew />}
                    onClick={() => setCloseShopDialogOpen(true)}
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
            <Tab label={`Products (${MOCK_PRODUCTS.length})`} />
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
                    <InfoRow label="Business License" value={shop.businessLicense || '—'} />
                    <InfoRow label="Tax ID" value={shop.taxId || '—'} />
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
              <Grid container spacing={2}>
                {MOCK_PRODUCTS.map((product) => {
                  const pStatus = getProductStatusConfig(product.status);
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
                            {product.imageUrl ? (
                              <CardMedia component="img" height={160} image={product.imageUrl} alt={product.name} sx={{ objectFit: 'cover' }} />
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
                            {product.originalPrice && (
                              <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#EF4444', color: '#fff', borderRadius: 1, px: 0.75, py: 0.25, fontSize: 10, fontWeight: 700 }}>
                                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                              </Box>
                            )}
                          </Box>

                          <CardContent sx={{ p: 2 }}>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500], mb: 0.25 }}>{product.category}</Typography>
                            <Typography
                              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.75, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                            >
                              {product.name}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Star sx={{ fontSize: 13, color: '#F59E0B' }} />
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>{product.rating.toFixed(1)}</Typography>
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>({product.reviewCount})</Typography>
                              <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], ml: 'auto' }}>{product.sold} sold</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1.5 }}>
                              <Typography sx={{ fontSize: 15, fontWeight: 700, color: theme.palette.custom.status.error.main }}>
                                {formatCurrency(product.price)}
                              </Typography>
                              {product.originalPrice && (
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                  {formatCurrency(product.originalPrice)}
                                </Typography>
                              )}
                            </Box>

                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>Stock</Typography>
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: product.stock === 0 ? theme.palette.custom.status.error.main : theme.palette.custom.neutral[700] }}>
                                  {product.stock}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((product.stock / 50) * 100, 100)}
                                sx={{
                                  height: 4, borderRadius: 2,
                                  bgcolor: theme.palette.custom.neutral[100],
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 2,
                                    bgcolor: product.stock === 0 ? theme.palette.custom.status.error.main
                                      : product.stock < 10 ? theme.palette.custom.status.warning.main
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
            </Box>
          )}
        </Box>
      </Box>

      {/* Product Detail Dialog */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' } }}
      >
        {selectedProduct && (() => {
          const pStatus = getProductStatusConfig(selectedProduct.status);
          return (
            <>
              {/* Image / header */}
              <Box sx={{ position: 'relative' }}>
                {selectedProduct.imageUrl ? (
                  <Box component="img" src={selectedProduct.imageUrl}
                    sx={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <Box sx={{
                    height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1E293B 0%, #334155 60%, #475569 100%)',
                  }}>
                    <ImageIcon sx={{ fontSize: 72, color: 'rgba(255,255,255,0.2)' }} />
                  </Box>
                )}

                {/* gradient overlay */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
                }} />

                {/* name + sku */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: '16px 20px' }}>
                  <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
                    <Chip label={pStatus.label} size="small"
                      sx={{ bgcolor: pStatus.bg, color: pStatus.color, fontWeight: 700, fontSize: 10, height: 20 }} />
                    <Chip label={selectedProduct.category} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 10, height: 20 }} />
                    <Chip label={selectedProduct.brand} size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 10, height: 20 }} />
                  </Box>
                  <Typography sx={{ fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', mt: 0.4 }}>
                    SKU: {selectedProduct.sku}
                  </Typography>
                </Box>

                {/* close button */}
                <Button size="small" onClick={() => setSelectedProduct(null)}
                  sx={{
                    position: 'absolute', top: 10, right: 10,
                    minWidth: 0, p: 1,
                    bgcolor: 'rgba(255, 255, 255, 0)', color: '#fff', borderRadius: '500',
                  }}
                >
                  <Close sx={{ fontSize: 17 }} />
                </Button>
              </Box>

              <DialogContent sx={{ p: 0 }}>
                {/* Price row */}
                <Box sx={{
                  px: 3, py: 2.5,
                  borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 800, color: theme.palette.custom.status.error.main }}>
                      {formatCurrency(selectedProduct.price)}
                    </Typography>
                    {selectedProduct.originalPrice && (
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                        {formatCurrency(selectedProduct.originalPrice)}
                      </Typography>
                    )}
                  </Box>
                  {selectedProduct.originalPrice && (
                    <Chip
                      label={`-${Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}%`}
                      size="small"
                      sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: 12, height: 24, px: 0.5 }}
                    />
                  )}
                </Box>

                {/* Stats row */}
                <Box sx={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                }}>
                  {[
                    { icon: <Star sx={{ fontSize: 15, color: '#F59E0B' }} />, label: 'Rating', value: `${selectedProduct.rating.toFixed(1)} (${selectedProduct.reviewCount})` },
                    { icon: <ShoppingCart sx={{ fontSize: 15, color: theme.palette.custom.status.info.main }} />, label: 'Total Sold', value: selectedProduct.sold.toLocaleString() },
                    { icon: <Inventory sx={{ fontSize: 15, color: theme.palette.custom.status.warning.main }} />, label: 'In Stock', value: String(selectedProduct.stock) },
                  ].map((s, i) => (
                    <Box key={s.label} sx={{
                      py: 2, px: 1.5, textAlign: 'center',
                      borderRight: i < 2 ? `1px solid ${theme.palette.custom.border.light}` : 'none',
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>{s.icon}</Box>
                      <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500], mb: 0.25 }}>{s.label}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>{s.value}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Description */}
                <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
                  <Typography sx={{
                    fontSize: 10, fontWeight: 700, color: theme.palette.custom.neutral[400],
                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 1,
                  }}>
                    Description
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700], lineHeight: 1.75 }}>
                    {selectedProduct.description}
                  </Typography>
                </Box>

                {/* Footer meta */}
                <Box sx={{
                  mx: 3, mb: 2,
                  px: 2, py: 1.5,
                  bgcolor: theme.palette.custom.neutral[50],
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.border.light}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                    Listed on <strong>{formatDate(selectedProduct.createdAt)}</strong>
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                    ID: <strong>{selectedProduct.id}</strong>
                  </Typography>
                </Box>
              </DialogContent>

              <DialogActions sx={{
                px: 3, py: 2,
                borderTop: `1px solid ${theme.palette.custom.border.light}`,
                gap: 1.5,
              }}>
                <Button onClick={() => setSelectedProduct(null)} variant="outlined"
                  sx={{ flex: 1, borderRadius: 2, color: theme.palette.custom.neutral[600], borderColor: theme.palette.custom.border.main }}>
                  Close
                </Button>
                <Button variant="contained" startIcon={<Visibility />}
                  sx={{ flex: 2, borderRadius: 2, fontWeight: 600 }}>
                  View Full Details
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onClose={() => !togglingStatus && setDeactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Deactivate Shop</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 2.5 }}>
            This will deactivate <strong>{shop.shopName}</strong>. Customers will not be able to view or order from this shop.
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            label="Reason for deactivation"
            placeholder="Please provide a reason..."
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
            disabled={togglingStatus}
            required
            sx={{ mb: 2.5 }}
          />
          <TextField
            fullWidth type="date"
            label="End Date"
            value={deactivateEndDate}
            onChange={(e) => setDeactivateEndDate(e.target.value)}
            disabled={togglingStatus}
            required
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: new Date().toISOString().split('T')[0] } }}
            helperText="Select the date when the deactivation should take effect"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeactivateDialogOpen(false)} disabled={togglingStatus}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={handleDeactivate}
            disabled={togglingStatus || !deactivateReason.trim() || !deactivateEndDate}
            startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}
          >
            {togglingStatus ? 'Deactivating...' : 'Confirm Deactivate'}
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

      {/* Close Shop Dialog */}
      <Dialog open={closeShopDialogOpen} onClose={() => !togglingStatus && setCloseShopDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: theme.palette.custom.status.error.main }}>Close Shop Permanently</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2.5 }}>
            This will permanently close <strong>{shop.shopName}</strong> after 30 days. All products will be removed.
          </Alert>
          <TextField
            fullWidth multiline rows={3}
            label="Reason for closing"
            placeholder="Please provide a reason..."
            value={closeShopReason}
            onChange={(e) => setCloseShopReason(e.target.value)}
            disabled={togglingStatus}
            required
            sx={{ mb: 2.5 }}
          />
          <FormControlLabel
            control={<Checkbox checked={closeShopConfirm} onChange={(e) => setCloseShopConfirm(e.target.checked)} disabled={togglingStatus} />}
            label={
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                I understand that this shop will be permanently closed after 30 days and this action cannot be reversed.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCloseShopDialogOpen(false)} disabled={togglingStatus}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={handleCloseShop}
            disabled={togglingStatus || !closeShopReason.trim() || !closeShopConfirm}
            startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}
          >
            {togglingStatus ? 'Submitting...' : 'Close Shop'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
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
