import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

import CreateFrameGroupPage, {
    type CreateFrameGroupPageRef,
    type CreateFrameFormData,
} from './CreateFrameGroupPage';

import CreateFrameVariantPage, {
    type CreateFrameVariantPageRef,
    type CreateFrameVariantFormData,
} from './CreateFrameVariantPage';

import GenerateFrameModel from './GenerateFrameModel';
import View3DModelPage from './View3DModelPage';

// ─── Stepper ──────────────────────────────────────────────────────────────────

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
    { label: 'Upload Angles', key: 'UPLOAD' },
    { label: 'View 3D Model', key: '3D_MODEL' },
    { label: 'Review & Submit', key: 'REVIEW' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const CreateFramePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // ── Step ──────────────────────────────────────────────────────────────────
    const [activeStep, setActiveStep] = useState(1);

    // ── Refs to child submit() ────────────────────────────────────────────────
    const frameInfoRef = useRef<CreateFrameGroupPageRef>(null);
    const variantRef   = useRef<CreateFrameVariantPageRef>(null);

    // ── Persisted data (survive Back navigation) ──────────────────────────────
    const [frameGroupId,    setFrameGroupId]    = useState<string>('');
    const [savedGroupData,  setSavedGroupData]  = useState<Partial<CreateFrameFormData>>({});
    const [savedVariantData, setSavedVariantData] = useState<Partial<CreateFrameVariantFormData>>({});

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleNext = async () => {
        try {
            if (activeStep === 0) {
                // submit() validates + calls API
                // onCreated callback (below) runs on success → setActiveStep
                await frameInfoRef.current?.submit();
            } else if (activeStep === 1) {
                await variantRef.current?.submit();
            } else {
                // steps 2, 3, 4 — no validation needed yet
                setActiveStep(prev => Math.min(prev + 1, registrationSteps.length - 1));
            }
        } catch {
            // validate failed or API error → stay on current step
        }
    };

    const handleBack = () => {
        setActiveStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = () => {
        navigate(PAGE_ENDPOINTS.SHOP.PROFILE);
    };

    useLayoutConfig({ showNavbar: false, showFooter: false });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50], display: 'flex' }}>
            <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />

            <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBack />
                    </IconButton>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}
                    >
                        Add new Frame
                    </Typography>
                </Box>

                {/* Stepper */}
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
                                            {index < activeStep
                                                ? <CheckCircle sx={{ fontSize: 20 }} />
                                                : index + 1}
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
                    {/* ── Step 0: Frame Info ── */}
                    {activeStep === 0 && (
                        <CreateFrameGroupPage
                            ref={frameInfoRef}
                            initialData={savedGroupData}
                            onCreated={(id, data) => {
                                // lưu lại để restore nếu user back
                                setFrameGroupId(id);
                                setSavedGroupData(data);
                                // chỉ chuyển step khi API thành công
                                setActiveStep(1);
                            }}
                        />
                    )}

                    {/* ── Step 1: Frame Variant ── */}
                    {activeStep === 1 && (
                        <CreateFrameVariantPage
                            ref={variantRef}
                            frameGroupId={frameGroupId}
                            initialData={savedVariantData}
                            onCreated={(_, data) => {
                                // lưu lại để restore nếu user back
                                setSavedVariantData(data);
                                setActiveStep(2);
                            }}
                        />
                    )}

                    {/* ── Step 2: Upload Angles ── */}
                    {activeStep === 2 && <GenerateFrameModel />}

                    {/* ── Step 3: View 3D Model ── */}
                    {activeStep === 3 && <View3DModelPage />}

                    {/* ── Step 4: Review & Submit ── */}
                    {activeStep === 4 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CheckCircle
                                sx={{
                                    fontSize: 64,
                                    color: theme.palette.custom.status.success.main,
                                    mb: 2,
                                }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                Ready to Submit
                            </Typography>
                            <Typography sx={{ color: theme.palette.custom.neutral[500] }}>
                                Please review your information before submitting.
                            </Typography>
                        </Box>
                    )}

                    {/* Navigation Buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 4,
                            pt: 3,
                            borderTop: `1px solid ${theme.palette.custom.border.light}`,
                        }}
                    >
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