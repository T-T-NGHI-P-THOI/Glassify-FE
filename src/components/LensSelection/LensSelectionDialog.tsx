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
    InputLabel,
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
import type {
    LensUsage,
    LensType,
    LensFeature,
    LensTint,
    Prescription,
    LensSelection,
} from '@/models/Lens';
import {
    SAMPLE_LENS_USAGES,
    SAMPLE_LENS_TYPES,
    SAMPLE_LENS_FEATURES,
    SAMPLE_LENS_TINTS,
    SPHERE_VALUES,
    CYLINDER_VALUES,
    ADD_VALUES,
} from '@/models/Lens';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

interface LensSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (selection: LensSelection) => void;
    productName?: string;
    productId?: string;
}

const USAGE_ICONS: { [key: string]: React.ReactElement } = {
    everyday: <Visibility />,
    computer: <Computer />,
    reading: <MenuBook />,
    driving: <DriveEta />,
    outdoor: <Terrain />,
};

const steps = ['Mục đích sử dụng', 'Loại kính', 'Độ kính (nếu có)', 'Màu kính', 'Tính năng bổ sung', 'Xác nhận'];

// Separate EyePrescription component outside main component
interface EyePrescriptionProps {
    eye: 'left_eye' | 'right_eye';
    label: string;
    eyeData: {
        sphere: string;
        cylinder: string;
        axis: string;
        add: string;
        pd: string;
    };
    syncData: {
        sphere: boolean;
        cylinder: boolean;
        axis: boolean;
        add: boolean;
        pd: boolean;
    };
    onChange: (eye: 'left_eye' | 'right_eye', field: string, value: string) => void;
}

