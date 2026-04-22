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
    Visibility,
    Edit,
    DeleteOutline,
    KeyboardArrowDown,
    KeyboardArrowUp,
    InfoOutlined,
    BarChart,
    Category,
    Star, StarBorder
} from '@mui/icons-material';
import { useState } from 'react';
import AccessoryVariantDetailDialog from './AccessoryVariantDetailDialog';
import CreateAccessoryVariantPopup from '../Create/CreateAccessoryVariantPopup';
import EditAccessoryVariantDialog, { type EditAccessoryVariantFormData } from '../Edit/EditAccessoryVariantDialog';
import { } from '@mui/icons-material';
import DeleteAccessoryVariantDialog from '../Delete/DeleteAccessoryVariantDialog';
import SetAccessoryFeaturedDialog from '../Edit/SetAccessoryFeaturedDialog';
import type { ProductSize } from '@/types/product.enums';
// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessoryVariantResponse {
    id: string;
    accessoryId: string;
    name: string | null;
    color: string | null;
    colorHex: string | null;
    size: ProductSize;
    isFeatured: boolean | null;
    productId: string | null;
    productName: string | null;
    slug: string | null;
    basePrice: number;
    costPrice: number;
    stock: number;
    stockThreshold: number;
    warrantyMonths: number;
    isReturnable: boolean;
    productResponse: AccessoryProductResponse;
}

export interface AccessoryProductResponse {
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
    fileResponses: { publicUrl?: string; url?: string; isPrimary?: boolean | null }[] | null;
}

