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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Store,
  Save,
  Lock,
  Info,
  CameraAlt,
  PowerSettingsNew,
  Send,
  AccessTime,
  Verified,
  WorkspacePremium,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import { ghnApi } from '@/api/ghnApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopDetailResponse, UpdateShopRequest, ShopRegisterRequest, GhnProvince, GhnDistrict, GhnWard, BusinessLicenseRequest } from '@/models/Shop';
import type { DeactivationStatus } from '@/api/shopApi';
import { toast } from 'react-toastify';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const SHOP_NAME_CHANGE_DAYS = 60;

const DEACTIVATE_REASONS = [
  'Going on vacation or holiday',
  'Temporary stock shortage',
  'Shop renovation or upgrade',
  'Personal or family emergency',
  'Seasonal business pause',
  'Technical issues',
];

const CLOSE_SHOP_REASONS = [
  'Switching to a different platform',
  'Retiring from business',
  'Low sales performance',
  'High operational costs',
  'Personal reasons',
  'Starting a new business',
];

const ShopEditProfilePage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateEndDate, setDeactivateEndDate] = useState('');
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [deactivationInfo, setDeactivationInfo] = useState<DeactivationStatus | null>(null);
  const [closeShopDialogOpen, setCloseShopDialogOpen] = useState(false);
  const [closeShopReason, setCloseShopReason] = useState('');
  const [closeShopConfirm, setCloseShopConfirm] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateShopRequest>({
    shopName: '',
    phone: '',
    address: '',
    city: '',
    logoUrl: '',
    ghnProvinceId: undefined,
    ghnDistrictId: undefined,
    ghnWardCode: '',
  });

  // Separate state for business license fields (editable on resubmit)
  const [licenseForm, setLicenseForm] = useState<BusinessLicenseRequest>({
    licenseNumber: '',
    businessName: '',
    legalRepresentative: '',
    registeredAddress: '',
    taxId: '',
    businessType: '',
    issuedDate: '',
    issuedBy: '',
    expiryDate: '',
    licenseImageUrl: '',
  });

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useLayoutConfig({ showNavbar: false, showFooter: false });

  useEffect(() => { fetchShop(); }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try { const res = await ghnApi.getProvinces(); setProvinces(res.data || []); }
      catch (err) { console.error('Failed to fetch provinces:', err); }
      finally { setLoadingProvinces(false); }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!formData.ghnProvinceId) { setDistricts([]); return; }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try { const res = await ghnApi.getDistricts(formData.ghnProvinceId!); setDistricts(res.data || []); }
      catch (err) { console.error('Failed to fetch districts:', err); }
      finally { setLoadingDistricts(false); }
    };
    fetchDistricts();
  }, [formData.ghnProvinceId]);

  useEffect(() => {
    if (!formData.ghnDistrictId) { setWards([]); return; }
    const fetchWards = async () => {
      setLoadingWards(true);
      try { const res = await ghnApi.getWards(formData.ghnDistrictId!); setWards(res.data || []); }
      catch (err) { console.error('Failed to fetch wards:', err); }
      finally { setLoadingWards(false); }
    };
    fetchWards();
  }, [formData.ghnDistrictId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const response = await shopApi.getMyShops();
      const shopData = response.data?.[0];
      if (shopData) {
        setShop(shopData);
        setFormData({
          shopName: shopData.shopName || '',
          phone: shopData.phone || '',
          address: shopData.address || '',
          city: shopData.city || '',
          logoUrl: shopData.logoUrl || '',
          ghnProvinceId: shopData.ghnProvinceId,
          ghnDistrictId: shopData.ghnDistrictId,
          ghnWardCode: shopData.ghnWardCode || '',
        });
        if (shopData.businessLicense) {
          setLicenseForm({
            licenseNumber: shopData.businessLicense.licenseNumber || '',
            businessName: shopData.businessLicense.businessName || '',
            legalRepresentative: shopData.businessLicense.legalRepresentative || '',
            registeredAddress: shopData.businessLicense.registeredAddress || '',
            taxId: shopData.businessLicense.taxId || '',
            businessType: shopData.businessLicense.businessType || '',
            issuedDate: shopData.businessLicense.issuedDate || '',
            issuedBy: shopData.businessLicense.issuedBy || '',
            expiryDate: shopData.businessLicense.expiryDate || '',
            licenseImageUrl: shopData.businessLicense.licenseImageUrl || '',
          });
        }
        try {
          const deactRes = await shopApi.getDeactivationStatus(shopData.id);
          setDeactivationInfo(deactRes.data ?? null);
        } catch {
          setDeactivationInfo(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const canChangeShopName = (): boolean => {
    if (!shop?.createdAt) return false;
    const diffDays = Math.floor((Date.now() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= SHOP_NAME_CHANGE_DAYS;
  };

  const getDaysUntilNameChange = (): number => {
    if (!shop?.createdAt) return SHOP_NAME_CHANGE_DAYS;
    const diffDays = Math.floor((Date.now() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, SHOP_NAME_CHANGE_DAYS - diffDays);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPG, PNG, and WEBP images are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
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

  const handleChange = (field: keyof UpdateShopRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLicenseChange = (field: keyof BusinessLicenseRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!shop?.id) return;
    try {
      setSaving(true);
      const payload: UpdateShopRequest = { ...formData };
      if (!canChangeShopName()) { delete payload.shopName; }
      await shopApi.updateMyShop(shop.id, payload);
      toast.success('Shop profile updated successfully');
      fetchShop();
    } catch (error) {
      console.error('Failed to update shop:', error);
      toast.error('Failed to update shop profile');
    } finally {
      setSaving(false);
    }
  };


  const handleDeactivate = async () => {
    if (!shop?.id) return;
    if (!deactivateReason.trim()) { toast.error('Please provide a reason for deactivation'); return; }
    if (!deactivateEndDate) { toast.error('Please select an end date'); return; }
    try {
      setTogglingStatus(true);
      await shopApi.deactivateRequest(shop.id, deactivateReason, deactivateEndDate);
      toast.success('Deactivation request submitted successfully');
      setDeactivateDialogOpen(false); setDeactivateReason(''); setDeactivateEndDate('');
      await fetchShop();
    } catch (error) {
      console.error('Failed to submit deactivation request:', error);
      toast.error((error as any).message || 'Failed to submit deactivation request');
    } finally { setTogglingStatus(false); }
  };

  const handleReactivate = async () => {
    if (!shop?.id) return;
    try {
      setTogglingStatus(true);
      await shopApi.reactivateRequest(shop.id);
      toast.success('Shop reactivated successfully');
      setReactivateDialogOpen(false);
      await fetchShop();
    } catch (error) {
      console.error('Failed to reactivate shop:', error);
      toast.error('Failed to reactivate shop');
    } finally { setTogglingStatus(false); }
  };

  const handleCancelDeactivate = async () => {
    if (!shop?.id) return;
    if (!window.confirm('Are you sure you want to cancel the deactivation request?')) return;
    try {
      setTogglingStatus(true);
      await shopApi.cancelDeactivate(shop.id);
      toast.success('Deactivation request cancelled');
      setDeactivationInfo(null);
      await fetchShop();
    } catch (error) {
      console.error('Failed to cancel deactivation:', error);
      toast.error('Failed to cancel deactivation request');
    } finally { setTogglingStatus(false); }
  };

  const handleCloseShop = async () => {
    if (!shop?.id) return;
    if (!closeShopReason.trim()) { toast.error('Please provide a reason for closing'); return; }
    if (!closeShopConfirm) { toast.error('Please confirm that you understand this action'); return; }
    try {
      setTogglingStatus(true);
      await shopApi.closeShop(shop.id, closeShopReason, closeShopConfirm);
      toast.success('Close shop request submitted successfully');
      setCloseShopDialogOpen(false); setCloseShopReason(''); setCloseShopConfirm(false);
      fetchShop();
    } catch (error) {
      console.error('Failed to submit close shop request:', error);
      toast.error((error as any).message || 'Failed to submit close shop request');
    } finally { setTogglingStatus(false); }
  };

  const handleCancelCloseShop = async () => {
    if (!shop?.id) return;
    if (!window.confirm('Are you sure you want to cancel the close shop request?')) return;
    try {
      setTogglingStatus(true);
      await shopApi.cancelCloseShop(shop.id);
      toast.success('Close shop request cancelled');
      fetchShop();
    } catch (error) {
      console.error('Failed to cancel close shop:', error);
      toast.error('Failed to cancel close shop request');
    } finally { setTogglingStatus(false); }
  };

  const handleResubmit = async () => {
    if (!shop?.id) return;
    try {
      setResubmitting(true);
      const selectedProvince = provinces.find((p) => p.ProvinceID === formData.ghnProvinceId);
      const selectedDistrict = districts.find((d) => d.DistrictID === formData.ghnDistrictId);
      const selectedWard = wards.find((w) => w.WardCode === formData.ghnWardCode);
      const resubmitData: ShopRegisterRequest = {
        shopName: formData.shopName || shop.shopName,
        email: shop.email,
        phone: formData.phone || shop.phone,
        address: formData.address || shop.address,
        city: formData.city || shop.city,
        logoUrl: formData.logoUrl || shop.logoUrl,
        ghnProvinceId: formData.ghnProvinceId || 0,
        ghnDistrictId: formData.ghnDistrictId || 0,
        ghnWardCode: formData.ghnWardCode || '',
        provinceName: selectedProvince?.ProvinceName || '',
        districtName: selectedDistrict?.DistrictName || '',
        wardName: selectedWard?.WardName || '',
        businessLicense: licenseForm,
      };
      await shopApi.resubmit(shop.id, resubmitData);
      toast.success('Shop registration resubmitted for review');
      fetchShop();
    } catch (error) {
      console.error('Failed to resubmit shop registration:', error);
      toast.error('Failed to resubmit shop registration');
    } finally { setResubmitting(false); }
  };

  // ── UI helpers ───────────────────────────────────────────────────────────
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
      case 'PENDING_DEACTIVATION': return { color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light, label: 'Pending Deactivation' };
      default: return { color: theme.palette.custom.neutral[500], bg: theme.palette.custom.neutral[100], label: status };
    }
  };

  // Format ngày dd/MM/yyyy
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Tính số ngày còn lại đến closeAt
  const getClosureDaysRemaining = (): number | null => {
    if (!shop) return null;
    // Lấy scheduledCloseAt nếu BE trả về, hoặc tính từ createdAt closing
    // Dùng deactivationInfo nếu có, hoặc tính xấp xỉ
    return 30; // mặc định 30 ngày theo backend CLOSURE_DELAY_DAYS
  };

  const nameChangeable = canChangeShopName();
  const daysLeft = getDaysUntilNameChange();
  const isShopInactive = shop?.status === 'INACTIVE';
  const isShopClosing = shop?.status === 'CLOSING';
  const isPendingReview = shop?.status === 'PENDING' && shop?.latestRequestStatus !== 'REJECTED';
  const isRequestRejected = shop?.status === 'PENDING' && shop?.latestRequestStatus === 'REJECTED';
  const isShopDisabled = isShopInactive || isShopClosing || isPendingReview;

  // Deactivation state derived from API
  const isScheduledDeactivation = deactivationInfo?.status === 'SCHEDULED';
  const withinDeactivationCancelWindow = isScheduledDeactivation &&
    !!deactivationInfo?.canCancelBefore &&
    new Date() < new Date(deactivationInfo.canCancelBefore);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar activeMenu={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE} shopName={user?.shop?.shopName} shopLogo={user?.shop?.logoUrl} ownerName={user?.fullName} ownerEmail={user?.email} ownerAvatar={user?.avatarUrl} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
        <ShopOwnerSidebar activeMenu={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE} shopName={user?.shop?.shopName} shopLogo={user?.shop?.logoUrl} ownerName={user?.fullName} ownerEmail={user?.email} ownerAvatar={user?.avatarUrl} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
          <Store sx={{ fontSize: 64, color: theme.palette.custom.neutral[300] }} />
          <Typography sx={{ fontSize: 18, color: theme.palette.custom.neutral[500] }}>Shop information not available</Typography>
        </Box>
      </Box>
    );
  }

  const statusCfg = getStatusConfig(shop.status);
  const tierCfg = getTierConfig(shop.tier);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      <ShopOwnerSidebar
        activeMenu={PAGE_ENDPOINTS.SHOP.EDIT_PROFILE}
        shopName={shop.shopName} shopLogo={shop.logoUrl}
        ownerName={shop.ownerName || user?.fullName} ownerEmail={shop.ownerEmail || user?.email}
        ownerAvatar={user?.avatarUrl}
      />

      <Box sx={{ flex: 1, overflow: 'auto' }}>

        <Box sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 60%, #ffffff 100%)',
          px: 4, pt: 3, pb: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* breadcrumb */}
          <Typography sx={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.38)', mb: 2.5, letterSpacing: 0.5 }}>
            Shop Management &nbsp;/&nbsp; Edit Profile
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, pb: 3 }}>

            {/* Left — avatar + name block */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>

              {/* Avatar */}
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  variant="rounded"
                  src={shop.logoUrl ?? undefined}
                  sx={{
                    width: 88, height: 88,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 3,
                    border: '2px solid rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <Store sx={{ fontSize: 40, color: 'rgba(0, 0, 0, 0.6)' }} />
                </Avatar>

                {/* Tier badge */}
                <Box sx={{
                  position: 'absolute', bottom: -7, right: -7,
                  bgcolor: tierCfg.bg, color: tierCfg.color,
                  borderRadius: 1, px: 0.75, py: 0.25,
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: 0.4,
                  border: `1px solid ${tierCfg.color}50`,
                }}>
                  <WorkspacePremium sx={{ fontSize: 11 }} />
                  {shop.tier}
                </Box>

                {/* Camera upload — top-right */}
                {!isShopDisabled && (
                  <Box
                    onClick={() => logoInputRef.current?.click()}
                    sx={{
                      position: 'absolute', top: -8, right: -8,
                      width: 26, height: 26, borderRadius: '50%',
                      bgcolor: '#ffffff26',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      border: '2px solid rgba(0, 0, 0, 0.5)',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      transition: 'background 0.15s',
                    }}
                  >
                    {uploadingLogo
                      ? <CircularProgress size={13} sx={{ color: '#334155' }} />
                      : <CameraAlt sx={{ fontSize: 13, color: '#334155' }} />}
                  </Box>
                )}
                <input ref={logoInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} disabled={isShopDisabled} />
              </Box>

              {/* Name / code / chips */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#000000', lineHeight: 1.2 }}>
                    {shop.shopName}
                  </Typography>
                  {shop.isVerified && (
                    <Tooltip title="Verified shop">
                      <Verified sx={{ fontSize: 22, color: '#0369A1' }} />
                    </Tooltip>
                  )}
                  {loading && <CircularProgress size={16} sx={{ color: '#94A3B8' }} />}
                </Box>

                <Typography sx={{ fontSize: 13, color: '#94A3B8', mb: 1.25, letterSpacing: 0.5 }}>
                  {shop.shopCode}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={statusCfg.label} size="small"
                    sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: 11, height: 22 }}
                  />
                  {shop.isVerified && (
                    <Chip
                      label="Verified" size="small"
                      icon={<Verified sx={{ fontSize: 12, color: '#0EA5E9 !important' }} />}
                      sx={{ bgcolor: '#F0F9FF', color: '#0369A1', fontWeight: 600, fontSize: 11, height: 22 }}
                    />
                  )}
                  <Chip
                    label={`${shop.commissionRate}% commission`} size="small"
                    sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500, fontSize: 11, height: 22 }}
                  />
                  {isScheduledDeactivation && (
                    <Chip
                      label="Pending Deactivation" size="small"
                      sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700, fontSize: 11, height: 22 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Right — action buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {/* ACTIVE + no pending deactivation → Deactivate */}
              {shop.status === 'ACTIVE' && !isScheduledDeactivation && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={() => setDeactivateDialogOpen(true)} disabled={togglingStatus}
                  sx={{ borderColor: '#FCA5A5', color: '#FCA5A5', '&:hover': { borderColor: '#F87171', bgcolor: 'rgba(248,113,113,0.1)' } }}>
                  Deactivate
                </Button>
              )}
              {/* Scheduled deactivation + within cancel window → Cancel Request */}
              {isScheduledDeactivation && withinDeactivationCancelWindow && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={handleCancelDeactivate} disabled={togglingStatus}
                  sx={{ borderColor: '#FCD34D', color: '#FCD34D', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}>
                  Cancel Request
                </Button>
              )}
              {/* INACTIVE → Reactivate */}
              {shop.status === 'INACTIVE' && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={() => setReactivateDialogOpen(true)} disabled={togglingStatus}
                  sx={{ borderColor: '#4ADE80', color: '#4ADE80', '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34,197,94,0.1)' } }}>
                  Reactivate
                </Button>
              )}
              {/* CLOSING → Cancel Close */}
              {isShopClosing && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={handleCancelCloseShop} disabled={togglingStatus}
                  sx={{ borderColor: '#FCD34D', color: '#FCD34D', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}>
                  Cancel Close
                </Button>
              )}
              {isRequestRejected && (
                <Button variant="outlined" startIcon={resubmitting ? <CircularProgress size={15} /> : <Send />} onClick={handleResubmit} disabled={resubmitting || saving}
                  sx={{ borderColor: '#93C5FD', color: '#93C5FD', '&:hover': { borderColor: '#60A5FA', bgcolor: 'rgba(96,165,250,0.1)' } }}>
                  {resubmitting ? 'Resubmitting...' : 'Resubmit'}
                </Button>
              )}
              {!isPendingReview && (
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={15} sx={{ color: '#1E293B' }} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving || isShopDisabled || resubmitting}
                  sx={{
                    bgcolor: '#fff', color: '#1E293B', fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
                    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.35)' },
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>

          {/* ── Alerts ── */}

          {isShopInactive && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your shop is currently <strong>inactive</strong>. Please reactivate your shop to make changes or receive orders.
            </Alert>
          )}

          {isShopClosing && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Your shop is in the <strong>closing process</strong>. It will be <strong>permanently closed after 30 days</strong> from the closure request date.
              All fields are disabled during this period. If you wish to keep your shop, click <strong>Cancel Close</strong> before the deadline.
            </Alert>
          )}

          {isPendingReview && (
            <Alert severity="warning" icon={<AccessTime />} sx={{ mb: 3, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Pending Approval</Typography>
              <Typography sx={{ fontSize: 14 }}>Your shop registration is currently being reviewed by our team. All fields are disabled until the review is complete.</Typography>
            </Alert>
          )}

          {isRequestRejected && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Registration Rejected</Typography>
              <Typography sx={{ fontSize: 14 }}>Your shop registration has been rejected. Please update your information and resubmit for review.</Typography>
              {shop.rejectionReason && <Typography sx={{ fontSize: 14, mt: 1 }}><strong>Reason:</strong> {shop.rejectionReason}</Typography>}
              {shop.adminComment && <Typography sx={{ fontSize: 14, mt: 0.5 }}><strong>Admin comment:</strong> {shop.adminComment}</Typography>}
            </Alert>
          )}

          {/* Alert: in-transit orders warning (deactivation allowed but orders ongoing) */}
          {shop.warning && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Orders Still in Transit</Typography>
              <Typography sx={{ fontSize: 14 }}>{shop.warning}</Typography>
            </Alert>
          )}

          {/* Alert: scheduled deactivation */}
          {isScheduledDeactivation && deactivationInfo && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Deactivation Scheduled</Typography>
              <Typography sx={{ fontSize: 14 }}>
                Your shop is scheduled to be <strong>deactivated at 23:59:59 tomorrow</strong>.
                {deactivationInfo.reactivateAt && (
                  <> It will automatically reactivate on <strong>{formatDate(String(deactivationInfo.reactivateAt))}</strong>.</>
                )}
              </Typography>
              {withinDeactivationCancelWindow && (
                <Typography sx={{ fontSize: 13, mt: 0.75, color: 'inherit' }}>
                  ⏱ You can still cancel this request before <strong>23:59:59 tomorrow</strong> using the <strong>Cancel Request</strong> button above.
                </Typography>
              )}
              {!withinDeactivationCancelWindow && (
                <Typography sx={{ fontSize: 13, mt: 0.75, color: 'inherit' }}>
                  ⚠ The cancellation window has passed. Deactivation is now in effect.
                </Typography>
              )}
            </Alert>
          )}

          {/* Shop Name */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>Shop Name</Typography>
            {!nameChangeable && !isRequestRejected && (
              <Alert severity="warning" icon={<Lock fontSize="small" />} sx={{ mb: 2, borderRadius: 1.5 }}>
                Shop name can only be changed after <strong>60 days</strong> from activation. Available in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
              </Alert>
            )}
            <Tooltip title={!nameChangeable && !isRequestRejected ? `Available in ${daysLeft} days` : ''} placement="top">
              <TextField
                label="Shop Name" fullWidth value={formData.shopName} onChange={handleChange('shopName')}
                disabled={(!nameChangeable && !isRequestRejected) || isShopDisabled}
                InputProps={{ endAdornment: (!nameChangeable && !isRequestRejected) || isShopInactive ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }}
              />
            </Tooltip>
          </Paper>

          {/* Contact */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>Contact Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email" fullWidth value={shop.email} disabled
                  InputProps={{ endAdornment: <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> }}
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Phone" fullWidth value={formData.phone} onChange={handleChange('phone')} disabled={isShopDisabled} />
              </Grid>
            </Grid>
          </Paper>

          {/* Address */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>Address</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}><TextField label="Address" fullWidth value={formData.address} onChange={handleChange('address')} disabled={isShopDisabled} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="City" fullWidth value={formData.city} onChange={handleChange('city')} disabled={isShopDisabled} /></Grid>
            </Grid>
          </Paper>

          {/* Business License */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>Business License</Typography>
            {!isRequestRejected && (
              <Alert severity="info" icon={<Info fontSize="small" />} sx={{ mb: 2, borderRadius: 1.5 }}>
                Business license information can only be edited when resubmitting after rejection.
              </Alert>
            )}
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="License Number" fullWidth value={licenseForm.licenseNumber} onChange={handleLicenseChange('licenseNumber')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Business Name" fullWidth value={licenseForm.businessName} onChange={handleLicenseChange('businessName')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Legal Representative" fullWidth value={licenseForm.legalRepresentative} onChange={handleLicenseChange('legalRepresentative')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Tax ID" fullWidth value={licenseForm.taxId} onChange={handleLicenseChange('taxId')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Business Type" fullWidth value={licenseForm.businessType} onChange={handleLicenseChange('businessType')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Registered Address" fullWidth value={licenseForm.registeredAddress} onChange={handleLicenseChange('registeredAddress')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Issued Date" fullWidth type="date" value={licenseForm.issuedDate ? licenseForm.issuedDate.split('T')[0] : ''} onChange={handleLicenseChange('issuedDate')} disabled={!isRequestRejected}
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Expiry Date" fullWidth type="date" value={licenseForm.expiryDate ? licenseForm.expiryDate.split('T')[0] : ''} onChange={handleLicenseChange('expiryDate')} disabled={!isRequestRejected}
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Issued By" fullWidth value={licenseForm.issuedBy} onChange={handleLicenseChange('issuedBy')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="License Image URL" fullWidth value={licenseForm.licenseImageUrl} onChange={handleLicenseChange('licenseImageUrl')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              {shop.businessLicense?.status && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>License Status:</Typography>
                    <Chip label={shop.businessLicense.status} size="small"
                      sx={{
                        fontWeight: 600, fontSize: 11,
                        bgcolor: shop.businessLicense.status === 'APPROVED' ? theme.palette.custom.status.success.light : theme.palette.custom.status.warning.light,
                        color: shop.businessLicense.status === 'APPROVED' ? theme.palette.custom.status.success.main : theme.palette.custom.status.warning.main,
                      }} />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* GHN */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 1 }}>GHN Shipping Information</Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Info sx={{ fontSize: 16 }} /> GHN Shop ID cannot be changed
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField label="GHN Shop ID" fullWidth value={shop.ghnShopId ?? ''} disabled InputProps={{ endAdornment: <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Province</InputLabel>
                  <Select value={formData.ghnProvinceId ? String(formData.ghnProvinceId) : ''} label="Province" disabled={loadingProvinces || isShopInactive || isPendingReview}
                    onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setFormData((p) => ({ ...p, ghnProvinceId: v, ghnDistrictId: undefined, ghnWardCode: '' })); }}>
                    {provinces.map((p) => <MenuItem key={p.ProvinceID} value={String(p.ProvinceID)}>{p.ProvinceName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>District</InputLabel>
                  <Select value={formData.ghnDistrictId ? String(formData.ghnDistrictId) : ''} label="District" disabled={!formData.ghnProvinceId || loadingDistricts || isShopInactive || isPendingReview}
                    onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setFormData((p) => ({ ...p, ghnDistrictId: v, ghnWardCode: '' })); }}>
                    {districts.map((d) => <MenuItem key={d.DistrictID} value={String(d.DistrictID)}>{d.DistrictName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Ward</InputLabel>
                  <Select value={formData.ghnWardCode || ''} label="Ward" disabled={!formData.ghnDistrictId || loadingWards || isShopInactive || isPendingReview}
                    onChange={(e) => setFormData((p) => ({ ...p, ghnWardCode: e.target.value }))}>
                    {wards.map((w) => <MenuItem key={w.WardCode} value={w.WardCode}>{w.WardName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Read-only */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, bgcolor: theme.palette.custom.neutral[50] }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>Read-only Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Shop Code</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.shopCode}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Owner Name</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.ownerName || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Owner Email</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.ownerEmail || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}><Divider sx={{ my: 0.5 }} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Status</Typography>
                <Chip label={shop.status} size="small" sx={{ fontWeight: 600, fontSize: 12, mt: 0.5 }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Tier</Typography>
                <Chip label={shop.tier} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: 12, mt: 0.5 }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Verified</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.isVerified ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Created At</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                </Typography>
              </Grid>
              {shop.totalOrders != null && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Total Orders</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.totalOrders}</Typography>
                </Grid>
              )}
              {shop.totalProducts != null && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Total Products</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.totalProducts}</Typography>
                </Grid>
              )}
              {shop.avgRating != null && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 0.25 }}>Avg Rating</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{shop.avgRating.toFixed(1)}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      </Box>

      {/* ── DIALOGS ─────────────────────────────────────────────────────── */}

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onClose={() => !togglingStatus && setDeactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Deactivate Shop</DialogTitle>
        <DialogContent>
          {/* === UPDATED MESSAGE === */}
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Deactivation takes effect at 23:59:59 tomorrow</Typography>
            <Typography sx={{ fontSize: 13 }}>
              Your shop will stop accepting orders from <strong>23:59:59 tomorrow</strong> until the end date you select.
              You can cancel this request anytime <strong>before 23:59:59 tomorrow</strong>. After that, cancellation is no longer possible.
            </Typography>
          </Alert>
          <FormControl fullWidth required sx={{ mb: 2.5 }}>
            <InputLabel>Reason for deactivation</InputLabel>
            <Select label="Reason for deactivation" value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} disabled={togglingStatus}>
              {DEACTIVATE_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth type="date"
            label="Reactivation Date"
            value={deactivateEndDate}
            onChange={(e) => setDeactivateEndDate(e.target.value)}
            disabled={togglingStatus}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date(Date.now() + 86400000).toISOString().split('T')[0] }}
            helperText="Your shop will automatically reactivate at 23:59:59 on this date"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setDeactivateDialogOpen(false)} disabled={togglingStatus} sx={{ borderColor: theme.palette.custom.neutral[300], color: theme.palette.custom.neutral[700] }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeactivate} disabled={togglingStatus || !deactivateReason.trim() || !deactivateEndDate} startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}>
              {togglingStatus ? 'Submitting...' : 'Submit Deactivation'}
            </Button>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <Button color="error" variant="text" onClick={() => { setDeactivateDialogOpen(false); setCloseShopDialogOpen(true); }} disabled={togglingStatus} sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, alignSelf: 'center' }}>
            Or close shop permanently...
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Shop Dialog */}
      <Dialog open={closeShopDialogOpen} onClose={() => !togglingStatus && setCloseShopDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: theme.palette.custom.status.error.main }}>Close Shop Permanently</DialogTitle>
        <DialogContent>
          {/* === UPDATED MESSAGE === */}
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>⚠ This action will permanently close your shop after 30 days</Typography>
            <Typography sx={{ fontSize: 13 }}>
              During this period, your shop remains visible but cannot accept new orders. You may cancel this request anytime within the 30-day window.
              After the 30-day period, <strong>this action cannot be undone</strong>.
            </Typography>
          </Alert>
          <FormControl fullWidth required sx={{ mb: 2.5 }}>
            <InputLabel>Reason for closing</InputLabel>
            <Select label="Reason for closing" value={closeShopReason} onChange={(e) => setCloseShopReason(e.target.value)} disabled={togglingStatus}>
              {CLOSE_SHOP_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={closeShopConfirm} onChange={(e) => setCloseShopConfirm(e.target.checked)} disabled={togglingStatus} />}
            label={
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                I understand that my shop will be <strong>permanently closed after 30 days</strong> and this action cannot be reversed after that period.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCloseShopDialogOpen(false)} disabled={togglingStatus}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCloseShop} disabled={togglingStatus || !closeShopReason.trim() || !closeShopConfirm} startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}>
            {togglingStatus ? 'Submitting...' : 'Close Shop'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialogOpen} onClose={() => !togglingStatus && setReactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Reactivate Shop</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
            Are you sure you want to reactivate your shop? Your shop will be <strong>immediately active</strong> and customers will be able to view and place orders again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReactivateDialogOpen(false)} disabled={togglingStatus}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleReactivate} disabled={togglingStatus} startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}>
            {togglingStatus ? 'Submitting...' : 'Reactivate Shop'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopEditProfilePage;