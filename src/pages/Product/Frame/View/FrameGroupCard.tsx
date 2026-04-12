import {
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Inventory,
    Visibility,
    Edit,
    DeleteOutline,
    KeyboardArrowDown,
    KeyboardArrowUp,
    InfoOutlined,
    BarChart,
    ViewInAr,
    Inventory2,
} from '@mui/icons-material';
import { useState } from 'react';
import type { CreateFrameVariantFormData } from '../Create/CreateFrameVariantPage';
import FrameVariantDetailDialog from '../View/FrameVariantDetailDialog';
import CreateFrameVariantPopup from '../Create/CreateFrameVariantPopup';
import ProductAPI from '@/api/product-api';
import EditFrameVariantDialog, { type EditFrameVariantFormData } from '../Edit/EditFrameVariantDialog';

// ─── Types (re-used from FrameProductPage) ────────────────────────────────────

export interface FrameVariantResponse {
    id: string;
    frameGroupId: string;
    colorName: string;
    colorHex: string;
    frameWidthMm: number;
    lensWidthMm: number;
    lensHeightMm: number;
    bridgeWidthMm: number;
    templeLengthMm: number;
    size: 'SMALL' | 'MEDIUM' | 'LARGE' | string;
    isActive: boolean | null;
    productId: string | null;
    productName: string | null;
    slug: string | null;
    basePrice: number;
    costPrice: number;
    stock: number;
    stockThreshold: number;
    qtyOnHand: number;
    qtyReserved: number;
    qtyAvailable: number;
    lowStockThreshold: number;
    warrantyMonths: number;
    isReturnable: boolean;
    isFeatured: boolean;
    productResponse: ProductResponse;
    textureFile: string;
}

export interface ProductResponse {
    id: string;
    basePrice: number;
    costPrice: number;
    stockQuantity: number;
    isActive: boolean;
    isFeatured: boolean;
    isReturnable: boolean;
    warrantyMonths: number;
    viewCount: number;
    soldCount: number;
    avgRating: number;
    reviewCount: number;
    metaTitle: string;
    metaDescription: string;
    productType: string;
    productImages: string[];
    fileResponses: FileResponse[];
}

export interface FrameGroup {
    id: string;
    frameName: string;
    frameShape: string;
    frameStructure: string;
    frameMaterial: string;
    genderTarget: string;
    ageGroup: string;
    hasNosePads: boolean;
    hasSpringHinge: boolean;
    description: string;
    vrEnabled?: boolean;
    suitableFaceShapes: string[] | null;
    createdAt: string;
    frameVariantResponses: FrameVariantResponse[];
}

