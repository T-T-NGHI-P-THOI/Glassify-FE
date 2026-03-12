import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  CheckCircle,
  InsertDriveFile,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../../layouts/LayoutContext';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import CreateFrameVariantPage from './CreateFrameVariantPage';
import CreateFrameInfoPage, { type CreateFrameInfoPageRef } from "./CreateFrameInfoPage";
import GenerateFrameModel from './GenerateFrameModel';
import View3DModelPage from './View3DModelPage';
import { useRef } from "react";
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
  { label: 'Frame Info', key: 'FRAME_INFO' },
  { label: 'Frame Variant', key: 'VARIANT' },
  { label: 'Upload Angles ', key: 'UPLOAD' },
  { label: 'View 3D Model ', key: '3D_MODEL' },
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

const CreateFramePage = () => {
  const theme = useTheme();
  const frameInfoRef = useRef<CreateFrameInfoPageRef>(null);
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


  const handleNext = async () => {
    try {
      if (activeStep === 0) {
        await frameInfoRef.current?.submit();
      }
      setActiveStep((prev) => Math.min(prev + 1, registrationSteps.length - 1));
    } catch(error) {
      console.log("Validate error: ", error)
      // validation failed → không next step
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    // Submit registration
    // console.log('Submitting:', { formData, licenseFiles });
    // Navigate to shop profile after successful registration
    navigate(PAGE_ENDPOINTS.SHOP.PROFILE);
  }


  // const renderReview = () => (
  //   <Box>
  //     <Typography
  //       sx={{
  //         fontSize: 18,
  //         fontWeight: 600,
  //         color: theme.palette.custom.neutral[800],
  //         mb: 3,
  //         display: 'flex',
  //         alignItems: 'center',
  //         gap: 1,
  //       }}
  //     >
  //       <CheckCircle sx={{ color: theme.palette.custom.status.success.main }} />
  //       Review Your Information
  //     </Typography>

  //     <Grid container spacing={3}>
  //       {/* Shop Info Summary */}
  //       <Grid size={{ xs: 12, md: 6 }}>
  //         <Paper
  //           elevation={0}
  //           sx={{
  //             p: 3,
  //             borderRadius: 2,
  //             border: `1px solid ${theme.palette.custom.border.light}`,
  //             height: '100%',
  //           }}
  //         >
  //           <Typography
  //             sx={{
  //               fontSize: 14,
  //               fontWeight: 600,
  //               color: theme.palette.custom.neutral[500],
  //               textTransform: 'uppercase',
  //               mb: 2,
  //             }}
  //           >
  //             Shop Details
  //           </Typography>

  //           <Box sx={{ mb: 2 }}>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Shop Name</Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.shopName || '-'}
  //             </Typography>
  //           </Box>

  //           <Box sx={{ mb: 2 }}>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>
  //               Business Type
  //             </Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.businessType || '-'}
  //             </Typography>
  //           </Box>

  //           <Box sx={{ mb: 2 }}>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Tax Code</Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.taxCode || '-'}
  //             </Typography>
  //           </Box>

  //           <Box>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Address</Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.shopAddress || '-'}
  //             </Typography>
  //           </Box>
  //         </Paper>
  //       </Grid>

  //       {/* Owner Info Summary */}
  //       <Grid size={{ xs: 12, md: 6 }}>
  //         <Paper
  //           elevation={0}
  //           sx={{
  //             p: 3,
  //             borderRadius: 2,
  //             border: `1px solid ${theme.palette.custom.border.light}`,
  //             height: '100%',
  //           }}
  //         >
  //           <Typography
  //             sx={{
  //               fontSize: 14,
  //               fontWeight: 600,
  //               color: theme.palette.custom.neutral[500],
  //               textTransform: 'uppercase',
  //               mb: 2,
  //             }}
  //           >
  //             Owner Details
  //           </Typography>

  //           <Box sx={{ mb: 2 }}>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Full Name</Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.ownerName || '-'}
  //             </Typography>
  //           </Box>

  //           <Box sx={{ mb: 2 }}>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Phone</Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.ownerPhone || '-'}
  //             </Typography>
  //           </Box>

  //           <Box>
  //             <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>Email</Typography>
  //             <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
  //               {formData.ownerEmail || '-'}
  //             </Typography>
  //           </Box>
  //         </Paper>
  //       </Grid>

  //       {/* Documents Summary */}
  //       <Grid size={{ xs: 12 }}>
  //         <Paper
  //           elevation={0}
  //           sx={{
  //             p: 3,
  //             borderRadius: 2,
  //             border: `1px solid ${theme.palette.custom.border.light}`,
  //           }}
  //         >
  //           <Typography
  //             sx={{
  //               fontSize: 14,
  //               fontWeight: 600,
  //               color: theme.palette.custom.neutral[500],
  //               textTransform: 'uppercase',
  //               mb: 2,
  //             }}
  //           >
  //             Uploaded Documents ({licenseFiles.length})
  //           </Typography>

  //           {licenseFiles.length === 0 ? (
  //             <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
  //               No documents uploaded
  //             </Typography>
  //           ) : (
  //             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
  //               {licenseFiles.map((file, index) => (
  //                 <Box
  //                   key={index}
  //                   sx={{
  //                     display: 'flex',
  //                     alignItems: 'center',
  //                     gap: 1,
  //                     px: 2,
  //                     py: 1,
  //                     borderRadius: 1,
  //                     bgcolor: theme.palette.custom.neutral[100],
  //                   }}
  //                 >
  //                   <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.custom.neutral[500] }} />
  //                   <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[700] }}>
  //                     {file.name}
  //                   </Typography>
  //                 </Box>
  //               ))}
  //             </Box>
  //           )}
  //         </Paper>
  //       </Grid>
  //     </Grid>

  //     <Box
  //       sx={{
  //         mt: 3,
  //         p: 2,
  //         borderRadius: 2,
  //         bgcolor: theme.palette.custom.status.warning.light,
  //       }}
  //     >
  //       <Typography sx={{ fontSize: 14, color: theme.palette.custom.status.warning.main }}>
  //         By submitting this registration, you confirm that all information provided is accurate and you agree
  //         to our Terms of Service and Seller Agreement.
  //       </Typography>
  //     </Box>
  //   </Box>
  // );

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
              Add new Frame
            </Typography>
            {/* <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
              Complete the registration process to start selling on our platform
            </Typography> */}
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
          {activeStep === 0 && <CreateFrameInfoPage ref={frameInfoRef} />}
          {activeStep === 1 && <CreateFrameVariantPage />}
          {activeStep === 2 && <GenerateFrameModel />}
          {activeStep === 3 && <View3DModelPage />}
          {/* {activeStep === 2 && renderReview()} */}

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
