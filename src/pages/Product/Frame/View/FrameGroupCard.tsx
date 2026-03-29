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
    compareAtPrice: number;
    stockQuantity: number;
}

export interface ProductResponse {
    id: string;
    basePrice: number;
    costPrice: number;
    compareAtPrice: number;
    stockQuantity: number;
    isActive: boolean;
    productImages: string[];
    fileResponses: { url: string }[] | null;
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
    productResponses: ProductResponse[];
    frameVariantResponses: FrameVariantResponse[];
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

function mapToFormData(v: FrameVariantResponse): CreateFrameVariantFormData {
    return {
        colorName: v.colorName,
        colorHex: v.colorHex,
        size: v.size as 'SMALL' | 'MEDIUM' | 'LARGE' | '',
        frameWidthMm: String(v.frameWidthMm ?? ''),
        lensWidthMm: String(v.lensWidthMm ?? ''),
        lensHeightMm: String(v.lensHeightMm ?? ''),
        bridgeWidthMm: String(v.bridgeWidthMm ?? ''),
        templeLengthMm: String(v.templeLengthMm ?? ''),
        stock: String(v.stockQuantity ?? ''),
        stockThreshold: '',
        warrantyMonths: '',
        costPrice: String(v.costPrice ?? ''),
        basePrice: String(v.basePrice ?? ''),
        compareAtPrice: String(v.compareAtPrice ?? ''),
        isReturnable: false,
        isFeatured: false,
        images: [],
        textureFile: null,
    };
}

// ─── Variant Panel (expanded) ─────────────────────────────────────────────────

interface VariantPanelProps {
    variants: FrameVariantResponse[];
    vrEnabled?: boolean;
}

const VariantPanel = ({ variants, vrEnabled }: VariantPanelProps) => {
    const theme = useTheme();
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<
        (CreateFrameVariantFormData & { id?: string }) | null
    >(null);

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
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 1,
                        p: 1,
                    }}
                >
                    {variants.map((v) => {
                        const st = getVariantStatus(v.stockQuantity);
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
                                    {v.compareAtPrice > v.basePrice && (
                                        <Typography sx={{ fontSize: 10, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                            {v.compareAtPrice.toLocaleString('vi-VN')}₫
                                        </Typography>
                                    )}
                                </Box>

                                {/* Stock */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[500] }}>
                                        Stock: <Box component="span" sx={{ fontWeight: 600, color: sc.color }}>{v.stockQuantity}</Box>
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
                                                setSelectedVariant({ ...mapToFormData(v), id: v.id });
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
        </>
    );
};

// ─── Frame Group Card ─────────────────────────────────────────────────────────

export interface FrameGroupCardProps {
    fg: FrameGroup;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onViewAnalytics?: () => void;
    onPreview?: () => void;
}

const FrameGroupCard = ({
    fg,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onViewAnalytics,
    onPreview,
}: FrameGroupCardProps) => {
    const theme = useTheme();

    const variants = fg.frameVariantResponses;
    const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    const hasOut = variants.some((v) => v.stockQuantity === 0);
    const hasLow = variants.some((v) => v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK_THRESHOLD);

    const isActive =
        fg.productResponses.some((p) => p.isActive) ||
        variants.some((v) => v.isActive === true);

    const price = (() => {
        const p = fg.productResponses[0];
        if (p) return { base: p.basePrice, compare: p.compareAtPrice, cost: p.costPrice };
        const v = variants[0];
        if (v) return { base: v.basePrice, compare: v.compareAtPrice, cost: v.costPrice };
        return null;
    })();

    // Unique color swatches
    const colorSwatches = Array.from(
        new Map(variants.map((v) => [v.colorHex, v.colorName])).entries()
    );

    // Thumbnail: first product image or 3D model
    const thumbnail =
        fg.productResponses[0]?.productImages?.[0] ||
        fg.productResponses[0]?.fileResponses?.[0]?.url ||
        null;

    // Overall stock status for the group
    const groupStatus = (() => {
        if (variants.length === 0) return null;
        if (variants.every((v) => v.stockQuantity === 0)) return 'out_of_stock' as const;
        if (variants.some((v) => v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK_THRESHOLD)) return 'low_stock' as const;
        return 'in_stock' as const;
    })();

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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                }}
                onClick={onToggle}
            >
                {thumbnail ? (
                    <Box
                        component="img"
                        src={thumbnail}
                        alt={fg.frameName}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        {fg.vrEnabled ? (
                            <>
                                <ViewInAr sx={{ fontSize: 28, color: theme.palette.custom.neutral[300] }} />
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                    3D Model
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Inventory2 sx={{ fontSize: 28, color: theme.palette.custom.neutral[300] }} />
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400] }}>
                                    No image
                                </Typography>
                            </>
                        )}
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
                        border: 'none',
                        '& .MuiChip-label': { px: 1 },
                    }}
                />

                {/* Active/inactive badge */}
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
                        bgcolor: isActive
                            ? theme.palette.custom.status.success.light
                            : theme.palette.custom.status.warning.light,
                        color: isActive
                            ? theme.palette.custom.status.success.main
                            : theme.palette.custom.status.warning.main,
                        border: 'none',
                        '& .MuiChip-label': { px: 1 },
                    }}
                />

                {/* Color swatches strip at bottom of image */}
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
                        {colorSwatches.length > 6 && (
                            <Typography sx={{ fontSize: 10, color: '#fff', alignSelf: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                +{colorSwatches.length - 6}
                            </Typography>
                        )}
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
                            {price.compare > price.base && (
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], textDecoration: 'line-through' }}>
                                    {price.compare.toLocaleString('vi-VN')}₫
                                </Typography>
                            )}
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
                        { label: 'Views', value: fg.productResponses[0] ? '—' : '—' },
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
                <VariantPanel variants={variants} vrEnabled={fg.vrEnabled} />
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