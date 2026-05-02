import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Grid,
    Divider,
    IconButton,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    InputAdornment,
    CircularProgress,
    Paper,
    Avatar,
    Button,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    Close,
    Save,
    Delete,
    CloudUpload,
    Refresh,
} from '@mui/icons-material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import ProductAPI from '@/api/product-api';
import { ThreeJsService } from '@/services/ThreeJsService';
import type { Model3DFile } from '../Create/Upload3DModel';
import type { FrameVariantResponse } from './../View/FrameGroupCard';
import { formatNumber, parseNumber } from '@/utils/formatCurrency';
import type { ProductSize } from '@/types/product.enums';
import { sanitizeTextInput } from '@/utils/text-input';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditFrameVariantFormData {
    colorName: string;
    colorHex: string;
    size: ProductSize;
    frameWidthMm: number;
    lensWidthMm: number;
    lensHeightMm: number;
    bridgeWidthMm: number;
    templeLengthMm: number;
    stock: number;
    stockThreshold: number;
    warrantyMonths: number;
    costPrice: number;
    basePrice: number;
    isReturnable: boolean;
    isFeatured: boolean;

    newImages: ProductImageFile[];
    keepImageUrls: string[];
    
    newTextureFile: TextureFileLocal | null;
    keepTextureUrl: string | null;
}

interface ProductImageFile {
    name: string;
    size: number;
    type: string;
    preview: string;
    file: File;
}

interface TextureFileLocal {
    name: string;
    size: number;
    preview: string;
    file: File;
}