export interface FileResponse {
    id: string;
    productId: string;
    originalName: string;
    storedName: string;
    publicUrl: string;
    filePath: string | null;
    fileSize: number;
    mimeType: string;
    storageProvider: string;
    isPrimary: boolean | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 10;

function getVariantStatus(stock: number) {
    if (stock === 0) return 'out_of_stock' as const;
    if (stock <= LOW_STOCK_THRESHOLD) return 'low_stock' as const;
    return 'in_stock' as const;
}

const statusConfig = {
    in_stock: { label: 'In Stock', bg: '#dcfce7', color: '#16a34a' },
    low_stock: { label: 'Low Stock', bg: '#fef9c3', color: '#ca8a04' },
    out_of_stock: { label: 'Out of Stock', bg: '#fee2e2', color: '#dc2626' },
};

// ─── Variant Panel (expanded) ─────────────────────────────────────────────────

interface VariantPanelProps {
    frameGroupId: string;
    shopId: string;
    variants: FrameVariantResponse[];
    vrEnabled?: boolean;
    productImages: string[];
    setFrameGroups: React.Dispatch<React.SetStateAction<FrameGroup[]>>;
}

const VariantPanel = ({ frameGroupId, shopId, variants, vrEnabled, productImages, setFrameGroups }: VariantPanelProps) => {
    const theme = useTheme();
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<
        FrameVariantResponse | null
    >(null);
    const [addVariantOpen, setAddVariantOpen] = useState(false);
    const [updateVaraintOpen, setUpdateVaraintOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<FrameVariantResponse | null>(null);

    if (variants.length === 0) {
        return (
            <Box
                sx={{
                    mx: 2,
                    mb: 2,
                    py: 2.5,
                    borderRadius: 2,
                    bgcolor: theme.palette.custom.neutral[50],
                    border: `1px dashed ${theme.palette.custom.border.light}`,
                    textAlign: 'center',
                }}
            >
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                    No variants for this frame group
                </Typography>
            </Box>
        );
    }

    const handleVariantUpdated = (variantId: string, data: EditFrameVariantFormData) => {
        setFrameGroups(prev =>
            prev.map(group => ({
                ...group,
                frameVariantResponses: group.frameVariantResponses.map(v =>
                    v.id === variantId
                        ? {
                            ...v,
                            ...data,
                            qtyOnHand: data.stock,
                            lowStockThreshold: data.stockThreshold,
                            textureFile: data.newTextureFile?.preview ?? v.textureFile,
                            productResponse: {
                                ...v.productResponse,
                                productImages:
                                    data.newImages && data.newImages.length > 0
                                        ? data.newImages.map(file => file.preview)
                                        : v.productResponse.productImages,
                            }
                        }
                        : v
                )
            }))
        );
    };

    return (
        <>
            <Box
                sx={{
                    mx: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    overflow: 'hidden',
                    bgcolor: theme.palette.custom.neutral[50],
                }}
            >
                {/* Variant header */}
                <Box
                    sx={{
                        px: 1.5,
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        {variants.length} variant{variants.length > 1 ? 's' : ''}
                    </Typography>
                </Box>

                {/* Variant card grid */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        p: 1,
                        overflowX: 'auto', // nếu quá nhiều variant thì cuộn ngang
                    }}
                >
                    {variants.map((v) => {
                        const st = getVariantStatus(v.stock);
                        const sc = statusConfig[st];

                        return (
                            <Box
                                key={v.id}
                                sx={{
                                    bgcolor: theme.palette.background.paper,
                                    border: `0.5px solid ${theme.palette.custom.border.light}`,
                                    borderRadius: 1.5,
                                    p: 1.25,
                                    position: 'relative',
                                    transition: 'border-color 0.15s',
                                    '&:hover': {
                                        borderColor: theme.palette.custom.status.info.main + '60',
                                    },
                                }}
                            >
                                {/* Stock dot */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        bgcolor: sc.color,
                                    }}
                                />

                                {/* Color swatch + name */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                    <Box
                                        sx={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: '50%',
                                            bgcolor: v.colorHex,
                                            border: '1.5px solid rgba(0,0,0,0.12)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: theme.palette.custom.neutral[700],
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {v.colorName}
                                    </Typography>
                                    <Chip
                                        label={v.size}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: 9,
                                            fontWeight: 600,
                                            bgcolor: theme.palette.custom.neutral[100],
                                            color: theme.palette.custom.neutral[600],
                                            border: 'none',
                                            mr: 1.5,
                                            '& .MuiChip-label': { px: 0.5 },
                                        }}
                                    />
                                </Box>

                                {/* Price */}
                                <Box sx={{ mb: 0.5 }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                        {v.basePrice.toLocaleString('vi-VN')}₫
                                    </Typography>
                                </Box>

                                {/* Stock */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                        Stock: <Box component="span" sx={{ fontWeight: 600, color: sc.color }}>{v.stock}</Box>
                                    </Typography>
                                    <Chip
                                        label={sc.label}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: 9,
                                            fontWeight: 600,
                                            bgcolor: sc.bg,
                                            color: sc.color,
                                            border: 'none',
                                            '& .MuiChip-label': { px: 0.5 },
                                        }}
                                    />
                                </Box>

                                {/* Dimensions */}
                                <Tooltip title="Frame / Lens W×H / Bridge / Temple">
                                    <Typography
                                        sx={{
                                            fontSize: 9,
                                            fontFamily: 'monospace',
                                            color: theme.palette.custom.neutral[400],
                                            mb: 1,
                                            cursor: 'default',
                                        }}
                                    >
                                        {v.frameWidthMm} / {v.lensWidthMm}×{v.lensHeightMm} / {v.bridgeWidthMm} / {v.templeLengthMm}
                                    </Typography>
                                </Tooltip>

                                {/* Actions */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 0.5,
                                        pt: 0.75,
                                        borderTop: `0.5px solid ${theme.palette.custom.border.light}`,
                                    }}
                                >
                                    <Tooltip title="View detail">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedVariant(v);
                                                setDetailOpen(true);
                                            }}
                                            sx={{
                                                width: 22, height: 22, borderRadius: 0.75,
                                                bgcolor: theme.palette.custom.neutral[100],
                                                '&:hover': { bgcolor: theme.palette.custom.status.info.light },
                                                '&:hover .vi': { color: theme.palette.custom.status.info.main },
                                            }}
                                        >
                                            <InfoOutlined className="vi" sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit variant">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setEditingVariant(v);
                                                setUpdateVaraintOpen(true);
                                            }}
                                            sx={{
                                                width: 22, height: 22, borderRadius: 0.75,
                                                bgcolor: theme.palette.custom.neutral[100],
                                                '&:hover': { bgcolor: theme.palette.custom.status.info.light },
                                                '&:hover .ve': { color: theme.palette.custom.status.info.main },
                                            }}
                                        >
                                            <Edit className="ve" sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete variant">
                                        <IconButton
                                            size="small"
                                            sx={{
                                                width: 22, height: 22, borderRadius: 0.75,
                                                bgcolor: theme.palette.custom.status.error.light,
                                                '&:hover': { bgcolor: '#fecaca' },
                                            }}
                                        >
                                            <DeleteOutline sx={{ fontSize: 11, color: theme.palette.custom.status.error.main }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        );
                    })}

                    {/* ── Add Variant card ── */}
                    <Box
                        onClick={() => setAddVariantOpen(true)}
                        sx={{
                            bgcolor: theme.palette.custom.neutral[100],
                            border: `0.5px dashed ${theme.palette.custom.border.light}`,
                            borderRadius: 1.5,
                            p: 1.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                bgcolor: theme.palette.custom.neutral[50],
                            },
                            minHeight: 120,
                            minWidth: 50
                        }}
                    >
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.primary.main }}>
                            +
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {selectedVariant && (
                <FrameVariantDetailDialog
                    open={detailOpen}
                    onClose={() => { setDetailOpen(false); setSelectedVariant(null); }}
                    variant={selectedVariant}
                    modelFile={null}
                    vrEnabled={vrEnabled}
                />
            )}
            {addVariantOpen && (
                <CreateFrameVariantPopup
                    open={addVariantOpen}
                    frameGroupId={frameGroupId}
                    shopId={shopId}
                    onClose={() => setAddVariantOpen(false)}
                />
            )}

            {updateVaraintOpen && editingVariant && (
                <EditFrameVariantDialog
                    open={updateVaraintOpen}
                    variant={editingVariant}
                    frameGroupId={frameGroupId}
                    shopId={shopId}
                    onClose={() => {
                        setUpdateVaraintOpen(false);
                        setEditingVariant(null);
                    }}
                    onSaved={(variantId, formData) => {
                        setUpdateVaraintOpen(false);
                        setEditingVariant(null);
                        handleVariantUpdated(variantId, formData);
                    }}
                />
            )}
        </>
    );
};

