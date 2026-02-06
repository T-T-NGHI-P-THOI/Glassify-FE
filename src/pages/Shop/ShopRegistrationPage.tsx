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
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  CloudUpload,
  Store,
  Description,
  CheckCircle,
  Business,
  LocationOn,
  Phone,
  Email,
  Delete,
  InsertDriveFile,
  LocalShipping,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import type { ShopRegisterRequest } from '@/models/Shop';
import { shopApi } from '@/api/shopApi';

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

// Styled upload area
const UploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.custom.border.light}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.custom.neutral[50],
  },
}));

const registrationSteps = [
  { label: 'Shop Information', key: 'SHOP_INFO' },
  { label: 'Business License', key: 'LICENSE' },
  { label: 'Shipping', key: 'SHIPPING' },
  { label: 'Review & Submit', key: 'REVIEW' },
];

// ==================== LOCATION DATA (GHN) ====================
interface LocationOption {
  value: string;
  name: string;
  ghnId: number;
}

interface WardOption {
  value: string;
  name: string;
  ghnCode: string;
}

const PROVINCES: LocationOption[] = [
  { value: 'hanoi', name: 'Ha Noi', ghnId: 201 },
  { value: 'hcm', name: 'Ho Chi Minh City', ghnId: 202 },
  { value: 'danang', name: 'Da Nang', ghnId: 48 },
  { value: 'haiphong', name: 'Hai Phong', ghnId: 203 },
];

const DISTRICTS: Record<string, LocationOption[]> = {
  hanoi: [
    { value: 'district1', name: 'Ba Dinh', ghnId: 1488 },
    { value: 'district2', name: 'Hoan Kiem', ghnId: 1489 },
    { value: 'district3', name: 'Cau Giay', ghnId: 1490 },
  ],
  hcm: [
    { value: 'district1', name: 'District 1', ghnId: 1442 },
    { value: 'district2', name: 'District 3', ghnId: 1443 },
    { value: 'district3', name: 'Thu Duc', ghnId: 1444 },
  ],
  danang: [
    { value: 'district1', name: 'Hai Chau', ghnId: 1535 },
    { value: 'district2', name: 'Thanh Khe', ghnId: 1536 },
    { value: 'district3', name: 'Son Tra', ghnId: 1537 },
  ],
  haiphong: [
    { value: 'district1', name: 'Hong Bang', ghnId: 1560 },
    { value: 'district2', name: 'Le Chan', ghnId: 1561 },
    { value: 'district3', name: 'Ngo Quyen', ghnId: 1562 },
  ],
};

const WARDS: Record<string, WardOption[]> = {
  district1: [
    { value: 'ward1', name: 'Ward 1', ghnCode: '1A0101' },
    { value: 'ward2', name: 'Ward 2', ghnCode: '1A0102' },
    { value: 'ward3', name: 'Ward 3', ghnCode: '1A0103' },
  ],
  district2: [
    { value: 'ward1', name: 'Ward 1', ghnCode: '1A0201' },
    { value: 'ward2', name: 'Ward 2', ghnCode: '1A0202' },
    { value: 'ward3', name: 'Ward 3', ghnCode: '1A0203' },
  ],
  district3: [
    { value: 'ward1', name: 'Ward 1', ghnCode: '1A0301' },
    { value: 'ward2', name: 'Ward 2', ghnCode: '1A0302' },
    { value: 'ward3', name: 'Ward 3', ghnCode: '1A0303' },
  ],
};

// ==================== FORM INTERFACES ====================
interface ShopFormData {
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  taxId: string;
  businessLicense: string;
  businessLicenseUrl: string;
  logoUrl: string;
}

interface LicenseFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

