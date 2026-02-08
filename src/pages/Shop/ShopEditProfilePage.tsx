import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  Save,
  Lock,
  Info,
  CameraAlt,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { useLayout } from '../../layouts/LayoutContext';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import { ghnApi } from '@/api/ghnApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopDetailResponse, UpdateShopRequest, GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import { toast } from 'react-toastify';

const SHOP_NAME_CHANGE_DAYS = 60;

const ShopEditProfilePage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { setShowNavbar, setShowFooter } = useLayout();
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateShopRequest>({
    shopName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    logoUrl: '',
    businessLicense: '',
    taxId: '',
    ghnProvinceId: undefined,
    ghnDistrictId: undefined,
    ghnWardCode: '',
  });

  // GHN location state
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  useEffect(() => {
    fetchShop();
  }, []);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await ghnApi.getProvinces();
        setProvinces(res.data || []);
      } catch (err) {
        console.error('Failed to fetch provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!formData.ghnProvinceId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await ghnApi.getDistricts(formData.ghnProvinceId!);
        setDistricts(res.data || []);
      } catch (err) {
        console.error('Failed to fetch districts:', err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [formData.ghnProvinceId]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!formData.ghnDistrictId) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await ghnApi.getWards(formData.ghnDistrictId!);
        setWards(res.data || []);
      } catch (err) {
        console.error('Failed to fetch wards:', err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [formData.ghnDistrictId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const response = await shopApi.getMyShop();
      if (response.data) {
        setShop(response.data);
        setFormData({
          shopName: response.data.shopName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          logoUrl: response.data.logoUrl || '',
          businessLicense: response.data.businessLicense || '',
          taxId: response.data.taxId || '',
          ghnProvinceId: response.data.ghnProvinceId,
          ghnDistrictId: response.data.ghnDistrictId,
          ghnWardCode: response.data.ghnWardCode || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const canChangeShopName = (): boolean => {
    if (!shop?.createdAt) return false;
    const created = new Date(shop.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= SHOP_NAME_CHANGE_DAYS;
  };

  const getDaysUntilNameChange = (): number => {
    if (!shop?.createdAt) return SHOP_NAME_CHANGE_DAYS;
    const created = new Date(shop.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, SHOP_NAME_CHANGE_DAYS - diffDays);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const response = await shopApi.uploadLogo(file);
      if (response.data?.logoUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: response.data!.logoUrl }));
        setShop((prev) => prev ? { ...prev, logoUrl: response.data!.logoUrl } : prev);
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof UpdateShopRequest) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: UpdateShopRequest = { ...formData };
      if (!canChangeShopName()) {
        delete payload.shopName;
      }
      await shopApi.updateMyShop(payload);
      toast.success('Shop profile updated successfully');
      fetchShop();
    } catch (error) {
      console.error('Failed to update shop:', error);
      toast.error('Failed to update shop profile');
    } finally {
      setSaving(false);
    }
  };

  const nameChangeable = canChangeShopName();
  const daysLeft = getDaysUntilNameChange();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar
          activeMenu={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE}
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
          activeMenu={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE}
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE}
        shopName={shop.shopName}
        shopLogo={shop.logoUrl}
        ownerName={shop.ownerName || user?.fullName}
        ownerEmail={shop.ownerEmail || user?.email}
      />

      <Box sx={{ flex: 1, p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Edit Shop Profile
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Update your shop information
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{ height: 40, px: 3 }}
          >
            Save Changes
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Logo with upload */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                variant="rounded"
                src={shop.logoUrl}
                sx={{ width: 80, height: 80, bgcolor: theme.palette.custom.neutral[100] }}
              >
                <Store sx={{ fontSize: 40 }} />
              </Avatar>
              <Box
                onClick={() => logoInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: `2px solid ${theme.palette.background.paper}`,
                  '&:hover': { bgcolor: theme.palette.custom.neutral[700] },
                }}
              >
                {uploadingLogo ? (
                  <CircularProgress size={14} sx={{ color: '#fff' }} />
                ) : (
                  <CameraAlt sx={{ fontSize: 14, color: '#fff' }} />
                )}
              </Box>
              <input
                ref={logoInputRef}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                {shop.shopName}
              </Typography>
              <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 1 }}>
                Shop Code: {shop.shopCode}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={shop.status} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                <Chip label={shop.tier} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 11 }} />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Shop Name Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
            Shop Name
          </Typography>

          {!nameChangeable && (
            <Alert
              severity="warning"
              icon={<Lock fontSize="small" />}
              sx={{ mb: 2, borderRadius: 1.5 }}
            >
              Shop name can only be changed after 60 days from creation.
              {/* You have <strong>{daysLeft} days</strong> remaining. */}
            </Alert>
          )}

          <Tooltip
            title={!nameChangeable ? `Available in ${daysLeft} days` : ''}
            placement="top"
          >
            <TextField
              label="Shop Name"
              fullWidth
              value={formData.shopName}
              onChange={handleChange('shopName')}
              disabled={!nameChangeable}
              InputProps={{
                endAdornment: !nameChangeable ? (
                  <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                ) : undefined,
              }}
            />
          </Tooltip>
        </Paper>

        {/* Contact Information */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>
            Contact Information
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                fullWidth
                value={formData.email}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Address */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>
            Address
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                fullWidth
                value={formData.address}
                onChange={handleChange('address')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="City"
                fullWidth
                value={formData.city}
                onChange={handleChange('city')}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Business Information */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>
            Business Information
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Business License"
                fullWidth
                value={formData.businessLicense}
                onChange={handleChange('businessLicense')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Tax ID"
                fullWidth
                value={formData.taxId}
                onChange={handleChange('taxId')}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* GHN Shipping Information */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 1 }}>
            GHN Shipping Information
          </Typography>
          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Info sx={{ fontSize: 16 }} />
            GHN Shop ID cannot be changed
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="GHN Shop ID"
                fullWidth
                value={shop.ghnShopId ?? ''}
                disabled
                InputProps={{
                  endAdornment: (
                    <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Province</InputLabel>
                <Select
                  value={formData.ghnProvinceId ? String(formData.ghnProvinceId) : ''}
                  label="Province"
                  disabled={loadingProvinces}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    setFormData((prev) => ({
                      ...prev,
                      ghnProvinceId: value,
                      ghnDistrictId: undefined,
                      ghnWardCode: '',
                    }));
                  }}
                >
                  {provinces.map((p) => (
                    <MenuItem key={p.ProvinceID} value={String(p.ProvinceID)}>
                      {p.ProvinceName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>District</InputLabel>
                <Select
                  value={formData.ghnDistrictId ? String(formData.ghnDistrictId) : ''}
                  label="District"
                  disabled={!formData.ghnProvinceId || loadingDistricts}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    setFormData((prev) => ({
                      ...prev,
                      ghnDistrictId: value,
                      ghnWardCode: '',
                    }));
                  }}
                >
                  {districts.map((d) => (
                    <MenuItem key={d.DistrictID} value={String(d.DistrictID)}>
                      {d.DistrictName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Ward</InputLabel>
                <Select
                  value={formData.ghnWardCode || ''}
                  label="Ward"
                  disabled={!formData.ghnDistrictId || loadingWards}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      ghnWardCode: e.target.value,
                    }));
                  }}
                >
                  {wards.map((w) => (
                    <MenuItem key={w.WardCode} value={w.WardCode}>
                      {w.WardName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Read-only Info */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
            bgcolor: theme.palette.custom.neutral[50],
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>
            Read-only Information
          </Typography>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Shop Code
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shop.shopCode}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Owner Name
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shop.ownerName || 'N/A'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Owner Email
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shop.ownerEmail || 'N/A'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Status
              </Typography>
              <Chip
                label={shop.status}
                size="small"
                sx={{ fontWeight: 600, fontSize: 12, mt: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Tier
              </Typography>
              <Chip
                label={shop.tier}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: 12, mt: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Verified
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shop.isVerified ? 'Yes' : 'No'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>
                Created At
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {shop.createdAt
                  ? new Date(shop.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default ShopEditProfilePage;
