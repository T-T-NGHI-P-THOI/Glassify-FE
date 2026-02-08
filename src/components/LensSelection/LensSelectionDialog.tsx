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
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@/hooks/useAuth';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import type {
    LensUsage,
    LensUsageType,
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
import {
    SPHERE_VALUES,
    CYLINDER_VALUES,
    ADD_VALUES,
    PD_VALUES,
    PD_MONOCULAR_VALUES,
} from '@/models/Lens';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import lensService from '@/api/service/LensService';

interface LensSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (selection: LensSelection) => void;
    productName?: string;
    productId?: string;
    frameVariantId?: string;
    framePrice?: number;
}

const USAGE_ICONS: { [key: string]: React.ReactElement } = {
    everyday: <Visibility />,
    computer: <Computer />,
    reading: <MenuBook />,
    driving: <DriveEta />,
    outdoor: <Terrain />,
};

const steps = ['Mục đích sử dụng', 'Độ kính (nếu có)', 'Loại kính', 'Màu kính', 'Tính năng bổ sung', 'Xác nhận'];

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
    productName = 'gọng kính',
    productId,
    frameVariantId,
    framePrice = 0,
}) => {
    const theme = useTheme();
    const { isAuthenticated } = useAuth();
    const { prescriptions, loading: prescriptionsLoading, error: prescriptionsError, createPrescription, fetchPrescriptions } = usePrescriptions();
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

    const hasRestoredRef = useRef(false);

    const savedPrescriptions = (prescriptions || [])
        .filter(p => p && p.id)
        .map(p => ({
            id: p.id,
            name: p.name,
            date: new Date(p.prescriptionDate).toLocaleDateString('vi-VN'),
            left_eye: {
                sphere: p.sphL.toFixed(2),
                cylinder: p.cylL !== 0 ? p.cylL.toFixed(2) : undefined,
                axis: p.axisL !== 0 ? p.axisL.toString() : undefined,
                add: p.addPower !== 0 ? (p.addPower > 0 ? `+${p.addPower.toFixed(2)}` : p.addPower.toFixed(2)) : undefined,
                pd: p.pdSingle !== 0 ? p.pdSingle.toString() : (p.pdLeft !== 0 ? p.pdLeft.toString() : undefined),
            },
            right_eye: {
                sphere: p.sphR.toFixed(2),
                cylinder: p.cylR !== 0 ? p.cylR.toFixed(2) : undefined,
                axis: p.axisR !== 0 ? p.axisR.toString() : undefined,
                add: p.addPower !== 0 ? (p.addPower > 0 ? `+${p.addPower.toFixed(2)}` : p.addPower.toFixed(2)) : undefined,
                pd: p.pdSingle !== 0 ? p.pdSingle.toString() : (p.pdRight !== 0 ? p.pdRight.toString() : undefined),
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
                setApiError('Không thể tải dữ liệu tròng kính. Vui lòng thử lại.');
            } finally {
                setIsLoadingLensData(false);
            }
        };

        fetchLensCatalog();
    }, [open, frameVariantId]);

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
                        description: usage.description,
                        type: usage.type as LensUsageType,
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
                const isPrescription = currentUsage?.type !== 'NON_PRESCRIPTION';
                
                return {
                    id: lens.lensId,
                    name: lens.lensName,
                    description: `SKU: ${lens.lensSku}`,
                    price: lens.basePrice,
                    isPrescription: isPrescription,
                    isProgressive: lens.isProgressive,
                    usage_id: selectedUsage.id,
                };
            });
    }, [selectedUsage, apiLensData]);

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
            category: 'other' as const,
        }));
    }, [selectedLensType, apiLensData]);

    useEffect(() => {
        if (open && !hasRestoredRef.current) {
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

    // Auto-validation đã được tắt - chỉ validate khi người dùng nhấn "Tiếp tục"
    // Điều này tránh gọi API không cần thiết khi mới vào bước hoặc chọn saved prescription

    const handleNext = async () => {
        if (activeStep === 1 && selectedUsage && selectedUsage.type !== 'NON_PRESCRIPTION') {
            
            const addValue = prescription.right_eye.add || prescription.left_eye.add;
            if (!addValue || addValue === '' || addValue === '0' || addValue === '0.0' || addValue === '0.00') {
                setApiError('Vui lòng chọn độ cộng (ADD)');
                return;
            }
            
            if (!has2PD) {
                const pd = prescription.right_eye.pd || prescription.left_eye.pd;
                if (!pd || pd === '0' || pd === '0.0' || pd === '0.00') {
                    setApiError('Vui lòng chọn khoảng cách đồng tử (PD)');
                    return;
                }
            } else {
                const pdRight = prescription.right_eye.pd;
                const pdLeft = prescription.left_eye.pd;
                if (!pdRight || pdRight === '0' || pdRight === '0.0' || pdRight === '0.00' ||
                    !pdLeft || pdLeft === '0' || pdLeft === '0.0' || pdLeft === '0.00') {
                    setApiError('Vui lòng chọn PD cho cả hai mắt');
                    return;
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
                                
                const response = await lensService.validatePrescription(prescriptionRequest);
                
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
            } catch (error) {
                console.error('Prescription validation error:', error);
                setApiError('Không thể xác thực đơn thuốc. Vui lòng thử lại.');
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
            } catch (error) {
                console.error('Lens-frame validation error:', error);
                setApiError('Không thể xác thực tương thích tròng-gọng. Vui lòng thử lại.');
                setIsValidating(false);
                return;
            }
        }
        
        if (activeStep !== 1 && activeStep !== 4) {
            setValidationIssues([]);
            setWarningsAcknowledged(false);
            setPendingWarnings([]);
        }
        
        if (pendingWarnings.length > 0 && !warningsAcknowledged) {
            setWarningsAcknowledged(true);
            return;
        }
        
        if (activeStep === 0 && selectedUsage && selectedUsage.type === 'NON_PRESCRIPTION') {
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
        
        if (activeStep === 2 && selectedUsage && selectedUsage.type === 'NON_PRESCRIPTION') {
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
        if (!selectedUsage || !selectedLensType || !selectedTint) return;

        const selection: LensSelection = {
            usage: selectedUsage,
            lens_type: selectedLensType,
            prescription: selectedLensType.isPrescription ? prescription : undefined,
            tint: selectedTint,
            features: selectedFeatures,
            total_price: calculateTotalPrice(),
        };

        onConfirm(selection);
        localStorage.removeItem('lens_dialog_state');
        handleReset();
        onClose();
    };

    const handleDialogClose = () => {
        localStorage.removeItem('lens_dialog_state');
        handleReset(); // Reset all state to prevent data persistence
        onClose();
    };

    const handleWarningConfirmProceed = () => {
        setWarningConfirmOpen(false);
        setPendingWarnings([]);
        setValidationIssues([]);
        setWarningsAcknowledged(false);
        if (activeStep === 0 && selectedUsage && selectedUsage.type === 'NON_PRESCRIPTION') {
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
                    if (selectedUsage?.type === 'NON_PRESCRIPTION') {
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
                
                return hasAdd && hasPD; 
            }
            case 2:
                return selectedLensType !== null;
            case 3:
                return selectedTint !== null;
            case 4:
                return true;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const canProceedToNextStep = (): boolean => {
        switch (activeStep) {
            case 0:
                return selectedUsage !== null;
            case 1:
                { 
                    if (selectedUsage?.type === 'NON_PRESCRIPTION') {
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
                
                return hasAdd && hasPD; 
            }
            case 2:
                return selectedLensType !== null;
            case 3:
                return selectedTint !== null;
            case 4:
                return true;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount);
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
                    <Typography>Đang tải dữ liệu tròng kính...</Typography>
                </Box>
            ) : apiError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            ) : null}
            
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Bạn sẽ sử dụng kính cho mục đích gì?
            </Typography>
            <Stack spacing={2}>
                {availableUsages.map((usage) => (
                    <Card
                        key={usage.id}
                        sx={{
                            cursor: 'pointer',
                            border: `2px solid ${
                                selectedUsage?.id === usage.id
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
                                    <Typography variant="body2" color="text.secondary">
                                        {usage.description}
                                    </Typography>
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

    const renderLensTypeStep = () => (
        <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Chọn loại tròng kính
            </Typography>
            <Stack spacing={2}>
                {availableLensTypes.map((lensType) => (
                    <Card
                        key={lensType.id}
                        sx={{
                            cursor: 'pointer',
                            border: `2px solid ${
                                selectedLensType?.id === lensType.id
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
                            if (lensType.isProgressive) {
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
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {lensType.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {lensType.description}
                                    </Typography>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                                        {formatCurrency(lensType.price)}
                                    </Typography>
                                </Box>
                                {selectedLensType?.id === lensType.id && (
                                    <CheckCircle color="primary" sx={{ ml: 2 }} />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
            
            {/* Info for non-prescription lenses */}
            {selectedLensType && !selectedLensType.isPrescription && (
                <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ✓ Bạn đã chọn loại tròng không cần đơn thuốc. Bước nhập chỉ số kính sẽ được bỏ qua.
                    </Typography>
                </Alert>
            )}
        </Box>
    );

    const handleSavePrescription = async () => {
        if (!prescriptionName.trim()) {
            setApiError('Vui lòng nhập tên cho đơn thuốc');
            return;
        }

        if (!isAuthenticated) {
            setApiError('Vui lòng đăng nhập để lưu đơn thuốc');
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
                prescriptionUsage: 'DISTANCE' as const,
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
            setSnackbarMessage(`Đã lưu đơn thuốc "${prescriptionData.name}" thành công!`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error saving prescription:', error);
            setApiError('Không thể lưu đơn thuốc. Vui lòng thử lại.');
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
        
        navigate(PAGE_ENDPOINTS.AUTH.LOGIN);
    };

    const handlePrescriptionFieldChange = useCallback((
        eye: 'left_eye' | 'right_eye',
        field: string,
        value: string
    ) => {
        setPrescription((prev) => {
            const updated = {
                ...prev,
                [eye]: { ...prev[eye], [field]: value },
            };

            if (eye === 'right_eye' && syncBothEyes[field as keyof typeof syncBothEyes]) {
                updated.left_eye = { ...updated.left_eye, [field]: value };
            }

            return updated;
        });
    }, [syncBothEyes]);

    const getIssueDescription = (issue: ValidationIssue): { description: string; suggestion?: string } => {
        const message = issue.message.toLowerCase();
        const code = issue.code.toUpperCase();
        const path = issue.path.toLowerCase();
        
        if (message.includes('must be greater than or equal to')) {
            const match = message.match(/must be greater than or equal to ([\d.]+)/);
            const minValue = match ? match[1] : '';
            
            if (path.includes('pd') || message.includes('pd:')) {
                return {
                    description: `Khoảng cách đồng tử (PD) phải từ ${minValue}mm trở lên`,
                    suggestion: 'PD tổng (binocular) thường dao động từ 56-79mm. Nếu bạn có 2 số PD riêng (monocular), mỗi bên thường từ 17.5-40mm. Vui lòng kiểm tra lại đơn thuốc của bạn.'
                };
            }
            if (path.includes('sph') || message.includes('sph')) {
                return {
                    description: `Độ cận/viễn (SPH) phải từ ${minValue} trở lên`,
                    suggestion: 'Vui lòng kiểm tra lại độ kính trong đơn thuốc.'
                };
            }
            if (path.includes('cyl') || message.includes('cyl')) {
                return {
                    description: `Độ loạn (CYL) phải từ ${minValue} trở lên`,
                    suggestion: 'Vui lòng kiểm tra lại độ loạn trong đơn thuốc.'
                };
            }
            if (path.includes('add') || message.includes('add')) {
                return {
                    description: `Độ cộng (ADD) phải từ ${minValue} trở lên`,
                    suggestion: 'ADD thường dao động từ +0.75 đến +3.00 cho kính đa tròng.'
                };
            }
            if (path.includes('fittingheight') || message.includes('fitting')) {
                return {
                    description: `Chiều cao lắp kính phải từ ${minValue}mm trở lên`,
                    suggestion: 'Chiều cao lắp kính ảnh hưởng đến vùng nhìn, đặc biệt với kính đa tròng.'
                };
            }
        }
        
        if (message.includes('must be less than or equal to')) {
            const match = message.match(/must be less than or equal to ([\d.]+)/);
            const maxValue = match ? match[1] : '';
            
            if (path.includes('pd') || message.includes('pd:')) {
                return {
                    description: `Khoảng cách đồng tử (PD) không được vượt quá ${maxValue}mm`,
                    suggestion: 'PD quá lớn. Vui lòng kiểm tra lại đơn thuốc của bạn.'
                };
            }
            if (path.includes('sph') || message.includes('sph')) {
                return {
                    description: `Độ cận/viễn (SPH) không được vượt quá ${maxValue}`,
                    suggestion: 'Độ kính này vượt quá giới hạn của gọng.'
                };
            }
        }
        
        // Feature compatibility
        if (code.includes('FEATURE') && code.includes('COMPATIBLE')) {
            return {
                description: 'Tính năng đã chọn không tương thích với gọng kính này',
                suggestion: 'Vui lòng bỏ chọn tính năng này hoặc chọn gọng kính khác.'
            };
        }
        
        if (code.includes('LENS') && code.includes('COMPATIBLE')) {
            return {
                description: 'Loại tròng kính không tương thích với gọng này',
                suggestion: 'Vui lòng chọn loại tròng kính khác hoặc gọng kính khác.'
            };
        }
        
        if (message.includes('out of range') || message.includes('not in range')) {
            return {
                description: 'Giá trị nằm ngoài phạm vi cho phép',
                suggestion: 'Vui lòng kiểm tra lại các thông số trong đơn thuốc của bạn.'
            };
        }
        
        if (message.includes('axis') && (message.includes('required') || message.includes('must be'))) {
            return {
                description: 'Trục loạn (AXIS) không hợp lệ',
                suggestion: 'AXIS phải từ 0 đến 180 độ và chỉ cần thiết khi có độ loạn (CYL).'
            };
        }
        
        // Default fallback
        return {
            description: issue.message,
            suggestion: 'Vui lòng kiểm tra lại thông tin đã nhập.'
        };
    };

    const renderPrescriptionStep = () => {
        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Nhập độ kính của bạn
                </Typography>
                
                {/* Debug info */}
                {!frameVariantId && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Không có thông tin frame variant ID. Validation sẽ không hoạt động.
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
                                                        💡 <strong>Gợi ý:</strong> {issueInfo.suggestion}
                                                    </Typography>
                                                </Box>
                                            )}
                                            
                                            {issue.meta && Object.keys(issue.meta).length > 0 && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                        Thông tin chi tiết:
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
                                * Bạn cần khắc phục các lỗi trên trước khi tiếp tục
                            </Typography>
                        )}
                        {pendingWarnings.length > 0 && !warningsAcknowledged && validationIssues.every(i => i.severity !== 'ERROR') && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    ⚠️ Vui lòng xem xét các cảnh báo trên. Nếu bạn đã kiểm tra và xác nhận thông số là chính xác, hãy nhấn <strong>"Tiếp tục"</strong> một lần nữa.
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
                        Chọn đơn đã lưu
                    </Button>
                    <Button
                        variant={prescriptionMode === 'manual' ? 'contained' : 'outlined'}
                        onClick={() => setPrescriptionMode('manual')}
                        sx={{ flex: 1 }}
                    >
                        Nhập thủ công
                    </Button>
                </Stack>

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
                                    Vui lòng đăng nhập
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Bạn cần đăng nhập để xem và sử dụng các đơn thuốc đã lưu
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<Login />}
                                    onClick={handleLoginRedirect}
                                >
                                    Đăng nhập ngay
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setPrescriptionMode('manual')}
                                    sx={{ mt: 2, display: 'block', mx: 'auto' }}
                                >
                                    Hoặc nhập thủ công
                                </Button>
                            </Paper>
                        ) : (
                            <Box>
                                {prescriptionsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <Typography>Đang tải đơn thuốc...</Typography>
                                    </Box>
                                ) : prescriptionsError ? (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        Không thể tải đơn thuốc: {prescriptionsError}
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
                                            Bạn chưa có đơn thuốc nào được lưu
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setPrescriptionMode('manual')}
                                        >
                                            Nhập đơn thuốc mới
                                        </Button>
                                    </Paper>
                                ) : (
                                    <>
                                        <Alert severity="info" sx={{ mb: 3 }}>
                                            <Typography variant="body2">
                                                Chọn một trong các đơn thuốc đã lưu của bạn
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
                                                    Mắt phải (OD)
                                                </Typography>
                                                <Typography variant="body2">
                                                    SPH: {saved.right_eye.sphere} | CYL: {saved.right_eye.cylinder || '0.00'}
                                                    {saved.right_eye.axis && ` | AXIS: ${saved.right_eye.axis}°`}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Mắt trái (OS)
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
                                                            Độ cộng (ADD)
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            +{saved.right_eye.add || saved.left_eye.add}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {(saved.right_eye.pd || saved.left_eye.pd) && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {saved.right_eye.pd === saved.left_eye.pd ? 'PD (chung)' : 'PD'}
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
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={prescription.right_eye.sphere}
                                        onChange={(e) => handlePrescriptionFieldChange('right_eye', 'sphere', e.target.value)}
                                        displayEmpty
                                    >
                                        {SPHERE_VALUES.map((value) => (
                                            <MenuItem key={value} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={prescription.left_eye.sphere}
                                        onChange={(e) => handlePrescriptionFieldChange('left_eye', 'sphere', e.target.value)}
                                        displayEmpty
                                    >
                                        {SPHERE_VALUES.map((value) => (
                                            <MenuItem key={value} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* CYL Row */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>CYL</Typography>
                                </Box>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={prescription.right_eye.cylinder || '0.00'}
                                        onChange={(e) => handlePrescriptionFieldChange('right_eye', 'cylinder', e.target.value)}
                                        displayEmpty
                                    >
                                        {CYLINDER_VALUES.map((value) => (
                                            <MenuItem key={value} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={prescription.left_eye.cylinder || '0.00'}
                                        onChange={(e) => handlePrescriptionFieldChange('left_eye', 'cylinder', e.target.value)}
                                        displayEmpty
                                    >
                                        {CYLINDER_VALUES.map((value) => (
                                            <MenuItem key={value} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Axis Row - Always visible for non-progressive lenses */}
                            {!selectedLensType?.isProgressive && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 2, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Axis</Typography>
                                    </Box>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="0"
                                        type="text"
                                        disabled={
                                            prescription.right_eye.sphere === '0.00' || 
                                            prescription.right_eye.cylinder === '0.00'
                                        }
                                        inputProps={{ 
                                            pattern: '[0-9]*',
                                            inputMode: 'numeric',
                                        }}
                                        value={prescription.right_eye.axis || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 180)) {
                                                handlePrescriptionFieldChange('right_eye', 'axis', value);
                                            }
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="0"
                                        type="text"
                                        disabled={
                                            prescription.left_eye.sphere === '0.00' || 
                                            prescription.left_eye.cylinder === '0.00'
                                        }
                                        inputProps={{ 
                                            pattern: '[0-9]*',
                                            inputMode: 'numeric',
                                        }}
                                        value={prescription.left_eye.axis || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 180)) {
                                                handlePrescriptionFieldChange('left_eye', 'axis', value);
                                            }
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Note for progressive lenses */}
                            {selectedLensType?.isProgressive && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Progressive lenses:</strong> Axis is not required. Progressive lenses are designed to correct multiple vision zones without needing astigmatism correction.
                                    </Typography>
                                </Alert>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* ADD Row - Single Field */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, mb: 2, maxWidth: '400px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>ADD *</Typography>
                                </Box>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={prescription.right_eye.add || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handlePrescriptionFieldChange('right_eye', 'add', value);
                                            handlePrescriptionFieldChange('left_eye', 'add', value);
                                        }}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select</MenuItem>
                                        {ADD_VALUES.map((value) => (
                                            <MenuItem key={value} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* PD Row - Single or Double */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, mb: 1, maxWidth: '400px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            PD *<br />
                                            <Typography variant="caption" color="text.secondary">
                                                Pupillary Distance
                                            </Typography>
                                        </Typography>
                                    </Box>
                                    {!has2PD ? (
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={prescription.right_eye.pd || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handlePrescriptionFieldChange('right_eye', 'pd', value);
                                                    handlePrescriptionFieldChange('left_eye', 'pd', value);
                                                }}
                                                displayEmpty
                                            >
                                                <MenuItem value="">Enter your PD</MenuItem>
                                                {PD_VALUES.map((value) => (
                                                    <MenuItem key={value} value={value}>
                                                        {value}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <FormControl size="small" sx={{ flex: 1 }}>
                                                <Select
                                                    value={prescription.right_eye.pd || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        handlePrescriptionFieldChange('right_eye', 'pd', value);
                                                    }}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="">Right</MenuItem>
                                                    {PD_MONOCULAR_VALUES.map((value) => (
                                                        <MenuItem key={value} value={value}>
                                                            {value}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <FormControl size="small" sx={{ flex: 1 }}>
                                                <Select
                                                    value={prescription.left_eye.pd || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        handlePrescriptionFieldChange('left_eye', 'pd', value);
                                                    }}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="">Left</MenuItem>
                                                    {PD_MONOCULAR_VALUES.map((value) => (
                                                        <MenuItem key={value} value={value}>
                                                            {value}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
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
                                Lưu chỉ số kính này
                            </Button>
                        </Box>
                        )}
                        {!isAuthenticated && (
                            <Alert severity="info" sx={{ mt: 3 }}>
                                <Typography variant="body2">
                                    <strong>Lưu ý:</strong> Bạn cần đăng nhập để lưu đơn thuốc này cho lần sử dụng sau.
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
                    Chọn màu kính
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chọn màu kính phù hợp với nhu cầu và phong cách của bạn
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
                            Xem trước màu kính đã chọn
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
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {selectedTint.description}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Giá: ${selectedTint.price.toLocaleString('vi-VN')} đ`}
                                        color="primary"
                                        size="small"
                                    />
                                    <Chip
                                        label={`Độ mờ: ${Math.round(selectedTint.opacity)}%`}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                )}

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Danh sách màu kính có sẵn
                </Typography>

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
                                                label={`${tint.price.toLocaleString('vi-VN')} đ`}
                                                size="small"
                                                color={selectedTint?.id === tint.id ? 'primary' : 'default'}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {tint.description}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            Độ mờ: {Math.round(tint.opacity)}%
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
            coating: 'Lớp phủ bảo vệ',
            tint: 'Màu sắc & Tính năng',
            protection: 'Bảo vệ nâng cao',
            other: 'Khác',
        };

        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Chọn tính năng bổ sung
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Tùy chọn các tính năng nâng cao để bảo vệ và tăng cường trải nghiệm sử dụng
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
                                            border: `2px solid ${
                                                isSelected
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
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mb: 1, fontSize: '0.85rem' }}
                                                    >
                                                        {feature.description}
                                                    </Typography>
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
        const formatCurrency = (price: number) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        };

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Xác nhận tùy chỉnh tròng kính
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Vui lòng xem lại tất cả các lựa chọn trước khi xác nhận
                </Typography>

                <Stack spacing={3}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Mục đích sử dụng
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {selectedUsage?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedUsage?.description}
                        </Typography>
                    </Paper>

                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Loại kính
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedLensType?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedLensType?.description}
                                </Typography>
                            </Box>
                            <Chip label={formatCurrency(selectedLensType?.price || 0)} color="primary" size="small" />
                        </Box>
                    </Paper>

                    {selectedLensType?.isPrescription && (
                        <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Độ kính
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                            Mắt trái (OS)
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
                                            Mắt phải (OD)
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
                                            <strong>ADD (Độ cộng):</strong> +{prescription.right_eye.add || prescription.left_eye.add}
                                        </Typography>
                                    )}
                                    {!has2PD && (prescription.right_eye.pd || prescription.left_eye.pd) && (
                                        <Typography variant="body2">
                                            <strong>PD (chung):</strong> {prescription.right_eye.pd || prescription.left_eye.pd} mm
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            Màu kính
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 2,
                                    border: '2px solid',
                                    borderColor: 'divider',
                                    background: selectedTint ? getTintBackground(selectedTint.cssValue, selectedTint.opacity) : 'transparent',
                                    flexShrink: 0,
                                }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedTint?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedTint?.description}
                                </Typography>
                            </Box>
                            <Chip label={formatCurrency(selectedTint?.price || 0)} color="primary" size="small" />
                        </Box>
                    </Paper>

                    {selectedFeatures.length > 0 && (
                        <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Tính năng bổ sung ({selectedFeatures.length})
                            </Typography>
                            <Stack spacing={1}>
                                {selectedFeatures.map((feature) => (
                                    <Box key={feature.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {feature.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {feature.description}
                                            </Typography>
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
                            Chi tiết giá
                        </Typography>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Gọng kính</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {formatCurrency(framePrice)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Tùy chỉnh tròng kính</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                    {formatCurrency(calculateLensCustomizationPrice())}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1" fontWeight="bold">Tổng cộng</Typography>
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
                            Tổng chi phí
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {formatCurrency(calculateTotalPrice())}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                            Bao gồm gọng kính + tùy chỉnh tròng kính
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
                            Tùy chỉnh tròng kính
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
                                                  selectedUsage.type === 'NON_PRESCRIPTION' && 
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
                                                        Bỏ qua
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
                        Tổng: {formatCurrency(calculateTotalPrice())}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button disabled={activeStep === 0} onClick={handleBack}>
                        Quay lại
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Tooltip title="Xác nhận và thêm vào giỏ hàng" arrow placement="top">
                            <span>
                                <Button
                                    variant="contained"
                                    onClick={handleConfirm}
                                    disabled={!selectedUsage || !selectedLensType}
                                    startIcon={<ShoppingCart />}
                                >
                                    Thêm vào giỏ hàng
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
                                ? 'Đang kiểm tra...' 
                                : pendingWarnings.length > 0 && !warningsAcknowledged
                                    ? 'Tôi đã kiểm tra, tiếp tục'
                                    : 'Tiếp theo'
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
                            Lưu chỉ số kính
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
                        Đặt tên cho đơn thuốc này để dễ dàng tìm lại sau
                    </Typography>
                    <TextField
                        fullWidth
                        label="Tên đơn thuốc"
                        placeholder="Ví dụ: Đơn thuốc tháng 2/2026"
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
                            Thông tin sẽ được lưu:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Mắt trái (OS):</Typography>
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
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Mắt phải (OD):</Typography>
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
                                    <strong>ADD (Độ cộng):</strong> +{prescription.right_eye.add || prescription.left_eye.add}
                                </Typography>
                            )}
                            {!has2PD && (prescription.right_eye.pd || prescription.left_eye.pd) && (
                                <Typography variant="body2">
                                    <strong>PD (chung):</strong> {prescription.right_eye.pd || prescription.left_eye.pd} mm
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSaveDialogOpen(false)} disabled={isValidating}>Hủy</Button>
                    <Button variant="contained" onClick={handleSavePrescription} disabled={isValidating}>
                        {isValidating ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Login Prompt Dialog */}
            <Dialog open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Yêu cầu đăng nhập
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
                            Bạn cần đăng nhập để lưu chỉ số kính
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Chuyển đến trang đăng nhập ngay bây giờ?
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center', gap: 1 }}>
                    <Button onClick={() => setLoginPromptOpen(false)} variant="outlined">
                        Để sau
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Login />}
                        onClick={handleLoginRedirect}
                    >
                        Đăng nhập ngay
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
                                    Cảnh báo về đơn kính
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
                        Chúng tôi phát hiện một số cảnh báo về thông số kính của bạn. Vui lòng xem xét kỹ trước khi tiếp tục.
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
                                                        💡 <strong>Gợi ý:</strong> {issueInfo.suggestion}
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
                                                        Thông tin chi tiết:
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
                            Bạn có thể quay lại để điều chỉnh các thông số, hoặc tiếp tục nếu bạn đã kiểm tra và xác nhận các giá trị này là chính xác.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button 
                        onClick={handleWarningConfirmCancel} 
                        variant="outlined"
                        size="large"
                    >
                        Quay lại điều chỉnh
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
                        Tôi đã kiểm tra, tiếp tục
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