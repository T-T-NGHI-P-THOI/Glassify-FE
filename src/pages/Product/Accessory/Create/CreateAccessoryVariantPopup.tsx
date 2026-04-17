import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, IconButton, Typography, Box,
    TextField, MenuItem, Grid, FormControlLabel, Switch,
    InputAdornment, CircularProgress, Paper, Avatar, Divider,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Close, CloudUpload, Delete, Save } from '@mui/icons-material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { toast } from 'react-toastify';
import ProductAPI from '@/api/product-api';
import { sanitizeTextInput } from '@/utils/text-input';
import { formatNumber, parseNumber } from '@/utils/formatCurrency';
import { ProductSize } from '@/types/product.enums';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateAccessoryVariantFormData {
    name: string;
    color: string;
    colorHex: string;
    size: ProductSize | '';
    isFeatured: boolean;
    stock: number;
    stockThreshold: number;
    warrantyMonths: number;
    costPrice: number;
    basePrice: number;
    isReturnable: boolean;
    productImages: ProductImageFile[];
}

interface ProductImageFile {
    name: string;
    size: number;
    type: string;
    preview: string;
    file: File;
}

interface CreateAccessoryVariantPopupProps {
    open: boolean;
    onClose: () => void;
    accessoryId?: string;
    shopId?: string;
    onCreated?: (variantId: string, productId: string, data: any) => void;
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

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const DEFAULT_FORM: CreateAccessoryVariantFormData = {
    name: '',
    color: '',
    colorHex: '#000000',
    size: '',
    isFeatured: false,
    stock: 0,
    stockThreshold: 0,
    warrantyMonths: 0,
    costPrice: 0,
    basePrice: 0,
    isReturnable: false,
    productImages: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateAccessoryVariantPopup({
    open,
    onClose,
    accessoryId,
    shopId,
    onCreated,
}: CreateAccessoryVariantPopupProps) {
    const theme = useTheme();
    const [formData, setFormData] = useState<CreateAccessoryVariantFormData>(DEFAULT_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof CreateAccessoryVariantFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);

    useEffect(() => {
        ProductAPI.getColors()
            .then(res => setColors(res))
            .catch(() => toast.error('Cannot load colors!'));
    }, []);

    useEffect(() => {
        if (open) {
            setFormData(DEFAULT_FORM);
            setErrors({});
        }
    }, [open]);

    const setField = <K extends keyof CreateAccessoryVariantFormData>(
        field: K,
        value: CreateAccessoryVariantFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const e: Partial<Record<keyof CreateAccessoryVariantFormData, string>> = {};
        if (!formData.basePrice || Number(formData.basePrice) <= 0)
            e.basePrice = 'Base price must be greater than 0';
        if (!formData.stock || Number(formData.stock) <= 0)
            e.stock = 'Stock must be greater than 0';
        if (formData.productImages.length === 0)
            e.productImages = 'Please upload at least 1 image';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        if (!accessoryId) { toast.error('Accessory ID missing'); return; }
        setLoading(true);
        try {
            const payload = new FormData();
            payload.append('accessoryId', accessoryId);
            payload.append('shopId', shopId ?? '');
            if (formData.name.trim()) payload.append('name', formData.name.trim());
            if (formData.color) payload.append('color', formData.color);
            payload.append('colorHex', formData.colorHex);
            if (formData.size) payload.append('size', formData.size);
            payload.append('isFeatured', String(formData.isFeatured));
            payload.append('stock', String(formData.stock));
            if (formData.stockThreshold) payload.append('stockThreshold', String(formData.stockThreshold));
            if (formData.warrantyMonths) payload.append('warrantyMonths', String(formData.warrantyMonths));
            if (formData.costPrice) payload.append('costPrice', String(formData.costPrice));
            payload.append('basePrice', String(formData.basePrice));
            payload.append('isReturnable', String(formData.isReturnable));
            formData.productImages.forEach(img => {
                if (img.file) payload.append('productImages', img.file);
            });
            const response = await ProductAPI.createAccessoryVariant(payload);
            onCreated?.(response.id, response.productId, formData);
            toast.success('Accessory variant created successfully!');
            setFormData(DEFAULT_FORM);
            onClose();
        } catch (error: any) {
            const msgs: string[] = error?.errors ?? [];
            if (msgs.length) msgs.forEach(m => toast.error(m));
            else toast.error('Cannot create variant!');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const maxNew = 4 - formData.productImages.length;
        const newImages: ProductImageFile[] = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .slice(0, maxNew)
            .map(file => ({
                name: file.name, size: file.size, type: file.type,
                preview: URL.createObjectURL(file), file,
            }));
        setFormData(prev => ({ ...prev, productImages: [...prev.productImages, ...newImages].slice(0, 4) }));
        if (errors.productImages) setErrors(prev => ({ ...prev, productImages: undefined }));
        e.target.value = '';
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            '& fieldset': { borderColor: theme.palette.custom.border.light },
        },
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${theme.palette.custom.border.light}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' } }}
        >
            <DialogTitle sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                        Create Accessory Variant
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.custom.neutral[400] }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>

                {/* ── Identity & Color ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Identity & Color
                </Typography>
                <Grid container spacing={2.5}>
                    {/* Name */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth label="Variant Name"
                            value={formData.name}
                            onChange={e => setField('name', sanitizeTextInput(e.target.value, { maxLength: 150 }))}
                            size="small" sx={fieldSx}
                            placeholder="e.g. Black Large Case"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <ViewModuleIcon sx={{ fontSize: 16, color: theme.palette.custom.neutral[400] }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    {/* Color dropdown */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select fullWidth label="Color Name"
                            value={formData.color}
                            onChange={e => {
                                const name = e.target.value;
                                const found = colors.find(c => c.name === name);
                                setField('color', name);
                                if (found) setField('colorHex', found.hex);
                            }}
                            error={!!errors.color} helperText={errors.color}
                            size="small" sx={fieldSx}
                        >
                            {colors.map(c => (
                                <MenuItem key={c.name} value={c.name}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.hex, border: '1px solid #ccc', flexShrink: 0 }} />
                                        {c.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* ColorHex picker */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth label="Color Hex"
                            value={formData.colorHex}
                            onChange={e => setField('colorHex', e.target.value)}
                            placeholder="#000000"
                            size="small" sx={fieldSx}
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

                    {/* Size */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required error={!!errors.size}>
                            <InputLabel>Size</InputLabel>
                            <Select
                                value={formData.size}
                                label="Size"
                                onChange={e => setField('size', e.target.value as ProductSize)}
                            >
                                <MenuItem value={ProductSize.EXTRA_SMALL}>Extra Small</MenuItem>
                                <MenuItem value={ProductSize.SMALL}>Small</MenuItem>
                                <MenuItem value={ProductSize.MEDIUM}>Medium</MenuItem>
                                <MenuItem value={ProductSize.LARGE}>Large</MenuItem>
                                <MenuItem value={ProductSize.EXTRA_LARGE}>Extra Large</MenuItem>
                            </Select>
                            {errors.size && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.size}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    {/* Featured */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={<Switch checked={formData.isFeatured} onChange={e => setField('isFeatured', e.target.checked)} />}
                            label="Is Featured"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Inventory & Pricing ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Inventory & Pricing
                </Typography>
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth required label="Stock" type="number" value={formData.stock} onChange={e => setField('stock', parseNumber(e.target.value))} error={!!errors.stock} helperText={errors.stock} inputProps={{ min: 0 }} size="small" sx={fieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Stock Threshold" type="number" value={formData.stockThreshold} onChange={e => setField('stockThreshold', parseNumber(e.target.value))} helperText="Alert when stock below this" inputProps={{ min: 0 }} size="small" sx={fieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Warranty (months)" type="number" value={formData.warrantyMonths} onChange={e => setField('warrantyMonths', parseNumber(e.target.value))} inputProps={{ min: 0 }} size="small" sx={fieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth label="Cost Price" type="text" value={formatNumber(formData.costPrice)} onChange={e => setField('costPrice', parseNumber(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} size="small" sx={fieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth required label="Base Price" type="text" value={formatNumber(formData.basePrice)} onChange={e => setField('basePrice', parseNumber(e.target.value))} error={!!errors.basePrice} helperText={errors.basePrice} InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} size="small" sx={fieldSx} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel control={<Switch checked={formData.isReturnable} onChange={e => setField('isReturnable', e.target.checked)} />} label="Is Returnable" />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* ── Product Images ── */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                    Product Images
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                    Upload at least 1 image, max 4.
                </Typography>

                <input type="file" id="acc-popup-image-upload" multiple accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileUpload} />
                {formData.productImages.length < 4 && (
                    <label htmlFor="acc-popup-image-upload">
                        <UploadArea sx={errors.productImages ? { borderColor: theme.palette.error.main } : {}}>
                            <CloudUpload sx={{ fontSize: 36, color: theme.palette.custom.neutral[400], mb: 1 }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>Click to upload images</Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>JPG, PNG · {formData.productImages.length}/4 uploaded</Typography>
                        </UploadArea>
                    </label>
                )}
                {errors.productImages && <Typography color="error" fontSize={12} sx={{ mt: 1 }}>{errors.productImages}</Typography>}

                {formData.productImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        {formData.productImages.map((file, index) => (
                            <Paper key={index} elevation={0} sx={{ p: 1.5, mb: 1, borderRadius: 2, border: `1px solid ${theme.palette.primary.main}30`, bgcolor: `${theme.palette.primary.main}05`, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar variant="rounded" src={file.preview} sx={{ width: 48, height: 48, borderRadius: 1 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{file.name}</Typography>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{formatFileSize(file.size)}</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, productImages: prev.productImages.filter((_, i) => i !== index) }))} sx={{ color: theme.palette.custom.status.error.main }}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: `1px solid ${theme.palette.custom.border.light}`, flexShrink: 0 }}>
                <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500, fontSize: 13, minWidth: 90 }}>
                    Cancel
                </Button>
                <Button
                    variant="contained" onClick={handleSave} disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save sx={{ fontSize: 16 }} />}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 130, bgcolor: theme.palette.primary.main }}
                >
                    {loading ? 'Saving...' : 'Create Variant'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}