import { Store } from "@mui/icons-material";
import {
    Box,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    useTheme,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useState, forwardRef, useImperativeHandle } from "react";
import ViewModuleIcon from '@mui/icons-material/ViewModule';
// import ProductAPI from '@/api/product-api'; // ← uncomment khi có API thật

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateFrameGroupPageRef {
    submit: () => Promise<void>;
}

type FrameShape =
    | 'RECTANGLE' | 'SQUARE' | 'ROUND' | 'OVAL'
    | 'CAT_EYE' | 'AVIATOR' | 'BROWLINE' | 'GEOMETRIC';

type FrameStructure = 'FULL_RIM' | 'HALF_RIM' | 'RIMLESS';

type FrameMaterial =
    | 'ACETATE' | 'METAL' | 'TITANIUM'
    | 'PLASTIC' | 'MIXED' | 'CARBON';

type GenderTarget = 'MALE' | 'FEMALE' | 'OTHERS';

type AgeGroup = 'KIDS' | 'TEENS' | 'ADULTS' | 'SENIORS';

export interface CreateFrameFormData {
    frameName: string;
    frameShape: FrameShape | '';
    frameStructure: FrameStructure | '';
    frameMaterial: FrameMaterial | '';
    genderTarget: GenderTarget | '';
    ageGroup: AgeGroup | '';
    description: string;
}

