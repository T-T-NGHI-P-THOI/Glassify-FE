import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Rating,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  ShoppingCart,
  Inventory,
  Star,
  VerifiedUser,
  Email,
  Phone,
  LocationOn,
  Business,
  Person,
  AccessTime,
  Visibility,
  LocalShipping,
  AccountBalance,
  TrendingUp,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import { ghnApi } from '@/api/ghnApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopDetailResponse, ShopStatus, ShopTier } from '@/models/Shop';

const ShopDashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { setShowNavbar, setShowFooter } = useLayout();
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [ghnNames, setGhnNames] = useState({ province: '', district: '', ward: '' });

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  useEffect(() => {
    fetchShopDetail();
  }, []);

  // Resolve GHN province/district/ward names
  useEffect(() => {
    if (!shop) return;
    const resolveGhnNames = async () => {
      const names = { province: '', district: '', ward: '' };
      try {
        if (shop.ghnProvinceId) {
          const provRes = await ghnApi.getProvinces();
          const prov = (provRes.data || []).find((p) => p.ProvinceID === shop.ghnProvinceId);
          if (prov) names.province = prov.ProvinceName;
        }
        if (shop.ghnDistrictId && shop.ghnProvinceId) {
          const distRes = await ghnApi.getDistricts(shop.ghnProvinceId);
          const dist = (distRes.data || []).find((d) => d.DistrictID === shop.ghnDistrictId);
          if (dist) names.district = dist.DistrictName;
        }
        if (shop.ghnWardCode && shop.ghnDistrictId) {
          const wardRes = await ghnApi.getWards(shop.ghnDistrictId);
          const ward = (wardRes.data || []).find((w) => w.WardCode === shop.ghnWardCode);
          if (ward) names.ward = ward.WardName;
        }
      } catch (err) {
        console.error('Failed to resolve GHN names:', err);
      }
      setGhnNames(names);
    };
    resolveGhnNames();
  }, [shop]);

  const fetchShopDetail = async () => {
    try {
      setLoading(true);
      const response = await shopApi.getMyShop();
      if (response.data) {
        setShop(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch shop detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ShopStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: theme.palette.custom.status.success.light,
          color: theme.palette.custom.status.success.main,
        };
      case 'PENDING':
        return {
          bg: theme.palette.custom.status.warning.light,
          color: theme.palette.custom.status.warning.main,
        };
      case 'SUSPENDED':
        return {
          bg: theme.palette.custom.status.error.light,
          color: theme.palette.custom.status.error.main,
        };
      case 'INACTIVE':
        return {
          bg: theme.palette.custom.neutral[100],
          color: theme.palette.custom.neutral[500],
        };
      default:
        return {
          bg: theme.palette.custom.neutral[100],
          color: theme.palette.custom.neutral[500],
        };
    }
  };

  const getTierColor = (tier: ShopTier) => {
    switch (tier) {
      case 'PLATINUM':
        return {
          bg: theme.palette.custom.status.purple.light,
          color: theme.palette.custom.status.purple.main,
        };
      case 'GOLD':
        return {
          bg: theme.palette.custom.status.warning.light,
          color: theme.palette.custom.status.warning.main,
        };
      case 'SILVER':
        return {
          bg: theme.palette.custom.status.info.light,
          color: theme.palette.custom.status.info.main,
        };
      case 'BRONZE':
      default:
        return {
          bg: theme.palette.custom.neutral[100],
          color: theme.palette.custom.neutral[600],
        };
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.DASHBOARD}
          shopName={user?.shop?.shopName}
          shopLogo={user?.shop?.shopLogo}
          ownerName={user?.fullName}
          ownerEmail={user?.email}
        />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.DASHBOARD}
          shopName={user?.shop?.shopName}
          shopLogo={user?.shop?.shopLogo}
          ownerName={user?.fullName}
          ownerEmail={user?.email}
        />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
          <Store sx={{ fontSize: 64, color: theme.palette.custom.neutral[300] }} />
          <Typography sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }}>
            Shop information not available
          </Typography>
        </Box>
      </Box>
    );
  }

  const stats = [
    {
      icon: <ShoppingCart sx={{ color: theme.palette.custom.status.info.main }} />,
      label: 'Total Orders',
      value: (shop.totalOrders ?? 0).toLocaleString(),
      bgColor: theme.palette.custom.status.info.light,
    },
    {
      icon: <Inventory sx={{ color: theme.palette.custom.status.purple.main }} />,
      label: 'Total Products',
      value: (shop.totalProducts ?? 0).toLocaleString(),
      bgColor: theme.palette.custom.status.purple.light,
    },
    {
      icon: <Star sx={{ color: theme.palette.custom.status.warning.main }} />,
      label: 'Avg Rating',
      value: shop.avgRating != null ? shop.avgRating.toFixed(1) : '0.0',
      bgColor: theme.palette.custom.status.warning.light,
    },
    {
      icon: <TrendingUp sx={{ color: theme.palette.custom.status.success.main }} />,
      label: 'Commission Rate',
      value: shop.commissionRate != null ? `${shop.commissionRate}%` : 'N/A',
      bgColor: theme.palette.custom.status.success.light,
    },
  ];

  const statusStyle = getStatusColor(shop.status);
  const tierStyle = getTierColor(shop.tier);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Sidebar */}
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.DASHBOARD}
        shopName={shop.shopName}
        shopLogo={shop.logoUrl}
        ownerName={shop.ownerName || user?.fullName}
        ownerEmail={shop.ownerEmail || user?.email}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Shop Dashboard
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Overview of your shop information and performance
            </Typography>
          </Box>
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
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Shop Info Cards */}
        <Grid container spacing={3}>
          {/* Shop Profile Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  Shop Information
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => setDetailDialogOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    borderColor: theme.palette.custom.border.main,
                    color: theme.palette.custom.neutral[700],
                    '&:hover': {
                      borderColor: theme.palette.custom.neutral[400],
                      bgcolor: theme.palette.custom.neutral[50],
                    },
                  }}
                >
                  View Details
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar
                  variant="rounded"
                  src={shop.logoUrl}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: theme.palette.custom.neutral[100],
                    fontSize: 32,
                  }}
                >
                  <Store sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                      {shop.shopName}
                    </Typography>
                    {shop.isVerified && (
                      <VerifiedUser sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 1.5 }}>
                    Shop Code: {shop.shopCode}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={shop.status}
                      size="small"
                      sx={{
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    />
                    <Chip
                      label={shop.tier}
                      size="small"
                      sx={{
                        bgcolor: tierStyle.bg,
                        color: tierStyle.color,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    />
                    {shop.isVerified && (
                      <Chip
                        label="Verified"
                        size="small"
                        icon={<VerifiedUser sx={{ fontSize: 14 }} />}
                        sx={{
                          bgcolor: theme.palette.custom.status.success.light,
                          color: theme.palette.custom.status.success.main,
                          fontWeight: 600,
                          fontSize: 12,
                          '& .MuiChip-icon': { color: theme.palette.custom.status.success.main },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Contact Info */}
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.info.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Email sx={{ fontSize: 18, color: theme.palette.custom.status.info.main }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                        Email
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {shop.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.success.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone sx={{ fontSize: 18, color: theme.palette.custom.status.success.main }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                        Phone
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {shop.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.error.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocationOn sx={{ fontSize: 18, color: theme.palette.custom.status.error.main }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                        Address
                      </Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                        {shop.address}{shop.city ? `, ${shop.city}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Owner & Rating Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Owner Info */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.border.light}`,
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>
                  Owner Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[200] }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {shop.ownerName || 'N/A'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                      {shop.ownerEmail || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Rating Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.border.light}`,
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                  Shop Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: 36, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                    {shop.avgRating != null ? shop.avgRating.toFixed(1) : '0.0'}
                  </Typography>
                  <Box>
                    <Rating
                      value={shop.avgRating ?? 0}
                      precision={0.1}
                      readOnly
                      size="small"
                    />
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                      Based on customer reviews
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Joined Date Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.border.light}`,
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                  Membership
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: theme.palette.custom.status.indigo.light,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AccessTime sx={{ fontSize: 18, color: theme.palette.custom.status.indigo.main }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                      Joined At
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {formatDate(shop.joinedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Detail Dialog */}
      <ShopDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        shop={shop}
        getStatusColor={getStatusColor}
        getTierColor={getTierColor}
        formatDate={formatDate}
        ghnNames={ghnNames}
      />
    </Box>
  );
};

// ==================== Shop Detail Dialog ====================
interface ShopDetailDialogProps {
  open: boolean;
  onClose: () => void;
  shop: ShopDetailResponse;
  getStatusColor: (status: ShopStatus) => { bg: string; color: string };
  getTierColor: (tier: ShopTier) => { bg: string; color: string };
  formatDate: (dateString: string | null | undefined) => string;
  ghnNames: { province: string; district: string; ward: string };
}

const ShopDetailDialog = ({
  open,
  onClose,
  shop,
  getStatusColor,
  getTierColor,
  formatDate,
  ghnNames,
}: ShopDetailDialogProps) => {
  const theme = useTheme();
  const statusStyle = getStatusColor(shop.status);
  const tierStyle = getTierColor(shop.tier);

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
        {value ?? 'N/A'}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Dialog Title */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            variant="rounded"
            src={shop.logoUrl}
            sx={{ width: 56, height: 56, bgcolor: theme.palette.custom.neutral[100] }}
          >
            <Store sx={{ fontSize: 28 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {shop.shopName}
              </Typography>
              {shop.isVerified && (
                <VerifiedUser sx={{ fontSize: 20, color: theme.palette.custom.status.success.main }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                label={shop.status}
                size="small"
                sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 11 }}
              />
              <Chip
                label={shop.tier}
                size="small"
                sx={{ bgcolor: tierStyle.bg, color: tierStyle.color, fontWeight: 600, fontSize: 11 }}
              />
              <Chip
                label={shop.shopCode}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: 11, borderColor: theme.palette.custom.border.main }}
              />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Shop Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Business sx={{ fontSize: 18 }} />
              Shop Information
            </Typography>

            <InfoRow label="Shop Name" value={shop.shopName} />
            <InfoRow label="Shop Code" value={shop.shopCode} />
            <InfoRow label="Email" value={shop.email} />
            <InfoRow label="Phone" value={shop.phone} />
            <InfoRow label="Tax ID" value={shop.taxId} />
            <InfoRow label="Business License" value={shop.businessLicense} />
          </Grid>

          {/* Owner Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Person sx={{ fontSize: 18 }} />
              Owner Information
            </Typography>

            <InfoRow label="Owner Name" value={shop.ownerName} />
            <InfoRow label="Owner Email" value={shop.ownerEmail} />
            <InfoRow label="Owner ID" value={shop.ownerId} />
          </Grid>

          {/* Address */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LocationOn sx={{ fontSize: 18 }} />
              Address
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow label="Address" value={shop.address} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow label="City" value={shop.city} />
              </Grid>
            </Grid>
          </Grid>

          {/* GHN Shipping Info */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LocalShipping sx={{ fontSize: 18 }} />
              GHN Shipping Info
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="GHN Shop ID" value={shop.ghnShopId} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Province" value={ghnNames.province || shop.ghnProvinceId} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="District" value={ghnNames.district || shop.ghnDistrictId} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Ward" value={ghnNames.ward || shop.ghnWardCode} />
              </Grid>
            </Grid>
          </Grid>

          {/* Performance Stats */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AccountBalance sx={{ fontSize: 18 }} />
              Performance & Billing
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Total Orders" value={(shop.totalOrders ?? 0).toLocaleString()} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Total Products" value={(shop.totalProducts ?? 0).toLocaleString()} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                    Avg Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                      {shop.avgRating != null ? shop.avgRating.toFixed(1) : '0.0'}
                    </Typography>
                    <Rating value={shop.avgRating ?? 0} precision={0.1} readOnly size="small" />
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InfoRow label="Commission Rate" value={shop.commissionRate != null ? `${shop.commissionRate}%` : 'N/A'} />
              </Grid>
            </Grid>
          </Grid>

          {/* Verification & Tier */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <VerifiedUser sx={{ fontSize: 18 }} />
              Status & Verification
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={shop.status}
                    size="small"
                    sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 12 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                    Tier
                  </Typography>
                  <Chip
                    label={shop.tier}
                    size="small"
                    sx={{ bgcolor: tierStyle.bg, color: tierStyle.color, fontWeight: 600, fontSize: 12 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                    Verified
                  </Typography>
                  <Chip
                    label={shop.isVerified ? 'Yes' : 'No'}
                    size="small"
                    sx={{
                      bgcolor: shop.isVerified
                        ? theme.palette.custom.status.success.light
                        : theme.palette.custom.neutral[100],
                      color: shop.isVerified
                        ? theme.palette.custom.status.success.main
                        : theme.palette.custom.neutral[500],
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Timestamps */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AccessTime sx={{ fontSize: 18 }} />
              Timestamps
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoRow label="Joined At" value={formatDate(shop.joinedAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoRow label="Created At" value={formatDate(shop.createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InfoRow label="Updated At" value={formatDate(shop.updatedAt)} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShopDashboardPage;
