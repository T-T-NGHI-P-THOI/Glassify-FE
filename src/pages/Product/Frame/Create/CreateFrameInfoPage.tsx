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
import { useState } from "react";
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import api from '@/api/axios.config';
import { API_ENDPOINTS } from '@/api/endpoints';
import { forwardRef, useImperativeHandle } from "react";
import ProductAPI from "@/api/product-api";

export interface CreateFrameInfoPageRef {
    submit: () => Promise<void>;
}

// ─── Enums matching backend ───────────────────────────────────────────────────

type FrameShape =
    | 'RECTANGLE' | 'SQUARE' | 'ROUND' | 'OVAL'
    | 'CAT_EYE' | 'AVIATOR' | 'BROWLINE' | 'GEOMETRIC';

type FrameStructure = 'FULL_RIM' | 'HALF_RIM' | 'RIMLESS';

type FrameMaterial =
    | 'ACETATE' | 'METAL' | 'TITANIUM'
    | 'PLASTIC' | 'MIXED' | 'CARBON';

type GenderTarget = 'MALE' | 'FEMALE' | 'OTHERS';

type AgeGroup = 'KIDS' | 'TEENS' | 'ADULTS' | 'SENIORS';

// ─── Request DTO matching CreateFrameRequest ──────────────────────────────────
export interface CreateFrameFormData {
    frameName: string;
    frameShape: FrameShape | '';
    frameStructure: FrameStructure | '';
    frameMaterial: FrameMaterial | '';
    genderTarget: GenderTarget | '';
    ageGroup: AgeGroup | '';
    description: string;
}

// ─── Variant display (read-only list, populated after save) ──────────────────

interface FrameVariant {
    id: string;
    name: string;
    color: string;
    size: string;
    sku: string;
    status: 'active' | 'draft';
}