interface CreateFrameGroupPageProps {
    /** Callback sau khi API thành công — trả về cả id lẫn formData để parent lưu lại */
    onCreated?: (frameGroupId: string, data: CreateFrameFormData) => void;
    /** Restore dữ liệu khi user ấn Back rồi quay lại */
    initialData?: Partial<CreateFrameFormData>;
    /** Shop/user UUID for createdBy field */
    createdBy?: string;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FORM: CreateFrameFormData = {
    frameName: '',
    frameShape: '',
    frameStructure: '',
    frameMaterial: '',
    genderTarget: '',
    ageGroup: '',
    description: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const CreateFrameGroupPage = forwardRef<CreateFrameGroupPageRef, CreateFrameGroupPageProps>(
    ({ onCreated, initialData, createdBy }, ref) => {
        const theme = useTheme();

        const [formData, setFormData] = useState<CreateFrameFormData>({
            ...DEFAULT_FORM,
            ...initialData, // ← restore khi back
        });

        const [loading, setLoading] = useState(false);
        const [errors, setErrors] = useState<Partial<Record<keyof CreateFrameFormData, string>>>({});
        const [success, setSuccess] = useState(false);

        // ── Helpers ───────────────────────────────────────────────────────────

        const clearError = (field: keyof CreateFrameFormData) => {
            if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
        };

        const handleInputChange =
            (field: keyof CreateFrameFormData) =>
                (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    setFormData(prev => ({ ...prev, [field]: e.target.value }));
                    clearError(field);
                };

        const handleSelectChange =
            (field: keyof CreateFrameFormData) => (e: any) => {
                setFormData(prev => ({ ...prev, [field]: e.target.value }));
                clearError(field);
            };

        // ── Validate ──────────────────────────────────────────────────────────

        const validate = (): boolean => {
            const e: typeof errors = {};

            if (!formData.frameName.trim() || formData.frameName.trim().length < 3)
                e.frameName = 'Frame name must be at least 3 characters';
            if (!formData.frameShape)
                e.frameShape = 'Please select frame shape';
            if (!formData.frameStructure)
                e.frameStructure = 'Please select frame structure';
            if (!formData.frameMaterial)
                e.frameMaterial = 'Please select frame material';
            if (!formData.genderTarget)
                e.genderTarget = 'Please select gender target';
            if (!formData.ageGroup)
                e.ageGroup = 'Please select age group';

            setErrors(e);
            return Object.keys(e).length === 0;
        };

        // ── Submit (exposed via ref) ───────────────────────────────────────────

        const handleSubmit = async () => {
            setSuccess(false);
            if (!validate()) throw new Error('Validation failed');

            setLoading(true);
            try {
                // ── Call API ───────────────────────────────────────────────────
                // const response = await ProductAPI.createFrameGroup({
                //     ...formData,
                //     createdBy,
                // });
                // const frameGroupId: string = response.id;
                // setSuccess(true);
                // onCreated?.(frameGroupId, formData);

                // ── Mock: xóa khi có API thật ──────────────────────────────────
                await new Promise(r => setTimeout(r, 800));
                const frameGroupId = 'group-' + Date.now();
                setSuccess(true);
                onCreated?.(frameGroupId, formData);

            } catch (err: any) {
                throw new Error('API Error');
            } finally {
                setLoading(false);
            }
        };

        useImperativeHandle(ref, () => ({ submit: handleSubmit }));

        // ── Render ────────────────────────────────────────────────────────────

        return (
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

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Frame group created successfully!
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Frame Name */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                            fullWidth
                            required
                            label="Frame Name"
                            value={formData.frameName}
                            onChange={handleInputChange('frameName')}
                            placeholder="Enter frame name"
                            error={!!errors.frameName}
                            helperText={errors.frameName}
                            inputProps={{ minLength: 3, maxLength: 255 }}
                            InputProps={{
                                startAdornment: (
                                    <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />
                                ),
                            }}
                        />
                    </Grid>

                    {/* Frame Shape */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required error={!!errors.frameShape}>
                            <InputLabel>Frame Shape</InputLabel>
                            <Select
                                value={formData.frameShape}
                                label="Frame Shape"
                                onChange={handleSelectChange('frameShape')}
                            >
                                <MenuItem value="RECTANGLE">Rectangle</MenuItem>
                                <MenuItem value="SQUARE">Square</MenuItem>
                                <MenuItem value="ROUND">Round</MenuItem>
                                <MenuItem value="OVAL">Oval</MenuItem>
                                <MenuItem value="CAT_EYE">Cat Eye</MenuItem>
                                <MenuItem value="AVIATOR">Aviator</MenuItem>
                                <MenuItem value="BROWLINE">Browline</MenuItem>
                                <MenuItem value="GEOMETRIC">Geometric</MenuItem>
                            </Select>
                            {errors.frameShape && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.frameShape}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Frame Structure */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required error={!!errors.frameStructure}>
                            <InputLabel>Frame Structure</InputLabel>
                            <Select
                                value={formData.frameStructure}
                                label="Frame Structure"
                                onChange={handleSelectChange('frameStructure')}
                            >
                                <MenuItem value="FULL_RIM">Full Rim</MenuItem>
                                <MenuItem value="HALF_RIM">Half Rim</MenuItem>
                                <MenuItem value="RIMLESS">Rimless</MenuItem>
                            </Select>
                            {errors.frameStructure && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.frameStructure}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Frame Material */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required error={!!errors.frameMaterial}>
                            <InputLabel>Frame Material</InputLabel>
                            <Select
                                value={formData.frameMaterial}
                                label="Frame Material"
                                onChange={handleSelectChange('frameMaterial')}
                            >
                                <MenuItem value="ACETATE">Acetate</MenuItem>
                                <MenuItem value="METAL">Metal</MenuItem>
                                <MenuItem value="TITANIUM">Titanium</MenuItem>
                                <MenuItem value="PLASTIC">Plastic</MenuItem>
                                <MenuItem value="MIXED">Mixed Material</MenuItem>
                                <MenuItem value="CARBON">Carbon Fiber</MenuItem>
                            </Select>
                            {errors.frameMaterial && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.frameMaterial}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Gender Target */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required error={!!errors.genderTarget}>
                            <InputLabel>Gender Target</InputLabel>
                            <Select
                                value={formData.genderTarget}
                                label="Gender Target"
                                onChange={handleSelectChange('genderTarget')}
                            >
                                <MenuItem value="MALE">Male</MenuItem>
                                <MenuItem value="FEMALE">Female</MenuItem>
                                <MenuItem value="OTHERS">Others</MenuItem>
                            </Select>
                            {errors.genderTarget && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.genderTarget}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Age Group */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required error={!!errors.ageGroup}>
                            <InputLabel>Age Group</InputLabel>
                            <Select
                                value={formData.ageGroup}
                                label="Age Group"
                                onChange={handleSelectChange('ageGroup')}
                            >
                                <MenuItem value="KIDS">Kids</MenuItem>
                                <MenuItem value="TEENS">Teens</MenuItem>
                                <MenuItem value="ADULTS">Adults</MenuItem>
                                <MenuItem value="SENIORS">Seniors</MenuItem>
                            </Select>
                            {errors.ageGroup && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.ageGroup}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Description */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={formData.description}
                            onChange={handleInputChange('description')}
                            placeholder="Describe your frame..."
                            inputProps={{ maxLength: 1000 }}
                            helperText={`${formData.description.length}/1000`}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, borderColor: '#E5E7EB', borderBottomWidth: 1 }} />

                {/* ── Frame Variants (read-only preview) ── */}
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
                    <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                    Frame Variants
                </Typography>

                <Box
                    sx={{
                        border: '1px dashed #E5E7EB',
                        borderRadius: 1,
                        py: 4,
                        textAlign: 'center',
                    }}
                >
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                        No frame variants yet. Please add at least one variant.
                    </Typography>
                </Box>

                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                            Saving frame info…
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }
);

CreateFrameGroupPage.displayName = 'CreateFrameGroupPage';

export default CreateFrameGroupPage;