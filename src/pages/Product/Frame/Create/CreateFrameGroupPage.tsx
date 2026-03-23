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
    FormControlLabel,
    Switch,
} from "@mui/material";
import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ProductAPI from "@/api/product-api";
import Upload3DModelPage, {
    type Model3DFile,
    type Upload3DModelPageRef,
} from './Upload3DModel';

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
    hasNosePads: boolean;
    hasSpringHinge: boolean;
    vrEnabled: boolean;
    genderTarget: GenderTarget | '';
    ageGroup: AgeGroup | '';
    description: string;
    model3dFile: Model3DFile | null;
}

interface CreateFrameGroupPageProps {
    onCreated?: (frameGroupId: string, data: CreateFrameFormData) => void;
    initialData?: Partial<CreateFrameFormData>;
    createdBy?: string;
    /** Expose ref của Upload3DModelPage lên CreateFramePage để truyền cho VariantPage */
    upload3DModelRef?: React.RefObject<Upload3DModelPageRef | null>;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FORM: CreateFrameFormData = {
    frameName: '',
    frameShape: '',
    frameStructure: '',
    frameMaterial: '',
    hasNosePads: false,
    hasSpringHinge: false,
    vrEnabled: false,
    genderTarget: '',
    ageGroup: '',
    description: '',
    model3dFile: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

const CreateFrameGroupPage = forwardRef<CreateFrameGroupPageRef, CreateFrameGroupPageProps>(
    ({ onCreated, initialData, createdBy, upload3DModelRef }, ref) => {
        const theme = useTheme();

        const [formData, setFormData] = useState<CreateFrameFormData>({
            ...DEFAULT_FORM,
            ...initialData,
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

        // ── Submit ────────────────────────────────────────────────────────────

        const handleSubmit = async () => {
            setSuccess(false);
            if (!validate()) throw new Error('Validation failed');

            setLoading(true);
            try {
                const payload = new FormData();
                payload.append('productName', formData.frameName.trim());
                payload.append('frameShape', formData.frameShape);
                payload.append('frameStructure', formData.frameStructure);
                payload.append('frameMaterial', formData.frameMaterial);
                payload.append('hasNosePads', String(formData.hasNosePads));
                payload.append('hasSpringHinge', String(formData.hasSpringHinge));
                payload.append('vrEnabled', String(formData.vrEnabled));
                payload.append('genderTarget', formData.genderTarget);
                payload.append('ageGroup', formData.ageGroup);
                payload.append('description', formData.description.trim());

                console.log("model3dFile: ", formData.model3dFile?.file);
                if (formData.model3dFile?.file && formData.vrEnabled == true) {
                    payload.append('model3dFile', formData.model3dFile.file);
                }
                const response = await ProductAPI.createFrameGroup(payload);
                const frameGroupId = response.id;
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
                    <Grid size={{ xs: 12 }}>
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

                    {/* ── Frame Features ── */}
                    <Grid size={{ xs: 12 }}>
                        <Typography sx={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: theme.palette.custom.neutral[800],
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}>
                            <ViewInArIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            Frame Features
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.hasNosePads}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, hasNosePads: e.target.checked }))
                                    }
                                />
                            }
                            label="Has Nose Pads"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.hasSpringHinge}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, hasSpringHinge: e.target.checked }))
                                    }
                                />
                            }
                            label="Spring Hinge"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.vrEnabled}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, vrEnabled: e.target.checked }))
                                    }
                                />
                            }
                            label="VR Enabled"
                        />
                    </Grid>

                    {/* Gender Target */}
                    <Grid size={{ xs: 12, md: 6 }}>
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

                <Divider sx={{ my: 3 }} />

                {/* ── 3D Model (optional) ── */}
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
                    <ViewInArIcon sx={{ color: theme.palette.primary.main }} />
                    3D Model
                    <Typography
                        component="span"
                        sx={{
                            fontSize: 13,
                            fontWeight: 400,
                            color: theme.palette.custom.neutral[500],
                            ml: 1,
                        }}
                    >
                        (optional)
                    </Typography>
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
                    Upload a 3D model. Texture can be applied in the next step.
                </Typography>

                {/* upload3DModelRef được truyền từ CreateFramePage */}
                <Upload3DModelPage
                    ref={upload3DModelRef}
                    variantId={undefined}
                    initialFile={formData.model3dFile}
                    onUploaded={(url, file) => {
                        console.log('onUploaded called:', file); // ← thêm log này
                        setFormData(prev => ({ ...prev, model3dFile: file }));
                    }}
                />

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