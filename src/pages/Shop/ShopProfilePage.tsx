import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Tabs,
  Tab,
  Rating,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Edit,
  Store,
  Inventory,
  ShoppingCart,
  Star,
  TrendingUp,
  CheckCircle,
  LocationOn,
  Phone,
  Email,
  CalendarMonth,
  Verified,
  WorkspacePremium,
  AttachMoney,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopApi, type ShopAnalyticsSummary } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { formatCurrency } from '@/utils/formatCurrency';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

const TIER_COLOR: Record<string, string> = {
  BRONZE: '#cd7f32',
  SILVER: '#9e9e9e',
  GOLD: '#fbc02d',
  PLATINUM: '#5c6bc0',
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const ShopProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [analytics, setAnalytics] = useState<ShopAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const shopRes = await shopApi.getMyShops();
        const shopData = shopRes.data?.[0] ?? null;
        setShop(shopData);

        if (shopData?.id) {
          const summaryRes = await shopApi.getAnalyticsSummary(shopData.id);
          if (summaryRes.data) setAnalytics(summaryRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch shop profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({
    icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.custom.border.light}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: color + '20',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 0.5 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            {value}
          </Typography>
          {subValue && (
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{subValue}</Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: theme.palette.custom.neutral[500] }}>No shop data found.</Typography>
      </Box>
    );
  }

  const tierColor = shop.commissionTierName ? (TIER_COLOR[shop.commissionTierName] ?? '#757575') : '#757575';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box
            component="button"
            onClick={() => navigate(-1)}
            sx={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', p: 1, borderRadius: 1 }}
          >
            <ArrowBack />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Shop Profile
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            sx={{ mr: 1 }}
            onClick={() => navigate(PAGE_ENDPOINTS.SHOP.EDIT_PROFILE)}
          >
            Edit Profile
          </Button>
        </Box>

        {/* Shop Header Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Avatar
              variant="rounded"
              src={shop.logoUrl}
              sx={{
                width: 100,
                height: 100,
                bgcolor: theme.palette.custom.neutral[100],
                fontSize: 32,
              }}
            >
              <Store sx={{ fontSize: 48 }} />
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                  {shop.shopName}
                </Typography>
                {shop.isVerified && (
                  <Verified sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }} />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {shop.avgRating != null && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={shop.avgRating} precision={0.1} readOnly size="small" />
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>
                      {Number(shop.avgRating).toFixed(1)}
                    </Typography>
                  </Box>
                )}
                {shop.commissionTierName && (
                  <Chip
                    icon={<WorkspacePremium sx={{ fontSize: 14, color: tierColor + ' !important' }} />}
                    label={shop.commissionTierName}
                    size="small"
                    sx={{
                      bgcolor: tierColor + '20',
                      color: tierColor,
                      fontWeight: 700,
                      border: `1px solid ${tierColor}50`,
                    }}
                  />
                )}
                <Chip
                  label={`${shop.commissionRate ?? 'N/A'}% commission`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.custom.neutral[100],
                    color: theme.palette.custom.neutral[600],
                    fontWeight: 500,
                  }}
                />
                <Chip
                  label={shop.status}
                  size="small"
                  sx={{
                    bgcolor: shop.status === 'ACTIVE'
                      ? theme.palette.custom.status.success.light
                      : theme.palette.custom.neutral[100],
                    color: shop.status === 'ACTIVE'
                      ? theme.palette.custom.status.success.main
                      : theme.palette.custom.neutral[500],
                    fontWeight: 500,
                  }}
                />
              </Box>

              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], maxWidth: 600 }}>
                {shop.city ?? ''}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500], mb: 0.5 }}>
                <CalendarMonth sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Joined {shop.joinedAt ? new Date(shop.joinedAt).toLocaleDateString('vi-VN') : 'N/A'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                Code: {shop.shopCode}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<Inventory sx={{ fontSize: 24, color: theme.palette.custom.status.info.main }} />}
              label="Total Products"
              value={shop.totalProducts ?? 0}
              color={theme.palette.custom.status.info.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<ShoppingCart sx={{ fontSize: 24, color: theme.palette.custom.status.success.main }} />}
              label="Total Orders"
              value={formatNumber(shop.totalOrders ?? 0)}
              color={theme.palette.custom.status.success.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<AttachMoney sx={{ fontSize: 24, color: theme.palette.custom.status.warning.main }} />}
              label="Total Revenue"
              value={analytics ? formatCurrency(analytics.totalRevenue) : '—'}
              color={theme.palette.custom.status.warning.main}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<Star sx={{ fontSize: 24, color: theme.palette.custom.status.rose.main }} />}
              label="Shop Rating"
              value={shop.avgRating != null ? Number(shop.avgRating).toFixed(1) + '/5' : 'N/A'}
              color={theme.palette.custom.status.rose.main}
            />
          </Grid>
        </Grid>

        {/* Commission Tier & Contact Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Commission Tier Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 3 }}>
                Commission Info
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: tierColor + '20',
                  }}
                >
                  <WorkspacePremium sx={{ fontSize: 28, color: tierColor }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                    CURRENT TIER
                  </Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: tierColor }}>
                    {shop.commissionTierName ?? 'BRONZE'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                  Commission Rate
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: theme.palette.custom.status.error.main }}>
                  {shop.commissionRate != null ? `${shop.commissionRate}%` : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                  Avg Order Value
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  {analytics?.avgOrderValue != null ? formatCurrency(analytics.avgOrderValue) : '—'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                  Total Orders (analytics)
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                  {analytics?.totalOrders != null ? analytics.totalOrders.toLocaleString() : '—'}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Contact Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                height: '100%',
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 3 }}>
                Contact Information
              </Typography>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  OWNER
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 16, color: theme.palette.custom.status.success.main }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.ownerName ?? 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  PHONE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.phone ?? 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  EMAIL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 16, color: theme.palette.custom.status.info.main }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {shop.email ?? 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.5 }}>
                  ADDRESS
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: theme.palette.custom.status.error.main, mt: 0.3 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                    {[shop.address, shop.city].filter(Boolean).join(', ') || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ borderBottom: `1px solid ${theme.palette.custom.border.light}` }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                },
              }}
            >
              <Tab label={`Products (${shop.totalProducts ?? 0})`} />
              <Tab label="Orders" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500], mb: 2 }}>
                Manage your products in the Products section
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(PAGE_ENDPOINTS.SHOP.PRODUCT_FRAME)}
              >
                Go to Products
              </Button>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <ShoppingCart sx={{ fontSize: 64, color: theme.palette.custom.neutral[300], mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: theme.palette.custom.neutral[500], mb: 2 }}>
                Manage your orders in the Orders section
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(PAGE_ENDPOINTS.SHOP.ORDERS)}
              >
                Go to Orders
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopProfilePage;
