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
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';

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

const CreateFramePage = () => {
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
    // Navigate to shop profile after successful registration
    navigate(PAGE_ENDPOINTS.SHOP.PROFILE);
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
        Frame Information
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="Frame Name"
            value={formData.shopName}
            onChange={handleInputChange('shopName')}
            placeholder="Enter frame name"
            InputProps={{
              startAdornment: <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Frame Category</InputLabel>
            <Select
              value={formData.businessType}
              label="Frame Category"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="rectangle">Rectangle</MenuItem>
              <MenuItem value="square">Square</MenuItem>
              <MenuItem value="round">Round</MenuItem>
              <MenuItem value="oval">Oval</MenuItem>
              <MenuItem value="cat_eye">Cat Eye</MenuItem>
              <MenuItem value="aviator">Aviator</MenuItem>
              <MenuItem value="browline">Browline</MenuItem>
              <MenuItem value="geometric">Geometric</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Frame Type</InputLabel>
            <Select
              value={formData.businessType}
              label="Frame Type"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="full_rim">Full Rim</MenuItem>
              <MenuItem value="half_rim">Half Rim</MenuItem>
              <MenuItem value="rimless">Rimless</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Frame Shape</InputLabel>
            <Select
              value={formData.businessType}
              label="Frame Shape"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="rectangle">Rectangle</MenuItem>
              <MenuItem value="square">Square</MenuItem>
              <MenuItem value="round">Round</MenuItem>
              <MenuItem value="oval">Oval</MenuItem>
              <MenuItem value="cat_eye">Cat Eye</MenuItem>
              <MenuItem value="aviator">Aviator</MenuItem>
              <MenuItem value="browline">Browline</MenuItem>
              <MenuItem value="geometric">Geometric</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Frame Material</InputLabel>
            <Select
              value={formData.businessType}
              label="Frame Material"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="acetate">Acetate</MenuItem>
              <MenuItem value="metal">Metal</MenuItem>
              <MenuItem value="titanium">Titanium</MenuItem>
              <MenuItem value="plastic">Plastic</MenuItem>
              <MenuItem value="mixed">Mixed Material</MenuItem>
              <MenuItem value="carbon">Carbon Fiber</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Gender Target</InputLabel>
            <Select
              value={formData.businessType}
              label="Gender Target"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="others">Others</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Age Group</InputLabel>
            <Select
              value={formData.businessType}
              label="Age Group"
              onChange={handleSelectChange('businessType')}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="others">Others</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Frame Description"
            value={formData.shopDescription}
            onChange={handleInputChange('shopDescription')}
            placeholder="Describe your frame..."
          />
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
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50], display: 'flex' }}>
      {/* Main Content */}
      <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
              Register Your Shop
            </Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Complete the registration process to start selling on our platform
            </Typography>
          </Box>
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
          {activeStep === 2 && renderReview()}

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
              <Button variant="contained" onClick={handleNext} sx={{ px: 4 }}>
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
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
      </Box>
    </Box>
  );
};

export default CreateFramePage;
