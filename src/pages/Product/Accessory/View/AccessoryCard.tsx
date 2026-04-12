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
} from '@mui/icons-material';
import { useState } from 'react';
import AccessoryVariantDetailDialog from './AccessoryVariantDetailDialog';
import CreateAccessoryVariantPopup from '../Create/CreateAccessoryVariantPopup';
import EditAccessoryVariantDialog, { type EditAccessoryVariantFormData } from '../Edit/EditAccessoryVariantDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessoryVariantResponse {
    id: string;
    accessoryId: string;
    color: string | null;
    size: string | null;
    isFeatured: boolean | null;
    productId: string | null;
    productName: string | null;
    slug: string | null;
    basePrice: number;
    costPrice: number;
    stock: number;
    stockThreshold: number;
    isActive: boolean | null;
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
    createdAt: string;
    accessoryVariants: AccessoryVariantResponse[];
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

    const handleVariantUpdated = (variantId: string, data: EditAccessoryVariantFormData) => {
        setAccessories(prev =>
            prev.map(acc => ({
                ...acc,
                accessoryVariants: acc.accessoryVariants.map(v =>
                    v.id === variantId ? { ...v, ...data } : v
                ),
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

                                {/* Color */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 12, fontWeight: 600,
                                            color: theme.palette.custom.neutral[700],
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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

    const variants = accessory.accessoryVariants ?? [];
    const totalStock = variants.reduce((sum, v) => sum + (v.productResponse?.stockQuantity ?? v.stock ?? 0), 0);
    const hasOut = variants.some((v) => (v.stock ?? v.productResponse?.stockQuantity ?? 0) === 0);
    const hasLow = variants.some((v) => {
        const s = v.stock ?? v.productResponse?.stockQuantity ?? 0;
        return s > 0 && s <= LOW_STOCK_THRESHOLD;
    });

    const featuredVariant = variants.find(v => v.productResponse?.isFeatured) ?? null;
    const isActive = featuredVariant?.productResponse?.isActive ?? variants.some(v => v.isActive === true);

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

                <Typography
                    sx={{
                        fontSize: 11, color: theme.palette.custom.neutral[500],
                        mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                >
                    {accessory.type}
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