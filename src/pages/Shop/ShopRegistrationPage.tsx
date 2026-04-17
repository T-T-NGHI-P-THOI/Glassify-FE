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
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
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
  LocalShipping,
  Badge,
  CalendarToday,
  AccountBalance,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import type { ShopRegisterRequest, ShopRegisterResponse, GhnProvince, GhnDistrict, GhnWard } from '@/models/Shop';
import { shopApi } from '@/api/shopApi';
import { ghnApi } from '@/api/ghnApi';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useAuth } from '@/hooks/useAuth';
import { initialize } from '@/auth/Reducer';
import userApi from '@/api/service/userApi';

// Custom Step Connector
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


const registrationSteps = [
  { label: 'Shop Information', key: 'SHOP_INFO' },
  { label: 'Business License', key: 'LICENSE' },
  { label: 'Shipping', key: 'SHIPPING' },
  { label: 'Review & Submit', key: 'REVIEW' },
];

// ==================== FORM INTERFACES ====================
interface ShopFormData {
  // Shop Info
  shopName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
  // GHN location (stored as string IDs in selects)
  city: string;
  district: string;
  ward: string;
  // Business license fields
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

const ShopRegistrationPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
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
  const [selectedShippingPartners, setSelectedShippingPartners] = useState<string[]>([]);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registerResponse, setRegisterResponse] = useState<ShopRegisterResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // GHN location state
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useLayoutConfig({ showNavbar: false, showFooter: true });

  // Redirect if user already has an active shop (skip if CLOSED or registration EXPIRED)
  useEffect(() => {
    shopApi.getMyShops().then((res) => {
      const shop = res.data?.[0];
      if (shop && shop.status !== 'CLOSED' && shop.latestRequestStatus !== 'EXPIRED') {
        navigate(PAGE_ENDPOINTS.SHOP.PROFILE, { replace: true });
      }
    }).catch(() => {});
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
    if (!formData.city) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const provinceId = Number(formData.city);
        const res = await ghnApi.getDistricts(provinceId);
        setDistricts(res.data || []);
      } catch (err) {
        console.error('Failed to fetch districts:', err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [formData.city]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!formData.district) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const districtId = Number(formData.district);
        const res = await ghnApi.getWards(districtId);
        setWards(res.data || []);
      } catch (err) {
        console.error('Failed to fetch wards:', err);
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

  // Text fields: max 21 chars, no special characters (allow letters incl. Vietnamese, digits, spaces, . - /)
  const handleTextChange = (field: keyof ShopFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const filtered = e.target.value
      .replace(/[^a-zA-Z0-9\s\u00C0-\u1EF9.,\-/]/g, '')
      .slice(0, 21);
    setFormData((prev) => ({ ...prev, [field]: filtered }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Number-only fields: digits only, configurable max chars
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
    const value = e.target.value.slice(0, 50);
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

    if (step === 2) {
      if (selectedShippingPartners.length === 0) newErrors.shippingPartners = 'Please select at least one shipping partner to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) return;

    if (activeStep === 0) {
      try {
        const res = await shopApi.checkEmail(formData.email);
        if (!res.data?.available) {
          setErrors((prev) => ({ ...prev, email: res.data?.message || 'This email is already used by another shop' }));
          return;
        }
      } catch (err: any) {
        const msg = err?.originalError?.response?.data?.data?.message || err?.message || 'This email is already used by another shop';
        setErrors((prev) => ({ ...prev, email: msg }));
        return;
      }
    }

    setErrors({});
    setActiveStep((prev) => Math.min(prev + 1, registrationSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
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

      const result = await shopApi.register(requestData);
      setRegisterResponse(result.data ?? null);
      // Refresh user profile so the SHOP_OWNER role is reflected in FE context
      try {
        const profileRes = await userApi.getMyProfile();
        if (profileRes.data) {
          dispatch(initialize({ isInitialized: true, isAuthenticated: true, user: profileRes.data as any }));
        }
      } catch {
        // profile refresh failure is non-critical
      }
      setSuccessDialogOpen(true);
    } catch (err: any) {
      const rawErrors = err?.originalError?.response?.data?.errors;
      const beError = Array.isArray(rawErrors) ? rawErrors[0] : rawErrors?.[Object.keys(rawErrors ?? {})[0]]?.[0];
      const message = beError || err?.originalError?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('email')) {
        setActiveStep(0);
        setErrors({ email: message });
      } else if (lowerMsg.includes('pending') || lowerMsg.includes('already submitted') || lowerMsg.includes('pending request')) {
        setSubmitError('You already have a pending registration request under review. Please wait for admin approval or check your shop profile.');
      } else if (lowerMsg.includes('already owns') || lowerMsg.includes('already has a shop') || lowerMsg.includes('shop owner')) {
        navigate(PAGE_ENDPOINTS.SHOP.PROFILE, { replace: true });
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate(PAGE_ENDPOINTS.SHOP.PROFILE);
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
              disabled={loadingProvinces}
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
              error={!!errors.district}
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
              error={!!errors.ward}
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

      {/* License Identity */}
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

      {/* Owner / Representative */}
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

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.custom.status.info.light,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.info.main, mb: 1 }}>
          Required Information:
        </Typography>
        <Typography
          component="ul"
          sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], m: 0, pl: 2 }}
        >
          <li>License number, business name, and business type</li>
          <li>Legal representative name and registered address</li>
          <li>Tax ID, issue date, expiry date, and issuing authority</li>
          <li>Public URL link to scanned license document</li>
        </Typography>
      </Box>
    </Box>
  );

  const shippingPartners = [
    {
      id: 'ghn',
      name: 'Giao Hàng Nhanh',
      logo: '/shipping/ghn-logo.png',
      description: 'Dịch vụ giao hàng nhanh chóng, uy tín hàng đầu Việt Nam. Hỗ trợ giao hàng toàn quốc với thời gian 1-3 ngày.',
      services: ['Giao hàng tiêu chuẩn', 'Giao hàng nhanh', 'Giao hàng thu tiền hộ (COD)'],
    },
  ];

  const handleToggleShippingPartner = (partnerId: string) => {
    setSelectedShippingPartners((prev) =>
      prev.includes(partnerId) ? prev.filter((id) => id !== partnerId) : [...prev, partnerId]
    );
    if (errors.shippingPartners) setErrors((prev) => ({ ...prev, shippingPartners: '' }));
  };

  const renderShipping = () => (
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
        <LocalShipping sx={{ color: theme.palette.primary.main }} />
        Shipping Partners
      </Typography>

      <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
        Select the shipping partners you want to use for delivering orders from your shop.
      </Typography>

      {shippingPartners.map((partner) => {
        const isSelected = selectedShippingPartners.includes(partner.id);
        return (
          <Paper
            key={partner.id}
            elevation={0}
            onClick={() => handleToggleShippingPartner(partner.id)}
            sx={{
              p: 3,
              mb: 2,
              borderRadius: 2,
              border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.custom.border.light}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              bgcolor: isSelected ? theme.palette.primary.main + '08' : 'transparent',
              '&:hover': {
                borderColor: isSelected ? theme.palette.primary.main : theme.palette.custom.neutral[300],
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Checkbox
                checked={isSelected}
                sx={{
                  mt: -0.5,
                  color: theme.palette.custom.neutral[400],
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                }}
              />
              <Avatar
                variant="rounded"
                src={partner.logo}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: theme.palette.custom.status.warning.light,
                }}
              >
                <LocalShipping sx={{ color: theme.palette.custom.status.warning.main }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                  {partner.name}
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 2 }}>
                  {partner.description}
                </Typography>

                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
                  Available Services:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {partner.services.map((service) => (
                    <Box
                      key={service}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.neutral[100],
                        fontSize: 12,
                        color: theme.palette.custom.neutral[700],
                      }}
                    >
                      {service}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        );
      })}

      {errors.shippingPartners && (
        <Alert severity="error" sx={{ mt: 2 }}>{errors.shippingPartners}</Alert>
      )}

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.custom.status.info.light,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.info.main, mb: 0.5 }}>
          Note:
        </Typography>
        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
          You must select at least one shipping partner. Shipping fees will be calculated based on the partner's rates and the delivery distance. You can change your shipping partners later in shop settings.
        </Typography>
      </Box>
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
        {/* Shop Info Summary */}
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
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Shop Details
            </Typography>

            {formData.logoUrl && (
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  variant="rounded"
                  src={formData.logoUrl}
                  sx={{ width: 64, height: 64, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
                >
                  <Store sx={{ color: theme.palette.custom.neutral[400] }} />
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Shop Logo</Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.custom.status.success.main, fontWeight: 500 }}>Uploaded</Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Shop Name</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.shopName || '-'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Email</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.email || '-'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Phone</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.phone || '-'}
              </Typography>
            </Box>

          </Paper>
        </Grid>

        {/* Address Summary */}
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
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Address Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Address</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.address || '-'}
              </Typography>
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

        {/* Business License Summary */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Business License
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>License Number</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.licenseNumber || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Business Name</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.businessName || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Business Type</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.businessType
                    ? { individual: 'Individual Business', household: 'Household Business', company: 'Limited Company', joint_stock: 'Joint Stock Company', partnership: 'Partnership' }[formData.businessType] ?? formData.businessType
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Tax ID</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.taxId || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Legal Representative</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.legalRepresentative || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Registered Address</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.registeredAddress || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Issued Date</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.issuedDate || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Expiry Date</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.expiryDate || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Issued By</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.issuedBy || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400], mb: 1 }}>License Document</Typography>
                {formData.licenseImageUrl ? (
                  <Box
                    component="img"
                    src={formData.licenseImageUrl}
                    alt="License document"
                    onClick={() => window.open(formData.licenseImageUrl, '_blank')}
                    sx={{
                      width: '100%',
                      maxHeight: 280,
                      objectFit: 'contain',
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.custom.border.light}`,
                      bgcolor: theme.palette.custom.neutral[50],
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>-</Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Shipping Partners Summary */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.custom.neutral[500],
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Shipping Partners ({selectedShippingPartners.length})
            </Typography>

            {selectedShippingPartners.length === 0 ? (
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                No shipping partner selected
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedShippingPartners.map((partnerId) => {
                  const partner = shippingPartners.find((p) => p.id === partnerId);
                  return partner ? (
                    <Box
                      key={partnerId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.warning.light,
                      }}
                    >
                      <LocalShipping sx={{ fontSize: 16, color: theme.palette.custom.status.warning.main }} />
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], fontWeight: 500 }}>
                        {partner.name}
                      </Typography>
                    </Box>
                  ) : null;
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.custom.status.warning.light,
        }}
      >
        <Typography sx={{ fontSize: 14, color: theme.palette.custom.status.warning.main }}>
          By submitting this registration, you confirm that all information provided is accurate and you agree
          to our Terms of Service and Seller Agreement.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
      {/* Shop Owner Registration Navbar */}
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
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBack />
        </IconButton>
        <Box
          sx={{
            width: 32,
            height: 32,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Store sx={{ color: theme.palette.primary.contrastText, fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: theme.palette.text.primary }}>
          Glassify Shop Owner Registration
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
        {/* Welcome Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            border: `1px solid ${theme.palette.primary.main}30`,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: theme.palette.custom.neutral[900], mb: 1 }}
          >
            Welcome to Glassify ✨
          </Typography>
          <Typography sx={{ fontSize: 15, color: theme.palette.custom.neutral[700], mb: 2, lineHeight: 1.7 }}>
            Glassify is Vietnam's leading eyewear marketplace — built for sellers who want to reach more customers with less effort.
            Our platform combines a modern storefront with <strong>AI-powered try-on technology</strong>, letting shoppers virtually try on your frames in real time, boosting confidence and conversion like never before.
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], lineHeight: 1.7 }}>
            Ready to grow your eyewear business? Fill in the form below and our team will review your application. Once approved, your shop goes live and you can start selling right away.
          </Typography>
        </Paper>

        {/* Progress Stepper */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          <Stepper activeStep={activeStep} connector={<CustomConnector />} alternativeLabel>
            {registrationSteps.map((step, index) => (
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
                      color:
                        index <= activeStep
                          ? theme.palette.custom.neutral[800]
                          : theme.palette.custom.neutral[400],
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
          sx={{
            p: 4,
            borderRadius: 2,
            border: `1px solid ${theme.palette.custom.border.light}`,
          }}
        >
          {activeStep === 0 && renderShopInfoForm()}
          {activeStep === 1 && renderLicenseUpload()}
          {activeStep === 2 && renderShipping()}
          {activeStep === 3 && renderReview()}

          {/* Policy Agreement */}
          <Box
            sx={{
              mt: 4,
              p: 2.5,
              borderRadius: 2,
              bgcolor: theme.palette.custom.neutral[50],
              border: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={policyAgreed}
                  onChange={(e) => setPolicyAgreed(e.target.checked)}
                  sx={{
                    color: theme.palette.custom.neutral[400],
                    '&.Mui-checked': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[700] }}>
                  I have read and agree to the{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPolicyDialogOpen(true);
                    }}
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      '&:hover': {
                        color: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Platform Seller Policy & Terms of Service
                  </Link>
                </Typography>
              }
            />
          </Box>

          {/* Submit Error */}
          {submitError && (
            <Alert
              severity="error"
              onClose={() => setSubmitError(null)}
              sx={{ mt: 3 }}
            >
              {submitError}
            </Alert>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.custom.border.light}` }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || submitting}
              sx={{ px: 4 }}
            >
              Back
            </Button>

            {activeStep < registrationSteps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ px: 4 }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!policyAgreed || submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{
                  px: 4,
                  bgcolor: theme.palette.custom.status.success.main,
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </Button>
            )}
          </Box>
        </Paper>

        {/* Policy Dialog */}
        <Dialog
          open={policyDialogOpen}
          onClose={() => setPolicyDialogOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: { sx: { borderRadius: 2 } },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: 20,
              borderBottom: `1px solid ${theme.palette.custom.border.light}`,
            }}
          >
            Platform Seller Policy & Terms of Service
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              1. General Terms
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              By registering as a seller on Glassify platform, you agree to comply with all applicable laws and regulations. You must provide accurate and complete information during the registration process. Any false or misleading information may result in the rejection or termination of your seller account.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              2. Product Listing Requirements
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              All products listed on the platform must be authentic and comply with quality standards. Sellers are responsible for ensuring accurate product descriptions, images, and pricing. Counterfeit or prohibited items are strictly forbidden and will result in immediate account suspension.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              3. Order Fulfillment
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              Sellers must process and ship orders within the specified timeframe (typically 2-3 business days). Orders must be properly packaged to prevent damage during transit. Tracking information must be provided for all shipments.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              4. Customer Service
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              Sellers must respond to customer inquiries within 24 hours. Professional and courteous communication is required at all times. Disputes should be resolved amicably, and refunds/returns must be processed according to platform policies.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              5. Fees and Payments
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              Platform commission fees will be deducted from each sale. Payment settlements are processed on a bi-weekly basis. Sellers are responsible for their own tax obligations and reporting.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              6. Account Termination
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              The platform reserves the right to suspend or terminate seller accounts for violations of these terms, poor performance metrics, or fraudulent activities. Sellers may close their accounts with 30 days written notice.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              7. Data Privacy
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600], mb: 3 }}>
              Seller information will be handled in accordance with our Privacy Policy. Customer data must be protected and used only for order fulfillment purposes. Sharing or selling customer data is strictly prohibited.
            </Typography>

            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}
            >
              8. Intellectual Property
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
              Sellers must have the right to sell all listed products and use associated trademarks. Any infringement claims will be taken seriously and may result in product removal and account suspension.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.custom.border.light}` }}>
            <Button onClick={() => setPolicyDialogOpen(false)} sx={{ px: 3 }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setPolicyAgreed(true);
                setPolicyDialogOpen(false);
              }}
              sx={{ px: 3 }}
            >
              I Agree
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Dialog */}
        <Dialog
          open={successDialogOpen}
          onClose={handleSuccessDialogClose}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: { sx: { borderRadius: 2, textAlign: 'center' } },
          }}
        >
          <DialogContent sx={{ py: 5, px: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: theme.palette.custom.status.success.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: theme.palette.custom.status.success.main }} />
            </Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 700,
                color: theme.palette.custom.neutral[800],
                mb: 2,
              }}
            >
              Registration Submitted Successfully!
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                color: theme.palette.custom.neutral[600],
                mb: 3,
              }}
            >
              Our team will review your application and notify you within a few business days.
            </Typography>

            {registerResponse && (
              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.border.light}`,
                  bgcolor: theme.palette.custom.neutral[50],
                  textAlign: 'left',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.palette.custom.neutral[500],
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    mb: 1.5,
                  }}
                >
                  Registration Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Shop Code</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                      {registerResponse.shopCode}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Request ID</Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: theme.palette.custom.neutral[600],
                        fontFamily: 'monospace',
                      }}
                    >
                      {registerResponse.requestId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Status</Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: theme.palette.custom.status.warning.light,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: theme.palette.custom.status.warning.main,
                          textTransform: 'uppercase',
                        }}
                      >
                        {registerResponse.status}
                      </Typography>
                    </Box>
                  </Box>
                  {registerResponse.submittedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Submitted At</Typography>
                      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                        {new Date(registerResponse.submittedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.custom.status.info.light,
              }}
            >
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }}>
                A confirmation email has been sent to <strong>{formData.email || 'your inbox'}</strong>. Please check it for updates on your registration status.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSuccessDialogOpen(false);
                navigate(PAGE_ENDPOINTS.HOME);
              }}
              sx={{ px: 4, py: 1.2 }}
            >
              Back to Homepage
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ShopRegistrationPage;
