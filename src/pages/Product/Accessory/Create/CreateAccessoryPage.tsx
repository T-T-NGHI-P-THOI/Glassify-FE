import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    CircularProgress,
    TextField,
    MenuItem,
    Grid,
    Divider,
    FormControlLabel,
    Switch,
    InputAdornment,
    Avatar,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    ArrowBack,
    CheckCircle,
    CloudUpload,
    Delete,
    Save,
    Category,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGE_ENDPOINTS } from '@/api/endpoints';
import { ShopOwnerSidebar } from '@/components/sidebar/ShopOwnerSidebar';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useAuth } from '@/hooks/useAuth';
import { shopApi } from '@/api/shopApi';
import type { ShopDetailResponse } from '@/models/Shop';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '@/utils/formatCurrency';
import ProductAPI from '@/api/product-api';
import { ProductSize } from '@/types/product.enums';
import { sanitizeTextInput } from '@/utils/text-input';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAccessoryFormData {
    name: string;
    type: string;
    description: string;
}

export interface CreateAccessoryVariantFormData {
    name: string;
    color: string;
    colorHex: string;
    size: ProductSize;
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

// ─── Options ──────────────────────────────────────────────────────────────────

export const ACCESSORY_TYPES = [
    { value: 'CASE', label: 'Case' },
    { value: 'STRAP', label: 'Strap' },
    { value: 'LENS_CLOTH', label: 'Lens Cloth' },
    { value: 'CHAIN', label: 'Chain' },
    { value: 'RETAINER', label: 'Retainer' },
    { value: 'REPAIR_KIT', label: 'Repair Kit' },
    { value: 'OTHER', label: 'Other' },
];

// ─── Styled ───────────────────────────────────────────────────────────────────

const CustomConnector = styled(StepConnector)(({ theme }) => ({
    '& .MuiStepConnector-line': {
        borderColor: theme.palette.custom.border.light,
        borderTopWidth: 2,
    },
    '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
        borderColor: theme.palette.custom.status.success.main,
    },
}));

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

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const registrationSteps = [
    { label: 'Accessory Info', key: 'ACCESSORY_INFO' },
    { label: 'Accessory Variant', key: 'VARIANT' },
    { label: 'Review & Submit', key: 'REVIEW' },
];

// ─── Step 0: Accessory Info ───────────────────────────────────────────────────

interface Step0Props {
    formData: CreateAccessoryFormData;
    setFormData: React.Dispatch<React.SetStateAction<CreateAccessoryFormData>>;
    errors: Partial<Record<keyof CreateAccessoryFormData, string>>;
}

const Step0AccessoryInfo = ({ formData, setFormData, errors }: Step0Props) => {
    const theme = useTheme();
    const fieldSx = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.palette.custom.border.light } },
    };

    const handleInputChange =
        (field: keyof CreateAccessoryFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setFormData(prev => ({ ...prev, [field]: sanitizeTextInput(e.target.value, { maxLength: 1000 }) }));
            };

    return (
        <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Category sx={{ color: theme.palette.primary.main }} />
                Accessory Information
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth required label="Accessory Name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: sanitizeTextInput(e.target.value, { maxLength: 150 }) }))}
                        error={!!errors.name} helperText={errors.name}
                        placeholder="Enter accessory name"
                        inputProps={{ minLength: 3, maxLength: 150 }}
                        InputProps={{ startAdornment: <Category sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> }}
                        sx={fieldSx}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        select fullWidth required label="Accessory Type"
                        value={formData.type}
                        onChange={e => setFormData(prev => ({ ...prev, type: sanitizeTextInput(e.target.value, { maxLength: 50 }) }))}
                        error={!!errors.type} helperText={errors.type}
                        sx={fieldSx}
                    >
                        {ACCESSORY_TYPES.map(t => (
                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                        ))}
                    </TextField>
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
        </Box>
    );
};

// ─── Step 1: Variant ──────────────────────────────────────────────────────────

interface Step1Props {
    formData: CreateAccessoryVariantFormData;
    setFormData: React.Dispatch<React.SetStateAction<CreateAccessoryVariantFormData>>;
    errors: Partial<Record<keyof CreateAccessoryVariantFormData, string>>;
    setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof CreateAccessoryVariantFormData, string>>>>;
}

