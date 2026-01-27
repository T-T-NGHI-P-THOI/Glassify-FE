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
  Person,
  Delete,
  InsertDriveFile,
  LocalShipping,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

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

interface ShopFormData {
  shopName: string;
  shopDescription: string;
  businessType: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  shopAddress: string;
  city: string;
  district: string;
  ward: string;
  taxCode: string;
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
    shopDescription: '',
    businessType: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    shopAddress: '',
    city: '',
    district: '',
    ward: '',
    taxCode: '',
  });
  const [licenseFiles, setLicenseFiles] = useState<LicenseFile[]>([]);
  const [selectedShippingPartners, setSelectedShippingPartners] = useState<string[]>([]);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

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
    if (files) {
      const newFiles: LicenseFile[] = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setLicenseFiles((prev) => [...prev, ...newFiles]);
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

  const handleSubmit = () => {
    // Submit registration
    console.log('Submitting:', { formData, licenseFiles });
    // Show success dialog
    setSuccessDialogOpen(true);
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
            label="Shop Name"
            value={formData.shopName}
            onChange={handleInputChange('shopName')}
            placeholder="Enter your shop name"
            InputProps={{
              startAdornment: <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Shop Description"
            value={formData.shopDescription}
            onChange={handleInputChange('shopDescription')}
            placeholder="Describe your shop and products..."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Business Type</InputLabel>
            <Select
              value={formData.businessType}
              label="Business Type"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="individual">Individual/Sole Proprietor</MenuItem>
              <MenuItem value="company">Company/Corporation</MenuItem>
              <MenuItem value="partnership">Partnership</MenuItem>
              <MenuItem value="household">Household Business</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Tax Code"
            value={formData.taxCode}
            onChange={handleInputChange('taxCode')}
            placeholder="Enter tax identification number"
            InputProps={{
              startAdornment: <Business sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
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
        <Person sx={{ color: theme.palette.primary.main }} />
        Owner Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Owner Full Name"
            value={formData.ownerName}
            onChange={handleInputChange('ownerName')}
            placeholder="Enter owner's full name"
            InputProps={{
              startAdornment: <Person sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.ownerPhone}
            onChange={handleInputChange('ownerPhone')}
            placeholder="Enter phone number"
            InputProps={{
              startAdornment: <Phone sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.ownerEmail}
            onChange={handleInputChange('ownerEmail')}
            placeholder="Enter email address"
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
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
            label="Street Address"
            value={formData.shopAddress}
            onChange={handleInputChange('shopAddress')}
            placeholder="Enter street address"
            InputProps={{
              startAdornment: <LocationOn sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>City/Province</InputLabel>
            <Select
              value={formData.city}
              label="City/Province"
              onChange={handleSelectChange('city')}
            >
              <MenuItem value="hanoi">Ha Noi</MenuItem>
              <MenuItem value="hcm">Ho Chi Minh City</MenuItem>
              <MenuItem value="danang">Da Nang</MenuItem>
              <MenuItem value="haiphong">Hai Phong</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>District</InputLabel>
            <Select
              value={formData.district}
              label="District"
              onChange={handleSelectChange('district')}
            >
              <MenuItem value="district1">District 1</MenuItem>
              <MenuItem value="district2">District 2</MenuItem>
              <MenuItem value="district3">District 3</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Ward</InputLabel>
            <Select value={formData.ward} label="Ward" onChange={handleSelectChange('ward')}>
              <MenuItem value="ward1">Ward 1</MenuItem>
              <MenuItem value="ward2">Ward 2</MenuItem>
              <MenuItem value="ward3">Ward 3</MenuItem>
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
        Please upload your business license and related documents for verification. Accepted formats: PDF,
        JPG, PNG (max 10MB each)
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
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
                Business Type
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.businessType || '-'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Tax Code</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.taxCode || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Address</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.shopAddress || '-'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Owner Info Summary */}
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
              Owner Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Full Name</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.ownerName || '-'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Phone</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.ownerPhone || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Email</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                {formData.ownerEmail || '-'}
              </Typography>
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

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.custom.border.light}` }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
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
                disabled={!policyAgreed}
                sx={{
                  px: 4,
                  bgcolor: theme.palette.custom.status.success.main,
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                Submit Registration
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
                Please check your email <strong>{formData.ownerEmail || 'inbox'}</strong> for updates on your registration status.
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
