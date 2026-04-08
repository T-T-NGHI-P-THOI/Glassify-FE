import {
    Box,
    Typography,
    Paper,
    IconButton,
    Avatar,
    Button,
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
import { Delete, CloudUpload, Refresh } from '@mui/icons-material';
import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ProductAPI from '@/api/product-api';
import { ThreeJsService } from '@/services/ThreeJsService';
import type { Model3DFile, Upload3DModelPageRef } from './Upload3DModel';
import { toast } from 'react-toastify';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImage {
    name: string;
    size: number;
    type: string;
    preview?: string;
    file?: File;
}

export interface TextureFile {
    name: string;
    size: number;
    preview: string;
    file: File;
}

export interface CreateFrameVariantFormData {
    colorName: string;
    colorHex: string;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | '';
    frameWidthMm: string;
    lensWidthMm: string;
    lensHeightMm: string;
    bridgeWidthMm: string;
    templeLengthMm: string;
    stock: string;
    stockThreshold: string;
    warrantyMonths: string;
    costPrice: string;
    basePrice: string;
    compareAtPrice: string;
    isReturnable: boolean;
    isFeatured: boolean;
    images: ProductImage[];
    textureFile: TextureFile | null;
}

export interface CreateFrameVariantPageRef {
    submit: () => Promise<void>;
}

interface CreateFrameVariantPageProps {
    shopId?: string;
    frameGroupId?: string;
    initialData?: Partial<CreateFrameVariantFormData>;
    onCreated?: (variantId: string, productId: string, data: CreateFrameVariantFormData) => void;
    upload3DModelRef?: React.RefObject<Upload3DModelPageRef | null>;
    modelFile?: Model3DFile | null;
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
    stock: '',
    stockThreshold: '',
    warrantyMonths: '',
    costPrice: '',
    basePrice: '',
    compareAtPrice: '',
    isFeatured: false,
    isReturnable: false,
    images: [],
    textureFile: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

const CreateFrameVariantPage = forwardRef<CreateFrameVariantPageRef, CreateFrameVariantPageProps>(
    ({ shopId, frameGroupId, initialData, onCreated, upload3DModelRef, modelFile }, ref) => {
        const theme = useTheme();

        const [formData, setFormData] = useState<CreateFrameVariantFormData>({
            ...DEFAULT_FORM,
            ...initialData,
        });

        const [errors, setErrors] = useState<Partial<Record<keyof CreateFrameVariantFormData, string>>>({});
        const [loading, setLoading] = useState(false);
        const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);

        // ── Local Three.js viewer ─────────────────────────────────────────────
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const cleanupRef = useRef<(() => void) | null>(null);
        const threeServiceRef = useRef<ThreeJsService | null>(null);

        useEffect(() => {
            const fetchColors = async () => {
                try {
                    const response = await ProductAPI.getColors();
                    console.log(response)
                    setColors(response);
                } catch (error) {
                    toast.error("Cannot load color!")
                }
            };
            fetchColors();
        }, []);

        useEffect(() => {
            if (!modelFile?.file) return;

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

                // Nếu đã có texture khi viewer khởi (restore từ back), apply luôn
                if (formData.textureFile?.file) {
                    setTimeout(() => {
                        if (service.viewerModel) {
                            service.applyTextureToModel(service.viewerModel, formData.textureFile!.file);
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
                for (const entry of entries) {
                    const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0];
                    startViewer(Math.round(w), Math.round(h));
                    if (initialized) {
                        observer.disconnect();
                        break;
                    }
                }
            });
            observer.observe(container);

            return () => {
                observer.disconnect();
                cleanupRef.current?.();
                cleanupRef.current = null;
                threeServiceRef.current = null;
            };
        }, [modelFile]);

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
            if (!formData.stock || Number(formData.stock) <= 0)
                e.stock = 'Stock must be greater than 0';
            if (formData.images.length === 0)
                e.images = 'Please upload at least 1 image';

            setErrors(e);
            return Object.keys(e).length === 0;
        };

        // ── Submit ────────────────────────────────────────────────────────────

        const handleSubmit = async () => {
            if (!validate()) throw new Error('Validation failed');
            if (!frameGroupId) throw new Error('frameGroupId is missing');

            setLoading(true);
            try {
                const payload = new FormData();

                payload.append('frameGroupId', frameGroupId);
                payload.append('shopId', shopId ?? '');
                payload.append('colorName', formData.colorName.trim());
                payload.append('colorHex', formData.colorHex);
                payload.append('size', formData.size);

                if (formData.frameWidthMm) payload.append('frameWidthMm', formData.frameWidthMm);
                if (formData.lensWidthMm) payload.append('lensWidthMm', formData.lensWidthMm);
                if (formData.lensHeightMm) payload.append('lensHeightMm', formData.lensHeightMm);
                if (formData.bridgeWidthMm) payload.append('bridgeWidthMm', formData.bridgeWidthMm);
                if (formData.templeLengthMm) payload.append('templeLengthMm', formData.templeLengthMm);

                if (formData.stock) payload.append('stock', formData.stock);
                if (formData.stockThreshold) payload.append('stockThreshold', formData.stockThreshold);
                if (formData.warrantyMonths) payload.append('warrantyMonths', formData.warrantyMonths);

                if (formData.costPrice) payload.append('costPrice', formData.costPrice);
                if (formData.basePrice) payload.append('basePrice', formData.basePrice);
                if (formData.compareAtPrice) payload.append('compareAtPrice', formData.compareAtPrice);

                payload.append('isReturnable', String(formData.isReturnable));
                payload.append('isFeatured', String(formData.isFeatured));

                formData.images.forEach(img => {
                    if (img.file) payload.append('productImages', img.file);
                });

                if (formData.textureFile?.file) {
                    payload.append('textureFile', formData.textureFile.file);
                }

                const response = await ProductAPI.createFrameVariant(payload);
                onCreated?.(response.id, response.productId, formData);
                toast.success("Save frame variant success!");
            }
            catch (error: any) {
                error?.errors.map((err: any) => {
                    toast.error(err);
                })
                throw new Error("Cannot save frame variant!")
            }
            finally {
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
                images: [...prev.images, ...newImages].slice(0, 4),
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

        // ── Texture handlers ──────────────────────────────────────────────────

        const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, textureFile: 'Invalid type. Accepted: PNG, JPG, WEBP' }));
                e.target.value = '';
                return;
            }

            const preview = URL.createObjectURL(file);
            const texture: TextureFile = { name: file.name, size: file.size, preview, file };
            setField('textureFile', texture);

            // Apply vào local viewer (Step 1)
            const service = threeServiceRef.current;
            if (service?.viewerModel) {
                service.applyTextureToModel(service.viewerModel, file);
            }

            // Apply vào viewer Step 0 nếu vẫn còn mount
            upload3DModelRef?.current?.applyTexture(file);

            e.target.value = '';
        };

        const handleRemoveTexture = () => {
            setField('textureFile', null);
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
                            select
                            fullWidth
                            required
                            label="Color Name"
                            value={formData.colorName}
                            onChange={(e) => {
                                const selectedName = e.target.value;
                                const selectedColor = colors.find(c => c.name === selectedName);

                                setField("colorName", selectedName);

                                // auto set hex khi chọn
                                if (selectedColor) {
                                    setField("colorHex", selectedColor.hex);
                                }
                            }}
                            error={!!errors.colorName}
                            helperText={errors.colorName}
                        >
                            {colors?.map((color) => (
                                <MenuItem key={color.name} value={color.name}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {/* preview màu */}
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "50%",
                                                backgroundColor: color.hex,
                                                border: "1px solid #ccc"
                                            }}
                                        />
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
                            InputProps={{
                                endAdornment:
                                    (<InputAdornment position="end">
                                        <input type="color" value={formData.colorHex}
                                            onChange={e => setField('colorHex', e.target.value)}
                                            style={{ width: 28, height: 28, border: 'none', borderRadius: 100, padding: 0, cursor: 'pointer', background: 'none', }} />
                                    </InputAdornment>),
                            }} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required error={!!errors.size}>
                            <InputLabel>Frame Size</InputLabel>
                            <Select
                                value={formData.size}
                                label="Frame Size"
                                onChange={e => setField('size', e.target.value as 'SMALL' | 'MEDIUM' | 'LARGE')}
                            >
                                <MenuItem value="SMALL">Small</MenuItem>
                                <MenuItem value="MEDIUM">Medium</MenuItem>
                                <MenuItem value="LARGE">Large</MenuItem>
                            </Select>
                            {errors.size && (
                                <Typography color="error" fontSize={12} sx={{ mt: 0.5, ml: 1.5 }}>
                                    {errors.size}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
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
                    <UploadArea sx={errors.images ? { borderColor: theme.palette.error.main } : {}}>
                        <CloudUpload sx={{ fontSize: 48, color: theme.palette.custom.neutral[400], mb: 2 }} />
                        <Typography sx={{ fontSize: 16, fontWeight: 500, color: theme.palette.custom.neutral[700], mb: 1 }}>
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
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 2 }}>
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
                                    sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: theme.palette.grey[100] }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800] }}>
                                        {file.name}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
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

                <Divider sx={{ my: 4 }} />

                {/* ── Texture Map + 3D Viewer ── */}
                <Typography
                    sx={{
                        fontSize: 16,
                        fontWeight: 600,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <ViewInArIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                    Texture Map
                    <Typography
                        component="span"
                        sx={{ fontSize: 13, fontWeight: 400, color: theme.palette.custom.neutral[500], ml: 0.5 }}
                    >
                        (optional — PNG, JPG, WEBP)
                    </Typography>
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
                    {modelFile
                        ? 'Upload a texture to apply onto the 3D model below.'
                        : 'No 3D model uploaded in the previous step.'}
                </Typography>

                {/* Texture upload / preview */}
                {!formData.textureFile ? (
                    <>
                        <input
                            type="file"
                            id="texture-upload"
                            accept=".png,.jpg,.jpeg,.webp"
                            style={{ display: 'none' }}
                            onChange={handleTextureUpload}
                        />
                        <label htmlFor="texture-upload">
                            <UploadArea
                                sx={{
                                    py: 3,
                                    ...(errors.textureFile ? { borderColor: theme.palette.error.main } : {}),
                                }}
                            >
                                <CloudUpload sx={{ fontSize: 36, color: theme.palette.custom.neutral[400], mb: 1 }} />
                                <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[600] }}>
                                    Click to upload texture
                                </Typography>
                            </UploadArea>
                        </label>
                        {errors.textureFile && (
                            <Typography color="error" fontSize={12} sx={{ mt: 1 }}>
                                {errors.textureFile}
                            </Typography>
                        )}
                    </>
                ) : (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
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
                            src={formData.textureFile.preview}
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 1,
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: `1px solid ${theme.palette.custom.border.light}`,
                            }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.custom.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {formData.textureFile.name}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                {formatFileSize(formData.textureFile.size)}
                            </Typography>
                        </Box>

                        <label htmlFor="texture-upload" style={{ cursor: 'pointer' }}>
                            <input
                                type="file"
                                id="texture-upload"
                                accept=".png,.jpg,.jpeg,.webp"
                                style={{ display: 'none' }}
                                onChange={handleTextureUpload}
                            />
                            <Button
                                component="span"
                                size="small"
                                variant="outlined"
                                startIcon={<Refresh sx={{ fontSize: 16 }} />}
                                sx={{ fontSize: 13, textTransform: 'none', mr: 1 }}
                            >
                                Replace
                            </Button>
                        </label>

                        <IconButton
                            size="small"
                            onClick={handleRemoveTexture}
                            sx={{ color: theme.palette.custom.status.error.main }}
                        >
                            <Delete />
                        </IconButton>
                    </Paper>
                )}

                {/* ── Local 3D viewer — chỉ hiện khi có modelFile ── */}
                {modelFile?.file && (
                    <Box
                        ref={containerRef}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: `1px solid ${theme.palette.custom.border.light}`,
                            position: 'relative',
                            width: '100%',
                            height: 380,
                            mt: 2,
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />

                        {/* Texture badge */}
                        {formData.textureFile && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 10,
                                    left: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: 'rgba(0,0,0,0.5)',
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 0.5,
                                    pointerEvents: 'none',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={formData.textureFile.preview}
                                    sx={{ width: 18, height: 18, borderRadius: 0.5, objectFit: 'cover' }}
                                />
                                <Typography sx={{ fontSize: 11, color: '#fff' }}>
                                    {formData.textureFile.name}
                                </Typography>
                            </Box>
                        )}

                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 12,
                                right: 14,
                                bgcolor: 'rgba(0,0,0,0.45)',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                                pointerEvents: 'none',
                            }}
                        >
                            <Typography sx={{ fontSize: 11, color: '#fff' }}>
                                Drag to rotate · Scroll to zoom
                            </Typography>
                        </Box>
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