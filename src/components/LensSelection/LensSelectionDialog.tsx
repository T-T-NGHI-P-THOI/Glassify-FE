import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    FormControl,
    FormHelperText,
    Select,
    MenuItem,
    Chip,
    Checkbox,
    Paper,
    Divider,
    Alert,
    IconButton,
    Stack,
    Tooltip,
    Snackbar,
    Autocomplete,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import type { StepIconProps } from '@mui/material/StepIcon';
import {
    Close,
    Visibility,
    Computer,
    MenuBook,
    DriveEta,
    Terrain,
    CheckCircle,
    SaveAlt,
    Remove,
    Login,
    ShoppingCart,
    PhotoCamera,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@/hooks/useAuth';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import PrescriptionAPI from '@/api/prescription-api';
import useLensEnums from '@/hooks/useLensEnums';
import type {
    LensUsage,
    LensType,
    LensFeature,
    LensTint,
    Prescription,
    LensSelection,
    LensCatalogData,
    ValidationIssue,
    LensFrameValidationRequest,
    PrescriptionValidationRequest,
} from '@/models/Lens';

import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import lensService from '@/api/service/LensService';
import { formatCurrency } from '@/utils/formatCurrency';

interface LensSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (selection: LensSelection) => void;
    productName?: string;
    productId?: string;
    frameVariantId?: string;
    framePrice?: number;
    initialSelection?: LensSelection;
}

const USAGE_ICONS: { [key: string]: React.ReactElement } = {
    everyday: <Visibility />,
    computer: <Computer />,
    reading: <MenuBook />,
    driving: <DriveEta />,
    outdoor: <Terrain />,
};

const steps = ['Usage Purpose', 'Prescription (if any)', 'Lens Type', 'Tint Color', 'Additional Features', 'Confirmation'];
const LENS_FALLBACK_IMAGE = '/assets/imgs/Logo/logo.png';

// Custom StepIcon component
const CustomStepIcon: React.FC<StepIconProps & { isSkipped?: boolean }> = (props) => {
    const { active, completed, className, icon, isSkipped } = props;

    if (isSkipped) {
        return (
            <Box
                className={className}
                sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: 'action.disabled',
                    color: 'text.disabled',
                }}
            >
                <Remove sx={{ fontSize: 16 }} />
            </Box>
        );
    }

    if (completed) {
        return (
            <Box
                className={className}
                sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                }}
            >
                <CheckCircle sx={{ fontSize: 20 }} />
            </Box>
        );
    }

    return (
        <Box
            className={className}
            sx={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 2,
                borderColor: active ? 'primary.main' : 'action.disabled',
                color: active ? 'primary.main' : 'text.disabled',
                bgcolor: 'transparent',
            }}
        >
            {icon}
        </Box>
    );
};