const ShopRegistrationPage = () => {
  const theme = useTheme();
  const { setShowNavbar, setShowFooter } = useLayout();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<ShopFormData>({
    shopName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    taxId: '',
    businessLicense: '',
    businessLicenseUrl: '',
    logoUrl: '',
  });
  const [licenseFiles, setLicenseFiles] = useState<LicenseFile[]>([]);
  const [selectedShippingPartners, setSelectedShippingPartners] = useState<string[]>([]);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setShowNavbar(false);
    setShowFooter(true);

    return () => {
      setShowNavbar(true);
      setShowFooter(true);
    };
  }, [setShowNavbar, setShowFooter]);

  const handleInputChange = (field: keyof ShopFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (field: keyof ShopFormData) => (e: any) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log(files);
    if (files) {
      const newFiles: LicenseFile[] = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setLicenseFiles((prev) => [...prev, ...newFiles]);
      setFormData((prev) => ({ ...prev, businessLicenseUrl: newFiles[0].name }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setLicenseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, registrationSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const province = PROVINCES.find((p) => p.value === formData.city);
      const districtList = DISTRICTS[formData.city] || [];
      const district = districtList.find((d) => d.value === formData.district);
      const wardList = WARDS[formData.district] || [];
      const ward = wardList.find((w) => w.value === formData.ward);

      const requestData: ShopRegisterRequest = {
        shopName: formData.shopName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: province?.name || formData.city,
        businessLicense: formData.businessLicense,
        businessLicenseUrl: formData.businessLicenseUrl,
        logoUrl: formData.logoUrl,
        ghnProvinceId: province?.ghnId || 0,
        ghnDistrictId: district?.ghnId || 0,
        ghnWardCode: ward?.ghnCode || '',
        provinceName: province?.name || '',
        districtName: district?.name || '',
        wardName: ward?.name || '',
        taxId: formData.taxId,
      };

      await shopApi.register(requestData);
      setSuccessDialogOpen(true);
    } catch (err: any) {
      const message =
        err?.message || err?.errors?.[0] || 'Registration failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate(PAGE_ENDPOINTS.DASHBOARD);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            onChange={handleInputChange('shopName')}
            placeholder="Enter your shop name"
            InputProps={{
              startAdornment: <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
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
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            placeholder="Enter phone number"
            InputProps={{
              startAdornment: <Phone sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Tax ID"
            value={formData.taxId}
            onChange={handleInputChange('taxId')}
            placeholder="Enter tax identification number"
            InputProps={{
              startAdornment: <Business sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Logo URL"
            value={formData.logoUrl}
            onChange={handleInputChange('logoUrl')}
            placeholder="Enter logo image URL"
          />
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
            onChange={handleInputChange('address')}
            placeholder="Enter street address"
            InputProps={{
              startAdornment: <LocationOn sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth required>
            <InputLabel>City/Province</InputLabel>
            <Select
              value={formData.city}
              label="City/Province *"
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, city: e.target.value, district: '', ward: '' }));
              }}
            >
              {PROVINCES.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>District</InputLabel>
            <Select
              value={formData.district}
              label="District"
              disabled={!formData.city}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, district: e.target.value, ward: '' }));
              }}
            >
              {(DISTRICTS[formData.city] || []).map((d) => (
                <MenuItem key={d.value} value={d.value}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Ward</InputLabel>
            <Select
              value={formData.ward}
              label="Ward"
              disabled={!formData.district}
              onChange={handleSelectChange('ward')}
            >
              {(WARDS[formData.district] || []).map((w) => (
                <MenuItem key={w.value} value={w.value}>{w.name}</MenuItem>
              ))}
            </Select>
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
        Please provide your business license information and upload related documents for verification.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Business License Number"
            value={formData.businessLicense}
            onChange={handleInputChange('businessLicense')}
            placeholder="Enter business license number"
            InputProps={{
              startAdornment: <Description sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Business License URL"
            value={formData.businessLicenseUrl}
            onChange={handleInputChange('businessLicenseUrl')}
            placeholder="Enter license document URL (optional)"
          />
        </Grid>
      </Grid>

      <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1.5 }}>
        Upload License Documents
      </Typography>
      <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
        Accepted formats: PDF, JPG, PNG (max 10MB each)
      </Typography>

      <input
        type="file"
        id="license-upload"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <label htmlFor="license-upload">
        <UploadArea>
          <CloudUpload sx={{ fontSize: 48, color: theme.palette.custom.neutral[400], mb: 2 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 500, color: theme.palette.custom.neutral[700], mb: 1 }}>
            Drag and drop files here or click to browse
          </Typography>
          <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
            PDF, JPG, PNG up to 10MB
          </Typography>
        </UploadArea>
      </label>

      {licenseFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 2 }}>
            Uploaded Files ({licenseFiles.length})
          </Typography>

          {licenseFiles.map((file, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.custom.border.light}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {file.preview ? (
                <Avatar
                  variant="rounded"
                  src={file.preview}
                  sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.neutral[100] }}
                />
              ) : (
                <Avatar
                  variant="rounded"
                  sx={{ width: 48, height: 48, bgcolor: theme.palette.custom.status.error.light }}
                >
                  <InsertDriveFile sx={{ color: theme.palette.custom.status.error.main }} />
                </Avatar>
              )}

              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {file.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                  {formatFileSize(file.size)}
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={() => handleRemoveFile(index)}
                sx={{ color: theme.palette.custom.status.error.main }}
              >
                <Delete />
              </IconButton>
            </Paper>
          ))}
        </Box>
      )}

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.custom.status.info.light,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.status.info.main, mb: 1 }}>
          Required Documents:
        </Typography>
        <Typography
          component="ul"
          sx={{ fontSize: 13, color: theme.palette.custom.neutral[700], m: 0, pl: 2 }}
        >
          <li>Business Registration Certificate</li>
          <li>Owner's ID Card (front and back)</li>
          <li>Tax Registration Certificate (if applicable)</li>
          <li>Bank Account Verification</li>
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

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Tax ID</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.taxId || '-'}
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
                {PROVINCES.find((p) => p.value === formData.city)?.name || '-'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>District</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {(DISTRICTS[formData.city] || []).find((d) => d.value === formData.district)?.name || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Ward</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {(WARDS[formData.district] || []).find((w) => w.value === formData.ward)?.name || '-'}
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

            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>License Number</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.businessLicense || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>License URL</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                  {formData.businessLicenseUrl || '-'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Documents Summary */}
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
              Uploaded Documents ({licenseFiles.length})
            </Typography>

            {licenseFiles.length === 0 ? (
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                No documents uploaded
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {licenseFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      bgcolor: theme.palette.custom.neutral[100],
                    }}
                  >
                    <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
                      {file.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
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
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
            Register Your Shop
          </Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
            Complete the registration process to start selling on our platform
          </Typography>
        </Box>

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
                  StepIconComponent={() => (
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
                  )}
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
                disabled={!policyAgreed}
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
                mb: 1,
              }}
            >
              Thank you for registering your shop on Glassify.
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                color: theme.palette.custom.neutral[600],
                mb: 3,
              }}
            >
              Our team will review your registration and you will receive a notification within the next few days regarding the status of your application.
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.custom.status.info.light,
              }}
            >
              <Typography sx={{ fontSize: 14, color: theme.palette.custom.status.info.main }}>
                Please check your email <strong>{formData.email || 'inbox'}</strong> for updates on your registration status.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleSuccessDialogClose}
              sx={{ px: 5, py: 1.2 }}
            >
              Back to Dashboard
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ShopRegistrationPage;