const EyePrescription: React.FC<EyePrescriptionProps> = React.memo(({ 
    eye, 
    label, 
    eyeData, 
    syncData, 
    onChange 
}) => (
    <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            {label}
        </Typography>
        <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: '1 1 200px' }}>
                    <InputLabel>SPH (Độ cận/viễn)</InputLabel>
                    <Select
                        value={eyeData.sphere}
                        label="SPH (Độ cận/viễn)"
                        onChange={(e) => onChange(eye, 'sphere', e.target.value)}
                        disabled={eye === 'left_eye' && syncData.sphere}
                    >
                        {SPHERE_VALUES.map((value) => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl sx={{ flex: '1 1 200px' }}>
                    <InputLabel>CYL (Độ loạn)</InputLabel>
                    <Select
                        value={eyeData.cylinder || '0.00'}
                        label="CYL (Độ loạn)"
                        onChange={(e) => onChange(eye, 'cylinder', e.target.value)}
                        disabled={eye === 'left_eye' && syncData.cylinder}
                    >
                        {CYLINDER_VALUES.map((value) => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    sx={{ flex: '1 1 150px' }}
                    label="Axis (Trục)"
                    type="text"
                    inputProps={{ 
                        pattern: '[0-9]*',
                        inputMode: 'numeric',
                    }}
                    value={eyeData.axis || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty or valid numbers
                        if (value === '') {
                            onChange(eye, 'axis', value);
                            return;
                        }
                        // Only allow numbers
                        if (/^\d+$/.test(value)) {
                            const numValue = parseInt(value);
                            // Allow any valid number during typing, validate on blur
                            if (numValue >= 0 && numValue <= 999) {
                                onChange(eye, 'axis', value);
                            }
                        }
                    }}
                    onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '' && (/^\d+$/.test(value))) {
                            const numValue = parseInt(value);
                            // Clamp value to valid range on blur
                            if (numValue > 180) {
                                onChange(eye, 'axis', '180');
                            }
                        }
                    }}
                    disabled={eye === 'left_eye' && syncData.axis}
                    helperText="0-180°"
                />
                <FormControl sx={{ flex: '1 1 150px' }}>
                    <InputLabel>ADD (Độ cộng)</InputLabel>
                    <Select
                        value={eyeData.add || ''}
                        label="ADD (Độ cộng)"
                        onChange={(e) => onChange(eye, 'add', e.target.value)}
                        disabled={eye === 'left_eye' && syncData.add}
                    >
                        <MenuItem value="">Không</MenuItem>
                        {ADD_VALUES.map((value) => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    sx={{ flex: '1 1 150px' }}
                    label="PD (Khoảng cách đồng tử)"
                    type="text"
                    inputProps={{ 
                        pattern: '[0-9]*',
                        inputMode: 'numeric',
                    }}
                    value={eyeData.pd || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty or valid numbers
                        if (value === '') {
                            onChange(eye, 'pd', value);
                            return;
                        }
                        // Only allow numbers
                        if (/^\d+$/.test(value)) {
                            const numValue = parseInt(value);
                            // Allow any valid number during typing, validate on blur
                            if (numValue >= 0 && numValue <= 999) {
                                onChange(eye, 'pd', value);
                            }
                        }
                    }}
                    onBlur={(e) => {
                        const value = e.target.value;
                        if (value !== '' && (/^\d+$/.test(value))) {
                            const numValue = parseInt(value);
                            // Clamp value to valid range on blur
                            if (numValue < 54) {
                                onChange(eye, 'pd', '54');
                            } else if (numValue > 74) {
                                onChange(eye, 'pd', '74');
                            }
                        }
                    }}
                    disabled={eye === 'left_eye' && syncData.pd}
                    helperText="54-74mm"
                />
            </Box>
        </Stack>
    </Paper>
));

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
}) => {
    const theme = useTheme();
    const { isAuthenticated } = useAuth();
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
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [prescriptionName, setPrescriptionName] = useState('');

    const hasRestoredRef = useRef(false);

    // FIXME: Mock saved prescriptions for development only. Replace with API call to fetch user-specific saved prescriptions in production.
    const [savedPrescriptions, setSavedPrescriptions] = useState<(Prescription & { id: string; name: string; date: string })[]>([
        {
            id: '1',
            name: 'Đơn thuốc gần nhất',
            date: '15/01/2026',
            left_eye: { sphere: '-2.50', cylinder: '-0.75', axis: '180', pd: '62' },
            right_eye: { sphere: '-2.75', cylinder: '-0.50', axis: '175', pd: '64' },
        },
        {
            id: '2',
            name: 'Đơn thuốc từ Dr. Nguyễn',
            date: '10/12/2025',
            left_eye: { sphere: '-2.25', cylinder: '-0.50', axis: '170', pd: '62' },
            right_eye: { sphere: '-2.50', cylinder: '-0.25', axis: '165', pd: '64' },
        },
    ]);

    const availableLensTypes = useMemo(() => {
        if (!selectedUsage) return [];
        return SAMPLE_LENS_TYPES.filter(
            (type) => type.usage_id === selectedUsage.id || selectedUsage.id === 'everyday'
        );
    }, [selectedUsage]);

    // Reset prescription when lens type changes between prescription and non-prescription
    useEffect(() => {
        if (selectedLensType) {
            // Reset prescription state when switching lens type
            setPrescription({
                left_eye: { sphere: '0.00' },
                right_eye: { sphere: '0.00' },
            });
            // Reset sync options
            setSyncBothEyes({
                sphere: false,
                cylinder: false,
                axis: false,
                add: false,
                pd: false,
            });
        }
    }, [selectedLensType?.id]);

    // Restore dialog state when dialog opens (runs FIRST)
    useEffect(() => {
        if (open && !hasRestoredRef.current) {
            // Try to restore dialog state from localStorage
            const savedState = localStorage.getItem('lens_dialog_state');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    // Only restore if saved within last hour AND for the same product
                    if (Date.now() - state.timestamp < 60 * 60 * 1000 && state.productId === productId) {
                        // Only restore if we have meaningful state (not initial state)
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
                        // Clear expired or mismatched product state
                        localStorage.removeItem('lens_dialog_state');
                    }
                } catch (error) {
                    console.error('Error restoring lens dialog state:', error);
                    localStorage.removeItem('lens_dialog_state');
                }
            }
            // Mark as restored even if no saved state (to prevent trying again)
            hasRestoredRef.current = true;
        }
        
        // Reset flag when dialog closes
        if (!open) {
            hasRestoredRef.current = false;
        }
    }, [open]);

    // Save dialog state when it changes (runs AFTER restoration)
    useEffect(() => {
        // Only save if dialog is open AND we've already attempted restoration
        if (open && hasRestoredRef.current) {
            // Save current dialog state to localStorage
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

    // Manage URL parameters
    useEffect(() => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                const hasLens = next.has('lens');

                if (open) {
                    // Add URL parameter to track dialog is open
                    if (hasLens && next.get('lens') === 'open') {
                        // No change needed
                        return prev;
                    }
                    next.set('lens', 'open');
                } else {
                    // Remove URL parameter when dialog closes
                    if (!hasLens) {
                        // No change needed
                        return prev;
                    }
                    next.delete('lens');
                }

                return next;
            },
            { replace: true },
        );
    }, [open, setSearchParams]);
    const handleNext = () => {
        if (activeStep === 1 && selectedLensType && !selectedLensType.isPrescription) {
            setActiveStep((prev) => prev + 2);
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (activeStep === 3 && selectedLensType && !selectedLensType.isPrescription) {
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
    };

    const calculateTotalPrice = (): number => {
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
        // Clear dialog state from localStorage
        localStorage.removeItem('lens_dialog_state');
        handleReset();
        onClose();
    };

    const handleDialogClose = () => {
        // Clear dialog state from localStorage
        localStorage.removeItem('lens_dialog_state');
        onClose();
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

    // Check if a step is completed (for Stepper visual indicator)
    const isStepCompleted = (step: number): boolean => {
        // Chỉ đánh dấu completed nếu step đó nằm trước activeStep VÀ đã có dữ liệu
        if (step >= activeStep) return false;
        
        switch (step) {
            case 0:
                return selectedUsage !== null;
            case 1:
                return selectedLensType !== null;
            case 2:
                return !selectedLensType?.isPrescription || true; // Skip prescription step for non-prescription
            case 3:
                return selectedTint !== null;
            case 4:
                return true; // Features step is always optional
            case 5:
                return true; // Summary step
            default:
                return false;
        }
    };

    // Check if current step can proceed to next (for Next button)
    const canProceedToNextStep = (): boolean => {
        switch (activeStep) {
            case 0:
                return selectedUsage !== null;
            case 1:
                return selectedLensType !== null;
            case 2:
                // Prescription step is always optional, can always proceed
                return true;
            case 3:
                return selectedTint !== null;
            case 4:
                // Features step is always optional
                return true;
            case 5:
                // Summary step - can always proceed to confirm
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

    // Helper function to convert cssValue + opacity to proper rgba/gradient
    const getTintBackground = (cssValue: string, opacity: number) => {
        // If transparent/clear
        if (cssValue === 'transparent' || opacity === 0) {
            return 'transparent';
        }
        
        // If it's a hex color, convert to rgba
        if (cssValue.startsWith('#')) {
            const hex = cssValue.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // If it's a gradient, we need to handle it differently
        if (cssValue.includes('linear-gradient')) {
            // Extract colors from gradient and apply opacity
            // For simplicity, we'll create a new gradient with opacity applied to each color
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
        
        // For other formats, return as is
        return cssValue;
    };

    const renderUsageStep = () => (
        <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Bạn sẽ sử dụng kính cho mục đích gì?
            </Typography>
            <Stack spacing={2}>
                {SAMPLE_LENS_USAGES.map((usage) => (
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
                        onClick={() => setSelectedLensType(lensType)}
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {lensType.name}
                                        </Typography>
                                        {lensType.isPrescription && (
                                            <Chip label="Thuốc" size="small" color="info" />
                                        )}
                                    </Box>
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
        </Box>
    );

    const handleSyncChange = (field: keyof typeof syncBothEyes, checked: boolean) => {
        setSyncBothEyes((prev) => ({ ...prev, [field]: checked }));
        
        // If enabling sync, copy from right eye to left eye
        if (checked) {
            setPrescription((prev) => ({
                ...prev,
                left_eye: {
                    ...prev.left_eye,
                    [field]: prev.right_eye[field as keyof typeof prev.right_eye],
                },
            }));
        }
    };

    const handleSyncAll = () => {
        const allSynced = Object.values(syncBothEyes).every((val) => val === true);
        
        if (allSynced) {
            // If all are synced, turn off all
            setSyncBothEyes({
                sphere: false,
                cylinder: false,
                axis: false,
                add: false,
                pd: false,
            });
        } else {
            // Enable all sync options
            setSyncBothEyes({
                sphere: true,
                cylinder: true,
                axis: true,
                add: true,
                pd: true,
            });

            // Copy all values from right eye to left eye
            setPrescription((prev) => ({
                ...prev,
                left_eye: { ...prev.right_eye },
            }));
        }
    };

    const handleSavePrescription = () => {
        if (!prescriptionName.trim()) {
            alert('Vui lòng nhập tên cho đơn thuốc');
            return;
        }

        const newPrescription = {
            id: Date.now().toString(),
            name: prescriptionName.trim(),
            date: new Date().toLocaleDateString('vi-VN'),
            left_eye: prescription.left_eye,
            right_eye: prescription.right_eye,
        };

        // In production, save to API
        setSavedPrescriptions((prev) => [newPrescription, ...prev]);
        setSaveDialogOpen(false);
        setPrescriptionName('');
        alert(`Đã lưu đơn thuốc "${newPrescription.name}" thành công!`);
    };

    const handleLoginRedirect = () => {
        // Save full dialog state before redirect
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
        
        // Reset restoration flag so it will restore when coming back
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

            // If syncing and changing right eye, also update left eye
            if (eye === 'right_eye' && syncBothEyes[field as keyof typeof syncBothEyes]) {
                updated.left_eye = { ...updated.left_eye, [field]: value };
            }

            return updated;
        });
    }, [syncBothEyes]);

    const renderPrescriptionStep = () => {
        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Nhập độ kính của bạn
                </Typography>
                
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
                                                    Mắt phải
                                                </Typography>
                                                <Typography variant="body2">
                                                    SPH: {saved.right_eye.sphere} | CYL: {saved.right_eye.cylinder || '0.00'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Mắt trái
                                                </Typography>
                                                <Typography variant="body2">
                                                    SPH: {saved.left_eye.sphere} | CYL: {saved.left_eye.cylinder || '0.00'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                                </Stack>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                Vui lòng nhập đúng độ kính theo đơn của bác sĩ nhãn khoa. Nếu chưa có đơn, bạn có thể bỏ qua
                                bước này và đo độ tại cửa hàng.
                            </Typography>
                        </Alert>

                        {/* Sync Options */}
                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Hai mắt cùng chỉ số
                                </Typography>
                                <Button
                                    size="small"
                                    variant={Object.values(syncBothEyes).every((val) => val === true) ? 'contained' : 'outlined'}
                                    onClick={handleSyncAll}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {Object.values(syncBothEyes).every((val) => val === true) ? 'Bỏ trùng' : 'Trùng tất cả'}
                                </Button>
                            </Box>
                            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={syncBothEyes.sphere}
                                        onChange={(e) => handleSyncChange('sphere', e.target.checked)}
                                        size="small"
                                    />
                                    <Typography variant="body2">SPH</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={syncBothEyes.cylinder}
                                        onChange={(e) => handleSyncChange('cylinder', e.target.checked)}
                                        size="small"
                                    />
                                    <Typography variant="body2">CYL</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={syncBothEyes.axis}
                                        onChange={(e) => handleSyncChange('axis', e.target.checked)}
                                        size="small"
                                    />
                                    <Typography variant="body2">Axis</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={syncBothEyes.add}
                                        onChange={(e) => handleSyncChange('add', e.target.checked)}
                                        size="small"
                                    />
                                    <Typography variant="body2">ADD</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={syncBothEyes.pd}
                                        onChange={(e) => handleSyncChange('pd', e.target.checked)}
                                        size="small"
                                    />
                                    <Typography variant="body2">PD</Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <EyePrescription 
                            eye="right_eye" 
                            label="Mắt phải (OD - Oculus Dexter)" 
                            eyeData={prescription.right_eye}
                            syncData={syncBothEyes}
                            onChange={handlePrescriptionFieldChange}
                        />
                        <EyePrescription 
                            eye="left_eye" 
                            label="Mắt trái (OS - Oculus Sinister)" 
                            eyeData={prescription.left_eye}
                            syncData={syncBothEyes}
                            onChange={handlePrescriptionFieldChange}
                        />

                        {/* Save Prescription Button */}
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
                                        label={`Độ mờ: ${Math.round(selectedTint.opacity * 100)}%`}
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
                    {SAMPLE_LENS_TINTS.map((tint) => (
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
                                            Độ mờ: {Math.round(tint.opacity * 100)}%
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
        const featuresByCategory = SAMPLE_LENS_FEATURES.reduce((acc, feature) => {
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
        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Xác nhận tùy chỉnh tròng kính
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Xác nhận tùy chỉnh tròng kính
                </Typography>

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
                    {/* Usage */}
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

                    {/* Lens Type */}
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

                    {/* Prescription (if applicable) */}
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
                                            {prescription.left_eye.add && (
                                                <Typography variant="body2">
                                                    <strong>ADD:</strong> {prescription.left_eye.add}
                                                </Typography>
                                            )}
                                            {prescription.left_eye.pd && (
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
                                            {prescription.right_eye.add && (
                                                <Typography variant="body2">
                                                    <strong>ADD:</strong> {prescription.right_eye.add}
                                                </Typography>
                                            )}
                                            {prescription.right_eye.pd && (
                                                <Typography variant="body2">
                                                    <strong>PD:</strong> {prescription.right_eye.pd} mm
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Tint */}
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

                    {/* Features */}
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

                    {/* Total Price */}
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
                            Tổng chi phí tròng kính
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {formatCurrency(calculateTotalPrice())}
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
                return renderLensTypeStep();
            case 2:
                return renderPrescriptionStep();
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
                    {/* Left Sidebar - Stepper (20%) */}
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
                        <Stepper activeStep={activeStep} orientation="vertical">
                            {steps.map((label, index) => {
                                // Only show skipped state if we've already passed step 2 (prescription step)
                                const isSkipped = index === 2 && 
                                                  selectedLensType && 
                                                  !selectedLensType.isPrescription && 
                                                  activeStep > 2;
                                return (
                                    <Step key={label} completed={isStepCompleted(index)}>
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

                    {/* Right Content Area (80%) */}
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
                    {selectedLensType && (
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                            Tổng: {formatCurrency(calculateTotalPrice())}
                        </Typography>
                    )}
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
                        <Button variant="contained" onClick={handleNext} disabled={!canProceedToNextStep()}>
                            Tiếp theo
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
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Mắt trái (OS):</Typography>
                                <Typography variant="body2">SPH: {prescription.left_eye.sphere}</Typography>
                                <Typography variant="body2">CYL: {prescription.left_eye.cylinder || '0.00'}</Typography>
                                {prescription.left_eye.axis && (
                                    <Typography variant="body2">Axis: {prescription.left_eye.axis}°</Typography>
                                )}
                                {prescription.left_eye.add && (
                                    <Typography variant="body2">ADD: {prescription.left_eye.add}</Typography>
                                )}
                                {prescription.left_eye.pd && (
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
                                {prescription.right_eye.add && (
                                    <Typography variant="body2">ADD: {prescription.right_eye.add}</Typography>
                                )}
                                {prescription.right_eye.pd && (
                                    <Typography variant="body2">PD: {prescription.right_eye.pd} mm</Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSaveDialogOpen(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSavePrescription}>
                        Lưu
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
        </Dialog>
    );
};
