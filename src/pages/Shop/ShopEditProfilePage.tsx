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
import { useLayout } from '../../layouts/LayoutContext';
import { ShopOwnerSidebar } from '../../components/sidebar/ShopOwnerSidebar';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { shopApi } from '@/api/shopApi';
import { ghnApi } from '@/api/ghnApi';
import { useAuth } from '@/hooks/useAuth';
import type { ShopDetailResponse, UpdateShopRequest, ShopRegisterRequest, GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
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
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateEndDate, setDeactivateEndDate] = useState('');
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [pendingDeactivation, setPendingDeactivation] = useState(false);
  const [closeShopDialogOpen, setCloseShopDialogOpen] = useState(false);
  const [closeShopReason, setCloseShopReason] = useState('');
  const [closeShopConfirm, setCloseShopConfirm] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
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

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(false);
    return () => { setShowNavbar(true); setShowFooter(true); };
  }, [setShowNavbar, setShowFooter]);

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
        setPendingDeactivation(response.data.status === 'PENDING');
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: UpdateShopRequest = { ...formData };
      if (!canChangeShopName()) { delete payload.shopName; }
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

  const handleToggleStatus = () => {
    if (!shop) return;
    if (shop.status === 'ACTIVE') setDeactivateDialogOpen(true);
    else if (shop.status === 'INACTIVE') setReactivateDialogOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) { toast.error('Please provide a reason for deactivation'); return; }
    if (!deactivateEndDate) { toast.error('Please select an end date'); return; }
    try {
      setTogglingStatus(true);
      const response = await shopApi.deactivateRequest(deactivateReason, deactivateEndDate);
      toast.success('Deactivation request submitted successfully');
      setDeactivateDialogOpen(false); setDeactivateReason(''); setDeactivateEndDate('');
      if (response.data) setShop(response.data);
      setPendingDeactivation(true);
      fetchShop();
    } catch (error) {
      console.error('Failed to submit deactivation request:', error);
      toast.error('Failed to submit deactivation request');
    } finally { setTogglingStatus(false); }
  };

  const handleReactivate = async () => {
    try {
      setTogglingStatus(true);
      await shopApi.reactivateRequest();
      toast.success('Reactivation request submitted successfully');
      setReactivateDialogOpen(false);
      fetchShop();
    } catch (error) {
      console.error('Failed to submit reactivation request:', error);
      toast.error('Failed to submit reactivation request');
    } finally { setTogglingStatus(false); }
  };

  const handleCancelDeactivate = async () => {
    if (!window.confirm('Are you sure you want to cancel the deactivation request?')) return;
    try {
      setTogglingStatus(true);
      await shopApi.cancelDeactivate();
      toast.success('Deactivation request cancelled');
      setPendingDeactivation(false);
      fetchShop();
    } catch (error) {
      console.error('Failed to cancel deactivation:', error);
      toast.error('Failed to cancel deactivation request');
    } finally { setTogglingStatus(false); }
  };

  const handleCloseShop = async () => {
    if (!closeShopReason.trim()) { toast.error('Please provide a reason for closing'); return; }
    if (!closeShopConfirm) { toast.error('Please confirm that you understand this action'); return; }
    try {
      setTogglingStatus(true);
      const response = await shopApi.closeShop(closeShopReason, closeShopConfirm);
      toast.success('Close shop request submitted successfully');
      setCloseShopDialogOpen(false); setCloseShopReason(''); setCloseShopConfirm(false);
      if (response.data) setShop(response.data);
      fetchShop();
    } catch (error) {
      console.error('Failed to submit close shop request:', error);
      toast.error('Failed to submit close shop request');
    } finally { setTogglingStatus(false); }
  };

  const handleCancelCloseShop = async () => {
    if (!window.confirm('Are you sure you want to cancel the close shop request?')) return;
    try {
      setTogglingStatus(true);
      await shopApi.cancelCloseShop();
      toast.success('Close shop request cancelled');
      fetchShop();
    } catch (error) {
      console.error('Failed to cancel close shop:', error);
      toast.error('Failed to cancel close shop request');
    } finally { setTogglingStatus(false); }
  };

  const handleResubmit = async () => {
    try {
      setResubmitting(true);
      const selectedProvince = provinces.find((p) => p.ProvinceID === formData.ghnProvinceId);
      const selectedDistrict = districts.find((d) => d.DistrictID === formData.ghnDistrictId);
      const selectedWard = wards.find((w) => w.WardCode === formData.ghnWardCode);
      const resubmitData: ShopRegisterRequest = {
        shopName: formData.shopName || '', email: formData.email || '', phone: formData.phone || '',
        address: formData.address || '', city: formData.city || '',
        businessLicense: formData.businessLicense || '', businessLicenseUrl: '',
        logoUrl: formData.logoUrl || '',
        ghnProvinceId: formData.ghnProvinceId || 0, ghnDistrictId: formData.ghnDistrictId || 0,
        ghnWardCode: formData.ghnWardCode || '',
        provinceName: selectedProvince?.ProvinceName || '',
        districtName: selectedDistrict?.DistrictName || '',
        wardName: selectedWard?.WardName || '',
        taxId: formData.taxId || '',
      };
      await shopApi.resubmit(resubmitData);
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
      case 'GOLD':     return { color: '#D97706', bg: '#FEF3C7' };
      case 'SILVER':   return { color: '#64748B', bg: '#F1F5F9' };
      default:         return { color: '#92400E', bg: '#FEF9C3' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':               return { color: theme.palette.custom.status.success.main, bg: theme.palette.custom.status.success.light, label: 'Active' };
      case 'INACTIVE':             return { color: theme.palette.custom.status.error.main,   bg: theme.palette.custom.status.error.light,   label: 'Inactive' };
      case 'CLOSING':              return { color: theme.palette.custom.status.error.main,   bg: theme.palette.custom.status.error.light,   label: 'Closing' };
      case 'PENDING':              return { color: theme.palette.custom.status.warning.main, bg: theme.palette.custom.status.warning.light, label: 'Pending' };
      default:                     return { color: theme.palette.custom.neutral[500], bg: theme.palette.custom.neutral[100], label: status };
    }
  };

  const nameChangeable    = canChangeShopName();
  const daysLeft          = getDaysUntilNameChange();
  const isShopInactive    = shop?.status === 'INACTIVE';
  const isShopClosing     = shop?.status === 'CLOSING';
  const isPendingReview   = shop?.status === 'PENDING' && shop?.latestRequestStatus !== 'REJECTED';
  const isRequestRejected = shop?.status === 'PENDING' && shop?.latestRequestStatus === 'REJECTED';
  const isShopDisabled    = isShopInactive || isShopClosing || isPendingReview;

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
  const tierCfg   = getTierConfig(shop.tier);

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
                  {(shop.status === 'PENDING' || pendingDeactivation) && (
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
              {shop.status === 'ACTIVE' && !pendingDeactivation && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={handleToggleStatus} disabled={togglingStatus}
                  sx={{ borderColor: '#FCA5A5', color: '#FCA5A5', '&:hover': { borderColor: '#F87171', bgcolor: 'rgba(248,113,113,0.1)' } }}>
                  Deactivate
                </Button>
              )}
              {(shop.status === 'PENDING_DEACTIVATION' || pendingDeactivation) && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={handleCancelDeactivate} disabled={togglingStatus}
                  sx={{ borderColor: '#FCD34D', color: '#FCD34D', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}>
                  Cancel Request
                </Button>
              )}
              {isShopClosing && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={handleCancelCloseShop} disabled={togglingStatus}
                  sx={{ borderColor: '#FCD34D', color: '#FCD34D', '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}>
                  Cancel Close
                </Button>
              )}
              {shop.status === 'INACTIVE' && (
                <Button variant="outlined" startIcon={togglingStatus ? <CircularProgress size={15} /> : <PowerSettingsNew />} onClick={handleToggleStatus} disabled={togglingStatus}
                  sx={{ borderColor: '#4ADE80', color: '#4ADE80', '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34,197,94,0.1)' } }}>
                  Reactivate
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

          {/* Alerts */}
          {isShopInactive && (
            <Alert severity="warning" sx={{ mb: 3 }}>Your shop is currently <strong>inactive</strong>. Please activate your shop to make changes.</Alert>
          )}
          {isShopClosing && (
            <Alert severity="error" sx={{ mb: 3 }}>Your shop is scheduled to be <strong>permanently closed</strong> after 30 days. All fields are disabled during this period. If you do not wish to close your shop, please click the <strong>Cancel Close</strong> button to cancel.</Alert>
          )}
          {isPendingReview && (
            <Alert severity="warning" icon={<AccessTime />} sx={{ mb: 3, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Pending Approval</Typography>
              <Typography sx={{ fontSize: 14 }}>Your shop registration is currently being reviewed. All fields are disabled until the review is complete.</Typography>
            </Alert>
          )}
          {isRequestRejected && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Shop Registration Rejected</Typography>
              <Typography sx={{ fontSize: 14 }}>Your shop registration has been rejected. Please update your information and resubmit.</Typography>
              {shop.rejectionReason && <Typography sx={{ fontSize: 14, mt: 1 }}><strong>Reason:</strong> {shop.rejectionReason}</Typography>}
              {shop.adminComment && <Typography sx={{ fontSize: 14, mt: 0.5 }}><strong>Admin comment:</strong> {shop.adminComment}</Typography>}
            </Alert>
          )}
          {(shop.status === 'PENDING_DEACTIVATION' || pendingDeactivation) && (
            <Alert severity="warning" sx={{ mb: 3 }}>Your shop has a pending deactivation request. You can cancel it before it takes effect.</Alert>
          )}

          {/* Shop Name */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>Shop Name</Typography>
            {!nameChangeable && !isRequestRejected && (
              <Alert severity="warning" icon={<Lock fontSize="small" />} sx={{ mb: 2, borderRadius: 1.5 }}>
                Shop name can only be changed after 60 days from creation.
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
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={formData.email} onChange={handleChange('email')} disabled={isShopDisabled} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={formData.phone} onChange={handleChange('phone')} disabled={isShopDisabled} /></Grid>
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

          {/* Business Info */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2.5 }}>Business Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Business License" fullWidth value={formData.businessLicense} onChange={handleChange('businessLicense')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Tax ID" fullWidth value={formData.taxId} onChange={handleChange('taxId')} disabled={!isRequestRejected}
                  InputProps={{ endAdornment: !isRequestRejected ? <Lock sx={{ fontSize: 18, color: theme.palette.custom.neutral[400] }} /> : undefined }} />
              </Grid>
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
            </Grid>
          </Paper>
        </Box>
      </Box>

      {/* ── DIALOGS ─────────────────────────────────────────────────────── */}

      {/* Deactivate */}
      <Dialog open={deactivateDialogOpen} onClose={() => !togglingStatus && setDeactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Deactivate Shop</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>Are you sure you want to deactivate your shop? This will prevent customers from viewing and ordering from your shop.</Typography>
          <TextField fullWidth multiline rows={3} label="Reason for deactivation" placeholder="Please provide a reason..." value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} disabled={togglingStatus} required sx={{ mb: 2.5 }} />
          <TextField fullWidth type="date" label="End Date" value={deactivateEndDate} onChange={(e) => setDeactivateEndDate(e.target.value)} disabled={togglingStatus} required InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} helperText="Select the date when the shop should be deactivated" />
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

      {/* Close Shop */}
      <Dialog open={closeShopDialogOpen} onClose={() => !togglingStatus && setCloseShopDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: theme.palette.custom.status.error.main }}>Close Shop</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>This action will permanently close your shop after 30 days. All products will be removed and customers will no longer be able to access your shop. This cannot be undone after the 30-day period.</Alert>
          <TextField fullWidth multiline rows={3} label="Reason for closing" placeholder="Please provide a reason for permanently closing your shop..." value={closeShopReason} onChange={(e) => setCloseShopReason(e.target.value)} disabled={togglingStatus} required sx={{ mb: 2.5 }} />
          <FormControlLabel
            control={<Checkbox checked={closeShopConfirm} onChange={(e) => setCloseShopConfirm(e.target.checked)} disabled={togglingStatus} />}
            label={<Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>I understand that my shop will be permanently closed after 30 days and this action cannot be reversed after that period.</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCloseShopDialogOpen(false)} disabled={togglingStatus}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCloseShop} disabled={togglingStatus || !closeShopReason.trim() || !closeShopConfirm} startIcon={togglingStatus ? <CircularProgress size={16} /> : undefined}>
            {togglingStatus ? 'Submitting...' : 'Close Shop'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate */}
      <Dialog open={reactivateDialogOpen} onClose={() => !togglingStatus && setReactivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Reactivate Shop</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>Are you sure you want to reactivate your shop? This will allow customers to view and order from your shop again.</Typography>
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