interface EditFrameVariantDialogProps {
    open: boolean;
    onClose: () => void;
    /** Called after a successful save */
    onSaved?: (variantId: string, data: EditFrameVariantFormData) => void;
    variant: FrameVariantResponse;
    /** 3D model file (if VR enabled) */
    modelFile?: Model3DFile | null;
    shopId: string;
    frameGroupId: string;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

const UploadArea = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.custom.border.light}`,
    borderRadius: 12,
    padding: theme.spacing(3),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.custom.neutral[50],
    },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const buildDefaultForm = (
    variant: FrameVariantResponse,
): EditFrameVariantFormData => ({
    colorName: variant.colorName ?? '',
    colorHex: variant.colorHex ?? '#000000',
    size: (variant.size as EditFrameVariantFormData['size']) ?? '',
    frameWidthMm: variant.frameWidthMm ?? 1,
    lensWidthMm: variant.lensWidthMm ?? 1,
    lensHeightMm: variant.lensHeightMm ?? 1,
    bridgeWidthMm: variant.bridgeWidthMm ?? 1,
    templeLengthMm: variant.templeLengthMm ?? 1,
    stock: variant.qtyOnHand ?? 0,
    stockThreshold: variant.lowStockThreshold ?? 0,
    warrantyMonths: variant.productResponse?.warrantyMonths ?? 0,
    costPrice: variant.costPrice ? Number(variant.costPrice) : 0,
    basePrice: variant.basePrice ? Number(variant.basePrice) : 0,
    isReturnable: variant.isReturnable ?? false,
    isFeatured: variant.productResponse.isFeatured ?? false,
    newImages: [],
    keepImageUrls: [...variant.productResponse.productImages],
    newTextureFile: null,
    keepTextureUrl: variant.textureFile ?? null,
});

// ─── Component ────────────────────────────────────────────────────────────────

const EditFrameVariantDialog = ({
    open,
    onClose,
    onSaved,
    variant,
    modelFile,
    shopId,
    frameGroupId
}: EditFrameVariantDialogProps) => {
    const theme = useTheme();

    const [formData, setFormData] = useState<EditFrameVariantFormData>(() =>
        buildDefaultForm(variant)
    );
    const [errors, setErrors] = useState<Partial<Record<keyof EditFrameVariantFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);

    // Three.js refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const threeServiceRef = useRef<ThreeJsService | null>(null);

    // ── Init form when variant changes ────────────────────────────────────────
    useEffect(() => {
        if (open) {
            setFormData(buildDefaultForm(variant));
            setErrors({});
        }
    }, [open, variant]);

    // ── Fetch colors ──────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchColors = async () => {
            try {
                const response = await ProductAPI.getColors();
                setColors(response);
            } catch {
                toast.error('Cannot load colors!');
            }
        };
        fetchColors();
    }, []);

    // ── Three.js viewer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!open || !modelFile?.file) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        let initialized = false;

        const startViewer = (w: number, h: number) => {
            if (initialized || w === 0 || h === 0) return;
            initialized = true;
            canvas.width = w;
            canvas.height = h;

            const service = new ThreeJsService();
            threeServiceRef.current = service;
            cleanupRef.current = service.initializeThreeDViewer(canvas, modelFile.file);

            // Auto-apply texture if present on open
            const tex = formData.newTextureFile?.file;
            if (tex) {
                setTimeout(() => {
                    if (service.viewerModel) {
                        service.applyTextureToModel(service.viewerModel, tex);
                    }
                }, 1500);
            }
        };

        const { offsetWidth, offsetHeight } = container;
        if (offsetWidth > 0 && offsetHeight > 0) {
            startViewer(offsetWidth, offsetHeight);
            return () => {
                cleanupRef.current?.();
                cleanupRef.current = null;
                threeServiceRef.current = null;
            };
        }

        const observer = new ResizeObserver(entries => {
            const { inlineSize: w, blockSize: h } = entries[0].contentBoxSize[0];
            startViewer(Math.round(w), Math.round(h));
            if (initialized) observer.disconnect();
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            cleanupRef.current?.();
            cleanupRef.current = null;
            threeServiceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, modelFile]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const setField = <K extends keyof EditFrameVariantFormData>(
        field: K,
        value: EditFrameVariantFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    // ── Validation ────────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const e: Partial<Record<keyof EditFrameVariantFormData, string>> = {};

        if (!formData.colorName.trim()) e.colorName = 'Color name is required';
        if (!formData.size) e.size = 'Please select frame size';
        if (!formData.basePrice || Number(formData.basePrice) <= 0)
            e.basePrice = 'Base price must be greater than 0';
        if (!formData.stock || Number(formData.stock) <= 0)
            e.stock = 'Stock must be greater than 0';

        const totalImages = formData.keepImageUrls.length + formData.newImages.length;
        if (totalImages === 0) e.newImages = 'Please keep or upload at least 1 image';

        const dimensionFields: (keyof EditFrameVariantFormData)[] = [
            'frameWidthMm',
            'lensWidthMm',
            'lensHeightMm',
            'bridgeWidthMm',
            'templeLengthMm',
        ];
        dimensionFields.forEach(field => {
            const v = formData[field] as number;
            if (!v || v <= 0) e[field] = `${field} must be greater than 0`;
            else if (v > 500) e[field] = `${field} must not exceed 500`;
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const payload = new FormData();

            payload.append('frameGroupId', frameGroupId)
            payload.append('shopId', shopId)

            payload.append('colorName', formData.colorName.trim());
            payload.append('colorHex', formData.colorHex);
            payload.append('size', formData.size);

            payload.append('frameWidthMm', String(formData.frameWidthMm));
            payload.append('lensWidthMm', String(formData.lensWidthMm));
            payload.append('lensHeightMm', String(formData.lensHeightMm));
            payload.append('bridgeWidthMm', String(formData.bridgeWidthMm));
            payload.append('templeLengthMm', String(formData.templeLengthMm));

            payload.append('stock', String(formData.stock));
            if (formData.stockThreshold) payload.append('stockThreshold', String(formData.stockThreshold));
            if (formData.warrantyMonths) payload.append('warrantyMonths', String(formData.warrantyMonths));

            if (formData.costPrice) payload.append('costPrice', String(formData.costPrice));
            payload.append('basePrice', String(formData.basePrice));

            payload.append('isReturnable', String(formData.isReturnable));
            payload.append('isFeatured', String(formData.isFeatured));

            // Images: tell BE which existing URLs to keep
            formData.keepImageUrls.forEach(url => payload.append('keepImageUrls', url));

            // New images
            formData.newImages.forEach(img => {
                if (img.file) payload.append('productImages', img.file);
            });

            // Texture
            if (formData.newTextureFile?.file) {
                payload.append('textureFile', formData.newTextureFile.file);
            } else if (formData.keepTextureUrl) {
                payload.append('keepTextureUrl', formData.keepTextureUrl);
            }
            // If both are null/empty → texture is removed

            await ProductAPI.updateFrameVariant(variant.id, payload);
            toast.success('Frame variant updated successfully!');
            onSaved?.(variant.id, formData);
            onClose();
            
        } catch (error: any) {
            const msgs: string[] = error?.errors ?? [];
            if (msgs.length) msgs.forEach(m => toast.error(m));
            else toast.error('Cannot save frame variant!');
        } finally {
            setLoading(false);
        }
    };

    // ── Image handlers ────────────────────────────────────────────────────────

    const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const maxNew = 4 - formData.keepImageUrls.length;
        const imageFiles = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .slice(0, maxNew);

        const newImages: ProductImageFile[] = imageFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            preview: URL.createObjectURL(file),
            file,
        }));

        setFormData(prev => ({
            ...prev,
            newImages: [...prev.newImages, ...newImages].slice(0, maxNew),
        }));
        if (errors.newImages) setErrors(prev => ({ ...prev, newImages: undefined }));
        e.target.value = '';
    };

    const handleRemoveExistingImage = (url: string) => {
        setFormData(prev => ({
            ...prev,
            keepImageUrls: prev.keepImageUrls.filter(u => u !== url),
        }));
    };

    const handleRemoveNewImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            newImages: prev.newImages.filter((_, i) => i !== index),
        }));
    };

    // ── Texture handlers ──────────────────────────────────────────────────────

    const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, newTextureFile: 'Invalid type. Accepted: PNG, JPG, WEBP' }));
            e.target.value = '';
            return;
        }

        const preview = URL.createObjectURL(file);
        const texture: TextureFileLocal = { name: file.name, size: file.size, preview, file };

        setFormData(prev => ({
            ...prev,
            newTextureFile: texture,
            keepTextureUrl: null, // replaced
        }));

        const service = threeServiceRef.current;
        if (service?.viewerModel) {
            service.applyTextureToModel(service.viewerModel, file);
        }

        e.target.value = '';
    };

    const handleRemoveTexture = () => {
        setFormData(prev => ({
            ...prev,
            newTextureFile: null,
            keepTextureUrl: null,
        }));
    };

    const handleRestoreTexture = () => {
        if (variant.textureFile) {
            setFormData(prev => ({
                ...prev,
                keepTextureUrl: variant.textureFile,
                newTextureFile: null,
            }));
        }
    };

    // ── Displayed texture (new upload takes priority, else existing URL) ──────
    const displayTexture: { src: string; label: string; isUrl: boolean } | null =
        formData.newTextureFile
            ? { src: formData.newTextureFile.preview, label: formData.newTextureFile.name, isUrl: false }
            : formData.keepTextureUrl
                ? { src: formData.keepTextureUrl, label: 'Current texture', isUrl: true }
                : null;

    const totalImages = formData.keepImageUrls.length + formData.newImages.length;
    const canAddMore = totalImages < 4;

    // ── Field style ───────────────────────────────────────────────────────────

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            '& fieldset': { borderColor: theme.palette.custom.border.light },
        },
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* ── Title ── */}
            <DialogTitle
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                    <Box>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            Edit Frame Variant
                        </Typography>
                        {variant.id && (
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], fontFamily: 'monospace', mt: 0.25 }}>
                                {variant.id.slice(0, 8).toUpperCase()}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: theme.palette.custom.neutral[400] }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            {/* ── Content ── */}
            <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>
                {/* ── Color & Size ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Color & Size
                </Typography>

                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            required
                            label="Color Name"
                            value={formData.colorName}
                            onChange={e => {
                                const name = sanitizeTextInput(e.target.value, { maxLength: 150 });
                                const found = colors.find(c => c.name === name);
                                setField('colorName', name);
                                if (found) setField('colorHex', found.hex);
                            }}
                            error={!!errors.colorName}
                            helperText={errors.colorName}
                            size="small"
                            sx={fieldSx}
                        >
                            {colors.map(color => (
                                <MenuItem key={color.name} value={color.name}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color.hex, border: '1px solid #ccc', flexShrink: 0 }} />
                                        {color.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Color Hex"
                            value={formData.colorHex}
                            onChange={e => setField('colorHex', e.target.value)}
                            placeholder="#000000"
                            size="small"
                            sx={fieldSx}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <input
                                            type="color"
                                            value={formData.colorHex}
                                            onChange={e => setField('colorHex', e.target.value)}
                                            style={{ width: 28, height: 28, border: 'none', borderRadius: 100, padding: 0, cursor: 'pointer', background: 'none' }}
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            required
                            label="Frame Size"
                            value={formData.size}
                            onChange={e => setField('size', e.target.value as EditFrameVariantFormData['size'])}
                            error={!!errors.size}
                            helperText={errors.size}
                            size="small"
                            sx={fieldSx}
                        >
                            <MenuItem value="SMALL">Small</MenuItem>
                            <MenuItem value="MEDIUM">Medium</MenuItem>
                            <MenuItem value="LARGE">Large</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isFeatured}
                                    onChange={e => setField('isFeatured', e.target.checked)}
                                />
                            }
                            label="Is Featured"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Dimensions ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Frame Dimensions (mm)
                </Typography>

                <Grid container spacing={2.5}>
                    {(
                        [
                            { field: 'frameWidthMm', label: 'Frame Width' },
                            { field: 'lensWidthMm', label: 'Lens Width' },
                            { field: 'lensHeightMm', label: 'Lens Height' },
                            { field: 'bridgeWidthMm', label: 'Bridge Width' },
                            { field: 'templeLengthMm', label: 'Temple Length' },
                        ] as { field: keyof EditFrameVariantFormData; label: string }[]
                    ).map(({ field, label }) => (
                        <Grid key={field} size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label={label + ' *'}
                                type="number"
                                value={(formData[field] as number) || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') { setField(field, 0); return; }
                                    const num = Number(val);
                                    if (num <= 0 || num > 500) return;
                                    setField(field, num);
                                }}
                                error={!!errors[field]}
                                helperText={errors[field]}
                                size="small"
                                sx={fieldSx}
                            />
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Inventory & Pricing ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Inventory & Pricing
                </Typography>

                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            required
                            label="Stock"
                            type="number"
                            value={formData.stock}
                            onChange={e => setField('stock', parseNumber(e.target.value))}
                            error={!!errors.stock}
                            helperText={errors.stock}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Stock Threshold"
                            type="number"
                            value={formData.stockThreshold}
                            onChange={e => setField('stockThreshold', parseNumber(e.target.value))}
                            helperText="Alert when stock falls below this"
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Warranty (months)"
                            type="number"
                            value={formData.warrantyMonths}
                            onChange={e => setField('warrantyMonths', parseNumber(e.target.value))}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Cost Price"
                            type="text"
                            value={formatNumber(formData.costPrice)}
                            onChange={e => setField('costPrice', parseNumber(e.target.value))}
                            InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                            inputProps={{ min: 0 }}
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            required
                            label="Base Price"
                            type="text"
                            value={formatNumber(formData.basePrice)}
                            onChange={e => setField('basePrice', parseNumber(e.target.value))}
                            error={!!errors.basePrice}
                            helperText={errors.basePrice}
                            InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                            size="small"
                            sx={fieldSx}
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

                <Divider sx={{ my: 3 }} />

                {/* ── Product Images ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                    Product Images
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                    Keep or replace images. Total max 4.
                </Typography>

                {/* Existing images */}
                {formData.keepImageUrls.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>
                            Current Images ({formData.keepImageUrls.length})
                        </Typography>
                        {formData.keepImageUrls.map((url, index) => (
                            <Paper
                                key={url}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.custom.border.light}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Avatar
                                    variant="rounded"
                                    src={url}
                                    sx={{ width: 48, height: 48, borderRadius: 1 }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                                        Image {index + 1}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                                        {url.split('/').pop()}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveExistingImage(url)}
                                    sx={{ color: theme.palette.custom.status.error.main }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                )}

                {/* New images */}
                {formData.newImages.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[600], mb: 1 }}>
                            New Images ({formData.newImages.length})
                        </Typography>
                        {formData.newImages.map((file, index) => (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.primary.main}30`,
                                    bgcolor: `${theme.palette.primary.main}05`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Avatar variant="rounded" src={file.preview} sx={{ width: 48, height: 48, borderRadius: 1 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                        {file.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                        {formatFileSize(file.size)}
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={() => handleRemoveNewImage(index)} sx={{ color: theme.palette.custom.status.error.main }}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                )}

                {/* Upload area */}
                {canAddMore && (
                    <>
                        <input
                            type="file"
                            id="edit-variant-image-upload"
                            multiple
                            accept=".jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={handleNewImageUpload}
                        />
                        <label htmlFor="edit-variant-image-upload">
                            <UploadArea sx={errors.newImages ? { borderColor: theme.palette.error.main } : {}}>
                                <CloudUpload sx={{ fontSize: 36, color: theme.palette.custom.neutral[400], mb: 1 }} />
                                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>
                                    Click to add images
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                    JPG, PNG · {totalImages}/4 uploaded
                                </Typography>
                            </UploadArea>
                        </label>
                    </>
                )}
                {errors.newImages && (
                    <Typography color="error" fontSize={12} sx={{ mt: 1 }}>
                        {errors.newImages}
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* ── Texture Map ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ViewInArIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                    Texture Map
                    <Typography component="span" sx={{ fontSize: 13, fontWeight: 400, color: theme.palette.custom.neutral[500] }}>
                        (optional)
                    </Typography>
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                    {modelFile ? 'Replace or remove the texture applied to the 3D model.' : 'No 3D model in this frame group.'}
                </Typography>

                {!displayTexture ? (
                    <>
                        <input type="file" id="edit-texture-upload" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={handleTextureUpload} />
                        <label htmlFor="edit-texture-upload">
                            <UploadArea sx={{ py: 2.5, ...(errors.newTextureFile ? { borderColor: theme.palette.error.main } : {}) }}>
                                <CloudUpload sx={{ fontSize: 32, color: theme.palette.custom.neutral[400], mb: 1 }} />
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>
                                    Click to upload texture
                                </Typography>
                                {variant.textureFile && (
                                    <Typography
                                        component="span"
                                        onClick={e => { e.preventDefault(); handleRestoreTexture(); }}
                                        sx={{ fontSize: 12, color: theme.palette.primary.main, cursor: 'pointer', textDecoration: 'underline', display: 'block', mt: 0.5 }}
                                    >
                                        Restore current texture
                                    </Typography>
                                )}
                            </UploadArea>
                        </label>
                        {errors.newTextureFile && (
                            <Typography color="error" fontSize={12} sx={{ mt: 1 }}>{errors.newTextureFile}</Typography>
                        )}
                    </>
                ) : (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            mb: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.custom.border.light}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Box
                            component="img"
                            src={displayTexture.src}
                            sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'contain', flexShrink: 0, border: `1px solid ${theme.palette.custom.border.light}` }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.custom.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {displayTexture.label}
                            </Typography>
                            {!displayTexture.isUrl && formData.newTextureFile && (
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                    {formatFileSize(formData.newTextureFile.size)}
                                </Typography>
                            )}
                        </Box>

                        <label htmlFor="edit-texture-upload" style={{ cursor: 'pointer' }}>
                            <input type="file" id="edit-texture-upload" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={handleTextureUpload} />
                            <Button
                                component="span"
                                size="small"
                                variant="outlined"
                                startIcon={<Refresh sx={{ fontSize: 14 }} />}
                                sx={{ fontSize: 12, textTransform: 'none', mr: 1 }}
                            >
                                Replace
                            </Button>
                        </label>

                        <IconButton size="small" onClick={handleRemoveTexture} sx={{ color: theme.palette.custom.status.error.main }}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Paper>
                )}

                {/* ── Local 3D Viewer ── */}
                {modelFile?.file && (
                    <Box
                        ref={containerRef}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: `1px solid ${theme.palette.custom.border.light}`,
                            position: 'relative',
                            width: '100%',
                            height: 320,
                            mt: 2,
                        }}
                    >
                        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

                        {displayTexture && (
                            <Box sx={{
                                position: 'absolute', top: 10, left: 12,
                                display: 'flex', alignItems: 'center', gap: 1,
                                bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1, px: 1.5, py: 0.5, pointerEvents: 'none',
                            }}>
                                <Box component="img" src={displayTexture.src} sx={{ width: 18, height: 18, borderRadius: 0.5, objectFit: 'contain' }} />
                                <Typography sx={{ fontSize: 11, color: '#fff' }}>{displayTexture.label}</Typography>
                            </Box>
                        )}

                        <Box sx={{
                            position: 'absolute', bottom: 12, right: 14,
                            bgcolor: 'rgba(0,0,0,0.45)', borderRadius: 1, px: 1.5, py: 0.5, pointerEvents: 'none',
                        }}>
                            <Typography sx={{ fontSize: 11, color: '#fff' }}>Drag to rotate · Scroll to zoom</Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {/* ── Actions ── */}
            <DialogActions
                sx={{
                    px: 3,
                    pb: 2.5,
                    pt: 1.5,
                    gap: 1,
                    borderTop: `1px solid ${theme.palette.custom.border.light}`,
                    flexShrink: 0,
                }}
            >
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={loading}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500, fontSize: 13, minWidth: 90 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save sx={{ fontSize: 16 }} />}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        minWidth: 130,
                        bgcolor: theme.palette.primary.main,
                    }}
                >
                    {loading ? 'Saving...' : 'Save changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditFrameVariantDialog;
export type { EditFrameVariantDialogProps };