const mockVariants: FrameVariant[] = [];

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateFrameInfoPageProps {
    /** Called with the created frameGroupId after successful POST */
    onCreated?: (frameGroupId: string) => void;
    /** Shop/user UUID for `createdBy` field */
    createdBy?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────


const CreateFrameInfoPage = forwardRef<CreateFrameInfoPageRef, CreateFrameInfoPageProps>(
    ({ onCreated, createdBy }, ref) => {
        const theme = useTheme();

        const [formData, setFormData] = useState<CreateFrameFormData>({
            frameName: '',
            frameShape: '',
            frameStructure: '',
            frameMaterial: '',
            genderTarget: '',
            ageGroup: '',
            description: '',
        });

        const [loading, setLoading] = useState(false);
        const [errors, setErrors] = useState<Partial<Record<keyof CreateFrameFormData, string>>>({});
        const [success, setSuccess] = useState(false);
        // ─── Validates ────────────────────────────────────────────────────────────
        const validateFields = (
            field: keyof CreateFrameFormData,
            value: any
        ) => {

            if (field === "frameName") {
                if (!value.trim() || value.trim().length < 3) {
                    return false;
                }
                return true;
            }

            if (
                field === "frameShape" ||
                field === "frameStructure" ||
                field === "frameMaterial" ||
                field === "genderTarget" ||
                field === "ageGroup"
            ) {
                return !!value;
            }

            return true;
        };

        // ─── Handlers ────────────────────────────────────────────────────────────
        const handleInputChange =
            (field: keyof CreateFrameFormData) =>
                (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const value = e.target.value;

                    setFormData((prev) => ({ ...prev, [field]: value }));
                    if (errors[field] && validateFields(field, value)) {
                        setErrors(prev => ({
                            ...prev,
                            [field]: null
                        }));
                    }
                };

        const handleSelectChange =
            (field: keyof CreateFrameFormData) => (e: any) => {
                const value = e.target.value;

                setFormData(prev => ({
                    ...prev,
                    [field]: value
                }));

                if (errors[field] && validateFields(field, value)) {
                    setErrors(prev => ({
                        ...prev,
                        [field]: null
                    }));
                }
            };

        // ─── Submit ───────────────────────────────────────────────────────────────

        const handleSubmit = async () => {
            setErrors({});
            setSuccess(false);

            const newErrors: Partial<Record<keyof CreateFrameFormData, string>> = {};

            if (!formData.frameName.trim() || formData.frameName.trim().length < 3) {
                newErrors.frameName = "Frame name must be at least 3 characters!"
            }

            if (!formData.frameShape) {
                newErrors.frameShape = "Please select frame shape!";
            }

            if (!formData.frameStructure) {
                newErrors.frameStructure = "Please select frame structure!";
            }

            if (!formData.frameMaterial) {
                newErrors.frameMaterial = "Please select frame material!";
            }

            if (!formData.genderTarget) {
                newErrors.genderTarget = "Please select gender target!";
            }

            if (!formData.ageGroup) {
                newErrors.ageGroup = "Please select age group!";
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                throw new Error("Validation failed");
            }

            setErrors({});

            // const requestBody = {
            //     frameName: formData.frameName.trim(),
            //     frameShape: formData.frameShape,
            //     frameStructure: formData.frameStructure,
            //     frameMaterial: formData.frameMaterial,
            //     genderTarget: formData.genderTarget,
            //     ageGroup: formData.ageGroup,
            //     description: formData.description.trim() || undefined,
            //     createdBy: createdBy,
            // };

            try {
                setLoading(true);
                const response = await ProductAPI.createFrameGroup(formData)

                const frameGroupId: string = response.id;
                setSuccess(true);

                onCreated?.(frameGroupId);

            } catch (err: any) {
                throw new Error("API Error");
            } finally {
                setLoading(false);
            }
        };

        // expose function to parent
        useImperativeHandle(ref, () => ({
            submit: handleSubmit
        }));

        // ─── Render ───────────────────────────────────────────────────────────────

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
                            inputProps={{ minLength: 3, maxLength: 255 }}
                            InputProps={{
                                startAdornment: (
                                    <Store sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} />
                                ),
                            }}
                        />

                        <Typography color="error" fontSize={12}>
                            {errors?.frameName}
                        </Typography>
                    </Grid>

                    {/* Frame Shape */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required>
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

                            <Typography color="error" fontSize={12}>
                                {errors?.frameShape}
                            </Typography>
                        </FormControl>
                    </Grid>

                    {/* Frame Structure */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required>
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

                            <Typography color="error" fontSize={12}>
                                {errors?.frameStructure}
                            </Typography>
                        </FormControl>
                    </Grid>

                    {/* Frame Material */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required>
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

                            <Typography color="error" fontSize={12}>
                                {errors?.frameMaterial}
                            </Typography>
                        </FormControl>
                    </Grid>

                    {/* Gender Target */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth required>
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

                            <Typography color="error" fontSize={12}>
                                {errors?.genderTarget}
                            </Typography>
                        </FormControl>
                    </Grid>

                    {/* Age Group */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
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

                            <Typography color="error" fontSize={12}>
                                {errors?.ageGroup}
                            </Typography>
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

                {/* ── Frame Variants ── */}
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

                {mockVariants.length === 0 ? (
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
                ) : (
                    <Grid container spacing={2}>
                        {mockVariants.map((variant) => (
                            <Grid size={{ xs: 12 }} key={variant.id}>
                                <Box
                                    sx={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: 1,
                                        px: 2,
                                        py: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: theme.palette.custom.neutral[800],
                                            }}
                                        >
                                            {variant.name}
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                                            Color: {variant.color} • Size: {variant.size} • SKU: {variant.sku}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color:
                                                variant.status === 'active'
                                                    ? theme.palette.success.main
                                                    : theme.palette.custom.neutral[500],
                                        }}
                                    >
                                        {variant.status === 'active' ? 'Active' : 'Draft'}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Submit button – exposed so parent (CreateFramePage) can also trigger via onCreated prop */}
                {/* The actual "Continue" button lives in CreateFramePage; call handleSubmit from there via ref if needed */}
                {/* For now we expose an internal save trigger – remove if parent drives the flow */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Box
                        component="button"
                        id="frame-info-submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ display: 'none' }}   // hidden – called programmatically
                    />
                    {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                                Saving frame info…
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    }
);



export default CreateFrameInfoPage;