// ─── Frame Group Card ─────────────────────────────────────────────────────────

export interface FrameGroupCardProps {
    fg: FrameGroup;
    shopId: string;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onViewAnalytics?: () => void;
    onPreview?: () => void;
    setFrameGroups: React.Dispatch<React.SetStateAction<FrameGroup[]>>;
}

const FrameGroupCard = ({
    fg,
    shopId,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onViewAnalytics,
    onPreview,
    setFrameGroups
}: FrameGroupCardProps) => {
    const theme = useTheme();

    const variants = fg.frameVariantResponses;
    const totalStock = variants.reduce((sum, v) => sum + (v.productResponse?.stockQuantity || 0), 0);
    const hasOut = variants.some((v) => v.stock === 0);
    const hasLow = variants.some((v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD);
    const featuredFrameVariant = fg.frameVariantResponses.find(
        fv => fv.productResponse?.isFeatured
    ) ?? null;
    const images = ProductAPI.getImageUrls(featuredFrameVariant?.productResponse);

    const [imgIndex, setImgIndex] = useState(0);

    const isActive =
        featuredFrameVariant?.productResponse.isActive ||
        variants.some((v) => v.isActive === true);

    const price = (() => {
        const p = featuredFrameVariant?.productResponse;
        if (p) return { base: p.basePrice, cost: p.costPrice };
        const v = variants[0];
        if (v) return { base: v.basePrice, cost: v.costPrice };
        return null;
    })();

    // Unique color swatches
    const colorSwatches = Array.from(
        new Map(variants.map((v) => [v.colorHex, v.colorName])).entries()
    );


    // Overall stock status for the group
    const findFrameVariantFeatured = () => {
        for (const fv of fg.frameVariantResponses) {
            if (fv.productResponse?.isFeatured) {
                return fv;
            }
        }
        return null;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2.5,
                border: `0.5px solid ${isExpanded
                    ? theme.palette.custom.status.info.main + '60'
                    : theme.palette.custom.border.light}`,
                overflow: 'hidden',
                transition: 'border-color 0.18s',
                bgcolor: theme.palette.background.paper,
            }}
        >
            {/* ── Card top: image / 3D placeholder ── */}
            <Box
                sx={{
                    position: 'relative',
                    height: 140,
                    bgcolor: theme.palette.custom.neutral[100],
                    overflow: 'hidden',
                    cursor: 'pointer',
                }}
                onClick={onToggle}
            >
                {/* Main image */}
                {images.length > 0 ? (
                    <Box
                        component="img"
                        src={images[imgIndex]}
                        alt={fg.frameName}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.25s',
                            '&:hover': {
                                transform: 'scale(1.05)',
                            },
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography fontSize={12} color="text.secondary">
                            No image
                        </Typography>
                    </Box>
                )}

                {/* Category badge */}
                <Chip
                    label="Frame"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        height: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        bgcolor: '#E6F1FB',
                        color: '#0C447C',
                    }}
                />

                {/* Active badge */}
                <Chip
                    label={isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        height: 20,
                        fontSize: 10,
                        fontWeight: 600,
                    }}
                />

                {/* Dots */}
                {images.length > 1 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 6,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 0.5,
                        }}
                    >
                        {images.map((_, i) => (
                            <Box
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImgIndex(i);
                                }}
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Prev button */}
                {images.length > 1 && (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            setImgIndex(prev => (prev - 1 + images.length) % images.length);
                        }}
                        sx={{
                            position: 'absolute',
                            left: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        ‹
                    </Box>
                )}

                {/* Next button */}
                {images.length > 1 && (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            setImgIndex(prev => (prev + 1) % images.length);
                        }}
                        sx={{
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        ›
                    </Box>
                )}

                {/* Color swatches */}
                {colorSwatches.length > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            display: 'flex',
                            gap: 0.4,
                        }}
                    >
                        {colorSwatches.slice(0, 6).map(([hex, name]) => (
                            <Tooltip key={hex} title={name}>
                                <Box
                                    sx={{
                                        width: 13,
                                        height: 13,
                                        borderRadius: '50%',
                                        bgcolor: hex,
                                        border: '1.5px solid rgba(255,255,255,0.8)',
                                    }}
                                />
                            </Tooltip>
                        ))}
                    </Box>
                )}
            </Box>

            {/* ── Card body ── */}
            <Box sx={{ p: 1.5 }}>
                {/* Name */}
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.palette.custom.neutral[800],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.25,
                    }}
                >
                    {fg.frameName}
                </Typography>

                {/* Description line */}
                <Typography
                    sx={{
                        fontSize: 11,
                        color: theme.palette.custom.neutral[500],
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {fg.frameShape} · {fg.frameMaterial} · {fg.genderTarget}
                </Typography>

                {/* Price row */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
                    {price ? (
                        <>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                {price.base.toLocaleString('vi-VN')}₫
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], ml: 'auto' }}>
                                Cost: {price.cost.toLocaleString('vi-VN')}₫
                            </Typography>
                        </>
                    ) : (
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>No price set</Typography>
                    )}
                </Box>

                {/* Meta chips */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                        label={fg.frameMaterial}
                        size="small"
                        sx={{
                            height: 18, fontSize: 10, fontWeight: 500,
                            bgcolor: theme.palette.custom.neutral[100],
                            color: theme.palette.custom.neutral[600],
                            border: 'none',
                            '& .MuiChip-label': { px: 0.75 },
                        }}
                    />
                    <Chip
                        label={`${fg.id.slice(0, 6).toUpperCase()}`}
                        size="small"
                        sx={{
                            height: 18, fontSize: 10,
                            bgcolor: theme.palette.custom.neutral[50],
                            color: theme.palette.custom.neutral[400],
                            border: `0.5px solid ${theme.palette.custom.border.light}`,
                            fontFamily: 'monospace',
                            '& .MuiChip-label': { px: 0.75 },
                        }}
                    />
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Chip
                            label={`Stock: ${totalStock}`}
                            size="small"
                            sx={{
                                height: 18, fontSize: 10, fontWeight: 500,
                                bgcolor: hasOut
                                    ? '#fee2e2'
                                    : hasLow
                                        ? '#fef9c3'
                                        : theme.palette.custom.neutral[100],
                                color: hasOut ? '#dc2626' : hasLow ? '#ca8a04' : theme.palette.custom.neutral[600],
                                border: 'none',
                                '& .MuiChip-label': { px: 0.75 },
                            }}
                        />
                    </Box>
                </Box>

                {/* Stats row */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 0,
                        mb: 1,
                        borderTop: `0.5px solid ${theme.palette.custom.border.light}`,
                        borderBottom: `0.5px solid ${theme.palette.custom.border.light}`,
                        py: 0.75,
                    }}
                >
                    {[
                        { label: 'Views', value: featuredFrameVariant?.productResponse ? '—' : '—' },
                        { label: 'Sales', value: '—' },
                        { label: 'Variants', value: String(variants.length) },
                    ].map(({ label, value }) => (
                        <Box key={label} sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400] }}>{label}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>{value}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Action buttons grid — 3×2 like the mockup */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 0.5,
                    }}
                >
                    {/* Row 1 */}
                    <ActionBtn icon={<Edit sx={{ fontSize: 12 }} />} label="Edit" onClick={onEdit} />
                    <ActionBtn icon={<Visibility sx={{ fontSize: 12 }} />} label="Preview" onClick={onPreview} />
                    <ActionBtn icon={<BarChart sx={{ fontSize: 12 }} />} label="Analytics" onClick={onViewAnalytics} />

                    {/* Row 2 */}
                    <ActionBtn
                        icon={
                            isExpanded
                                ? <KeyboardArrowUp sx={{ fontSize: 12 }} />
                                : <KeyboardArrowDown sx={{ fontSize: 12 }} />
                        }
                        label={`${variants.length} variants`}
                        onClick={onToggle}
                        active={isExpanded}
                    />
                    <ActionBtn icon={<ViewInAr sx={{ fontSize: 12 }} />} label="3D Model" onClick={() => { }} />
                    <ActionBtn
                        icon={<DeleteOutline sx={{ fontSize: 12 }} />}
                        label="Delete"
                        onClick={onDelete}
                        danger
                    />
                </Box>
            </Box>

            {/* Expand variants panel */}
            {isExpanded && (
                <VariantPanel
                    frameGroupId={fg.id}
                    shopId={shopId}
                    variants={variants}
                    vrEnabled={fg.vrEnabled}
                    productImages={featuredFrameVariant?.productResponse.productImages || []}
                    setFrameGroups={setFrameGroups} />
            )}
        </Paper>
    );
};

// ─── Tiny action button ───────────────────────────────────────────────────────

interface ActionBtnProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    danger?: boolean;
    active?: boolean;
}

const ActionBtn = ({ icon, label, onClick, danger, active }: ActionBtnProps) => {
    const theme = useTheme();
    return (
        <Box
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                py: 0.75,
                px: 0.5,
                borderRadius: 1,
                border: `0.5px solid ${theme.palette.custom.border.light}`,
                cursor: 'pointer',
                fontSize: 10,
                color: danger
                    ? theme.palette.custom.status.error.main
                    : active
                        ? theme.palette.custom.status.info.main
                        : theme.palette.custom.neutral[500],
                bgcolor: danger
                    ? theme.palette.custom.status.error.light
                    : active
                        ? theme.palette.custom.status.info.light
                        : 'transparent',
                transition: 'background-color 0.12s',
                '&:hover': {
                    bgcolor: danger
                        ? '#fecaca'
                        : theme.palette.custom.neutral[100],
                },
                userSelect: 'none',
            }}
        >
            {icon}
            <Typography sx={{ fontSize: 10, color: 'inherit', lineHeight: 1 }}>{label}</Typography>
        </Box>
    );
};

export default FrameGroupCard;