export const LensSelectionDialog: React.FC<LensSelectionDialogProps> = ({
    open,
    onClose,
    onConfirm,
    productName = 'frame',
    productId,
    frameVariantId,
    framePrice = 0,
    initialSelection,
}) => {
    const theme = useTheme();
    const { isAuthenticated } = useAuth();
    const { prescriptions, loading: prescriptionsLoading, error: prescriptionsError, createPrescription, fetchPrescriptions } = usePrescriptions();
    const { prescriptionUsages } = useLensEnums();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const [activeStep, setActiveStep] = useState(0);
    const [selectedUsage, setSelectedUsage] = useState<LensUsage | null>(null);
    const [selectedLensType, setSelectedLensType] = useState<LensType | null>(null);
    const [prescription, setPrescription] = useState<Prescription>({
        left_eye: { sphere: '0.00' },
        right_eye: { sphere: '0.00' },
    });
    const [selectedFeatures, setSelectedFeatures] = useState<LensFeature[]>([]);
    const [selectedTint, setSelectedTint] = useState<LensTint | null>(null);
    const [failedLensImageIds, setFailedLensImageIds] = useState<Record<string, true>>({});
    const [prescriptionMode, setPrescriptionMode] = useState<'saved' | 'manual'>('saved');
    const [syncBothEyes, setSyncBothEyes] = useState({
        sphere: false,
        cylinder: false,
        axis: false,
        add: false,
        pd: false,
    });
    const [has2PD, setHas2PD] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [prescriptionName, setPrescriptionName] = useState('');
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);

    // API data state
    const [apiLensData, setApiLensData] = useState<LensCatalogData | null>(null);
    const [isLoadingLensData, setIsLoadingLensData] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Validation state
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [warningConfirmOpen, setWarningConfirmOpen] = useState(false);
    const [pendingWarnings, setPendingWarnings] = useState<ValidationIssue[]>([]);
    const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    // Prescription image scan state
    const [isScanningPrescription, setIsScanningPrescription] = useState(false);
    const [scannedPrescriptionImageUrl, setScannedPrescriptionImageUrl] = useState<string | null>(null);
    const prescriptionInputRef = useRef<HTMLInputElement | null>(null);

    const handlePrescriptionFileChange = async (file?: File | null) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setSnackbarMessage('File too large. Maximum 5MB allowed.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        try {
            setIsScanningPrescription(true);
            setSnackbarMessage('Scanning prescription image. Please wait...');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);

            const json = await PrescriptionAPI.scanPrescription(file);
            const data = json.data || json;
            if (!data) {
                throw new Error('No prescription data returned from scan.');
            }

            const mapped: Prescription = {
                left_eye: {
                    sphere: (data.sphL ?? 0).toFixed(2),
                    cylinder: data.cylL ? data.cylL.toFixed(2) : undefined,
                    axis: data.axisL ? String(data.axisL) : undefined,
                    add: data.addPower ? (data.addPower > 0 ? `+${data.addPower.toFixed(2)}` : data.addPower.toFixed(2)) : undefined,
                    pd: data.pdLeft && data.pdLeft !== 0 ? String(data.pdLeft) : (data.pdSingle && data.pdSingle !== 0 ? String(data.pdSingle) : undefined),
                },
                right_eye: {
                    sphere: (data.sphR ?? 0).toFixed(2),
                    cylinder: data.cylR ? data.cylR.toFixed(2) : undefined,
                    axis: data.axisR ? String(data.axisR) : undefined,
                    add: data.addPower ? (data.addPower > 0 ? `+${data.addPower.toFixed(2)}` : data.addPower.toFixed(2)) : undefined,
                    pd: data.pdRight && data.pdRight !== 0 ? String(data.pdRight) : (data.pdSingle && data.pdSingle !== 0 ? String(data.pdSingle) : undefined),
                },
            };

            setPrescription(mapped);
            if (data.imageUrl) setScannedPrescriptionImageUrl(data.imageUrl);

            setSnackbarMessage('Prescription scanned. Please review values and correct if needed before continuing.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error: any) {
            setSnackbarMessage(error?.message || 'Failed to scan prescription image.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsScanningPrescription(false);
            if (prescriptionInputRef.current) prescriptionInputRef.current.value = '';
        }
    };

    // Prescription values from API
    const [prescriptionValues, setPrescriptionValues] = useState<{
        sphere: string[];
        cylinder: string[];
        add: string[];
        pd: string[];
        pdMonocular: string[];
    }>();
    const [isLoadingPrescriptionValues, setIsLoadingPrescriptionValues] = useState(false);

    const axisOptions = useMemo(
        () => Array.from({ length: 180 }, (_, index) => (index + 1).toString()),
        []
    );

    const isNonZeroNumericValue = (input?: string) => {
        if (!input) return false;
        const numeric = Number(input);
        return Number.isFinite(numeric) && numeric !== 0;
    };

    const hasRestoredRef = useRef(false);

    const savedPrescriptions = (prescriptions || [])
        .filter(p => p && p.id)
        .map(p => ({
            id: p.id,
            name: p.name,
            date: new Date(p.prescriptionDate).toLocaleDateString('en-US'),
            left_eye: {
                sphere: (p.sphL ?? 0).toFixed(2),
                cylinder: p.cylL != null && p.cylL !== 0 ? p.cylL.toFixed(2) : undefined,
                axis: p.axisL != null && p.axisL !== 0 ? p.axisL.toString() : undefined,
                add: p.addPower != null && p.addPower !== 0 ? (p.addPower > 0 ? `+${p.addPower.toFixed(2)}` : p.addPower.toFixed(2)) : undefined,
                pd: p.pdSingle != null && p.pdSingle !== 0 ? p.pdSingle.toString() : (p.pdLeft != null && p.pdLeft !== 0 ? p.pdLeft.toString() : undefined),
            },
            right_eye: {
                sphere: (p.sphR ?? 0).toFixed(2),
                cylinder: p.cylR != null && p.cylR !== 0 ? p.cylR.toFixed(2) : undefined,
                axis: p.axisR != null && p.axisR !== 0 ? p.axisR.toString() : undefined,
                add: p.addPower != null && p.addPower !== 0 ? (p.addPower > 0 ? `+${p.addPower.toFixed(2)}` : p.addPower.toFixed(2)) : undefined,
                pd: p.pdSingle != null && p.pdSingle !== 0 ? p.pdSingle.toString() : (p.pdRight != null && p.pdRight !== 0 ? p.pdRight.toString() : undefined),
            },
        }));

    useEffect(() => {
        const fetchLensCatalog = async () => {
            if (!open || !frameVariantId) {
                return;
            }

            try {
                setIsLoadingLensData(true);
                setApiError(null);
                const catalog = await lensService.getLensCatalogForFrame(frameVariantId);
                setApiLensData(catalog);
            } catch (error) {
                console.error('Failed to load lens catalog:', error);
                setApiError('Unable to load lens data. Please try again.');
            } finally {
                setIsLoadingLensData(false);
            }
        };

        fetchLensCatalog();
    }, [open, frameVariantId]);

    // Fetch prescription values from API
    useEffect(() => {
        const fetchPrescriptionValues = async () => {
            if (!open) return;

            try {
                setIsLoadingPrescriptionValues(true);
                setApiError(null);
                const values = await lensService.getAllPrescriptionValues();
                setPrescriptionValues({
                    sphere: values.sphereValues,
                    cylinder: values.cylinderValues,
                    add: values.addValues,
                    pd: values.pdValues,
                    pdMonocular: values.pdMonocularValues,
                });
            } catch (error) {
                console.error('Failed to load prescription values:', error);
                setApiError('Unable to load prescription value list. Please try again later.');
            } finally {
                setIsLoadingPrescriptionValues(false);
            }
        };

        fetchPrescriptionValues();
    }, [open]);

    const availableUsages = useMemo(() => {
        if (!apiLensData || apiLensData.lenses.length === 0) {
            return [];
        }

        const usageMap = new Map<string, LensUsage>();

        apiLensData.lenses.forEach(lens => {
            lens.usages.forEach(usage => {
                if (!usageMap.has(usage.usageId)) {
                    usageMap.set(usage.usageId, {
                        id: usage.usageId,
                        name: usage.name,
                        allowProgressive: usage.allowProgressive,
                        description: usage.description,
                        isNonPrescription: usage.isNonPrescription,
                    });
                }
            });
        });

        return Array.from(usageMap.values());
    }, [apiLensData]);

    const availableLensTypes = useMemo(() => {
        if (!selectedUsage) return [];

        if (!apiLensData || apiLensData.lenses.length === 0) {
            return [];
        }

        return apiLensData.lenses
            .filter(lens => lens.usages.some(u => u.usageId === selectedUsage.id))
            .map(lens => {
                const currentUsage = lens.usages.find(u => u.usageId === selectedUsage.id);
                const isNonPrescription = currentUsage?.isNonPrescription;
                const isPrescription = !isNonPrescription;
                const lensRecord = lens as unknown as {
                    description?: string;
                    lensDescription?: string;
                    imageFileUrl?: string;
                    image_file_url?: string;
                    image?: string;
                };
                const apiDescription = [
                    lensRecord.description,
                    lensRecord.lensDescription,
                ].find((value): value is string => typeof value === 'string' && value.trim().length > 0);
                const resolvedImageUrl = [
                    lens.imageUrl,
                    lens.lensImageUrl,
                    lensRecord.imageFileUrl,
                    lensRecord.image_file_url,
                    lensRecord.image,
                ].find((value): value is string => typeof value === 'string' && value.trim().length > 0);
                const displayDescription = [apiDescription, `SKU: ${lens.lensSku}`].filter(Boolean).join(' • ');

                return {
                    id: lens.lensId,
                    name: lens.lensName,
                    description: displayDescription,
                    imageUrl: resolvedImageUrl,
                    price: lens.basePrice,
                    isPrescription: isPrescription,
                    isProgressive: lens.isProgressive,
                    usage_id: selectedUsage.id,
                };
            });
    }, [selectedUsage, apiLensData]);

    const isNonPrescriptionUsage = (usage?: LensUsage | null) => {
        return Boolean(usage?.isNonPrescription);
    };

    const getLensImageSrc = useCallback((lensType: LensType | null | undefined): string => {
        if (!lensType) return LENS_FALLBACK_IMAGE;
        if (failedLensImageIds[lensType.id]) return LENS_FALLBACK_IMAGE;
        return lensType.imageUrl || LENS_FALLBACK_IMAGE;
    }, [failedLensImageIds]);

    const handleLensImageError = useCallback((lensId: string) => {
        setFailedLensImageIds((prev) => {
            if (prev[lensId]) return prev;
            return { ...prev, [lensId]: true };
        });
    }, []);

    const availableTints = useMemo(() => {
        if (!selectedLensType || !apiLensData) {
            return [];
        }

        const selectedLens = apiLensData.lenses.find(l => l.lensId === selectedLensType.id);
        if (!selectedLens || selectedLens.tints.length === 0) {
            return [];
        }

        return selectedLens.tints.map(tint => ({
            id: tint.tintId,
            name: tint.name,
            description: `${tint.behavior} - Code: ${tint.code}`,
            price: tint.basePrice + tint.extraPrice,
            cssValue: tint.cssValue,
            opacity: tint.opacity,
        }));
    }, [selectedLensType, apiLensData]);

    const availableFeatures = useMemo(() => {
        if (!selectedLensType || !apiLensData) {
            return [];
        }

        const selectedLens = apiLensData.lenses.find(l => l.lensId === selectedLensType.id);
        if (!selectedLens || selectedLens.features.length === 0) {
            return [];
        }

        return selectedLens.features.map(feature => ({
            id: feature.featureId,
            name: feature.name,
            description: feature.description,
            price: feature.extraPrice,
            category: 'other',
        }));
    }, [selectedLensType, apiLensData]);

    // Restore from initialSelection (edit mode) - takes priority over localStorage
    useEffect(() => {
        if (open && initialSelection && !hasRestoredRef.current) {
            setActiveStep(5); // Go to confirmation step so user sees full selection
            setSelectedUsage(initialSelection.usage);
            setSelectedLensType(initialSelection.lens_type);
            if (initialSelection.prescription) {
                setPrescription(initialSelection.prescription);
                setPrescriptionMode('manual');
            }
            setSelectedTint(initialSelection.tint || null);
            setSelectedFeatures(initialSelection.features || []);
            hasRestoredRef.current = true;
        }
    }, [open, initialSelection]);

    useEffect(() => {
        if (open && !hasRestoredRef.current && !initialSelection) {
            const savedState = localStorage.getItem('lens_dialog_state');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    if (Date.now() - state.timestamp < 60 * 60 * 1000 && state.productId === productId) {
                        if (state.activeStep > 0 || state.selectedUsage || state.selectedLensType) {
                            setActiveStep(state.activeStep || 0);
                            setSelectedUsage(state.selectedUsage || null);
                            setSelectedLensType(state.selectedLensType || null);
                            setPrescription(state.prescription || { left_eye: { sphere: '0.00' }, right_eye: { sphere: '0.00' } });
                            setSelectedTint(state.selectedTint || null);
                            setSelectedFeatures(state.selectedFeatures || []);
                            setPrescriptionMode(state.prescriptionMode || 'saved');
                            setSyncBothEyes(state.syncBothEyes || { sphere: false, cylinder: false, axis: false, add: false, pd: false });
                            hasRestoredRef.current = true;
                        }
                    } else {
                        localStorage.removeItem('lens_dialog_state');
                    }
                } catch (error) {
                    console.error('Error restoring lens dialog state:', error);
                    localStorage.removeItem('lens_dialog_state');
                }
            }
            hasRestoredRef.current = true;
        }

        if (!open) {
            hasRestoredRef.current = false;
        }
    }, [open]);

    useEffect(() => {
        if (open && hasRestoredRef.current) {
            const dialogState = {
                productId,
                activeStep,
                selectedUsage,
                selectedLensType,
                prescription,
                selectedTint,
                selectedFeatures,
                prescriptionMode,
                syncBothEyes,
                timestamp: Date.now(),
            };
            localStorage.setItem('lens_dialog_state', JSON.stringify(dialogState));
        }
    }, [open, productId, activeStep, selectedUsage, selectedLensType, prescription, selectedTint, selectedFeatures, prescriptionMode, syncBothEyes]);

    useEffect(() => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                const hasLens = next.has('lens');

                if (open) {
                    if (hasLens && next.get('lens') === 'open') {
                        return prev;
                    }
                    next.set('lens', 'open');
                } else {
                    if (!hasLens) {
                        return prev;
                    }
                    next.delete('lens');
                }

                return next;
            },
            { replace: true },
        );
    }, [open, setSearchParams]);

    // Auto-validation has been disabled - only validate when user clicks "Continue"
    // This avoids unnecessary API calls when first entering step or selecting saved prescription

    const handleNext = async () => {
        // If warnings are already shown, user can acknowledge and continue on next click.
        if (pendingWarnings.length > 0 && !warningsAcknowledged) {
            setWarningsAcknowledged(true);
            setPendingWarnings([]);
            setValidationIssues([]);

            if (activeStep === 0 && isNonPrescriptionUsage(selectedUsage)) {
                setActiveStep((prev) => prev + 2);
            } else if (activeStep === 2 && availableTints.length === 0) {
                setActiveStep((prev) => prev + 2);
            } else {
                setActiveStep((prev) => prev + 1);
            }
            return;
        }

        if (activeStep === 1 && selectedUsage && !isNonPrescriptionUsage(selectedUsage)) {
            const addValue = prescription.right_eye.add || prescription.left_eye.add;

            // If usage is reading, only require ADD value and skip PD/AXIS checks and server validation
            if (isReading(selectedUsage)) {
                if (!addValue || addValue === '' || addValue === '0' || addValue === '0.0' || addValue === '0.00') {
                    setApiError('Please select ADD value');
                    return;
                }
                // proceed without calling validation API for reading
            } else {

                // Require ADD only for Progressive or Bifocal lenses
                if ((isProgressive(selectedUsage) || isBifocal(selectedUsage) || isReading(selectedUsage))) {
                    if (!addValue || addValue === '' || addValue === '0' || addValue === '0.0' || addValue === '0.00') {
                        setApiError('Please select ADD value');
                        return;
                    }
                }

                if (!has2PD) {
                    const pd = prescription.right_eye.pd || prescription.left_eye.pd;
                    if (!pd || pd === '0' || pd === '0.0' || pd === '0.00') {
                        setApiError('Please select Pupillary Distance (PD)');
                        return;
                    }
                } else {
                    const pdRight = prescription.right_eye.pd;
                    const pdLeft = prescription.left_eye.pd;
                    if (!pdRight || pdRight === '0' || pdRight === '0.0' || pdRight === '0.00' ||
                        !pdLeft || pdLeft === '0' || pdLeft === '0.0' || pdLeft === '0.00') {
                        setApiError('Please select PD for both eyes');
                        return;
                    }
                }

                if (!isProgressive(selectedUsage)) {
                    const requiresRightAxis = isNonZeroNumericValue(prescription.right_eye.cylinder);
                    const requiresLeftAxis = isNonZeroNumericValue(prescription.left_eye.cylinder);

                    if (requiresRightAxis && !isNonZeroNumericValue(prescription.right_eye.axis)) {
                        setApiError('Please select AXIS (1-180) for right eye when CYL is not 0');
                        return;
                    }

                    if (requiresLeftAxis && !isNonZeroNumericValue(prescription.left_eye.cylinder)) {
                        setApiError('Please select AXIS (1-180) for left eye when CYL is not 0');
                        return;
                    }
                }
            }

            try {
                setIsValidating(true);
                setValidationIssues([]);
                setApiError(null);

                const prescriptionRequest: PrescriptionValidationRequest = {
                    sphRight: parseFloat(prescription.right_eye.sphere || '0'),
                    sphLeft: parseFloat(prescription.left_eye.sphere || '0'),
                    cylRight: parseFloat(prescription.right_eye.cylinder || '0'),
                    cylLeft: parseFloat(prescription.left_eye.cylinder || '0'),
                    axisRight: parseFloat(prescription.right_eye.axis || '0'),
                    axisLeft: parseFloat(prescription.left_eye.axis || '0'),
                    add: parseFloat(prescription.right_eye.add || prescription.left_eye.add || '0'),
                    pd: has2PD ? undefined : parseFloat(prescription.right_eye.pd || prescription.left_eye.pd || '0'),
                    pdLeft: has2PD ? parseFloat(prescription.left_eye.pd || '0') : undefined,
                    pdRight: has2PD ? parseFloat(prescription.right_eye.pd || '0') : undefined,
                };

                console.log('🔍 Validating prescription:', prescriptionRequest);
                const response = await lensService.validatePrescription(prescriptionRequest);
                console.log('✅ Prescription validation response:', response);

                if (response.data && Array.isArray(response.data.issues) && response.data.issues.length > 0) {
                    const issues: ValidationIssue[] = response.data.issues.map(issue => ({
                        code: issue.code,
                        path: issue.field,
                        message: issue.message,
                        severity: (issue.level === 'ERROR' ? 'ERROR' : issue.level === 'WARNING' ? 'WARNING' : 'INFO') as 'ERROR' | 'WARNING' | 'INFO',
                        meta: issue.metadata || {}
                    }));

                    setValidationIssues(issues);

                    const hasErrors = issues.some(issue => issue.severity === 'ERROR');
                    const hasWarnings = issues.some(issue => issue.severity === 'WARNING');

                    if (hasErrors) {
                        setIsValidating(false);
                        return;
                    }

                    if (hasWarnings && !warningsAcknowledged) {
                        setPendingWarnings(issues.filter(issue => issue.severity === 'WARNING'));
                        setIsValidating(false);
                        return;
                    }

                    if (hasWarnings && warningsAcknowledged) {
                        setWarningConfirmOpen(true);
                        setIsValidating(false);
                        return;
                    }
                }

                setIsValidating(false);
            } catch (error: any) {
                console.error('Prescription validation error:', error);
                console.log('Error details:', {
                    status: error.status,
                    message: error.message,
                    errors: error.errors,
                    data: error.data
                });

                // Error already formatted by axios interceptor
                // error.errors can be string[] or Record<string, string[]>
                let errorMessages: string[] = [];

                if (error.errors) {
                    if (Array.isArray(error.errors)) {
                        errorMessages = error.errors;
                    } else if (typeof error.errors === 'object') {
                        // Flatten object values
                        errorMessages = Object.values(error.errors).flat() as string[];
                    }
                }

                if (errorMessages.length > 0) {
                    const issues: ValidationIssue[] = errorMessages.map((errorMsg: string) => {
                        const colonIndex = errorMsg.indexOf(':');
                        let field = 'unknown';
                        let message = errorMsg;

                        if (colonIndex !== -1) {
                            field = errorMsg.substring(0, colonIndex).trim();
                            message = errorMsg.substring(colonIndex + 1).trim();
                        }

                        return {
                            code: 'VALIDATION_ERROR',
                            path: field,
                            message: message,
                            severity: 'ERROR' as const,
                            meta: {}
                        };
                    });

                    setValidationIssues(issues);
                } else {
                    setApiError(error.message || 'Unable to validate prescription. Please try again.');
                }

                setIsValidating(false);
                return;
            }
        }

        if (activeStep === 4 && selectedLensType && frameVariantId) {

            try {
                setIsValidating(true);
                setValidationIssues([]);
                setApiError(null);

                const lensFrameRequest: LensFrameValidationRequest = {
                    lensId: selectedLensType.id,
                    frameVariantId: frameVariantId,
                    featureIds: selectedFeatures.map(f => f.id),
                };


                const response = await lensService.validateLensFrame(lensFrameRequest);

                if (response.issues && Array.isArray(response.issues) && response.issues.length > 0) {
                    setValidationIssues(response.issues);

                    const hasErrors = response.issues.some(issue => issue.severity === 'ERROR');
                    const hasWarnings = response.issues.some(issue => issue.severity === 'WARNING');

                    if (hasErrors) {
                        setIsValidating(false);
                        return;
                    }

                    if (hasWarnings && !warningsAcknowledged) {
                        setPendingWarnings(response.issues.filter(issue => issue.severity === 'WARNING'));
                        setIsValidating(false);
                        return;
                    }

                    if (hasWarnings && warningsAcknowledged) {
                        setWarningConfirmOpen(true);
                        setIsValidating(false);
                        return;
                    }
                }

                setIsValidating(false);
            } catch (error: any) {
                console.error('Lens-frame validation error:', error);
                console.log('Error details:', {
                    status: error.status,
                    message: error.message,
                    errors: error.errors,
                    data: error.data
                });

                // Error already formatted by axios interceptor
                let errorMessages: string[] = [];

                if (error.errors) {
                    if (Array.isArray(error.errors)) {
                        errorMessages = error.errors;
                    } else if (typeof error.errors === 'object') {
                        errorMessages = Object.values(error.errors).flat() as string[];
                    }
                }

                if (errorMessages.length > 0) {
                    const issues: ValidationIssue[] = errorMessages.map((errorMsg: string) => {
                        const colonIndex = errorMsg.indexOf(':');
                        let field = 'unknown';
                        let message = errorMsg;

                        if (colonIndex !== -1) {
                            field = errorMsg.substring(0, colonIndex).trim();
                            message = errorMsg.substring(colonIndex + 1).trim();
                        }

                        return {
                            code: 'VALIDATION_ERROR',
                            path: field,
                            message: message,
                            severity: 'ERROR' as const,
                            meta: {}
                        };
                    });

                    setValidationIssues(issues);
                } else {
                    setApiError(error.message || 'Unable to validate lens-frame compatibility. Please try again.');
                }

                setIsValidating(false);
                return;
            }
        }

        if (activeStep !== 1 && activeStep !== 4) {
            setValidationIssues([]);
            setWarningsAcknowledged(false);
            setPendingWarnings([]);
        }

        if (activeStep === 0 && isNonPrescriptionUsage(selectedUsage)) {
            setActiveStep((prev) => prev + 2);
        } else if (activeStep === 2 && availableTints.length === 0) {
            // Skip color step if no tints available
            setActiveStep((prev) => prev + 2);
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setValidationIssues([]);
        setWarningsAcknowledged(false);
        setPendingWarnings([]);

        switch (activeStep) {
            case 1:
                break;
            case 2:
                setSelectedLensType(null);
                break;
            case 3:
                setSelectedTint(null);
                break;
            case 4:
                setSelectedFeatures([]);
                break;
            case 5:
                break;
        }

        if (activeStep === 2 && isNonPrescriptionUsage(selectedUsage)) {
            setActiveStep((prev) => prev - 2);
        } else if (activeStep === 4 && availableTints.length === 0) {
            // Skip color step when going back if no tints available
            setActiveStep((prev) => prev - 2);
        } else {
            setActiveStep((prev) => prev - 1);
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedUsage(null);
        setSelectedLensType(null);
        setPrescription({
            left_eye: { sphere: '0.00' },
            right_eye: { sphere: '0.00' },
        });
        setSelectedTint(null);
        setSelectedFeatures([]);
        setPrescriptionMode('saved');
        setValidationIssues([]);
        setApiError(null);
    };

    const calculateTotalPrice = (): number => {
        let total = framePrice;
        total += selectedLensType?.price || 0;
        if (selectedTint) total += selectedTint.price;
        selectedFeatures.forEach((feature) => {
            total += feature.price;
        });
        return total;
    };

    const calculateLensCustomizationPrice = (): number => {
        let total = selectedLensType?.price || 0;
        if (selectedTint) total += selectedTint.price;
        selectedFeatures.forEach((feature) => {
            total += feature.price;
        });
        return total;
    };

    const handleConfirm = () => {
        if (!selectedUsage || !selectedLensType || (!selectedTint && availableTints.length > 0)) return;

        const selection: LensSelection = {
            usage: selectedUsage,
            lens_type: selectedLensType,
            prescription: selectedLensType.isPrescription ? prescription : undefined,
            tint: selectedTint ?? undefined,
            features: selectedFeatures,
            total_price: calculateTotalPrice(),
        };

        onConfirm(selection);
        localStorage.removeItem('lens_dialog_state');
        handleReset();
        onClose();
    };

    const handleDialogClose = () => {
        onClose();
    };

    const handleWarningConfirmProceed = () => {
        setWarningConfirmOpen(false);
        setPendingWarnings([]);
        setValidationIssues([]);
        setWarningsAcknowledged(false);
        if (activeStep === 0 && isNonPrescriptionUsage(selectedUsage)) {
            setActiveStep((prev) => prev + 2);
        } else if (activeStep === 2 && availableTints.length === 0) {
            // Skip color step if no tints available
            setActiveStep((prev) => prev + 2);
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleWarningConfirmCancel = () => {
        setWarningConfirmOpen(false);
        setWarningsAcknowledged(false);

    };

    const toggleFeature = (feature: LensFeature) => {
        setSelectedFeatures((prev) => {
            const exists = prev.find((f) => f.id === feature.id);
            if (exists) {
                return prev.filter((f) => f.id !== feature.id);
            } else {
                return [...prev, feature];
            }
        });
    };

    const isStepCompleted = (step: number): boolean => {
        if (step >= activeStep) return false;

        switch (step) {
            case 0:
                return selectedUsage !== null;
            case 1:
                {
                    if (isNonPrescriptionUsage(selectedUsage)) {
                        return true;
                    }
                    const addValue = prescription.right_eye.add || prescription.left_eye.add;
                    const hasAdd = !!(addValue && addValue !== '' && addValue !== '0' && addValue !== '0.0' && addValue !== '0.00');

                    let hasPD = false;
                    if (!has2PD) {
                        const pd = prescription.right_eye.pd || prescription.left_eye.pd;
                        hasPD = !!(pd && pd !== '0' && pd !== '0.0' && pd !== '0.00');
                    } else {
                        const pdRight = prescription.right_eye.pd;
                        const pdLeft = prescription.left_eye.pd;
                        hasPD = !!(pdRight && pdRight !== '0' && pdRight !== '0.0' && pdRight !== '0.00' &&
                            pdLeft && pdLeft !== '0' && pdLeft !== '0.0' && pdLeft !== '0.00');
                    }

                    if (!isProgressive(selectedUsage)) {
                        const requiresRightAxis = isNonZeroNumericValue(prescription.right_eye.cylinder);
                        const requiresLeftAxis = isNonZeroNumericValue(prescription.left_eye.cylinder);
                        const hasValidRightAxis = !requiresRightAxis || isNonZeroNumericValue(prescription.right_eye.axis);
                        const hasValidLeftAxis = !requiresLeftAxis || isNonZeroNumericValue(prescription.left_eye.axis);

                        return hasAdd && hasPD && hasValidRightAxis && hasValidLeftAxis;
                    }

                    return hasAdd && hasPD;
                }
            case 2:
                return selectedLensType !== null;
            case 3:
                return selectedTint !== null || availableTints.length === 0;
            case 4:
                return true;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const isBifocal = (selectedUsage?: LensUsage | null) => {
        if (!selectedUsage) return false;
        const name = selectedUsage.name || '';
        return name.toLowerCase().includes('bifocal');
    };

    const isProgressive = (selectedUsage?: LensUsage | null) => {
        if (!selectedUsage) return false;
        const isPrescription = selectedUsage.isNonPrescription
        return !isPrescription && selectedUsage.allowProgressive;
    }

    const isReading = (selectedUsage?: LensUsage | null) => {
        if (!selectedUsage) return false;
        const name = selectedUsage.name || '';
        return name.toLowerCase().includes('reading');
    }

    const canProceedToNextStep = (): boolean => {
        switch (activeStep) {
            case 0:
                return selectedUsage !== null;
            case 1:
                {
                    if (isNonPrescriptionUsage(selectedUsage)) {
                        return true;
                    }

                    const addValue = prescription.right_eye.add || prescription.left_eye.add;
                    const hasAdd = !!(addValue && addValue !== '' && addValue !== '0' && addValue !== '0.0' && addValue !== '0.00');

                    let hasPD = false;
                    if (!has2PD) {
                        const pd = prescription.right_eye.pd || prescription.left_eye.pd;
                        hasPD = !!(pd && pd !== '0' && pd !== '0.0' && pd !== '0.00');
                    } else {
                        const pdRight = prescription.right_eye.pd;
                        const pdLeft = prescription.left_eye.pd;
                        hasPD = !!(pdRight && pdRight !== '0' && pdRight !== '0.0' && pdRight !== '0.00' &&
                            pdLeft && pdLeft !== '0' && pdLeft !== '0.0' && pdLeft !== '0.00');
                    }

                    if (isReading(selectedUsage)) {
                        return hasAdd;
                    }
                    return (isProgressive(selectedUsage) || isBifocal(selectedUsage)) ? hasAdd && hasPD : hasPD;
                }
            case 2:
                return selectedLensType !== null;
            case 3:
                return selectedTint !== null || availableTints.length === 0;
            case 4:
                return true;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const getTintBackground = (cssValue: string, opacity: number) => {
        if (cssValue === 'transparent' || opacity === 0) {
            return 'transparent';
        }

        if (cssValue.startsWith('#')) {
            const hex = cssValue.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        if (cssValue.includes('linear-gradient')) {
            const gradientMatch = cssValue.match(/linear-gradient\(([^)]+)\)/);
            if (gradientMatch) {
                const gradientContent = gradientMatch[1];
                const parts = gradientContent.split(',').map(p => p.trim());
                const direction = parts[0]; // "to bottom"
                const colors = parts.slice(1); // colors

                const newColors = colors.map(color => {
                    if (color === 'transparent') {
                        return 'transparent';
                    }
                    if (color.startsWith('#')) {
                        const hex = color.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                    }
                    return color;
                });

                return `linear-gradient(${direction}, ${newColors.join(', ')})`;
            }
        }

        return cssValue;
    };

    const renderUsageStep = () => (
        <Box sx={{ py: 3 }}>
            {isLoadingLensData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <Typography>Loading lens data...</Typography>
                </Box>
            ) : apiError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            ) : null}

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                What will you use the glasses for?
            </Typography>
            <Stack spacing={2}>
                {availableUsages.map((usage) => (
                    <Card
                        key={usage.id}
                        sx={{
                            cursor: 'pointer',
                            border: `2px solid ${selectedUsage?.id === usage.id
                                ? theme.palette.primary.main
                                : theme.palette.divider
                                }`,
                            bgcolor:
                                selectedUsage?.id === usage.id
                                    ? theme.palette.primary.light + '20'
                                    : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: 2,
                            },
                        }}
                        onClick={() => setSelectedUsage(usage)}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        color:
                                            selectedUsage?.id === usage.id
                                                ? theme.palette.primary.main
                                                : theme.palette.text.secondary,
                                        display: 'flex',
                                    }}
                                >
                                    {USAGE_ICONS[usage.id] || <Visibility />}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {usage.name}
                                    </Typography>
                                    {usage.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {usage.description}
                                        </Typography>
                                    )}
                                </Box>
                                {selectedUsage?.id === usage.id && (
                                    <CheckCircle color="primary" />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Box>
    );

    const renderLensTypeStep = () => {
        // Calculate available tints for preview
        const getAvailableTintsForLens = (lensId: string) => {
            if (!apiLensData) return [];
            const selectedLens = apiLensData.lenses.find(l => l.lensId === lensId);
            if (!selectedLens || selectedLens.tints.length === 0) return [];
            return selectedLens.tints.map(tint => ({
                id: tint.tintId,
                name: tint.name,
                cssValue: tint.cssValue,
                opacity: tint.opacity,
            }));
        };

        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Select lens type
                </Typography>
                <Stack spacing={2}>
                    {availableLensTypes.map((lensType) => {
                        const tintsPreview = getAvailableTintsForLens(lensType.id);
                        return (
                            <Card
                                key={lensType.id}
                                sx={{
                                    cursor: 'pointer',
                                    border: `2px solid ${selectedLensType?.id === lensType.id
                                        ? theme.palette.primary.main
                                        : theme.palette.divider
                                        }`,
                                    bgcolor:
                                        selectedLensType?.id === lensType.id
                                            ? theme.palette.primary.light + '20'
                                            : 'transparent',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        boxShadow: 2,
                                    },
                                }}
                                onClick={() => {
                                    setSelectedLensType(lensType);
                                    if (isProgressive(selectedUsage)) {
                                        setPrescription(prev => ({
                                            left_eye: { ...prev.left_eye, axis: '' },
                                            right_eye: { ...prev.right_eye, axis: '' },
                                        }));
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: 1.5,
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={getLensImageSrc(lensType)}
                                            alt={lensType.name}
                                            onError={() => handleLensImageError(lensType.id)}
                                            sx={{
                                                width: 76,
                                                height: 76,
                                                borderRadius: 1.5,
                                                objectFit: 'cover',
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                bgcolor: 'background.default',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {lensType.name}
                                            </Typography>
                                            {lensType.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {lensType.description}
                                                </Typography>
                                            )}
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                                                {formatCurrency(lensType.price)}
                                            </Typography>

                                            {/* Color preview */}
                                            {tintsPreview.length > 0 && (
                                                <Box sx={{ mt: 1.5 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        Available colors ({tintsPreview.length}):
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                                        {tintsPreview.slice(0, 8).map((tint) => (
                                                            <Tooltip key={tint.id} title={tint.name} arrow>
                                                                <Box
                                                                    sx={{
                                                                        width: 28,
                                                                        height: 28,
                                                                        borderRadius: 1,
                                                                        border: '2px solid',
                                                                        borderColor: 'divider',
                                                                        background: getTintBackground(tint.cssValue, tint.opacity),
                                                                        flexShrink: 0,
                                                                        boxShadow: 1,
                                                                        cursor: 'pointer',
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        ))}
                                                        {tintsPreview.length > 8 && (
                                                            <Box
                                                                sx={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: 1,
                                                                    border: '2px solid',
                                                                    borderColor: 'divider',
                                                                    bgcolor: 'background.paper',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Typography variant="caption" fontWeight="bold">
                                                                    +{tintsPreview.length - 8}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                            {tintsPreview.length === 0 && (
                                                <Box sx={{ mt: 1.5 }}>
                                                    <Chip
                                                        label="No lens tint"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                        {selectedLensType?.id === lensType.id && (
                                            <CheckCircle color="primary" sx={{ ml: 2 }} />
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>

                {/* Info for non-prescription lenses */}
                {selectedLensType && !selectedLensType.isPrescription && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            You have chosen a lens type that doesn't require a prescription. The prescription step will be skipped.
                        </Typography>
                    </Alert>
                )}

                {/* Info about no colors available */}
                {selectedLensType && getAvailableTintsForLens(selectedLensType.id).length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            This lens type has no color options available. The tint selection step will be skipped.
                        </Typography>
                    </Alert>
                )}
            </Box>
        );
    };

    const handleSavePrescription = async () => {
        if (!prescriptionName.trim()) {
            setApiError('Please enter a name for the prescription');
            return;
        }

        if (!isAuthenticated) {
            setApiError('Please login to save prescription');
            return;
        }

        try {
            setIsValidating(true);
            setApiError(null);

            // Convert component prescription format to API format
            const prescriptionData: any = {
                name: prescriptionName.trim(),
                sphR: parseFloat(prescription.right_eye.sphere || '0'),
                cylR: parseFloat(prescription.right_eye.cylinder || '0'),
                axisR: parseFloat(prescription.right_eye.axis || '0'),
                sphL: parseFloat(prescription.left_eye.sphere || '0'),
                cylL: parseFloat(prescription.left_eye.cylinder || '0'),
                axisL: parseFloat(prescription.left_eye.axis || '0'),
                addPower: parseFloat(prescription.right_eye.add || prescription.left_eye.add || '0'),
                prescriptionDate: new Date().toISOString(),
                prescriptionUsage: (prescriptionUsages && prescriptionUsages.length > 0) ? prescriptionUsages[0] : 'DISTANCE',
                isDefault: false,
            };

            // Handle PD values
            if (has2PD) {
                prescriptionData.pdLeft = parseFloat(prescription.left_eye.pd || '0');
                prescriptionData.pdRight = parseFloat(prescription.right_eye.pd || '0');
            } else {
                prescriptionData.pdSingle = parseFloat(prescription.right_eye.pd || prescription.left_eye.pd || '0');
            }

            await createPrescription(prescriptionData);

            setSaveDialogOpen(false);
            setPrescriptionName('');
            setApiError(null);

            // Show success message
            setSnackbarMessage(`Prescription "${prescriptionData.name}" saved successfully!`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error saving prescription:', error);
            setApiError('Unable to save prescription. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleLoginRedirect = () => {
        const dialogState = {
            productId,
            activeStep,
            selectedUsage,
            selectedLensType,
            prescription,
            selectedTint,
            selectedFeatures,
            prescriptionMode,
            syncBothEyes,
            timestamp: Date.now(),
        };
        localStorage.setItem('lens_dialog_state', JSON.stringify(dialogState));

        hasRestoredRef.current = false;

        // Build return URL with lens=open parameter
        const currentSearch = location.search || '';
        const searchParams = new URLSearchParams(currentSearch);
        searchParams.set('lens', 'open');

        // Navigate to login with state containing pathname and search separately
        navigate(PAGE_ENDPOINTS.AUTH.LOGIN, {
            state: {
                from: {
                    pathname: location.pathname,
                    search: `?${searchParams.toString()}`
                }
            },
            replace: false
        });
    };

    const handlePrescriptionFieldChange = useCallback((
        eye: 'left_eye' | 'right_eye',
        field: string,
        value: string
    ) => {
        setPrescription((prev) => {
            const isZeroValue = (input?: string) => {
                if (input === undefined || input === null) return true;
                const normalized = input.trim();
                if (normalized === '') return true;
                const numeric = Number(normalized);
                return Number.isFinite(numeric) && numeric === 0;
            };

            const updated = {
                ...prev,
                [eye]: { ...prev[eye], [field]: value },
            };

            if (field === 'axis' && isZeroValue(value)) {
                updated[eye] = { ...updated[eye], cylinder: '0.00' };
            }

            if (field === 'cylinder' && isZeroValue(value)) {
                updated[eye] = { ...updated[eye], axis: '' };
            }

            if (eye === 'right_eye' && syncBothEyes[field as keyof typeof syncBothEyes]) {
                updated.left_eye = { ...updated.left_eye, [field]: value };

                if (field === 'axis' && isZeroValue(value)) {
                    updated.left_eye = { ...updated.left_eye, cylinder: '0.00' };
                }

                if (field === 'cylinder' && isZeroValue(value)) {
                    updated.left_eye = { ...updated.left_eye, axis: '' };
                }
            }

            return updated;
        });
    }, [syncBothEyes]);

    const getIssueDescription = (issue: ValidationIssue): { description: string; suggestion?: string } => {
        const message = issue.message.toLowerCase();
        const code = issue.code.toUpperCase();
        const path = issue.path.toLowerCase();

        // Map field names to Vietnamese
        const getFieldName = (field: string): string => {
            if (field.includes('pd')) {
                if (field.includes('left')) return 'PD left eye';
                if (field.includes('right')) return 'PD right eye';
                return 'Pupillary Distance (PD)';
            }
            if (field.includes('sph')) {
                if (field.includes('left')) return 'SPH left eye';
                if (field.includes('right')) return 'SPH right eye';
                return 'Sphere (SPH)';
            }
            if (field.includes('cyl')) {
                if (field.includes('left')) return 'CYL left eye';
                if (field.includes('right')) return 'CYL right eye';
                return 'Cylinder (CYL)';
            }
            if (field.includes('add')) return 'Addition (ADD)';
            if (field.includes('axis')) {
                if (field.includes('left')) return 'Axis left eye';
                if (field.includes('right')) return 'Axis right eye';
                return 'Axis';
            }
            return field;
        };

        if (message.includes('must be greater than or equal to')) {
            const match = message.match(/must be greater than or equal to ([\d.]+)/);
            const minValue = match ? match[1] : '';
            const fieldName = getFieldName(path);

            if (path.includes('pd')) {
                return {
                    description: `${fieldName} must be at least ${minValue}mm`,
                    suggestion: 'Total PD (binocular) typically ranges from 50-80mm. If you have 2 separate PD numbers (monocular), each side is typically 25-40mm. Please check your prescription again.'
                };
            }
            if (path.includes('sph')) {
                return {
                    description: `${fieldName} must be at least ${minValue}`,
                    suggestion: 'Please check the sphere power in your prescription again.'
                };
            }
            if (path.includes('cyl')) {
                return {
                    description: `${fieldName} must be at least ${minValue}`,
                    suggestion: 'Please check the cylinder power in your prescription again.'
                };
            }
            if (path.includes('add')) {
                return {
                    description: `${fieldName} must be at least ${minValue}`,
                    suggestion: 'ADD typically ranges from +0.75 to +3.00 for multifocal lenses.'
                };
            }
            if (path.includes('fittingheight') || path.includes('fitting')) {
                return {
                    description: `Fitting height must be at least ${minValue}mm`,
                    suggestion: 'Fitting height affects the viewing zone, especially with multifocal lenses.'
                };
            }
        }

        if (message.includes('must be less than or equal to')) {
            const match = message.match(/must be less than or equal to ([\d.]+)/);
            const maxValue = match ? match[1] : '';
            const fieldName = getFieldName(path);

            if (path.includes('pd')) {
                return {
                    description: `${fieldName} must not exceed ${maxValue}mm`,
                    suggestion: 'Total PD (binocular) typically ranges from 50-80mm. PD exceeding limits may be due to incorrect input. Please check your prescription again.'
                };
            }
            if (path.includes('sph')) {
                return {
                    description: `${fieldName} must not exceed ${maxValue}`,
                    suggestion: 'This sphere power exceeds limits. Please check your prescription again.'
                };
            }
            if (path.includes('cyl')) {
                return {
                    description: `${fieldName} must not exceed ${maxValue}`,
                    suggestion: 'This cylinder power exceeds limits. Please check your prescription again.'
                };
            }
        }

        // Feature compatibility
        if (code.includes('FEATURE') && code.includes('COMPATIBLE')) {
            return {
                description: 'The selected feature is not compatible with this frame',
                suggestion: 'Please deselect this feature or choose a different frame.'
            };
        }

        if (code.includes('LENS') && code.includes('COMPATIBLE')) {
            return {
                description: 'Lens type not compatible with this frame',
                suggestion: 'Please choose a different lens type or frame.'
            };
        }

        if (message.includes('out of range') || message.includes('not in range')) {
            return {
                description: 'Value is out of allowed range',
                suggestion: 'Please check the parameters in your prescription again.'
            };
        }

        if (message.includes('axis') && (message.includes('required') || message.includes('must be'))) {
            return {
                description: 'Axis (AXIS) is invalid',
                suggestion: 'AXIS must be between 0 to 180 degrees and is only required when cylinder (CYL) is present.'
            };
        }

        // Default fallback
        return {
            description: issue.message,
            suggestion: 'Please check the information you entered.'
        };
    };

    const renderPrescriptionStep = () => {
        const rightAxisEnabled = isNonZeroNumericValue(prescription.right_eye.cylinder);
        const leftAxisEnabled = isNonZeroNumericValue(prescription.left_eye.cylinder);
        const rightAxisMissing = rightAxisEnabled && !isNonZeroNumericValue(prescription.right_eye.axis);
        const leftAxisMissing = leftAxisEnabled && !isNonZeroNumericValue(prescription.left_eye.axis);

        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Enter your prescription
                </Typography>

                {/* Debug info */}
                {!frameVariantId && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        No frame variant ID available. Validation will not work.
                    </Alert>
                )}

                {/* API Error Display */}
                {apiError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
                        {apiError}
                    </Alert>
                )}

                {/* Validation Issues Display */}
                {validationIssues.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Stack spacing={1.5}>
                            {validationIssues.map((issue, index) => {
                                const issueInfo = getIssueDescription(issue);
                                return (
                                    <Alert
                                        key={index}
                                        severity={issue.severity === 'ERROR' ? 'error' : issue.severity === 'WARNING' ? 'warning' : 'info'}
                                        sx={{
                                            '& .MuiAlert-message': { width: '100%' }
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                                {issueInfo.description}
                                            </Typography>

                                            {issueInfo.suggestion && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, borderLeft: 3, borderColor: issue.severity === 'ERROR' ? 'error.main' : 'warning.main' }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                                                        <strong>Suggestion:</strong> {issueInfo.suggestion}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {issue.meta && Object.keys(issue.meta).length > 0 && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                        Additional details:
                                                    </Typography>
                                                    {Object.entries(issue.meta).map(([key, value]) => (
                                                        <Typography key={key} variant="caption" sx={{ display: 'block' }}>
                                                            • {key}: {JSON.stringify(value)}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Alert>
                                );
                            })}
                        </Stack>
                        {validationIssues.some(i => i.severity === 'ERROR') && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'error.main', fontStyle: 'italic' }}>
                                * You need to fix the errors above before continuing
                            </Typography>
                        )}
                        {pendingWarnings.length > 0 && !warningsAcknowledged && validationIssues.every(i => i.severity !== 'ERROR') && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    Please review the warnings above. If you have checked and confirmed the values are correct, press <strong>"Continue"</strong> again.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Mode Selection */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant={prescriptionMode === 'saved' ? 'contained' : 'outlined'}
                        onClick={() => setPrescriptionMode('saved')}
                        sx={{ flex: 1 }}
                    >
                        Choose saved prescription
                    </Button>
                    <Button
                        variant={prescriptionMode === 'manual' ? 'contained' : 'outlined'}
                        onClick={() => setPrescriptionMode('manual')}
                        sx={{ flex: 1 }}
                    >
                        Enter manually
                    </Button>
                </Stack>
                <Box sx={{ py: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                            Upload prescription image
                            <input
                                hidden
                                ref={prescriptionInputRef}
                                accept="image/*"
                                type="file"
                                onChange={async (e) => {
                                    const file = e.target.files && e.target.files[0];
                                    await handlePrescriptionFileChange(file);
                                }}
                            />
                        </Button>

                        <Button variant="text" color="inherit" onClick={() => {
                            setScannedPrescriptionImageUrl(null);
                            setPrescription({ left_eye: { sphere: '0.00' }, right_eye: { sphere: '0.00' } });
                            setSnackbarMessage('Scan cleared.');
                            setSnackbarSeverity('info');
                            setSnackbarOpen(true);
                        }}>Reset scan</Button>

                        {isScanningPrescription && <CircularProgress size={24} />}
                    </Stack>

                    {scannedPrescriptionImageUrl && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption">Scanned image (please verify):</Typography>
                            <Box component="img" src={scannedPrescriptionImageUrl} alt="scanned prescription" sx={{ maxWidth: 240, display: 'block', mt: 1 }} />
                        </Box>
                    )}

                    {/* Existing prescription form UI follows - omitted content reused here */}
                    {/* Lines 1565-2172 omitted content preserved below */}
                </Box>

                {prescriptionMode === 'saved' ? (
                    <Box>
                        {!isAuthenticated ? (
                            <Paper
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    bgcolor: 'grey.50',
                                    border: 2,
                                    borderColor: 'primary.main',
                                    borderStyle: 'dashed',
                                }}
                            >
                                <Login sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                    Please login
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    You need to login to view and use saved prescriptions
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<Login />}
                                    onClick={handleLoginRedirect}
                                >
                                    Login now
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setPrescriptionMode('manual')}
                                    sx={{ mt: 2, display: 'block', mx: 'auto' }}
                                >
                                    Or enter manually
                                </Button>
                            </Paper>
                        ) : (
                            <Box>
                                {prescriptionsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <Typography>Loading prescriptions...</Typography>
                                    </Box>
                                ) : prescriptionsError ? (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        Unable to load prescriptions: {prescriptionsError}
                                    </Alert>
                                ) : savedPrescriptions.length === 0 ? (
                                    <Paper
                                        sx={{
                                            p: 4,
                                            textAlign: 'center',
                                            bgcolor: 'grey.50',
                                        }}
                                    >
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            You don't have any saved prescriptions yet
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setPrescriptionMode('manual')}
                                        >
                                            Enter new prescription
                                        </Button>
                                    </Paper>
                                ) : (
                                    <>
                                        <Alert severity="info" sx={{ mb: 3 }}>
                                            <Typography variant="body2">
                                                Choose one of your saved prescriptions
                                            </Typography>
                                        </Alert>
                                        <Stack spacing={2}>
                                            {savedPrescriptions.map((saved) => (
                                                <Card
                                                    key={saved.id}
                                                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                                                    onClick={() => {
                                                        setPrescription({
                                                            left_eye: saved.left_eye,
                                                            right_eye: saved.right_eye,
                                                        });
                                                        // Switch to manual mode to show the filled form
                                                        setPrescriptionMode('manual');
                                                    }}
                                                >
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                {saved.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {saved.date}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Right Eye (OD)
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    SPH: {saved.right_eye.sphere} | CYL: {saved.right_eye.cylinder || '0.00'}
                                                                    {saved.right_eye.axis && ` | AXIS: ${saved.right_eye.axis}°`}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Left Eye (OS)
                                                                </Typography>
                                                                <Typography variant="body2">
                                                                    SPH: {saved.left_eye.sphere} | CYL: {saved.left_eye.cylinder || '0.00'}
                                                                    {saved.left_eye.axis && ` | AXIS: ${saved.left_eye.axis}°`}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        {/* ADD and PD - shared values */}
                                                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                                {(saved.right_eye.add || saved.left_eye.add) && (
                                                                    <Box>
                                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                                            Addition (ADD)
                                                                        </Typography>
                                                                        <Typography variant="body2" fontWeight={600}>
                                                                            {saved.right_eye.add || saved.left_eye.add}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                                {(saved.right_eye.pd || saved.left_eye.pd) && (
                                                                    <Box>
                                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                                            {saved.right_eye.pd === saved.left_eye.pd ? 'PD (single)' : 'PD'}
                                                                        </Typography>
                                                                        <Typography variant="body2" fontWeight={600}>
                                                                            {saved.right_eye.pd === saved.left_eye.pd
                                                                                ? `${saved.right_eye.pd} mm`
                                                                                : `OD: ${saved.right_eye.pd} / OS: ${saved.left_eye.pd} mm`
                                                                            }
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box>
                        {/* Prescription Form - Compact Layout */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                                Fill in your prescription details
                            </Typography>

                            {/* Header Row */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 2, mb: 2 }}>
                                <Box /> {/* Empty cell */}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center' }}>
                                    OD<br />Right Eye
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center' }}>
                                    OS<br />Left Eye
                                </Typography>
                            </Box>

                            {/* SPH Row */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>SPH</Typography>
                                </Box>
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={prescriptionValues?.sphere || []}
                                    value={prescription.right_eye.sphere}
                                    onChange={(_, newValue) => handlePrescriptionFieldChange('right_eye', 'sphere', newValue || '0.00')}
                                    renderInput={(params) => <TextField {...params} placeholder="Select or type" onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value && value !== prescription.right_eye.sphere) {
                                            handlePrescriptionFieldChange('right_eye', 'sphere', value);
                                        }
                                    }} />}
                                />
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={prescriptionValues?.sphere || []}
                                    value={prescription.left_eye.sphere}
                                    onChange={(_, newValue) => handlePrescriptionFieldChange('left_eye', 'sphere', newValue || '0.00')}
                                    renderInput={(params) => <TextField {...params} placeholder="Select or type" onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value && value !== prescription.left_eye.sphere) {
                                            handlePrescriptionFieldChange('left_eye', 'sphere', value);
                                        }
                                    }} />}
                                />
                            </Box>

                            {/* CYL Row */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>CYL</Typography>
                                </Box>
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={prescriptionValues?.cylinder || []}
                                    value={prescription.right_eye.cylinder || '0.00'}
                                    onChange={(_, newValue) => handlePrescriptionFieldChange('right_eye', 'cylinder', newValue || '0.00')}
                                    renderInput={(params) => <TextField {...params} placeholder="Select or type" onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value && value !== prescription.right_eye.cylinder) {
                                            handlePrescriptionFieldChange('right_eye', 'cylinder', value);
                                        }
                                    }} />}
                                />
                                <Autocomplete
                                    freeSolo
                                    size="small"
                                    options={prescriptionValues?.cylinder || []}
                                    value={prescription.left_eye.cylinder || '0.00'}
                                    onChange={(_, newValue) => handlePrescriptionFieldChange('left_eye', 'cylinder', newValue || '0.00')}
                                    renderInput={(params) => <TextField {...params} placeholder="Select or type" onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value && value !== prescription.left_eye.cylinder) {
                                            handlePrescriptionFieldChange('left_eye', 'cylinder', value);
                                        }
                                    }} />}
                                />
                            </Box>

                            {/* Axis Row - Always visible for non-progressive lenses */}
                            {!isProgressive(selectedUsage) && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 2, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Axis</Typography>
                                    </Box>
                                    <FormControl
                                        size="small"
                                        fullWidth
                                        disabled={
                                            !prescription.right_eye.cylinder ||
                                            !Number.isFinite(Number(prescription.right_eye.cylinder)) ||
                                            Number(prescription.right_eye.cylinder) === 0
                                        }
                                        error={rightAxisMissing}
                                    >
                                        <Select
                                            displayEmpty
                                            value={!isNonZeroNumericValue(prescription.right_eye.axis) ? '' : prescription.right_eye.axis || ''}
                                            onChange={(e) => handlePrescriptionFieldChange('right_eye', 'axis', String(e.target.value))}
                                        >
                                            <MenuItem value="">
                                                <em>Select axis</em>
                                            </MenuItem>
                                            {axisOptions.map((axis) => (
                                                <MenuItem key={`axis-right-${axis}`} value={axis}>
                                                    {axis}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {rightAxisMissing && (
                                            <FormHelperText>AXIS is required when CYL is not 0.</FormHelperText>
                                        )}
                                    </FormControl>
                                    <FormControl
                                        size="small"
                                        fullWidth
                                        disabled={
                                            !prescription.left_eye.cylinder ||
                                            !Number.isFinite(Number(prescription.left_eye.cylinder)) ||
                                            Number(prescription.left_eye.cylinder) === 0
                                        }
                                        error={leftAxisMissing}
                                    >
                                        <Select
                                            displayEmpty
                                            value={!isNonZeroNumericValue(prescription.left_eye.axis) ? '' : prescription.left_eye.axis || ''}
                                            onChange={(e) => handlePrescriptionFieldChange('left_eye', 'axis', String(e.target.value))}
                                        >
                                            <MenuItem value="">
                                                <em>Select axis</em>
                                            </MenuItem>
                                            {axisOptions.map((axis) => (
                                                <MenuItem key={`axis-left-${axis}`} value={axis}>
                                                    {axis}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {leftAxisMissing && (
                                            <FormHelperText>AXIS is required when CYL is not 0.</FormHelperText>
                                        )}
                                    </FormControl>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* ADD Row - Single Field */}

                            {(isProgressive(selectedUsage) || isBifocal(selectedUsage)) && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, mb: 2, maxWidth: '400px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>ADD *</Typography>
                                    </Box>
                                    <Autocomplete
                                        freeSolo
                                        size="small"
                                        options={prescriptionValues?.add || []}
                                        value={prescription.right_eye.add || ''}
                                        onChange={(_, newValue) => {
                                            const value = newValue || '';
                                            handlePrescriptionFieldChange('right_eye', 'add', value);
                                            handlePrescriptionFieldChange('left_eye', 'add', value);
                                        }}
                                        renderInput={(params) => <TextField {...params} placeholder="Select or type" onBlur={(e) => {
                                            const value = e.target.value;
                                            if (value && value !== prescription.right_eye.add) {
                                                handlePrescriptionFieldChange('right_eye', 'add', value);
                                                handlePrescriptionFieldChange('left_eye', 'add', value);
                                            }
                                        }} />}
                                    />
                                </Box>
                            )}

                            {/* PD Row - Single or Double */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, mb: 1, maxWidth: '400px' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            PD *
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Pupillary Distance
                                        </Typography>
                                    </Box>
                                    {!has2PD ? (
                                        <Autocomplete
                                            freeSolo
                                            size="small"
                                            options={prescriptionValues?.pd || []}
                                            value={prescription.right_eye.pd || ''}
                                            onChange={(_, newValue) => {
                                                const value = newValue || '';
                                                handlePrescriptionFieldChange('right_eye', 'pd', value);
                                                handlePrescriptionFieldChange('left_eye', 'pd', value);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Enter your PD"
                                                    onBlur={(e) => {
                                                        const value = e.target.value;
                                                        if (value && value !== prescription.right_eye.pd) {
                                                            handlePrescriptionFieldChange('right_eye', 'pd', value);
                                                            handlePrescriptionFieldChange('left_eye', 'pd', value);
                                                        }
                                                    }}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                <InputAdornment position="end">mm</InputAdornment>
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Autocomplete
                                                freeSolo
                                                size="small"
                                                options={prescriptionValues?.pdMonocular || []}
                                                value={prescription.right_eye.pd || ''}
                                                onChange={(_, newValue) => {
                                                    const value = newValue || '';
                                                    handlePrescriptionFieldChange('right_eye', 'pd', value);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Right"
                                                        onBlur={(e) => {
                                                            const value = e.target.value;
                                                            if (value && value !== prescription.right_eye.pd) {
                                                                handlePrescriptionFieldChange('right_eye', 'pd', value);
                                                            }
                                                        }}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    <InputAdornment position="end">mm</InputAdornment>
                                                                    {params.InputProps.endAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                                sx={{ flex: 1 }}
                                            />
                                            <Autocomplete
                                                freeSolo
                                                size="small"
                                                options={prescriptionValues?.pdMonocular || []}
                                                value={prescription.left_eye.pd || ''}
                                                onChange={(_, newValue) => {
                                                    const value = newValue || '';
                                                    handlePrescriptionFieldChange('left_eye', 'pd', value);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Left"
                                                        onBlur={(e) => {
                                                            const value = e.target.value;
                                                            if (value && value !== prescription.left_eye.pd) {
                                                                handlePrescriptionFieldChange('left_eye', 'pd', value);
                                                            }
                                                        }}
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    <InputAdornment position="end">mm</InputAdornment>
                                                                    {params.InputProps.endAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                                sx={{ flex: 1 }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: '120px' }}>
                                    <Checkbox
                                        checked={has2PD}
                                        onChange={(e) => {
                                            setHas2PD(e.target.checked);
                                            if (!e.target.checked) {
                                                // When unchecking, sync left to right
                                                handlePrescriptionFieldChange('left_eye', 'pd', prescription.right_eye.pd || '');
                                            }
                                        }}
                                        size="small"
                                    />
                                    <Typography variant="body2">I have 2 PD numbers</Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            ml: 'auto',
                                            color: 'primary.main',
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Help me find my PD
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />
                        </Paper>

                        {/* Save Prescription Button */}
                        {isAuthenticated && (
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<SaveAlt />}
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            setLoginPromptOpen(true);
                                        } else {
                                            setSaveDialogOpen(true);
                                        }
                                    }}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Save this prescription
                                </Button>
                            </Box>
                        )}
                        {!isAuthenticated && (
                            <Alert severity="info" sx={{ mt: 3 }}>
                                <Typography variant="body2">
                                    <strong>Note:</strong> You need to login to save this prescription for future use.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                )}
            </Box>
        );
    };

    const renderTintStep = () => {
        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Select lens tint
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose a tint that suits your needs and style
                </Typography>

                {/* Preview Area */}
                {selectedTint && (
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            mb: 3,
                            bgcolor: 'background.default',
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Preview selected tint color
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                            {/* Glasses preview with tint overlay */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: 200,
                                    height: 120,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    flexShrink: 0,
                                    bgcolor: 'white',
                                }}
                            >
                                {/* Frame outline - simple SVG representation */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1,
                                        p: 2,
                                    }}
                                >
                                    {/* Left lens */}
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 60,
                                            borderRadius: '50% 50% 45% 45%',
                                            border: '3px solid #333',
                                            position: 'relative',
                                            background: getTintBackground(selectedTint.cssValue, selectedTint.opacity),
                                            overflow: 'hidden',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '50%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                                                animation: 'shine 3s ease-in-out infinite',
                                                transform: 'skewX(-20deg)',
                                            },
                                            '@keyframes shine': {
                                                '0%': {
                                                    left: '-100%',
                                                },
                                                '50%': {
                                                    left: '150%',
                                                },
                                                '100%': {
                                                    left: '150%',
                                                },
                                            },
                                        }}
                                    />

                                    {/* Bridge */}
                                    <Box
                                        sx={{
                                            width: 16,
                                            height: 4,
                                            bgcolor: '#333',
                                            borderRadius: 1,
                                        }}
                                    />

                                    {/* Right lens */}
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 60,
                                            borderRadius: '50% 50% 45% 45%',
                                            border: '3px solid #333',
                                            position: 'relative',
                                            background: getTintBackground(selectedTint.cssValue, selectedTint.opacity),
                                            overflow: 'hidden',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '50%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                                                animation: 'shine 3s ease-in-out infinite',
                                                animationDelay: '0.15s',
                                                transform: 'skewX(-20deg)',
                                            },
                                            '@keyframes shine': {
                                                '0%': {
                                                    left: '-100%',
                                                },
                                                '50%': {
                                                    left: '150%',
                                                },
                                                '100%': {
                                                    left: '150%',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                {/* Frame temples (arms) */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: 8,
                                        top: '45%',
                                        width: 12,
                                        height: 3,
                                        bgcolor: '#333',
                                        transform: 'rotate(-5deg)',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        top: '45%',
                                        width: 12,
                                        height: 3,
                                        bgcolor: '#333',
                                        transform: 'rotate(5deg)',
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {selectedTint.name}
                                </Typography>
                                {selectedTint.description && (
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {selectedTint.description}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Price: ${selectedTint.price.toLocaleString('en-US')} VND`}
                                        color="primary"
                                        size="small"
                                    />
                                    <Chip
                                        label={`Opacity: ${Math.round(selectedTint.opacity)}%`}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                )}

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Available tint colors
                </Typography>

                {availableTints.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This lens has no tint options. You can skip this step and continue.
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        {availableTints.map((tint) => (
                            <Card
                                key={tint.id}
                                sx={{
                                    cursor: 'pointer',
                                    border: 2,
                                    borderColor: selectedTint?.id === tint.id ? 'primary.main' : 'divider',
                                    bgcolor: selectedTint?.id === tint.id ? 'action.selected' : 'background.paper',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: 2,
                                    },
                                }}
                                onClick={() => setSelectedTint(tint)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {/* Color preview */}
                                        <Box
                                            sx={{
                                                width: 60,
                                                height: 60,
                                                borderRadius: 2,
                                                border: '2px solid',
                                                borderColor: 'divider',
                                                background: getTintBackground(tint.cssValue, tint.opacity),
                                                flexShrink: 0,
                                                boxShadow: 1,
                                            }}
                                        />

                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {tint.name}
                                                </Typography>
                                                <Chip
                                                    label={`${tint.price.toLocaleString('en-US')} VND`}
                                                    size="small"
                                                    color={selectedTint?.id === tint.id ? 'primary' : 'default'}
                                                />
                                            </Box>
                                            {tint.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {tint.description}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                Opacity: {Math.round(tint.opacity)}%
                                            </Typography>
                                        </Box>

                                        {selectedTint?.id === tint.id && (
                                            <CheckCircle color="primary" sx={{ flexShrink: 0 }} />
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
        );
    };

    const renderFeaturesStep = () => {
        const featuresByCategory = availableFeatures.reduce((acc, feature) => {
            if (!acc[feature.category]) {
                acc[feature.category] = [];
            }
            acc[feature.category].push(feature);
            return acc;
        }, {} as Record<string, LensFeature[]>);

        const categoryLabels: Record<string, string> = {
            coating: 'Protective coating',
            tint: 'Color & Features',
            protection: 'Advanced protection',
            other: 'Other',
        };

        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Select additional features
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Choose advanced features for protection and enhanced experience
                </Typography>

                {Object.entries(featuresByCategory).map(([category, features]) => (
                    <Box key={category} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                            {categoryLabels[category]}
                        </Typography>
                        <Stack spacing={2}>
                            {features.map((feature) => {
                                const isSelected = selectedFeatures.some((f) => f.id === feature.id);
                                return (
                                    <Card
                                        key={feature.id}
                                        sx={{
                                            cursor: 'pointer',
                                            border: `2px solid ${isSelected
                                                ? theme.palette.primary.main
                                                : theme.palette.divider
                                                }`,
                                            bgcolor: isSelected
                                                ? theme.palette.primary.light + '20'
                                                : 'transparent',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                boxShadow: 2,
                                            },
                                        }}
                                        onClick={() => toggleFeature(feature)}
                                    >
                                        <CardContent>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                }}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{ fontWeight: 600, mb: 0.5 }}
                                                    >
                                                        {feature.name}
                                                    </Typography>
                                                    {feature.description && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mb: 1, fontSize: '0.85rem' }}
                                                        >
                                                            {feature.description}
                                                        </Typography>
                                                    )}
                                                    <Typography
                                                        variant="body2"
                                                        color="primary"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        + {formatCurrency(feature.price)}
                                                    </Typography>
                                                </Box>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => toggleFeature(feature)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}
            </Box>
        );
    };

    const renderSummaryStep = () => {
        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Confirm lens customization
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Please review all selections before confirming
                </Typography>

                <Stack spacing={3}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Usage Purpose
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {selectedUsage?.name}
                        </Typography>
                        {selectedUsage?.description && (
                            <Typography variant="body2" color="text.secondary">
                                {selectedUsage.description}
                            </Typography>
                        )}
                    </Paper>

                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Lens Type
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1.5 }}>
                            <Box
                                component="img"
                                src={getLensImageSrc(selectedLensType)}
                                alt={selectedLensType?.name || 'Selected lens'}
                                onError={() => selectedLensType && handleLensImageError(selectedLensType.id)}
                                sx={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: 1.5,
                                    objectFit: 'cover',
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    bgcolor: 'background.default',
                                    flexShrink: 0,
                                }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedLensType?.name}
                                </Typography>
                                {selectedLensType?.description && (
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedLensType.description}
                                    </Typography>
                                )}
                            </Box>
                            <Chip label={formatCurrency(selectedLensType?.price || 0)} color="primary" size="small" />
                        </Box>
                    </Paper>

                    {selectedLensType?.isPrescription && (
                        <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Prescription
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            Left Eye (OS)
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="body2">
                                                <strong>SPH:</strong> {prescription.left_eye.sphere}
                                            </Typography>
                                            {prescription.left_eye.cylinder && (
                                                <Typography variant="body2">
                                                    <strong>CYL:</strong> {prescription.left_eye.cylinder}
                                                </Typography>
                                            )}
                                            {prescription.left_eye.axis && (
                                                <Typography variant="body2">
                                                    <strong>Axis:</strong> {prescription.left_eye.axis}°
                                                </Typography>
                                            )}
                                            {has2PD && prescription.left_eye.pd && (
                                                <Typography variant="body2">
                                                    <strong>PD:</strong> {prescription.left_eye.pd} mm
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            Right Eye (OD)
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="body2">
                                                <strong>SPH:</strong> {prescription.right_eye.sphere}
                                            </Typography>
                                            {prescription.right_eye.cylinder && (
                                                <Typography variant="body2">
                                                    <strong>CYL:</strong> {prescription.right_eye.cylinder}
                                                </Typography>
                                            )}
                                            {prescription.right_eye.axis && (
                                                <Typography variant="body2">
                                                    <strong>Axis:</strong> {prescription.right_eye.axis}°
                                                </Typography>
                                            )}
                                            {has2PD && prescription.right_eye.pd && (
                                                <Typography variant="body2">
                                                    <strong>PD:</strong> {prescription.right_eye.pd} mm
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                                {/* Shared values */}
                                <Divider />
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    {(prescription.right_eye.add || prescription.left_eye.add) && (
                                        <Typography variant="body2">
                                            <strong>ADD (Addition):</strong> {prescription.right_eye.add || prescription.left_eye.add}
                                        </Typography>
                                    )}
                                    {!has2PD && (prescription.right_eye.pd || prescription.left_eye.pd) && (
                                        <Typography variant="body2">
                                            <strong>PD (single):</strong> {prescription.right_eye.pd || prescription.left_eye.pd} mm
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Lens Tint
                        </Typography>
                        {selectedTint ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 2,
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        background: getTintBackground(selectedTint.cssValue, selectedTint.opacity),
                                        flexShrink: 0,
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedTint.name}
                                    </Typography>
                                    {selectedTint.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedTint.description}
                                        </Typography>
                                    )}
                                </Box>
                                <Chip label={formatCurrency(selectedTint.price)} color="primary" size="small" />
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No lens tint
                            </Typography>
                        )}
                    </Paper>

                    {selectedFeatures.length > 0 && (
                        <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Additional Features ({selectedFeatures.length})
                            </Typography>
                            <Stack spacing={1}>
                                {selectedFeatures.map((feature) => (
                                    <Box key={feature.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {feature.name}
                                            </Typography>
                                            {feature.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {feature.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Chip label={formatCurrency(feature.price)} size="small" variant="outlined" />
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    {/* Price Breakdown */}
                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Price Details
                        </Typography>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Frame</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {formatCurrency(framePrice)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Lens customization</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {formatCurrency(calculateLensCustomizationPrice())}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1" fontWeight="bold">Total</Typography>
                                <Typography variant="body1" fontWeight="bold" color="primary">
                                    {formatCurrency(calculateTotalPrice())}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            bgcolor: 'primary.main',
                            color: 'white',
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ opacity: 0.9 }} gutterBottom>
                            Total Cost
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {formatCurrency(calculateTotalPrice())}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                            Includes frame + lens customization
                        </Typography>
                    </Paper>
                </Stack>
            </Box>
        );
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return renderUsageStep();
            case 1:
                return renderPrescriptionStep();
            case 2:
                return renderLensTypeStep();
            case 3:
                return renderTintStep();
            case 4:
                return renderFeaturesStep();
            case 5:
                return renderSummaryStep();
            default:
                return null;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            maxWidth="lg"
            fullWidth
            disableEscapeKeyDown={false}
            PaperProps={{
                sx: {
                    height: '85vh',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Lens customization
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {productName}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleDialogClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', height: '100%' }}>
                    <Box
                        sx={{
                            width: '20%',
                            minWidth: '200px',
                            borderRight: 1,
                            borderColor: 'divider',
                            p: 3,
                            bgcolor: 'grey.50',
                            overflowY: 'auto',
                        }}
                    >
                        <Stepper
                            activeStep={activeStep}
                            orientation="vertical"
                            sx={{
                                '& .MuiStepLabel-root': {
                                    color: 'text.primary !important',
                                },
                                '& .MuiStepLabel-label': {
                                    color: 'text.primary !important',
                                },
                                '& .MuiStepLabel-root.Mui-active': {
                                    color: 'primary.main !important',
                                    fontWeight: 500,
                                },
                                '& .MuiStepLabel-label.Mui-active': {
                                    color: 'primary.main !important',
                                    fontWeight: 500,
                                },
                                '& .MuiStepLabel-label.Mui-completed': {
                                    color: 'text.primary !important',
                                },
                                '& .MuiStepLabel-root.Mui-disabled': {
                                    color: 'text.primary !important',
                                },
                                '& .MuiStepLabel-label.Mui-disabled': {
                                    color: 'text.primary !important',
                                },
                            }}
                        >
                            {steps.map((label, index) => {
                                const isSkipped = !!(index === 1 &&
                                    selectedUsage &&
                                    isNonPrescriptionUsage(selectedUsage) &&
                                    activeStep > 1);
                                return (
                                    <Step
                                        key={label}
                                        completed={isStepCompleted(index)}
                                        sx={{
                                            '& .MuiStepLabel-root': {
                                                color: 'text.primary !important',
                                            },
                                            '& .MuiStepLabel-label': {
                                                color: 'text.primary !important',
                                            },
                                            '& .MuiStepLabel-label.Mui-completed': {
                                                color: 'text.primary !important',
                                                fontWeight: 400,
                                            },
                                            '& .MuiStepLabel-label.Mui-active': {
                                                color: 'primary.main !important',
                                                fontWeight: 500,
                                            },
                                            '& .MuiStepContent-root': {
                                                borderLeftColor: 'divider',
                                            },
                                        }}
                                    >
                                        <StepLabel
                                            StepIconComponent={(props) => (
                                                <CustomStepIcon {...props} isSkipped={isSkipped} />
                                            )}
                                            optional={
                                                isSkipped ? (
                                                    <Typography variant="caption" color="text.disabled">
                                                        Skip
                                                    </Typography>
                                                ) : undefined
                                            }
                                        >
                                            {label}
                                        </StepLabel>
                                    </Step>
                                );
                            })}
                        </Stepper>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            p: 3,
                            overflowY: 'auto',
                        }}
                    >
                        {renderStepContent()}
                    </Box>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        Total: {formatCurrency(calculateTotalPrice())}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button disabled={activeStep === 0} onClick={handleBack}>
                        Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Tooltip title="Confirm and add to cart" arrow placement="top">
                            <span>
                                <Button
                                    variant="contained"
                                    onClick={handleConfirm}
                                    disabled={!selectedUsage || !selectedLensType}
                                    startIcon={<ShoppingCart />}
                                >
                                    Add to cart
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!canProceedToNextStep() || isValidating}
                            color={pendingWarnings.length > 0 && !warningsAcknowledged ? 'warning' : 'primary'}
                        >
                            {isValidating
                                ? 'Validating...'
                                : pendingWarnings.length > 0 && !warningsAcknowledged
                                    ? 'I have checked, continue'
                                    : 'Next'
                            }
                        </Button>
                    )}
                </Box>
            </DialogActions>

            {/* Save Prescription Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Save prescription
                        </Typography>
                        <IconButton onClick={() => setSaveDialogOpen(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {apiError && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
                            {apiError}
                        </Alert>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Name this prescription for easy future reference
                    </Typography>
                    <TextField
                        fullWidth
                        label="Prescription name"
                        placeholder="Example: February 2026 Prescription"
                        value={prescriptionName}
                        onChange={(e) => setPrescriptionName(e.target.value)}
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSavePrescription();
                            }
                        }}
                    />
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Information to be saved:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Left Eye (OS):</Typography>
                                <Typography variant="body2">SPH: {prescription.left_eye.sphere}</Typography>
                                <Typography variant="body2">CYL: {prescription.left_eye.cylinder || '0.00'}</Typography>
                                {prescription.left_eye.axis && (
                                    <Typography variant="body2">Axis: {prescription.left_eye.axis}°</Typography>
                                )}
                                {has2PD && prescription.left_eye.pd && (
                                    <Typography variant="body2">PD: {prescription.left_eye.pd} mm</Typography>
                                )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Right Eye (OD):</Typography>
                                <Typography variant="body2">SPH: {prescription.right_eye.sphere}</Typography>
                                <Typography variant="body2">CYL: {prescription.right_eye.cylinder || '0.00'}</Typography>
                                {prescription.right_eye.axis && (
                                    <Typography variant="body2">Axis: {prescription.right_eye.axis}°</Typography>
                                )}
                                {has2PD && prescription.right_eye.pd && (
                                    <Typography variant="body2">PD: {prescription.right_eye.pd} mm</Typography>
                                )}
                            </Box>
                        </Box>
                        {/* Shared values */}
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            {(prescription.right_eye.add || prescription.left_eye.add) && (
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>ADD (Addition):</strong> {prescription.right_eye.add || prescription.left_eye.add}
                                </Typography>
                            )}
                            {!has2PD && (prescription.right_eye.pd || prescription.left_eye.pd) && (
                                <Typography variant="body2">
                                    <strong>PD (single):</strong> {prescription.right_eye.pd || prescription.left_eye.pd} mm
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSaveDialogOpen(false)} disabled={isValidating}>Cancel</Button>
                    <Button variant="contained" onClick={handleSavePrescription} disabled={isValidating}>
                        {isValidating ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Login Prompt Dialog */}
            <Dialog open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Login Required
                        </Typography>
                        <IconButton onClick={() => setLoginPromptOpen(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Login sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            You need to login to save prescription
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Go to login page now?
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center', gap: 1 }}>
                    <Button onClick={() => setLoginPromptOpen(false)} variant="outlined">
                        Later
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Login />}
                        onClick={handleLoginRedirect}
                    >
                        Login now
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Warning Confirmation Dialog */}
            <Dialog
                open={warningConfirmOpen}
                onClose={handleWarningConfirmCancel}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Alert severity="warning" icon={false} sx={{ py: 0, px: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Prescription warnings
                                </Typography>
                            </Alert>
                        </Box>
                        <IconButton onClick={handleWarningConfirmCancel} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        We detected some warnings about your lens parameters. Please review carefully before continuing.
                    </Typography>

                    <Stack spacing={2}>
                        {pendingWarnings.map((issue, index) => {
                            const issueInfo = getIssueDescription(issue);
                            return (
                                <Paper
                                    key={index}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        border: 2,
                                        borderColor: 'warning.main',
                                        borderRadius: 2,
                                        bgcolor: 'warning.lighter'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                bgcolor: 'warning.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.875rem',
                                                flexShrink: 0
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                                {issueInfo.description}
                                            </Typography>

                                            {issueInfo.suggestion && (
                                                <Box
                                                    sx={{
                                                        mt: 1.5,
                                                        p: 1.5,
                                                        bgcolor: 'background.paper',
                                                        borderRadius: 1,
                                                        borderLeft: 3,
                                                        borderColor: 'warning.dark'
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                                        <strong>Suggestion:</strong> {issueInfo.suggestion}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {issue.meta && Object.keys(issue.meta).length > 0 && (
                                                <Box
                                                    sx={{
                                                        mt: 1.5,
                                                        p: 1.5,
                                                        bgcolor: 'background.paper',
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                        Additional details:
                                                    </Typography>
                                                    {Object.entries(issue.meta).map(([key, value]) => (
                                                        <Typography key={key} variant="caption" sx={{ display: 'block' }}>
                                                            • {key}: {JSON.stringify(value)}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>

                    <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="body2">
                            You can go back to adjust the parameters, or continue if you have reviewed and confirmed these values are correct.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={handleWarningConfirmCancel}
                        variant="outlined"
                        size="large"
                    >
                        Go back to adjust
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleWarningConfirmProceed}
                        size="large"
                        sx={{
                            bgcolor: 'warning.main',
                            '&:hover': { bgcolor: 'warning.dark' }
                        }}
                    >
                        I've reviewed, continue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default LensSelectionDialog;