import {
    Box,
    Typography,
    Paper,
    IconButton,
    Avatar,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Divider,
    FormControlLabel,
    Switch,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Delete, CloudUpload } from '@mui/icons-material';
import { useState, forwardRef, useImperativeHandle } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
// import VariantAPI from '@/api/variant-api'; // ← uncomment khi có API thật

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImage {
    name: string;
    size: number;
    type: string;
    preview?: string;
    file?: File;
}

export interface CreateFrameVariantFormData {
    colorName: string;
    colorHex: string;
    size: 'S' | 'M' | 'L' | '';
    frameWidthMm: string;
    lensWidthMm: string;
    lensHeightMm: string;
    bridgeWidthMm: string;
    templeLengthMm: string;
    hasNosepads: boolean;
    hasSpringHinge: boolean;
    vrEnabled: boolean;
    stock: string;
    stockThreshold: string;
    warrantyMonths: string;
    costPrice: string;
    basePrice: string;
    compareAtPrice: string;
    isReturnable: boolean;
    images: ProductImage[];
}

export interface CreateFrameVariantPageRef {
    submit: () => Promise<void>;
}

interface CreateFrameVariantPageProps {
    frameGroupId?: string;
    /** Restore dữ liệu khi user ấn Back rồi quay lại */
    initialData?: Partial<CreateFrameVariantFormData>;
    /** Callback sau khi API thành công */
    onCreated?: (variantId: string, data: CreateFrameVariantFormData) => void;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

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

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FORM: CreateFrameVariantFormData = {
    colorName: '',
    colorHex: '#000000',
    size: '',
    frameWidthMm: '',
    lensWidthMm: '',
    lensHeightMm: '',
    bridgeWidthMm: '',
    templeLengthMm: '',
    hasNosepads: false,
    hasSpringHinge: false,
    vrEnabled: false,
    stock: '',
    stockThreshold: '',
    warrantyMonths: '',
    costPrice: '',
    basePrice: '',
    compareAtPrice: '',
    isReturnable: false,
    images: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

const CreateFrameVariantPage = forwardRef<CreateFrameVariantPageRef, CreateFrameVariantPageProps>(
    ({ frameGroupId, initialData, onCreated }, ref) => {
        const theme = useTheme();

        const [formData, setFormData] = useState<CreateFrameVariantFormData>({
            ...DEFAULT_FORM,
            ...initialData, // ← restore khi back về rồi quay lại
        });

        const [errors, setErrors] = useState<Partial<Record<keyof CreateFrameVariantFormData, string>>>({});
        const [loading, setLoading] = useState(false);

        // ── Helpers ───────────────────────────────────────────────────────────

        const formatFileSize = (bytes: number) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        const setField = <K extends keyof CreateFrameVariantFormData>(
            field: K,
            value: CreateFrameVariantFormData[K]
        ) => {
            setFormData(prev => ({ ...prev, [field]: value }));
            if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
        };

        // ── Validate ──────────────────────────────────────────────────────────

        const validate = (): boolean => {
            const e: Partial<Record<keyof CreateFrameVariantFormData, string>> = {};

            if (!formData.colorName.trim())
                e.colorName = 'Color name is required';

            if (!formData.size)
                e.size = 'Please select frame size';

            if (!formData.basePrice || Number(formData.basePrice) <= 0)
                e.basePrice = 'Base price must be greater than 0';

            if (formData.stock === '' || Number(formData.stock) < 0)
                e.stock = 'Stock must be ≥ 0';

            if (formData.images.length === 0)
                e.images = 'Please upload at least 1 image';

            setErrors(e);
            return Object.keys(e).length === 0;
        };

        // ── Submit (exposed via ref) ───────────────────────────────────────────

        const handleSubmit = async () => {
            if (!validate()) throw new Error('Validation failed');

            setLoading(true);
            try {
                // ── Build payload ──────────────────────────────────────────────
                // const payload = new FormData();
                // payload.append('frameGroupId', frameGroupId ?? '');
                // payload.append('colorName', formData.colorName.trim());
                // payload.append('colorHex', formData.colorHex);
                // payload.append('size', formData.size);
                // payload.append('stock', formData.stock);
                // payload.append('basePrice', formData.basePrice);
                // formData.images.forEach(img => img.file && payload.append('images', img.file));

                // ── Call API ───────────────────────────────────────────────────
                // const response = await VariantAPI.createFrameVariant(payload);
                // onCreated?.(response.id, formData);

                // ── Mock: xóa khi có API thật ──────────────────────────────────
                await new Promise(r => setTimeout(r, 800));
                const mockId = 'variant-' + Date.now();
                onCreated?.(mockId, formData);

            } finally {
                setLoading(false);
            }
        };

        useImperativeHandle(ref, () => ({ submit: handleSubmit }));

        // ── Image handlers ────────────────────────────────────────────────────

        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;

            const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            const newImages: ProductImage[] = imageFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                preview: URL.createObjectURL(file),
                file,
            }));

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages].slice(0, 4), // max 4
            }));
            if (errors.images) setErrors(prev => ({ ...prev, images: undefined }));
            e.target.value = '';
        };

        const handleRemoveImage = (index: number) => {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index),
            }));
        };

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
                    <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                    Frame Variant Information
                </Typography>

                {/* ── Color & Size ── */}
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Color Name"
                            placeholder="Black / Silver"
                            value={formData.colorName}
                            onChange={e => setField('colorName', e.target.value)}
                            error={!!errors.colorName}
                            helperText={errors.colorName}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            label="Color Hex"
                            value={formData.colorHex}
                            onChange={e => setField('colorHex', e.target.value)}
                            placeholder="#000000"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <input
                                            type="color"
                                            value={formData.colorHex}
                                            onChange={e => setField('colorHex', e.target.value)}
                                            style={{
                                                width: 28,
                                                height: 28,
                                                border: 'none',
                                                borderRadius: 100,
                                                padding: 0,
                                                cursor: 'pointer',
                                                background: 'none',
                                            }}
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth required error={!!errors.size}>
                            <InputLabel>Frame Size</InputLabel>
                            <Select
                                value={formData.size}
                                label="Frame Size"
                                onChange={e => setField('size', e.target.value as 'S' | 'M' | 'L')}
                            >
                                <MenuItem value="S">Small</MenuItem>
                                <MenuItem value="M">Medium</MenuItem>
                                <MenuItem value="L">Large</MenuItem>
                            </Select>
                            {errors.size && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.size}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* ── Dimensions ── */}
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                    Frame Dimensions (mm)
                </Typography>

                <Grid container spacing={3}>
                    {(
                        [
                            { field: 'frameWidthMm', label: 'Frame Width' },
                            { field: 'lensWidthMm', label: 'Lens Width' },
                            { field: 'lensHeightMm', label: 'Lens Height' },
                            { field: 'bridgeWidthMm', label: 'Bridge Width' },
                            { field: 'templeLengthMm', label: 'Temple Length' },
                        ] as { field: keyof CreateFrameVariantFormData; label: string }[]
                    ).map(({ field, label }) => (
                        <Grid key={field} size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label={label}
                                type="number"
                                value={formData[field] as string}
                                onChange={e => setField(field, e.target.value)}
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* ── Features ── */}
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                    Frame Features
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.hasNosepads}
                                    onChange={e => setField('hasNosepads', e.target.checked)}
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
                                    onChange={e => setField('hasSpringHinge', e.target.checked)}
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
                                    onChange={e => setField('vrEnabled', e.target.checked)}
                                />
                            }
                            label="VR Enabled"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* ── Inventory & Pricing ── */}
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
                    Inventory & Pricing
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            required
                            label="Stock"
                            type="number"
                            placeholder="0"
                            value={formData.stock}
                            onChange={e => setField('stock', e.target.value)}
                            error={!!errors.stock}
                            helperText={errors.stock}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Stock Threshold"
                            type="number"
                            placeholder="10"
                            value={formData.stockThreshold}
                            onChange={e => setField('stockThreshold', e.target.value)}
                            helperText="Alert when stock falls below this value"
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Warranty (months)"
                            type="number"
                            placeholder="12"
                            value={formData.warrantyMonths}
                            onChange={e => setField('warrantyMonths', e.target.value)}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Cost Price"
                            type="number"
                            placeholder="0.00"
                            value={formData.costPrice}
                            onChange={e => setField('costPrice', e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                            }}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            required
                            label="Base Price"
                            type="number"
                            placeholder="0.00"
                            value={formData.basePrice}
                            onChange={e => setField('basePrice', e.target.value)}
                            error={!!errors.basePrice}
                            helperText={errors.basePrice}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                            }}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Compare At Price"
                            type="number"
                            placeholder="0.00"
                            value={formData.compareAtPrice}
                            onChange={e => setField('compareAtPrice', e.target.value)}
                            helperText="Original price shown as strikethrough"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                            }}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isReturnable}
                                    onChange={e => setField('isReturnable', e.target.checked)}
                                />
                            }
                            label="Is Returnable"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* ── Product Images ── */}
                <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>
                    Product Images
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
                    Please upload at least 1 image, max 4. Accepted: PNG, JPG (max 5 MB each)
                </Typography>

                <input
                    type="file"
                    id="variant-image-upload"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />

                <label htmlFor="variant-image-upload">
                    <UploadArea
                        sx={errors.images ? { borderColor: theme.palette.error.main } : {}}
                    >
                        <CloudUpload
                            sx={{ fontSize: 48, color: theme.palette.custom.neutral[400], mb: 2 }}
                        />
                        <Typography
                            sx={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: theme.palette.custom.neutral[700],
                                mb: 1,
                            }}
                        >
                            Drag and drop files here or click to browse
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                            JPG, PNG up to 5 MB · {formData.images.length}/4 uploaded
                        </Typography>
                    </UploadArea>
                </label>

                {errors.images && (
                    <Typography color="error" fontSize={12} sx={{ mt: 1 }}>
                        {errors.images}
                    </Typography>
                )}

                {formData.images.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography
                            sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: theme.palette.custom.neutral[700],
                                mb: 2,
                            }}
                        >
                            Uploaded Files ({formData.images.length})
                        </Typography>

                        {formData.images.map((file, index) => (
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
                                <Avatar
                                    variant="rounded"
                                    src={file.preview}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 1,
                                        bgcolor: theme.palette.grey[100],
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: theme.palette.custom.neutral[800],
                                        }}
                                    >
                                        {file.name}
                                    </Typography>
                                    <Typography
                                        sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}
                                    >
                                        {formatFileSize(file.size)}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveImage(index)}
                                    sx={{ color: theme.palette.custom.status.error.main }}
                                >
                                    <Delete />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500] }}>
                            Saving variant…
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }
);

CreateFrameVariantPage.displayName = 'CreateFrameVariantPage';

export default CreateFrameVariantPage;
export { UploadArea };