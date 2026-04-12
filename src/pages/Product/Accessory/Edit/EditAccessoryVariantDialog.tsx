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
import { Close, Save, Delete, CloudUpload, Refresh } from '@mui/icons-material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { AccessoryVariantResponse } from '../View/AccessoryCard';
import { formatNumber, parseNumber } from '@/utils/formatCurrency';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditAccessoryVariantFormData {
    color: string;
    size: string;
    isFeatured: boolean;
    stock: number;
    stockThreshold: number;
    warrantyMonths: number;
    costPrice: number;
    basePrice: number;
    isReturnable: boolean;
    newImages: ProductImageFile[];
    keepImageUrls: string[];
}

interface ProductImageFile {
    name: string;
    size: number;
    type: string;
    preview: string;
    file: File;
}

interface EditAccessoryVariantDialogProps {
    open: boolean;
    onClose: () => void;
    onSaved?: (variantId: string, data: EditAccessoryVariantFormData) => void;
    variant: AccessoryVariantResponse;
    shopId: string;
    accessoryId: string;
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

const buildDefaultForm = (variant: AccessoryVariantResponse): EditAccessoryVariantFormData => ({
    color: variant.color ?? '',
    size: variant.size ?? '',
    isFeatured: variant.productResponse?.isFeatured ?? false,
    stock: variant.productResponse?.stockQuantity ?? variant.stock ?? 0,
    stockThreshold: variant.stockThreshold ?? 0,
    warrantyMonths: variant.productResponse?.warrantyMonths ?? 0,
    costPrice: variant.costPrice ?? variant.productResponse?.costPrice ?? 0,
    basePrice: variant.basePrice ?? variant.productResponse?.basePrice ?? 0,
    isReturnable: variant.productResponse?.isReturnable ?? false,
    newImages: [],
    keepImageUrls: [...(variant.productResponse?.productImages ?? [])],
});

// ─── Component ────────────────────────────────────────────────────────────────

const EditAccessoryVariantDialog = ({
    open,
    onClose,
    onSaved,
    variant,
    shopId,
    accessoryId,
}: EditAccessoryVariantDialogProps) => {
    const theme = useTheme();

    const [formData, setFormData] = useState<EditAccessoryVariantFormData>(() => buildDefaultForm(variant));
    const [errors, setErrors] = useState<Partial<Record<keyof EditAccessoryVariantFormData, string>>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData(buildDefaultForm(variant));
            setErrors({});
        }
    }, [open, variant]);

    const setField = <K extends keyof EditAccessoryVariantFormData>(
        field: K,
        value: EditAccessoryVariantFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const e: Partial<Record<keyof EditAccessoryVariantFormData, string>> = {};
        if (!formData.basePrice || Number(formData.basePrice) <= 0)
            e.basePrice = 'Base price must be greater than 0';
        if (!formData.stock || Number(formData.stock) <= 0)
            e.stock = 'Stock must be greater than 0';
        const totalImages = formData.keepImageUrls.length + formData.newImages.length;
        if (totalImages === 0) e.newImages = 'Please keep or upload at least 1 image';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = new FormData();
            payload.append('accessoryId', accessoryId);
            payload.append('shopId', shopId);
            if (formData.color) payload.append('color', formData.color);
            if (formData.size) payload.append('size', formData.size);
            payload.append('isFeatured', String(formData.isFeatured));
            payload.append('stock', String(formData.stock));
            if (formData.stockThreshold) payload.append('stockThreshold', String(formData.stockThreshold));
            if (formData.warrantyMonths) payload.append('warrantyMonths', String(formData.warrantyMonths));
            if (formData.costPrice) payload.append('costPrice', String(formData.costPrice));
            payload.append('basePrice', String(formData.basePrice));
            payload.append('isReturnable', String(formData.isReturnable));
            formData.keepImageUrls.forEach(url => payload.append('keepImageUrls', url));
            formData.newImages.forEach(img => { if (img.file) payload.append('productImages', img.file); });

            // TODO: await AccessoryAPI.updateAccessoryVariant(variant.id, payload);
            toast.success('Accessory variant updated successfully!');
            onSaved?.(variant.id, formData);
            onClose();
        } catch (error: any) {
            const msgs: string[] = error?.errors ?? [];
            if (msgs.length) msgs.forEach(m => toast.error(m));
            else toast.error('Cannot save variant!');
        } finally {
            setLoading(false);
        }
    };

    const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const maxNew = 4 - formData.keepImageUrls.length;
        const newImages: ProductImageFile[] = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .slice(0, maxNew)
            .map(file => ({
                name: file.name, size: file.size, type: file.type,
                preview: URL.createObjectURL(file), file,
            }));
        setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...newImages].slice(0, maxNew) }));
        if (errors.newImages) setErrors(prev => ({ ...prev, newImages: undefined }));
        e.target.value = '';
    };

    const totalImages = formData.keepImageUrls.length + formData.newImages.length;
    const canAddMore = totalImages < 4;

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            '& fieldset': { borderColor: theme.palette.custom.border.light },
        },
    };

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            maxWidth="sm"
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
            {/* Title */}
            <DialogTitle
                sx={{
                    px: 3, py: 2,
                    borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ViewModuleIcon sx={{ color: theme.palette.primary.main }} />
                    <Box>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                            Edit Accessory Variant
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

            {/* Content */}
            <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>
                {/* Color & Size */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Color & Size
                </Typography>
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Color"
                            value={formData.color}
                            onChange={e => setField('color', e.target.value)}
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Size"
                            value={formData.size}
                            onChange={e => setField('size', e.target.value)}
                            size="small"
                            placeholder="e.g. S, M, L or Free size"
                            sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={<Switch checked={formData.isFeatured} onChange={e => setField('isFeatured', e.target.checked)} />}
                            label="Is Featured"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Inventory & Pricing */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 2 }}>
                    Inventory & Pricing
                </Typography>
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth required label="Stock" type="number"
                            value={formData.stock}
                            onChange={e => setField('stock', parseNumber(e.target.value))}
                            error={!!errors.stock} helperText={errors.stock}
                            inputProps={{ min: 0 }} size="small" sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth label="Stock Threshold" type="number"
                            value={formData.stockThreshold}
                            onChange={e => setField('stockThreshold', parseNumber(e.target.value))}
                            helperText="Alert when stock falls below this"
                            inputProps={{ min: 0 }} size="small" sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth label="Warranty (months)" type="number"
                            value={formData.warrantyMonths}
                            onChange={e => setField('warrantyMonths', parseNumber(e.target.value))}
                            inputProps={{ min: 0 }} size="small" sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth label="Cost Price" type="text"
                            value={formatNumber(formData.costPrice)}
                            onChange={e => setField('costPrice', parseNumber(e.target.value))}
                            InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                            size="small" sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth required label="Base Price" type="text"
                            value={formatNumber(formData.basePrice)}
                            onChange={e => setField('basePrice', parseNumber(e.target.value))}
                            error={!!errors.basePrice} helperText={errors.basePrice}
                            InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
                            size="small" sx={fieldSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControlLabel
                            control={<Switch checked={formData.isReturnable} onChange={e => setField('isReturnable', e.target.checked)} />}
                            label="Is Returnable"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Images */}
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                    Product Images
                </Typography>
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500], mb: 2 }}>
                    Keep or replace images. Total max 4.
                </Typography>

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
                                    p: 1.5, mb: 1, borderRadius: 2,
                                    border: `1px solid ${theme.palette.custom.border.light}`,
                                    display: 'flex', alignItems: 'center', gap: 2,
                                }}
                            >
                                <Avatar variant="rounded" src={url} sx={{ width: 48, height: 48, borderRadius: 1 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[600] }}>Image {index + 1}</Typography>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                                        {url.split('/').pop()}
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, keepImageUrls: prev.keepImageUrls.filter(u => u !== url) }))} sx={{ color: theme.palette.custom.status.error.main }}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                )}

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
                                    p: 1.5, mb: 1, borderRadius: 2,
                                    border: `1px solid ${theme.palette.primary.main}30`,
                                    bgcolor: `${theme.palette.primary.main}05`,
                                    display: 'flex', alignItems: 'center', gap: 2,
                                }}
                            >
                                <Avatar variant="rounded" src={file.preview} sx={{ width: 48, height: 48, borderRadius: 1 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{file.name}</Typography>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>{formatFileSize(file.size)}</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, newImages: prev.newImages.filter((_, i) => i !== index) }))} sx={{ color: theme.palette.custom.status.error.main }}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                )}

                {canAddMore && (
                    <>
                        <input type="file" id="acc-edit-image-upload" multiple accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleNewImageUpload} />
                        <label htmlFor="acc-edit-image-upload">
                            <UploadArea sx={errors.newImages ? { borderColor: theme.palette.error.main } : {}}>
                                <CloudUpload sx={{ fontSize: 36, color: theme.palette.custom.neutral[400], mb: 1 }} />
                                <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[700] }}>Click to add images</Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>JPG, PNG · {totalImages}/4 uploaded</Typography>
                            </UploadArea>
                        </label>
                    </>
                )}
                {errors.newImages && <Typography color="error" fontSize={12} sx={{ mt: 1 }}>{errors.newImages}</Typography>}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, borderTop: `1px solid ${theme.palette.custom.border.light}`, flexShrink: 0 }}>
                <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500, fontSize: 13, minWidth: 90 }}>
                    Cancel
                </Button>
                <Button
                    variant="contained" onClick={handleSave} disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Save sx={{ fontSize: 16 }} />}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 130, bgcolor: theme.palette.primary.main }}
                >
                    {loading ? 'Saving...' : 'Save changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditAccessoryVariantDialog;
export type { EditAccessoryVariantDialogProps };