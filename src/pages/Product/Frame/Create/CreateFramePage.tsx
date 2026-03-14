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

import Upload3DModelPage, {
    type Upload3DModelPageRef,
    type Model3DFile,
} from './Upload3DModel';

import ReviewFramePage from './ReviewFramePage';

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
    { label: 'Upload 3D Model', key: 'UPLOAD' },
    { label: 'Review & Submit', key: 'REVIEW' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const CreateFramePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // ── Step ──────────────────────────────────────────────────────────────────
    const [activeStep, setActiveStep] = useState(0);

    // ── Refs to child submit() ────────────────────────────────────────────────
    const frameInfoRef = useRef<CreateFrameGroupPageRef>(null);
    const variantRef = useRef<CreateFrameVariantPageRef>(null);
    const upload3DModelRef = useRef<Upload3DModelPageRef>(null);

    // ── Persisted data (survive Back navigation) ──────────────────────────────
    const [frameGroupId, setFrameGroupId] = useState<string>('');
    const [variantId, setVariantId] = useState<string>('');
    const [savedGroupData, setSavedGroupData] = useState<Partial<CreateFrameFormData>>({});
    const [savedVariantData, setSavedVariantData] = useState<Partial<CreateFrameVariantFormData>>({});
    const [savedModelFile, setSavedModelFile] = useState<Model3DFile | null>(null);
    const [savedModelUrl, setSavedModelUrl] = useState<string>('');

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleNext = async () => {
        try {
            if (activeStep === 0) {
                await frameInfoRef.current?.submit();
            } else if (activeStep === 1) {
                await variantRef.current?.submit();
            } else if (activeStep === 2) {
                await upload3DModelRef.current?.submit();
            }
            setActiveStep(prev => Math.min(prev + 1, registrationSteps.length - 1));
        } catch {
            // validation failed or API error → stay on current step
        }
    };

    const handleBack = () => {
        setActiveStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = () => {
        // TODO: final submit API call if needed
        navigate(PAGE_ENDPOINTS.SHOP.PROFILE);
    };

    useLayoutConfig({ showNavbar: false, showFooter: false });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50], display: 'flex' }}>
            <Sidebar activeMenu={PAGE_ENDPOINTS.TRACKING.SHOPS} />

            <Box sx={{ maxWidth: 1000, mx: 'auto', p: 4 }}>
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
                                setFrameGroupId(id);
                                setSavedGroupData(data);
                            }}
                        />
                    )}

                    {/* ── Step 1: Frame Variant ── */}
                    {activeStep === 1 && (
                        <CreateFrameVariantPage
                            ref={variantRef}
                            frameGroupId={frameGroupId}
                            initialData={savedVariantData}
                            onCreated={(id, data) => {
                                setVariantId(id);
                                setSavedVariantData(data);
                            }}
                        />
                    )}

                    {/* ── Step 2: Upload 3D Model ── */}
                    {activeStep === 2 && (
                        <Upload3DModelPage
                            ref={upload3DModelRef}
                            variantId={variantId}
                            initialFile={savedModelFile}
                            onUploaded={(modelUrl, file) => {
                                setSavedModelUrl(modelUrl);
                                setSavedModelFile(file);
                            }}
                        />
                    )}

                    {/* ── Step 3: Review & Submit ── */}
                    {activeStep === 3 && (
                        <ReviewFramePage
                            groupData={savedGroupData}
                            variantData={savedVariantData}
                            modelFile={savedModelFile}
                        />
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
                                Submit
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default CreateFramePage;