export interface Accessory {
    id: string;
    name: string;
    type: string; // AccessoryType enum: e.g. CASE, STRAP, LENS_CLOTH, etc.
    description: string;
    createdAt: string;
    variants: AccessoryVariantResponse[];
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

// ─── Variant Panel ────────────────────────────────────────────────────────────

interface VariantPanelProps {
    accessoryId: string;
    shopId: string;
    variants: AccessoryVariantResponse[];
    setAccessories: React.Dispatch<React.SetStateAction<Accessory[]>>;
}

const VariantPanel = ({ accessoryId, shopId, variants, setAccessories }: VariantPanelProps) => {
    const theme = useTheme();
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<AccessoryVariantResponse | null>(null);
    const [addVariantOpen, setAddVariantOpen] = useState(false);
    const [editVariantOpen, setEditVariantOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<AccessoryVariantResponse | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedDeleteVariant, setSelectedDeleteVariant] = useState<AccessoryVariantResponse | null>(null);
    const [featuredOpen, setFeaturedOpen] = useState(false);
    const [selectedFeaturedVariant, setSelectedFeaturedVariant] = useState<AccessoryVariantResponse | null>(null);


    if (variants.length === 0) {
        return (
            <Box
                sx={{
                    mx: 2, mb: 2, py: 2.5, borderRadius: 2,
                    bgcolor: theme.palette.custom.neutral[50],
                    border: `1px dashed ${theme.palette.custom.border.light}`,
                    textAlign: 'center',
                }}
            >
                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                    No variants for this accessory
                </Typography>
            </Box>
        );
    }

    const handleAddVariant = (variantId: string, productId: string, data: any) => {
        setAccessories(prev =>
            prev.map(acc => {
                if (acc.id !== accessoryId) return acc;

                const newVariant: AccessoryVariantResponse = {
                    id: variantId,
                    accessoryId: accessoryId,
                    name: data.name ?? null,
                    color: data.color ?? null,
                    colorHex: data.colorHex ?? null,
                    size: data.size ?? null,
                    isFeatured: data.isFeatured ?? false,

                    productId: productId,
                    productName: data.name ?? null,
                    slug: null,

                    basePrice: data.basePrice ?? 0,
                    costPrice: data.costPrice ?? 0,
                    stock: data.stock ?? 0,
                    stockThreshold: data.stockThreshold ?? 0,
                    warrantyMonths: data.warrantyMonths ?? 0,
                    isReturnable: data.isReturnable ?? false,

                    productResponse: {
                        id: productId,
                        basePrice: data.basePrice ?? 0,
                        costPrice: data.costPrice ?? 0,
                        stockQuantity: data.stock ?? 0,
                        isActive: true,
                        isFeatured: data.isFeatured ?? false,
                        isReturnable: data.isReturnable ?? false,
                        warrantyMonths: data.warrantyMonths ?? 0,
                        viewCount: 0,
                        soldCount: 0,
                        avgRating: 0,
                        reviewCount: 0,
                        metaTitle: '',
                        metaDescription: '',
                        productType: 'ACCESSORY',
                        productImages: data.productImages.map((img: any) => img.preview),
                        fileResponses: null,
                    }
                };

                return {
                    ...acc,
                    variants: [...(acc.variants ?? []), newVariant]
                };
            })
        );
    };

    const handleVariantUpdated = (variantId: string, data: EditAccessoryVariantFormData) => {
        setAccessories(prev =>
            prev.map(acc => ({
                ...acc,
                variants: acc.variants.map(v =>
                    v.id === variantId ? {
                        ...v, ...data,
                        productResponse: {
                            ...v.productResponse,
                            productImages:
                                data.newImages && data.newImages.length > 0
                                    ? data.newImages.map(file => file.preview)
                                    : v.productResponse.productImages,
                        }
                    } : v
                ),
            }))
        );
    };

    const handleDeleteConfirm = () => {
        setAccessories(prev =>
            prev.map(acc => ({
                ...acc,
                variants: acc.variants.filter(v => v.id !== selectedDeleteVariant?.id),
            }))
        );
    };

    // Handler onSuccess featured
    const handleFeaturedSuccess = () => {
        setAccessories(prev =>
            prev.map(acc => ({
                ...acc,
                variants: acc.variants.map(v => ({
                    ...v,
                    productResponse: {
                        ...v.productResponse,
                        isFeatured: v.id === selectedFeaturedVariant?.id,
                    },
                })),
            }))
        );
    };

    return (
        <>
            <Box
                sx={{
                    mx: 2, mb: 2, borderRadius: 2,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    overflow: 'hidden',
                    bgcolor: theme.palette.custom.neutral[50],
                }}
            >
                <Box
                    sx={{
                        px: 1.5, py: 1,
                        borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}
                >
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.palette.custom.neutral[500] }}>
                        {variants.length} variant{variants.length > 1 ? 's' : ''}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, p: 1, overflowX: 'auto' }}>
                    {variants.map((v) => {
                        const st = getVariantStatus(v.stock ?? v.productResponse?.stockQuantity ?? 0);
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
                                    minWidth: 140,
                                    transition: 'border-color 0.15s',
                                    '&:hover': { borderColor: theme.palette.custom.status.info.main + '60' },
                                }}
                            >
                                {/* Stock dot */}
                                <Box
                                    sx={{
                                        position: 'absolute', top: 8, right: 8,
                                        width: 7, height: 7, borderRadius: '50%',
                                        bgcolor: sc.color,
                                    }}
                                />

                                {/* Variant name */}
                                {v.name && (
                                    <Typography
                                        sx={{
                                            fontSize: 11, fontWeight: 700,
                                            color: theme.palette.custom.neutral[500],
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            mb: 0.4,
                                        }}
                                    >
                                        {v.name}
                                    </Typography>
                                )}

                                {/* Color swatch + name + size chip */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                    {v.colorHex && (
                                        <Box
                                            sx={{
                                                width: 13, height: 13, borderRadius: '50%',
                                                bgcolor: v.colorHex,
                                                border: '1.5px solid rgba(0,0,0,0.12)',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <Typography
                                        sx={{
                                            fontSize: 12, fontWeight: 600,
                                            color: theme.palette.custom.neutral[700],
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            flex: 1,
                                        }}
                                    >
                                        {v.color || '—'}
                                    </Typography>
                                    {v.size && (
                                        <Chip
                                            label={v.size}
                                            size="small"
                                            sx={{
                                                height: 16, fontSize: 9, fontWeight: 600,
                                                bgcolor: theme.palette.custom.neutral[100],
                                                color: theme.palette.custom.neutral[600],
                                                border: 'none', mr: 1.5,
                                                '& .MuiChip-label': { px: 0.5 },
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Price */}
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.custom.neutral[800], mb: 0.5 }}>
                                    {(v.basePrice || v.productResponse?.basePrice || 0).toLocaleString('vi-VN')}₫
                                </Typography>

                                {/* Stock */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                        Stock: <Box component="span" sx={{ fontWeight: 600, color: sc.color }}>
                                            {v.stock ?? v.productResponse?.stockQuantity ?? 0}
                                        </Box>
                                    </Typography>
                                    <Chip
                                        label={sc.label}
                                        size="small"
                                        sx={{
                                            height: 16, fontSize: 9, fontWeight: 600,
                                            bgcolor: sc.bg, color: sc.color, border: 'none',
                                            '& .MuiChip-label': { px: 0.5 },
                                        }}
                                    />
                                </Box>

                                {/* Actions */}
                                <Box
                                    sx={{
                                        display: 'flex', gap: 0.5, pt: 0.75,
                                        borderTop: `0.5px solid ${theme.palette.custom.border.light}`,
                                    }}
                                >
                                    <Tooltip title={v.productResponse?.isFeatured ? "Featured product" : "Set as featured"}>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                if (!v.productResponse?.isFeatured) {
                                                    setSelectedFeaturedVariant(v);
                                                    console.log("Feature v", v)
                                                    setFeaturedOpen(true);
                                                }
                                            }}
                                            sx={{
                                                width: 22, height: 22, borderRadius: 0.75,
                                                bgcolor: v.productResponse?.isFeatured ? '#fef9c3' : theme.palette.custom.neutral[100],
                                                '&:hover': {
                                                    bgcolor: v.productResponse?.isFeatured ? '#fde68a' : theme.palette.custom.neutral[200],
                                                },
                                            }}
                                        >
                                            {v.productResponse?.isFeatured
                                                ? <Star sx={{ fontSize: 12, color: '#eab308' }} />
                                                : <StarBorder sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }} />
                                            }
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="View detail">
                                        <IconButton
                                            size="small"
                                            onClick={() => { setSelectedVariant(v); setDetailOpen(true); }}
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
                                            onClick={() => { setEditingVariant(v); setEditVariantOpen(true); }}
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
                                            onClick={() => {
                                                setSelectedDeleteVariant(v);
                                                setDeleteOpen(true);
                                            }}
                                        >
                                            <DeleteOutline sx={{ fontSize: 11, color: theme.palette.custom.status.error.main }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        );
                    })}

                    {/* Add Variant */}
                    <Box
                        onClick={() => setAddVariantOpen(true)}
                        sx={{
                            bgcolor: theme.palette.custom.neutral[100],
                            border: `0.5px dashed ${theme.palette.custom.border.light}`,
                            borderRadius: 1.5, p: 1.25,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            '&:hover': { borderColor: theme.palette.primary.main, bgcolor: theme.palette.custom.neutral[50] },
                            minHeight: 120, minWidth: 50,
                        }}
                    >
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.primary.main }}>+</Typography>
                    </Box>
                </Box>
            </Box>

            {selectedVariant && (
                <AccessoryVariantDetailDialog
                    open={detailOpen}
                    onClose={() => { setDetailOpen(false); setSelectedVariant(null); }}
                    variant={selectedVariant}
                />
            )}
            {addVariantOpen && (
                <CreateAccessoryVariantPopup
                    open={addVariantOpen}
                    accessoryId={accessoryId}
                    shopId={shopId}
                    onCreated={(variantId, productId, data) => {
                        handleAddVariant(variantId, productId, data);
                    }}
                    onClose={() => setAddVariantOpen(false)}
                />
            )}
            {editVariantOpen && editingVariant && (
                <EditAccessoryVariantDialog
                    open={editVariantOpen}
                    variant={editingVariant}
                    accessoryId={accessoryId}
                    shopId={shopId}
                    onClose={() => { setEditVariantOpen(false); setEditingVariant(null); }}
                    onSaved={(variantId, formData) => {
                        setEditVariantOpen(false);
                        setEditingVariant(null);
                        handleVariantUpdated(variantId, formData);
                    }}
                />
            )}
            {selectedDeleteVariant && (
                <DeleteAccessoryVariantDialog
                    open={deleteOpen}
                    variantId={selectedDeleteVariant.id}
                    colorName={selectedDeleteVariant.color ?? selectedDeleteVariant.name ?? undefined}
                    variantSize={selectedDeleteVariant.size}
                    onClose={() => { setDeleteOpen(false); setSelectedDeleteVariant(null); }}
                    onConfirm={() => {
                        handleDeleteConfirm();
                        setDeleteOpen(false);
                        setSelectedDeleteVariant(null);
                    }}
                />
            )}

            <SetAccessoryFeaturedDialog
                open={featuredOpen}
                productId={selectedFeaturedVariant?.productResponse.id}
                accessoryName={selectedFeaturedVariant?.name ?? ''}
                variantSize={selectedFeaturedVariant?.size}
                colorName={selectedFeaturedVariant?.color ?? ''}
                onClose={() => { setFeaturedOpen(false); setSelectedFeaturedVariant(null); }}
                onSuccess={() => {
                    handleFeaturedSuccess();
                    setFeaturedOpen(false);
                    setSelectedFeaturedVariant(null);
                }}
            />
        </>
    );
};

