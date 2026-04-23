import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Store,
  Description,
  CheckCircle,
  Business,
  LocationOn,
  Phone,
  Email,
  Badge,
  CalendarToday,
  AccountBalance,
  Link as LinkIcon,
  WarningAmber,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import type { ShopRegisterRequest, GhnProvince, GhnDistrict, GhnWard, ShopDetailResponse, ShopRequest } from '@/models/Shop';
import { shopApi } from '@/api/shopApi';
import { sanitizeTextInput } from '@/utils/text-input';
import { ghnApi } from '@/api/ghnApi';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.custom.border.light,
    borderTopWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.custom.status.success.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.custom.status.success.main,
  },
}));

const resubmitSteps = [
  { label: 'Shop Information', key: 'SHOP_INFO' },
  { label: 'Business License', key: 'LICENSE' },
  { label: 'Review & Submit', key: 'REVIEW' },
];

interface ShopFormData {
  shopName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
  city: string;
  district: string;
  ward: string;
  licenseNumber: string;
  businessName: string;
  legalRepresentative: string;
  registeredAddress: string;
  taxId: string;
  businessType: string;
  issuedDate: string;
  issuedBy: string;
  expiryDate: string;
  licenseImageUrl: string;
}

const toDateInput = (iso: string | undefined | null): string => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

const ShopResubmitPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [shop, setShop] = useState<ShopDetailResponse | null>(null);
  const [registrationRequest, setRegistrationRequest] = useState<ShopRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ShopFormData>({
    shopName: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    city: '',
    district: '',
    ward: '',
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
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useLayoutConfig({ showNavbar: false, showFooter: true });

  // Load shop + latest registration request + provinces on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [shopsRes, provincesRes] = await Promise.all([
          shopApi.getMyShops(),
          ghnApi.getProvinces(),
        ]);
        const shops = shopsRes.data;
        if (!shops || shops.length === 0) {
          navigate(PAGE_ENDPOINTS.SHOP.REGISTER, { replace: true });
          return;
        }
        const shopData = shops[0];
        if (shopData.latestRequestStatus !== 'REJECTED') {
          navigate(PAGE_ENDPOINTS.SHOP.DASHBOARD, { replace: true });
          return;
        }
        setShop(shopData);
        setProvinces(provincesRes.data || []);

        // Fetch latest registration request for pre-filling form fields
        const regRes = await shopApi.getMyShopRegistration(shopData.id);
        const reg = regRes.data as ShopRequest | null;
        setRegistrationRequest(reg);

        // Use registration request for form fields; use shop GHN IDs for location dropdowns
        setFormData({
          shopName: reg?.shopName || shopData.shopName || '',
          email: reg?.email || shopData.email || '',
          phone: reg?.phone || shopData.phone || '',
          address: reg?.address || shopData.address || '',
          logoUrl: reg?.logoUrl || shopData.logoUrl || '',
          city: shopData.ghnProvinceId ? String(shopData.ghnProvinceId) : '',
          district: shopData.ghnDistrictId ? String(shopData.ghnDistrictId) : '',
          ward: shopData.ghnWardCode || '',
          licenseNumber: reg?.businessLicense?.licenseNumber || '',
          businessName: reg?.businessLicense?.businessName || '',
          legalRepresentative: reg?.businessLicense?.legalRepresentative || '',
          registeredAddress: reg?.businessLicense?.registeredAddress || '',
          taxId: reg?.businessLicense?.taxId || '',
          businessType: reg?.businessLicense?.businessType || '',
          issuedDate: toDateInput(reg?.businessLicense?.issuedDate),
          issuedBy: reg?.businessLicense?.issuedBy || '',
          expiryDate: toDateInput(reg?.businessLicense?.expiryDate),
          licenseImageUrl: reg?.businessLicense?.licenseImageUrl || '',
        });
      } catch {
        navigate(PAGE_ENDPOINTS.SHOP.DASHBOARD, { replace: true });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch districts when city is set
  useEffect(() => {
    if (!formData.city) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await ghnApi.getDistricts(Number(formData.city));
        setDistricts(res.data || []);
      } catch {
        // ignore
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [formData.city]);

  // Fetch wards when district is set
  useEffect(() => {
    if (!formData.district) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await ghnApi.getWards(Number(formData.district));
        setWards(res.data || []);
      } catch {
        // ignore
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [formData.district]);

  const handleInputChange = (field: keyof ShopFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleTextChange = (field: keyof ShopFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const filtered = sanitizeTextInput(e.target.value, { maxLength: 21 });
    setFormData((prev) => ({ ...prev, [field]: filtered }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNumberFieldChange = (field: keyof ShopFormData, maxLen = 21) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setFormData((prev) => ({ ...prev, [field]: digits }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleAddressChange = (field: keyof ShopFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = sanitizeTextInput(e.target.value, { maxLength: 50 });
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setUploadingLogo(true);
    try {
      const res = await shopApi.uploadLogoImage(file);
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, logoUrl: res.data!.url }));
      }
    } catch {
      setLogoFile(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLicenseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFile(file);
    setErrors((prev) => ({ ...prev, licenseImageUrl: '' }));
    setUploadingLicense(true);
    try {
      const res = await shopApi.uploadLicenseImage(file);
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, licenseImageUrl: res.data!.url }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, licenseImageUrl: 'Upload failed. Please try again.' }));
      setLicenseFile(null);
    } finally {
      setUploadingLicense(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: digits }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const handleSelectChange = (field: keyof ShopFormData) => (e: any) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.shopName.trim()) newErrors.shopName = 'Shop name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^0\d{9}$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number (must be 10 digits, starting with 0)';
      }
      if (!formData.address.trim()) newErrors.address = 'Street address is required';
      if (!formData.city) newErrors.city = 'City/Province is required';
      if (!formData.district) newErrors.district = 'District is required';
      if (!formData.ward) newErrors.ward = 'Ward is required';
    }

    if (step === 1) {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required';
      } else if (!/^\d+$/.test(formData.licenseNumber)) {
        newErrors.licenseNumber = 'License number must contain digits only';
      }
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
      if (!formData.taxId.trim()) {
        newErrors.taxId = 'Tax ID is required';
      } else if (!/^\d+$/.test(formData.taxId)) {
        newErrors.taxId = 'Tax ID must contain digits only';
      }
      if (!formData.legalRepresentative.trim()) newErrors.legalRepresentative = 'Legal representative name is required';
      if (!formData.licenseImageUrl.trim()) newErrors.licenseImageUrl = 'License image URL is required';
      if (formData.expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(formData.expiryDate) <= today) {
          newErrors.expiryDate = 'Expiry date must be a future date';
        } else if (formData.issuedDate && new Date(formData.expiryDate) <= new Date(formData.issuedDate)) {
          newErrors.expiryDate = 'Expiry date must be after the issued date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setErrors({});
    setActiveStep((prev) => Math.min(prev + 1, resubmitSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!shop) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const province = provinces.find((p) => p.ProvinceID === Number(formData.city));
      const district = districts.find((d) => d.DistrictID === Number(formData.district));
      const ward = wards.find((w) => w.WardCode === formData.ward);

      const requestData: ShopRegisterRequest = {
        shopName: formData.shopName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: province?.ProvinceName || '',
        logoUrl: formData.logoUrl,
        ghnProvinceId: province?.ProvinceID || 0,
        ghnDistrictId: district?.DistrictID || 0,
        ghnWardCode: ward?.WardCode || '',
        provinceName: province?.ProvinceName || '',
        districtName: district?.DistrictName || '',
        wardName: ward?.WardName || '',
        businessLicense: {
          licenseNumber: formData.licenseNumber,
          businessName: formData.businessName,
          legalRepresentative: formData.legalRepresentative,
          registeredAddress: formData.registeredAddress,
          taxId: formData.taxId,
          businessType: formData.businessType,
          issuedDate: formData.issuedDate ? new Date(formData.issuedDate).toISOString() : '',
          issuedBy: formData.issuedBy,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : '',
          licenseImageUrl: formData.licenseImageUrl,
        },
      };

      await shopApi.resubmit(shop.id, requestData);
      setSuccessDialogOpen(true);
    } catch (err: any) {
      const rawErrors = err?.originalError?.response?.data?.errors;
      const beError = Array.isArray(rawErrors) ? rawErrors[0] : rawErrors?.[Object.keys(rawErrors ?? {})[0]]?.[0];
      const message = beError || err?.message || 'Resubmission failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate(PAGE_ENDPOINTS.HOME);
  };

  const renderRejectionBanner = () => {
    const rejectionReason = registrationRequest?.rejectionReason || shop?.rejectionReason;
    const adminComment = registrationRequest?.adminComment || shop?.adminComment;
    if (!rejectionReason && !adminComment) return null;
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: `1px solid #fca5a5`,
          bgcolor: '#fff5f5',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <WarningAmber sx={{ color: '#dc2626', mt: 0.25, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#dc2626', mb: 1 }}>
              Registration Rejected
            </Typography>
            {rejectionReason && (
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#7f1d1d' }}>Rejection reason:</Typography>
                <Typography sx={{ fontSize: 14, color: '#991b1b' }}>{rejectionReason}</Typography>
              </Box>
            )}
            {adminComment && (
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#7f1d1d' }}>Admin comment:</Typography>
                <Typography sx={{ fontSize: 14, color: '#991b1b' }}>{adminComment}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderShopInfoForm = () => (
    <Box>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.custom.neutral[800],
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Store sx={{ color: theme.palette.primary.main }} />
        Shop Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            required
            label="Shop Name"
            value={formData.shopName}
            onChange={handleTextChange('shopName')}
            placeholder="Enter your shop name"
            error={!!errors.shopName}
            helperText={errors.shopName || `${formData.shopName.length}/21`}
            slotProps={{ input: { startAdornment: <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Enter email address"
            error={!!errors.email}
            helperText={errors.email}
            slotProps={{ input: { startAdornment: <Email sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Phone Number"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="e.g. 0912345678"
            error={!!errors.phone}
            helperText={errors.phone || '10 digits, starts with 0'}
            inputMode="numeric"
            slotProps={{ htmlInput: { maxLength: 10, inputMode: 'numeric' }, input: { startAdornment: <Phone sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[700], mb: 0.75 }}>
              Shop Logo
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                border: `2px dashed ${uploadingLogo ? theme.palette.primary.main : formData.logoUrl ? theme.palette.custom.status.success.main : theme.palette.custom.border.light}`,
                bgcolor: theme.palette.custom.neutral[50],
                cursor: uploadingLogo ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: theme.palette.primary.main, bgcolor: theme.palette.primary.main + '08' },
              }}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handleLogoFileChange}
                disabled={uploadingLogo}
              />
              {uploadingLogo ? (
                <CircularProgress size={40} />
              ) : formData.logoUrl ? (
                <Avatar
                  variant="rounded"
                  src={formData.logoUrl}
                  sx={{ width: 56, height: 56, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
                />
              ) : (
                <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: theme.palette.custom.neutral[100], borderRadius: 2 }}>
                  <Store sx={{ color: theme.palette.custom.neutral[400], fontSize: 28 }} />
                </Avatar>
              )}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>
                  {uploadingLogo ? 'Uploading...' : formData.logoUrl ? (logoFile?.name || 'Logo uploaded') : 'Click to upload shop logo'}
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                  {formData.logoUrl ? 'Click to replace' : 'PNG, JPG or WEBP'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.custom.neutral[800],
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <LocationOn sx={{ color: theme.palette.primary.main }} />
        Shop Address
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            required
            label="Street Address"
            value={formData.address}
            onChange={handleAddressChange('address')}
            placeholder="Enter street address"
            error={!!errors.address}
            helperText={errors.address || `${formData.address.length}/50`}
            slotProps={{ htmlInput: { maxLength: 50 }, input: { startAdornment: <LocationOn sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth required error={!!errors.city}>
            <InputLabel>City/Province</InputLabel>
            <Select
              value={formData.city}
              label="City/Province *"
              disabled={provinces.length === 0}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, city: e.target.value, district: '', ward: '' }));
                if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
              }}
            >
              {provinces.map((p) => (
                <MenuItem key={p.ProvinceID} value={String(p.ProvinceID)}>{p.ProvinceName}</MenuItem>
              ))}
            </Select>
            {errors.city && <FormHelperText>{errors.city}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth required error={!!errors.district}>
            <InputLabel>District</InputLabel>
            <Select
              value={formData.district}
              label="District"
              disabled={!formData.city || loadingDistricts}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, district: e.target.value, ward: '' }));
                if (errors.district) setErrors((prev) => ({ ...prev, district: '' }));
              }}
            >
              {districts.map((d) => (
                <MenuItem key={d.DistrictID} value={String(d.DistrictID)}>{d.DistrictName}</MenuItem>
              ))}
            </Select>
            {errors.district && <FormHelperText>{errors.district}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth required error={!!errors.ward}>
            <InputLabel>Ward</InputLabel>
            <Select
              value={formData.ward}
              label="Ward"
              disabled={!formData.district || loadingWards}
              onChange={(e) => {
                handleSelectChange('ward')(e);
                if (errors.ward) setErrors((prev) => ({ ...prev, ward: '' }));
              }}
            >
              {wards.map((w) => (
                <MenuItem key={w.WardCode} value={w.WardCode}>{w.WardName}</MenuItem>
              ))}
            </Select>
            {errors.ward && <FormHelperText>{errors.ward}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  const renderLicenseUpload = () => (
    <Box>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.custom.neutral[800],
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Description sx={{ color: theme.palette.primary.main }} />
        Business License Documents
      </Typography>

      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
        Please provide your business license information for verification.
      </Typography>

      <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 2 }}>
        License Information
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Row 1: License Number + Tax ID */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="License Number"
            value={formData.licenseNumber}
            onChange={handleNumberFieldChange('licenseNumber', 13)}
            placeholder="e.g. 0312345678"
            inputMode="numeric"
            error={!!errors.licenseNumber}
            helperText={errors.licenseNumber || `Digits only · ${formData.licenseNumber.length}/13`}
            slotProps={{ htmlInput: { maxLength: 13 }, input: { startAdornment: <Description sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Tax ID"
            value={formData.taxId}
            onChange={handleNumberFieldChange('taxId', 13)}
            placeholder="e.g. 0312345678"
            inputMode="numeric"
            error={!!errors.taxId}
            helperText={errors.taxId || `Digits only · ${formData.taxId.length}/13`}
            slotProps={{ htmlInput: { maxLength: 13 }, input: { startAdornment: <Business sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        {/* Row 2: Business Name + Business Type */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Business Name"
            value={formData.businessName}
            onChange={handleTextChange('businessName')}
            placeholder="Registered business name"
            error={!!errors.businessName}
            helperText={errors.businessName || `${formData.businessName.length}/21`}
            slotProps={{ input: { startAdornment: <Business sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth required error={!!errors.businessType}>
            <InputLabel>Business Type</InputLabel>
            <Select
              value={formData.businessType}
              label="Business Type *"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="Hộ kinh doanh cá thể">Individual Business (Hộ kinh doanh cá thể)</MenuItem>
              <MenuItem value="Hộ kinh doanh">Household Business (Hộ kinh doanh)</MenuItem>
              <MenuItem value="Công ty TNHH">Limited Company (Công ty TNHH)</MenuItem>
              <MenuItem value="Công ty cổ phần">Joint Stock Company (Công ty cổ phần)</MenuItem>
              <MenuItem value="Công ty hợp danh">Partnership (Công ty hợp danh)</MenuItem>
            </Select>
            {errors.businessType && <FormHelperText>{errors.businessType}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Row 3: Issued Date + Expiry Date + Issued By */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Issued Date"
            type="date"
            value={formData.issuedDate}
            onChange={handleInputChange('issuedDate')}
            slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <CalendarToday sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={handleInputChange('expiryDate')}
            error={!!errors.expiryDate}
            helperText={errors.expiryDate}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: new Date().toISOString().split('T')[0] },
              input: { startAdornment: <CalendarToday sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Issued By"
            value={formData.issuedBy}
            onChange={handleInputChange('issuedBy')}
            placeholder="e.g. Sở KH&ĐT TP.HCM"
            slotProps={{ input: { startAdornment: <AccountBalance sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        {/* Row 4: License Document — full width */}
        <Grid size={{ xs: 12 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[700], mb: 0.75 }}>
              License Document <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.75,
                height: 56,
                borderRadius: 1,
                border: `1px solid ${errors.licenseImageUrl ? '#dc2626' : formData.licenseImageUrl ? theme.palette.custom.status.success.main : theme.palette.custom.border.light}`,
                bgcolor: 'background.paper',
                cursor: uploadingLicense ? 'wait' : 'pointer',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: errors.licenseImageUrl ? '#dc2626' : theme.palette.text.primary },
              }}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                style={{ display: 'none' }}
                onChange={handleLicenseFileChange}
                disabled={uploadingLicense}
              />
              {uploadingLicense ? (
                <CircularProgress size={18} sx={{ flexShrink: 0 }} />
              ) : formData.licenseImageUrl ? (
                <CheckCircle sx={{ fontSize: 20, color: theme.palette.custom.status.success.main, flexShrink: 0 }} />
              ) : (
                <LinkIcon sx={{ fontSize: 20, color: theme.palette.custom.neutral[400], flexShrink: 0 }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 14,
                    color: uploadingLicense
                      ? theme.palette.primary.main
                      : formData.licenseImageUrl
                      ? theme.palette.custom.status.success.main
                      : theme.palette.custom.neutral[500],
                  }}
                >
                  {uploadingLicense
                    ? 'Uploading...'
                    : formData.licenseImageUrl
                    ? (licenseFile?.name || 'File uploaded — click to replace')
                    : 'Click to upload license document (PNG, JPG, WEBP, PDF)'}
                </Typography>
              </Box>
            </Box>
            {errors.licenseImageUrl && (
              <Typography sx={{ fontSize: 12, color: '#dc2626', mt: 0.5, ml: 0.5 }}>
                {errors.licenseImageUrl}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 2 }}>
        Owner / Legal Representative
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Legal Representative Name"
            value={formData.legalRepresentative}
            onChange={handleTextChange('legalRepresentative')}
            placeholder="Full name as on ID card"
            error={!!errors.legalRepresentative}
            helperText={errors.legalRepresentative || `${formData.legalRepresentative.length}/21`}
            slotProps={{ input: { startAdornment: <Badge sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Registered Address"
            value={formData.registeredAddress}
            onChange={handleAddressChange('registeredAddress')}
            placeholder="Business registered address"
            helperText={`${formData.registeredAddress.length}/50`}
            slotProps={{ htmlInput: { maxLength: 50 }, input: { startAdornment: <Badge sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> } }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderReview = () => (
    <Box>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.custom.neutral[800],
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CheckCircle sx={{ color: theme.palette.custom.status.success.main }} />
        Review Your Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, height: '100%' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', mb: 2 }}>
              Shop Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Shop Name</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.shopName || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Email</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.email || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Phone</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.phone || '-'}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, height: '100%' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', mb: 2 }}>
              Address Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Address</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.address || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>City/Province</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {provinces.find((p) => p.ProvinceID === Number(formData.city))?.ProvinceName || '-'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>District</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {districts.find((d) => d.DistrictID === Number(formData.district))?.DistrictName || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Ward</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {wards.find((w) => w.WardCode === formData.ward)?.WardName || '-'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[500], textTransform: 'uppercase', mb: 2 }}>
              Business License
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>License Number</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.licenseNumber || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Business Name</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.businessName || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Business Type</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.businessType || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Tax ID</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.taxId || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Legal Representative</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.legalRepresentative || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Registered Address</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.registeredAddress || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Issued Date</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.issuedDate || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Expiry Date</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.expiryDate || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Issued By</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>{formData.issuedBy || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>License Image URL</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: formData.licenseImageUrl ? theme.palette.primary.main : theme.palette.custom.neutral[800], wordBreak: 'break-all' }}>
                  {formData.licenseImageUrl || '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: theme.palette.custom.status.warning.light }}>
        <Typography sx={{ fontSize: 14, color: theme.palette.custom.status.warning.main }}>
          By resubmitting, you confirm that all information provided is accurate and you agree to our Terms of Service and Seller Agreement.
        </Typography>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Navbar */}
      <Box
        sx={{
          height: 56,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          gap: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <IconButton onClick={() => navigate(PAGE_ENDPOINTS.SHOP.DASHBOARD)} size="small">
          <ArrowBack />
        </IconButton>
        <Box
          sx={{
            width: 32,
            height: 32,
            backgroundColor: '#dc2626',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Store sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: theme.palette.text.primary }}>
          Resubmit Shop Registration
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Update & Resubmit Registration
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Review the rejection reason, update your information, and resubmit for approval.
          </Typography>
        </Box>

        {/* Rejection Banner */}
        {renderRejectionBanner()}

        {/* Progress Stepper */}
        <Paper
          elevation={0}
          sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
        >
          <Stepper activeStep={activeStep} connector={<CustomConnector />} alternativeLabel>
            {resubmitSteps.map((step, index) => (
              <Step key={step.key} completed={index < activeStep}>
                <StepLabel
                  slots={{ stepIcon: () => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          index <= activeStep
                            ? theme.palette.custom.status.success.main
                            : theme.palette.custom.border.light,
                        color:
                          index <= activeStep
                            ? theme.palette.primary.contrastText
                            : theme.palette.custom.neutral[400],
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {index < activeStep ? <CheckCircle sx={{ fontSize: 20 }} /> : index + 1}
                    </Box>
                  ) }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: index <= activeStep ? 600 : 400,
                      color: index <= activeStep ? theme.palette.custom.neutral[800] : theme.palette.custom.neutral[400],
                    }}
                  >
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form Content */}
        <Paper
          elevation={0}
          sx={{ p: 4, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
        >
          {activeStep === 0 && renderShopInfoForm()}
          {activeStep === 1 && renderLicenseUpload()}
          {activeStep === 2 && renderReview()}

          {submitError && (
            <Alert severity="error" sx={{ mt: 3 }}>{submitError}</Alert>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={activeStep === 0 ? () => navigate(PAGE_ENDPOINTS.SHOP.DASHBOARD) : handleBack}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>

            {activeStep < resubmitSteps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ borderRadius: 2, px: 4 }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ borderRadius: 2, px: 4, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {submitting ? 'Submitting...' : 'Resubmit Registration'}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleSuccessDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Avatar sx={{ width: 60, height: 60, bgcolor: theme.palette.custom.status.success.light, mx: 'auto', mb: 2 }}>
            <CheckCircle sx={{ fontSize: 36, color: theme.palette.custom.status.success.main }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Registration Resubmitted!</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ textAlign: 'center', color: theme.palette.custom.neutral[600] }}>
            Your registration has been resubmitted successfully. Our team will review your information and get back to you.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={handleSuccessDialogClose} sx={{ px: 4, borderRadius: 2 }}>
            Go to Homepage
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopResubmitPage;