const Step1Variant = ({ formData, setFormData, errors, setErrors }: Step1Props) => {
    const theme = useTheme();
    const fieldSx = {
        '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.palette.custom.border.light } },
    };
    const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
    useEffect(() => {
        const fetchColors = async () => {
            try {
                const response = await ProductAPI.getColors();
                setColors(response);
            } catch (error) {
                toast.error("Cannot load color!")
            }
        };
        fetchColors();
    }, []);


    const setField = <K extends keyof CreateAccessoryVariantFormData>(field: K, value: CreateAccessoryVariantFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newImages: ProductImageFile[] = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .slice(0, 4 - formData.productImages.length)
            .map(file => ({ name: file.name, size: file.size, type: file.type, preview: URL.createObjectURL(file), file }));
        setFormData(prev => ({ ...prev, productImages: [...prev.productImages, ...newImages].slice(0, 4) }));
        if (errors.productImages) setErrors(prev => ({ ...prev, productImages: undefined }));
        e.target.value = '';
    };

    return (
        <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 3 }}>
                Variant Information
            </Typography>

            <Grid container spacing={3}>
                {/* ── Name & Size── */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth required label="Variant Name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        error={!!errors.name} helperText={errors.name}
                        placeholder="Enter accessory name"
                        inputProps={{ minLength: 3, maxLength: 150 }}
                        InputProps={{ startAdornment: <Category sx={{ mr: 1, color: theme.palette.custom.neutral[400] }} /> }}
                        sx={fieldSx}
                    />
                </Grid>

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
                {/* ── Color & Size ── */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        select
                        fullWidth
                        required
                        label="Color Name"
                        value={formData.color}
                        onChange={(e) => {
                            const selectedName = e.target.value;
                            const selectedColor = colors.find(c => c.name === selectedName);

                            setField("color", selectedName);

                            // auto set hex khi chọn
                            if (selectedColor) {
                                setField("colorHex", selectedColor.hex);
                            }
                        }}
                        error={!!errors.color}
                        helperText={errors.color}
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
                    <FormControlLabel control={<Switch checked={formData.isFeatured} onChange={e => setField('isFeatured', e.target.checked)} />} label="Is Featured" />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>Inventory & Pricing</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth required label="Stock" type="number" value={formData.stock} onChange={e => setField('stock', parseNumber(e.target.value))} error={!!errors.stock} helperText={errors.stock} inputProps={{ min: 0 }} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Stock Threshold" type="number" value={formData.stockThreshold} onChange={e => setField('stockThreshold', parseNumber(e.target.value))} helperText="Alert when stock falls below this" inputProps={{ min: 0 }} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Warranty (months)" type="number" value={formData.warrantyMonths} onChange={e => setField('warrantyMonths', parseNumber(e.target.value))} inputProps={{ min: 0 }} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Cost Price" type="text" value={formatNumber(formData.costPrice)} onChange={e => setField('costPrice', parseNumber(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth required label="Base Price" type="text" value={formatNumber(formData.basePrice)} onChange={e => setField('basePrice', parseNumber(e.target.value))} error={!!errors.basePrice} helperText={errors.basePrice} InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel control={<Switch checked={formData.isReturnable} onChange={e => setField('isReturnable', e.target.checked)} />} label="Is Returnable" />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>Product Images</Typography>
            <Typography sx={{ fontSize: 14, color: theme.palette.custom.neutral[500], mb: 3 }}>
                At least 1 image, max 4. Accepted: PNG, JPG
            </Typography>

            <input type="file" id="acc-create-step-image" multiple accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileUpload} />
            {formData.productImages.length < 4 && (
                <label htmlFor="acc-create-step-image">
                    <UploadArea sx={errors.productImages ? { borderColor: theme.palette.error.main } : {}}>
                        <CloudUpload sx={{ fontSize: 48, color: theme.palette.custom.neutral[400], mb: 2 }} />
                        <Typography sx={{ fontSize: 16, fontWeight: 500, color: theme.palette.custom.neutral[700], mb: 1 }}>
                            Drag and drop files here or click to browse
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>
                            JPG, PNG up to 5 MB · {formData.productImages.length}/4 uploaded
                        </Typography>
                    </UploadArea>
                </label>
            )}
            {errors.productImages && <Typography color="error" fontSize={12} sx={{ mt: 1 }}>{errors.productImages}</Typography>}

            {formData.productImages.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    {formData.productImages.map((file, index) => (
                        <Paper key={index} elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar variant="rounded" src={file.preview} sx={{ width: 56, height: 56, borderRadius: 1 }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{file.name}</Typography>
                                <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>{formatFileSize(file.size)}</Typography>
                            </Box>
                            <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, images: prev.productImages.filter((_, i) => i !== index) }))} sx={{ color: theme.palette.custom.status.error.main }}>
                                <Delete />
                            </IconButton>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
};

// ─── Step 2: Review ───────────────────────────────────────────────────────────

interface Step2Props {
    groupData: CreateAccessoryFormData;
    variantData: CreateAccessoryVariantFormData;
}

const Step2Review = ({ groupData, variantData }: Step2Props) => {
    const theme = useTheme();

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: theme.palette.custom.status.success.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Review & Submit</Typography>
                    <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>Please review all information before submitting</Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Accessory Info</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {[{ label: 'Name', value: groupData.name }, { label: 'Type', value: groupData.type }].map(({ label, value }) => (
                            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>{label}</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Variant Info</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {[
                            { label: 'Color', value: variantData.color },
                            { label: 'Size', value: variantData.size },
                            { label: 'Base Price', value: variantData.basePrice ? variantData.basePrice.toLocaleString('vi-VN') + '₫' : '—' },
                            { label: 'Stock', value: variantData.stock ? variantData.stock + ' units' : '—' },
                        ].map(({ label, value }) => (
                            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[500] }}>{label}</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{value || '—'}</Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                {variantData.productImages.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>Product Images</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                {variantData.productImages.map((img, i) => (
                                    <Avatar
                                        key={i}
                                        variant="rounded"
                                        src={img.preview}
                                        sx={{ width: 100, height: 80, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}
                                    />
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

// ─── Main CreateAccessoryPage ─────────────────────────────────────────────────

const CreateAccessoryPage = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [shop, setShop] = useState<ShopDetailResponse | null>(null);
    const [accessoryId, setAccessoryId] = useState('');

    const [groupData, setGroupData] = useState<CreateAccessoryFormData>({ name: '', type: '', description: '' });
    const [groupErrors, setGroupErrors] = useState<Partial<Record<keyof CreateAccessoryFormData, string>>>({});

    const [variantData, setVariantData] = useState<CreateAccessoryVariantFormData>({
        name: '', color: '', colorHex: '', size: ProductSize.MEDIUM, isFeatured: false,
        stock: 0, stockThreshold: 0, warrantyMonths: 0,
        costPrice: 0, basePrice: 0, isReturnable: false, productImages: [],
    });
    const [variantErrors, setVariantErrors] = useState<Partial<Record<keyof CreateAccessoryVariantFormData, string>>>({});

    useLayoutConfig({ showNavbar: false, showFooter: false });

    useEffect(() => {
        (async () => {
            try {
                const shopRes = await shopApi.getMyShops();
                setShop(shopRes.data?.[0] ?? null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toFormData = (data: Record<string, any>) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (key === 'productImages' && Array.isArray(value)) {
                    value.forEach((img: ProductImageFile) => {
                        formData.append('productImages', img.file);
                    });
                } else {
                    formData.append(key, value);
                }
            }
        });

        return formData;
    };

    const validateStep0 = () => {
        const e: typeof groupErrors = {};
        if (!groupData.name.trim() || groupData.name.trim().length < 3) e.name = 'Name must be at least 3 characters';
        if (!groupData.type) e.type = 'Please select a type';
        setGroupErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep1 = () => {
        const e: typeof variantErrors = {};
        if (!variantData.basePrice || Number(variantData.basePrice) <= 0) e.basePrice = 'Base price must be greater than 0';
        if (!variantData.stock || Number(variantData.stock) <= 0) e.stock = 'Stock must be greater than 0';
        if (variantData.productImages.length === 0) e.productImages = 'Please upload at least 1 image';
        setVariantErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = async () => {
        try {
            if (activeStep === 0) {
                if (!validateStep0()) return;

                const payload = toFormData(groupData);
                if (shop?.id) payload.append("shopId", shop.id);
                const response = await ProductAPI.createAccessory(payload);

                console.log("API Res:", response.id)
                setAccessoryId(response.id);
                toast.success('Accessory info saved!');
            } else if (activeStep === 1) {
                if (!validateStep1()) return;

                const payload = toFormData(variantData);
                if (shop?.id) payload.append("shopId", shop.id);
                if (accessoryId) payload.append("accessoryId", accessoryId);
                await ProductAPI.createAccessoryVariant(payload)

                toast.success('Variant saved!');
            }
            setActiveStep(prev => Math.min(prev + 1, registrationSteps.length - 1));
        }
        catch (err: any) {
            err?.errors.map((message: any) => toast.error(message))
        }
    };

    const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        navigate(PAGE_ENDPOINTS.SHOP.PRODUCT_ACCESSORY ?? PAGE_ENDPOINTS.SHOP.PRODUCTS);
    };

    const sidebarProps = {
        activeMenu: PAGE_ENDPOINTS.SHOP.PRODUCTS,
        shopName: shop?.shopName,
        shopLogo: shop?.logoUrl,
        ownerName: user?.fullName,
        ownerEmail: user?.email,
        ownerAvatar: user?.avatarUrl,
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50] }}>
                <ShopOwnerSidebar {...sidebarProps} />
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.custom.neutral[50], display: 'flex' }}>
            <ShopOwnerSidebar {...sidebarProps} />

            <Box sx={{ maxWidth: 1000, mx: 'auto', p: 4, flex: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.custom.neutral[800] }}>
                        Add new Accessory
                    </Typography>
                </Box>

                {/* Stepper */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                    <Stepper activeStep={activeStep} connector={<CustomConnector />} alternativeLabel>
                        {registrationSteps.map((step, index) => (
                            <Step key={step.key} completed={index < activeStep}>
                                <StepLabel
                                    StepIconComponent={() => (
                                        <Box
                                            sx={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: index <= activeStep ? theme.palette.custom.status.success.main : theme.palette.custom.border.light,
                                                color: index <= activeStep ? theme.palette.primary.contrastText : theme.palette.custom.neutral[400],
                                                fontSize: 14, fontWeight: 600,
                                            }}
                                        >
                                            {index < activeStep ? <CheckCircle sx={{ fontSize: 20 }} /> : index + 1}
                                        </Box>
                                    )}
                                >
                                    <Typography sx={{ fontSize: 13, fontWeight: index <= activeStep ? 600 : 400, color: index <= activeStep ? theme.palette.custom.neutral[800] : theme.palette.custom.neutral[400] }}>
                                        {step.label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Paper>

                {/* Form */}
                <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: `1px solid ${theme.palette.custom.border.light}` }}>
                    {activeStep === 0 && (
                        <Step0AccessoryInfo formData={groupData} setFormData={setGroupData} errors={groupErrors} />
                    )}
                    {activeStep === 1 && (
                        <Step1Variant formData={variantData} setFormData={setVariantData} errors={variantErrors} setErrors={setVariantErrors} />
                    )}
                    {activeStep === 2 && (
                        <Step2Review groupData={groupData} variantData={variantData} />
                    )}

                    {/* Navigation */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.custom.border.light}` }}>
                        <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} sx={{ px: 4 }}>
                            Back
                        </Button>
                        {activeStep < registrationSteps.length - 1 ? (
                            <Button variant="contained" onClick={handleNext} sx={{ px: 4 }}>
                                Continue
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save />}
                                sx={{ px: 4, bgcolor: theme.palette.custom.status.success.main, '&:hover': { bgcolor: '#15803d' } }}
                            >
                                Submit
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default CreateAccessoryPage;