// ─── Accessory Card ────────────────────────────────────────────────────────────

export interface AccessoryCardProps {
    accessory: Accessory;
    shopId: string;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPreview?: () => void;
    onViewAnalytics?: () => void;
    setAccessories: React.Dispatch<React.SetStateAction<Accessory[]>>;
}

const AccessoryCard = ({
    accessory,
    shopId,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onPreview,
    onViewAnalytics,
    setAccessories,
}: AccessoryCardProps) => {
    const theme = useTheme();

    const variants = accessory.variants ?? [];
    const totalStock = variants.reduce((sum, v) => sum + (v.productResponse?.stockQuantity ?? v.stock ?? 0), 0);
    const hasOut = variants.some((v) => (v.stock ?? v.productResponse?.stockQuantity ?? 0) === 0);
    const hasLow = variants.some((v) => {
        const s = v.stock ?? v.productResponse?.stockQuantity ?? 0;
        return s > 0 && s <= LOW_STOCK_THRESHOLD;
    });

    const featuredVariant = variants.find(v => v.productResponse?.isFeatured) ?? null;
    const isActive = featuredVariant?.productResponse?.isActive ?? variants.some(v => v.productResponse.isActive === true);

    const price = (() => {
        const p = featuredVariant?.productResponse;
        if (p) return { base: p.basePrice, cost: p.costPrice };
        const v = variants[0];
        if (v) return { base: v.basePrice, cost: v.costPrice };
        return null;
    })();

    const images: string[] = featuredVariant?.productResponse?.productImages ?? [];
    const [imgIndex, setImgIndex] = useState(0);

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
            {/* Image area */}
            <Box
                sx={{
                    position: 'relative', height: 140,
                    bgcolor: theme.palette.custom.neutral[100],
                    overflow: 'hidden', cursor: 'pointer',
                }}
                onClick={onToggle}
            >
                {images.length > 0 ? (
                    <Box
                        component="img"
                        src={images[imgIndex]}
                        alt={accessory.name}
                        sx={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transition: 'transform 0.25s',
                            '&:hover': { transform: 'scale(1.05)' },
                        }}
                    />
                ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Category sx={{ fontSize: 40, color: theme.palette.custom.neutral[300] }} />
                    </Box>
                )}

                <Chip
                    label="Accessory"
                    size="small"
                    sx={{
                        position: 'absolute', top: 8, left: 8,
                        height: 20, fontSize: 10, fontWeight: 600,
                        bgcolor: '#F3E8FF', color: '#7C3AED',
                    }}
                />
                <Chip
                    label={isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: 10, fontWeight: 600 }}
                />

                {images.length > 1 && (
                    <>
                        <Box
                            sx={{
                                position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', gap: 0.5,
                            }}
                        >
                            {images.map((_, i) => (
                                <Box
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                                    sx={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        bgcolor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </Box>
                        <Box
                            onClick={(e) => { e.stopPropagation(); setImgIndex(p => (p - 1 + images.length) % images.length); }}
                            sx={{
                                position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                                width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 12, cursor: 'pointer',
                            }}
                        >‹</Box>
                        <Box
                            onClick={(e) => { e.stopPropagation(); setImgIndex(p => (p + 1) % images.length); }}
                            sx={{
                                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                                width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 12, cursor: 'pointer',
                            }}
                        >›</Box>
                    </>
                )}
            </Box>

            {/* Card body */}
            <Box sx={{ p: 1.5 }}>
                <Typography
                    sx={{
                        fontSize: 13, fontWeight: 600,
                        color: theme.palette.custom.neutral[800],
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.25,
                    }}
                >
                    {accessory.name}
                </Typography>

                {/* Type · Description */}
                <Typography
                    sx={{
                        fontSize: 11, color: theme.palette.custom.neutral[500],
                        mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                >
                    {accessory.type}{accessory.description ? ` · ${accessory.description}` : ''}
                </Typography>

                {/* Color swatches row */}
                {(() => {
                    const swatches = Array.from(
                        new Map(
                            variants
                                .filter(v => v.colorHex)
                                .map(v => [v.colorHex!, v.color ?? v.colorHex!])
                        ).entries()
                    );
                    return swatches.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.4, mb: 1 }}>
                            {swatches.slice(0, 7).map(([hex, name]) => (
                                <Tooltip key={hex} title={name}>
                                    <Box
                                        sx={{
                                            width: 13, height: 13, borderRadius: '50%',
                                            bgcolor: hex,
                                            border: '1.5px solid rgba(0,0,0,0.12)',
                                            flexShrink: 0,
                                        }}
                                    />
                                </Tooltip>
                            ))}
                            {swatches.length > 7 && (
                                <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400], alignSelf: 'center' }}>
                                    +{swatches.length - 7}
                                </Typography>
                            )}
                        </Box>
                    ) : null;
                })()}

                {/* Price row */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
                    {price ? (
                        <>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                                {(price?.base ?? 0).toLocaleString('vi-VN')}₫
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], ml: 'auto' }}>
                                Cost: {(price?.cost ?? 0).toLocaleString('vi-VN')}₫
                            </Typography>
                        </>
                    ) : (
                        <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[400] }}>No price set</Typography>
                    )}
                </Box>

                {/* Meta chips */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                        label={accessory.type}
                        size="small"
                        sx={{
                            height: 18, fontSize: 10, fontWeight: 500,
                            bgcolor: '#F3E8FF', color: '#7C3AED', border: 'none',
                            '& .MuiChip-label': { px: 0.75 },
                        }}
                    />
                    <Chip
                        label={accessory.id.slice(0, 6).toUpperCase()}
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
                                bgcolor: hasOut ? '#fee2e2' : hasLow ? '#fef9c3' : theme.palette.custom.neutral[100],
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
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, mb: 1,
                        borderTop: `0.5px solid ${theme.palette.custom.border.light}`,
                        borderBottom: `0.5px solid ${theme.palette.custom.border.light}`,
                        py: 0.75,
                    }}
                >
                    {[
                        { label: 'Views', value: '—' },
                        { label: 'Sales', value: '—' },
                        { label: 'Variants', value: String(variants.length) },
                    ].map(({ label, value }) => (
                        <Box key={label} sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400] }}>{label}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700] }}>{value}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
                    <ActionBtn icon={<Edit sx={{ fontSize: 12 }} />} label="Edit" onClick={onEdit} />
                    <ActionBtn icon={<Visibility sx={{ fontSize: 12 }} />} label="Preview" onClick={onPreview} />
                    <ActionBtn icon={<BarChart sx={{ fontSize: 12 }} />} label="Analytics" onClick={onViewAnalytics} />
                    <ActionBtn
                        icon={isExpanded ? <KeyboardArrowUp sx={{ fontSize: 12 }} /> : <KeyboardArrowDown sx={{ fontSize: 12 }} />}
                        label={`${variants.length} variants`}
                        onClick={onToggle}
                        active={isExpanded}
                    />
                    <ActionBtn
                        icon={<DeleteOutline sx={{ fontSize: 12 }} />}
                        label="Delete"
                        onClick={onDelete}
                        danger
                    />
                </Box>
            </Box>

            {isExpanded && (
                <VariantPanel
                    accessoryId={accessory.id}
                    shopId={shopId}
                    variants={variants}
                    setAccessories={setAccessories}
                />
            )}
        </Paper>
    );
};

// ─── ActionBtn ────────────────────────────────────────────────────────────────

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
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                py: 0.75, px: 0.5, borderRadius: 1,
                border: `0.5px solid ${theme.palette.custom.border.light}`,
                cursor: 'pointer', fontSize: 10,
                color: danger
                    ? theme.palette.custom.status.error.main
                    : active ? theme.palette.custom.status.info.main : theme.palette.custom.neutral[500],
                bgcolor: danger
                    ? theme.palette.custom.status.error.light
                    : active ? theme.palette.custom.status.info.light : 'transparent',
                transition: 'background-color 0.12s',
                '&:hover': { bgcolor: danger ? '#fecaca' : theme.palette.custom.neutral[100] },
                userSelect: 'none',
            }}
        >
            {icon}
            <Typography sx={{ fontSize: 10, color: 'inherit', lineHeight: 1 }}>{label}</Typography>
        </Box>
    );
};

export default AccessoryCard;