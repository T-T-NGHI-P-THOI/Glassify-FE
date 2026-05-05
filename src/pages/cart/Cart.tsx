import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    Paper,
    Chip,
    Divider,
    Stack,
    Skeleton,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    FavoriteBorder as FavoriteIcon,
    Close as CloseIcon,
    CardGiftcard as GiftIcon,
    CheckCircle as CheckCircleIcon,
    ArrowBack as ArrowBackIcon,
    Inventory2Outlined as AccessoryIcon,
    Visibility as LensIcon,
    Edit as EditIcon,
    Info as InfoIcon,
    Storefront as StorefrontIcon,
} from '@mui/icons-material';
import type { CartItemWithDetails, ItemType } from '@/api/service/Type';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatCurrency';
import { PAGE_ENDPOINTS } from '@/api/endpoints';

// =====================================================
// Quantity Selector Component
// =====================================================
interface QuantitySelectorProps {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    size?: 'small' | 'medium';
    disabled?: boolean;
    maxQuantity?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onIncrease,
    onDecrease,
    size = 'medium',
    disabled = false,
    maxQuantity,
}) => {
    const isSmall = size === 'small';
    const atMax = maxQuantity != null && quantity >= maxQuantity;

    return (
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1.5px solid',
                    borderColor: disabled ? '#eee' : isSmall ? '#e0e0e0' : '#d0d0d0',
                    borderRadius: isSmall ? '6px' : '8px',
                    bgcolor: disabled ? '#fafafa' : '#fff',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <IconButton
                    size="small"
                    onClick={onDecrease}
                    disabled={quantity <= 1 || disabled}
                    sx={{
                        borderRadius: 0,
                        p: isSmall ? '2px 6px' : '6px 10px',
                        color: '#666',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        '&.Mui-disabled': { color: '#ccc' },
                    }}
                >
                    <RemoveIcon sx={{ fontSize: isSmall ? 14 : 18 }} />
                </IconButton>
                <Typography
                    sx={{
                        px: isSmall ? 1.5 : 2,
                        minWidth: isSmall ? 20 : 28,
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: isSmall ? '0.75rem' : '0.9rem',
                        color: '#222',
                        userSelect: 'none',
                    }}
                >
                    {quantity}
                </Typography>
                <IconButton
                    size="small"
                    onClick={onIncrease}
                    disabled={atMax || disabled}
                    sx={{
                        borderRadius: 0,
                        p: isSmall ? '2px 6px' : '6px 10px',
                        color: '#666',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        '&.Mui-disabled': { color: '#ccc' },
                    }}
                >
                    <AddIcon sx={{ fontSize: isSmall ? 14 : 18 }} />
                </IconButton>
            </Box>
            {atMax && (
                <Typography sx={{ fontSize: '0.65rem', color: '#e57373', fontWeight: 500, letterSpacing: '0.2px' }}>
                    Out of stock
                </Typography>
            )}
        </Box>
    );
};

// =====================================================
// Helper: get icon by item type
// =====================================================
const getChildIcon = (itemType?: ItemType, isGift?: boolean) => {
    if (isGift || itemType === 'GIFT') return <GiftIcon sx={{ fontSize: 16, color: '#666' }} />;
    if (itemType === 'LENS') return <LensIcon sx={{ fontSize: 16, color: '#00838f' }} />;
    return <AccessoryIcon sx={{ fontSize: 16, color: '#888' }} />;
};

const getChildChip = (itemType?: ItemType, isGift?: boolean) => {
    if (isGift || itemType === 'GIFT') {
        return (
            <Chip
                label="GIFT"
                size="small"
                sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    bgcolor: '#222',
                    color: '#fff',
                    '& .MuiChip-label': { px: 1 },
                }}
            />
        );
    }
    if (itemType === 'LENS') {
        return (
            <Chip
                label="LENS"
                size="small"
                sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    bgcolor: '#00838f',
                    color: '#fff',
                    '& .MuiChip-label': { px: 1 },
                }}
            />
        );
    }
    if (itemType === 'ACCESSORY') {
        return (
            <Chip
                label="ADD-ON"
                size="small"
                sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    bgcolor: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #e0e0e0',
                    '& .MuiChip-label': { px: 1 },
                }}
            />
        );
    }
    return null;
};

// =====================================================
// Child Item (Lens/Accessory/Gift) Component
// =====================================================
interface ChildItemProps {
    item: CartItemWithDetails;
    isLast: boolean;
    onQuantityChange: (itemId: string, quantity: number) => void;
    onRemove: (itemId: string) => void;
    onViewDetails?: () => void;
    loading?: boolean;
}

const ChildItem: React.FC<ChildItemProps> = ({
    item,
    isLast,
    onQuantityChange,
    onRemove,
    onViewDetails,
    loading = false,
}) => {
    const isGift = item.is_gift || item.unit_price === 0;
    const isLens = item.item_type === 'LENS';
    const itemTotal = item.unit_price * item.quantity;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                ml: '36px',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: isLast ? '50%' : 0,
                    width: '1px',
                    bgcolor: isLens ? '#00838f' : '#ddd',
                    opacity: isLens ? 0.4 : 1,
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: '20px',
                    height: '1px',
                    bgcolor: isLens ? '#00838f' : '#ddd',
                    opacity: isLens ? 0.4 : 1,
                },
            }}
        >
            <Box
                onClick={isLens && onViewDetails ? onViewDetails : undefined}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    ml: '28px',
                    py: 1.5,
                    px: 2,
                    bgcolor: isGift ? '#fafafa' : isLens ? '#f0fafa' : '#fff',
                    border: '1px dashed',
                    borderColor: isLens ? 'rgba(0,131,143,0.3)' : '#ddd',
                    borderRadius: '8px',
                    gap: 2,
                    cursor: isLens && onViewDetails ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: isLens ? '#00838f' : '#bbb',
                        bgcolor: isLens ? '#e8f5f5' : '#f8f8f8',
                    },
                }}
            >
                {/* Icon */}
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '6px',
                        bgcolor: isLens ? 'rgba(0,131,143,0.1)' : isGift ? '#f0f0f0' : '#f5f5f5',
                        border: '1px solid',
                        borderColor: isLens ? 'rgba(0,131,143,0.2)' : isGift ? '#e0e0e0' : '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {getChildIcon(item.item_type, isGift)}
                </Box>

                {/* Name + SKU + Tag */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: isLens ? 600 : 500,
                                color: isLens ? '#00838f' : '#555',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {item.product.name}
                        </Typography>
                        {getChildChip(item.item_type, isGift)}
                        {isLens && onViewDetails && (
                            <InfoIcon sx={{ fontSize: 16, color: '#00838f', opacity: 0.6 }} />
                        )}
                    </Stack>
                    {isLens && item.lens_selection && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#00838f', opacity: 0.7, mt: 0.25 }}>
                            {item.lens_selection.usage?.name}
                            {item.lens_selection.tint ? ` • ${item.lens_selection.tint.name}` : ''}
                            {(item.lens_selection.features?.length ?? 0) > 0
                                ? ` • ${item.lens_selection.features.length} features`
                                : ''}
                        </Typography>
                    )}
                    {item.variant_details?.sku && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#999', mt: 0.25 }}>
                            SKU: {item.variant_details.sku}
                        </Typography>
                    )}
                </Box>

                {/* Unit Price */}
                <Typography
                    sx={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: isGift ? '#888' : isLens ? '#00838f' : '#555',
                        minWidth: 55,
                        textAlign: 'right',
                        fontStyle: isGift ? 'italic' : 'normal',
                    }}
                >
                    {isGift ? 'Free' : formatCurrency(item.unit_price)}
                </Typography>

                {/* Quantity */}
                <Box sx={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
                    {!isGift && !isLens ? (
                        <QuantitySelector
                            quantity={item.quantity}
                            onIncrease={() => onQuantityChange(item.id, item.quantity + 1)}
                            onDecrease={() => onQuantityChange(item.id, item.quantity - 1)}
                            size="small"
                            disabled={loading}
                            maxQuantity={item.stock_quantity != null ? item.quantity + item.stock_quantity : undefined}
                        />
                    ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                            x{item.quantity}
                        </Typography>
                    )}
                </Box>

                {/* Total */}
                <Typography
                    sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isGift ? '#888' : isLens ? '#00838f' : '#333',
                        minWidth: 55,
                        textAlign: 'right',
                    }}
                >
                    {isGift ? formatCurrency(0) : formatCurrency(itemTotal)}
                </Typography>

                {/* Remove button */}
                <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                    {!isGift && !isLens && (
                        <IconButton
                            size="small"
                            onClick={() => onRemove(item.id)}
                            disabled={loading}
                            sx={{
                                p: 0.5,
                                color: '#bbb',
                                '&:hover': { color: '#666', bgcolor: 'transparent' },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

// =====================================================
// Main Cart Item Row Component
// =====================================================
interface CartItemRowProps {
    item: CartItemWithDetails;
    onQuantityChange: (itemId: string, quantity: number) => void;
    onRemove: (itemId: string) => void;
    onFavorite: (itemId: string) => void;
    onEdit: (item: CartItemWithDetails) => void;
    onViewLensDetails: (lensItem: CartItemWithDetails, parentItem: CartItemWithDetails) => void;
    loading?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
    item,
    onQuantityChange,
    onRemove,
    onFavorite,
    onEdit,
    onViewLensDetails,
    loading = false,
}) => {
    const calculateItemTotal = (cartItem: CartItemWithDetails): number => {
        const selfTotal = cartItem.unit_price * cartItem.quantity;
        const childrenTotal = cartItem.children.reduce(
            (sum: number, child: CartItemWithDetails) => sum + child.unit_price * child.quantity,
            0
        );
        return selfTotal + childrenTotal;
    };

    const itemTotal = calculateItemTotal(item);
    const hasLens = item.children.some(c => c.item_type === 'LENS');

    // Sort children: LENS first, then ACCESSORY, then GIFT
    const sortedChildren = [...item.children].sort((a, b) => {
        const order: Record<string, number> = { LENS: 0, ACCESSORY: 1, GIFT: 2 };
        return (order[a.item_type || ''] ?? 3) - (order[b.item_type || ''] ?? 3);
    });

    return (
        <Box sx={{ py: 2.5, px: 3 }}>
            {/* Main Item */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                {/* Product Image */}
                <Box
                    onClick={() => onEdit(item)}
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: '#f5f5f5',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #eee',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: '#00838f',
                            boxShadow: '0 0 0 2px rgba(0,131,143,0.15)',
                        },
                    }}
                >
                    {item.variant_details?.image_url ? (
                        <Box
                            component="img"
                            src={item.variant_details.image_url}
                            alt={item.product.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <Box
                            component="svg"
                            sx={{ width: 32, height: 32, color: '#ccc' }}
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                            />
                        </Box>
                    )}
                </Box>

                {/* Product Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                            onClick={() => onEdit(item)}
                            sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                color: '#111',
                                mb: 0.25,
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                '&:hover': { color: '#00838f' },
                            }}
                        >
                            {item.product.name}
                        </Typography>
                        {item.item_type === 'FRAME' && (
                            <Chip
                                label="FRAME"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    bgcolor: '#111',
                                    color: '#fff',
                                    '& .MuiChip-label': { px: 1 },
                                }}
                            />
                        )}
                        {hasLens && (
                            <Chip
                                label="+ LENS"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    bgcolor: '#00838f',
                                    color: '#fff',
                                    '& .MuiChip-label': { px: 1 },
                                }}
                            />
                        )}
                    </Stack>
                    {item.product.brand && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.25 }}>
                            {item.product.brand.name}
                        </Typography>
                    )}
                    <Typography
                        sx={{
                            color: '#999',
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {item.product.description}
                    </Typography>
                    {item.variant_details && (
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            {item.variant_details.sku && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>
                                    SKU: {item.variant_details.sku}
                                </Typography>
                            )}
                            {item.variant_details.color && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>
                                    • {item.variant_details.color}
                                </Typography>
                            )}
                            {item.variant_details.size && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>
                                    • Size {item.variant_details.size}
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Box>

                {/* Unit Price */}
                <Typography
                    sx={{
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        color: '#666',
                        minWidth: 70,
                        textAlign: 'right',
                    }}
                >
                    {formatCurrency(item.unit_price)}
                </Typography>

                {/* Quantity */}
                <Box sx={{ minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => onQuantityChange(item.id, item.quantity + 1)}
                        onDecrease={() => onQuantityChange(item.id, item.quantity - 1)}
                        disabled={loading}
                        maxQuantity={item.stock_quantity != null ? item.quantity + item.stock_quantity : undefined}
                    />
                </Box>

                {/* Total Price */}
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#111',
                        minWidth: 80,
                        textAlign: 'right',
                    }}
                >
                    {formatCurrency(itemTotal)}
                </Typography>

                {/* Actions */}
                <Stack direction="row" spacing={0.5} sx={{ minWidth: 88 }}>
                    <IconButton
                        size="small"
                        onClick={() => onEdit(item)}
                        disabled={loading}
                        title="Edit item"
                        sx={{
                            color: '#ccc',
                            transition: 'all 0.2s',
                            '&:hover': { color: '#00838f', bgcolor: 'transparent' },
                        }}
                    >
                        <EditIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => onFavorite(item.id)}
                        disabled={loading}
                        sx={{
                            color: '#ccc',
                            transition: 'all 0.2s',
                            '&:hover': { color: '#666', bgcolor: 'transparent' },
                        }}
                    >
                        <FavoriteIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => onRemove(item.id)}
                        disabled={loading}
                        sx={{
                            color: '#ccc',
                            transition: 'all 0.2s',
                            '&:hover': { color: '#666', bgcolor: 'transparent' },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Stack>
            </Box>

            {/* Child Items (Lens/Accessories/Gifts) */}
            {sortedChildren.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                    {sortedChildren.map((child: CartItemWithDetails, index: number) => (
                        <ChildItem
                            key={child.id}
                            item={child}
                            isLast={index === sortedChildren.length - 1}
                            onQuantityChange={onQuantityChange}
                            onRemove={onRemove}
                            onViewDetails={
                                child.item_type === 'LENS'
                                    ? () => onViewLensDetails(child, item)
                                    : undefined
                            }
                            loading={loading}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

// =====================================================
// Loading Skeleton
// =====================================================
const CartItemSkeleton: React.FC = () => (
    <Box sx={{ py: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Skeleton variant="rounded" width={80} height={80} sx={{ borderRadius: '12px' }} />
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={18} />
                <Skeleton variant="text" width="80%" height={16} />
            </Box>
            <Skeleton variant="text" width={60} />
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="text" width={70} />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
            </Box>
        </Box>
    </Box>
);

// =====================================================
// Lens Detail Dialog Component
// =====================================================
interface LensDetailDialogProps {
    open: boolean;
    onClose: () => void;
    lensItem: CartItemWithDetails | null;
    parentItem: CartItemWithDetails | null;
    onEdit: (item: CartItemWithDetails) => void;
}

const LensDetailDialog: React.FC<LensDetailDialogProps> = ({
    open,
    onClose,
    lensItem,
    parentItem,
    onEdit,
}) => {
    if (!lensItem || !parentItem) return null;

    const framePrice = parentItem.unit_price * parentItem.quantity;
    const lensPrice = lensItem.unit_price * lensItem.quantity;
    const totalPrice = framePrice + lensPrice;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#fafafa',
                    borderBottom: '1px solid #eee',
                    py: 2,
                    px: 3,
                }}
            >
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>
                    Lens & Frame Details
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* Frame Section */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip
                            label="Eyeglass Frame"
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                bgcolor: '#111',
                                color: '#fff',
                            }}
                        />
                    </Stack>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: '12px',
                            borderColor: '#e5e5e5',
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {/* Frame image */}
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: '10px',
                                    border: '1px solid #eee',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                {parentItem.variant_details?.image_url ? (
                                    <Box
                                        component="img"
                                        src={parentItem.variant_details.image_url}
                                        alt={parentItem.product.name}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Box
                                        component="svg"
                                        sx={{ width: 28, height: 28, color: '#ccc' }}
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                                        />
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#111', mb: 0.5 }}>
                                    {parentItem.product.name}
                                </Typography>
                                {parentItem.product.brand && (
                                    <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 0.5 }}>
                                        {parentItem.product.brand.name}
                                    </Typography>
                                )}
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 0.5 }}>
                                    {parentItem.variant_details?.color && (
                                        <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                                            Màu: <strong>{parentItem.variant_details.color}</strong>
                                        </Typography>
                                    )}
                                    {parentItem.variant_details?.size && (
                                        <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                                            Size: <strong>{parentItem.variant_details.size}</strong>
                                        </Typography>
                                    )}
                                </Stack>
                                {parentItem.variant_details?.sku && (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#aaa' }}>
                                        SKU: {parentItem.variant_details.sku}
                                    </Typography>
                                )}
                            </Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#111', flexShrink: 0 }}>
                                {formatCurrency(framePrice)}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Lens Section */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip
                            label="Lens"
                            size="small"
                            sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                bgcolor: '#00838f',
                                color: '#fff',
                            }}
                        />
                    </Stack>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: '12px',
                            borderColor: 'rgba(0,131,143,0.3)',
                            bgcolor: '#f9fefe',
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '8px',
                                    bgcolor: 'rgba(0,131,143,0.1)',
                                    border: '1px solid rgba(0,131,143,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <LensIcon sx={{ fontSize: 20, color: '#00838f' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#00838f', mb: 0.5 }}>
                                    {lensItem.product.name}
                                </Typography>

                                {lensItem.lens_selection ? (
                                    <>
                                        {/* Usage */}
                                        {lensItem.lens_selection.usage && (
                                        <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
                                            Purpose: <strong>{lensItem.lens_selection.usage.name}</strong>
                                        </Typography>
                                        )}

                                        {/* Prescription */}
                                        {lensItem.lens_selection.prescription && (
                                            <Box sx={{ mb: 0.75, p: 1, bgcolor: 'rgba(0,131,143,0.04)', borderRadius: '6px' }}>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#555', fontWeight: 600, mb: 0.25 }}>
                                                    Prescription:
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                                    Right eye: SPH {lensItem.lens_selection.prescription.right_eye.sphere}
                                                    {lensItem.lens_selection.prescription.right_eye.cylinder
                                                        ? ` / CYL ${lensItem.lens_selection.prescription.right_eye.cylinder}` : ''}
                                                    {lensItem.lens_selection.prescription.right_eye.axis
                                                        ? ` / Axis ${lensItem.lens_selection.prescription.right_eye.axis}°` : ''}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                                    Left eye: SPH {lensItem.lens_selection.prescription.left_eye.sphere}
                                                    {lensItem.lens_selection.prescription.left_eye.cylinder
                                                        ? ` / CYL ${lensItem.lens_selection.prescription.left_eye.cylinder}` : ''}
                                                    {lensItem.lens_selection.prescription.left_eye.axis
                                                        ? ` / Axis ${lensItem.lens_selection.prescription.left_eye.axis}°` : ''}
                                                </Typography>
                                                {lensItem.lens_selection.prescription.right_eye.pd && (
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                                        PD: {lensItem.lens_selection.prescription.right_eye.pd}mm
                                                    </Typography>
                                                )}
                                                {lensItem.lens_selection.prescription.right_eye.add && (
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                                        ADD: {lensItem.lens_selection.prescription.right_eye.add}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}

                                        {/* Tint */}
                                        {lensItem.lens_selection.tint && (
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                                                    Lens color: <strong>{lensItem.lens_selection.tint.name}</strong>
                                                </Typography>
                                                {lensItem.lens_selection.tint.cssValue !== 'transparent' && (
                                                    <Box sx={{
                                                        width: 14,
                                                        height: 14,
                                                        borderRadius: '50%',
                                                        bgcolor: lensItem.lens_selection.tint.cssValue,
                                                        border: '1px solid #ccc',
                                                        opacity: lensItem.lens_selection.tint.opacity || 1,
                                                    }} />
                                                )}
                                            </Stack>
                                        )}

                                        {/* Features */}
                                        {(lensItem.lens_selection.features?.length ?? 0) > 0 && (
                                            <Box sx={{ mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, mb: 0.25 }}>
                                                    Features:
                                                </Typography>
                                                {lensItem.lens_selection.features.map(f => (
                                                    <Typography key={f.id} sx={{ fontSize: '0.75rem', color: '#666', pl: 1 }}>
                                                        • {f.name}{f.price > 0 ? ` (+${formatCurrency(f.price)})` : ''}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    lensItem.product.description && (
                                        <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
                                            {lensItem.product.description}
                                        </Typography>
                                    )
                                )}

                                {lensItem.variant_details?.sku && (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#aaa' }}>
                                        SKU: {lensItem.variant_details.sku}
                                    </Typography>
                                )}
                            </Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#00838f', flexShrink: 0 }}>
                                {formatCurrency(lensPrice)}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Total */}
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color: '#666' }}>
                        Total
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#111' }}>
                        {formatCurrency(totalPrice)}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid #eee',
                    bgcolor: '#fafafa',
                }}
            >
                <Button
                    onClick={onClose}
                    sx={{
                        color: '#888',
                        textTransform: 'none',
                        fontWeight: 500,
                    }}
                >
                    Close
                </Button>
                <Button
                    variant="contained"
                    disableElevation
                    onClick={() => {
                        onClose();
                        onEdit(parentItem);
                    }}
                    startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                    sx={{
                        bgcolor: '#111',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '10px',
                        px: 3,
                        '&:hover': { bgcolor: '#333' },
                    }}
                >
                    Edit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// =====================================================
// Main Shopping Cart Component
// =====================================================
const ShoppingCart: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user?.roles?.includes('ADMIN')) {
            navigate(PAGE_ENDPOINTS.DASHBOARD, { replace: true });
        }
    }, [user, navigate]);

    const {
        cartData,
        summary,
        isLoading,
        updateItemQuantity,
        removeItem: removeCartItem,
        applyCoupon,
        removeCoupon,
    } = useCart();

    const [updating, setUpdating] = useState(false);
    const [promoCode, setPromoCode] = useState(summary.applied_coupon?.code || '');
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({ open: false, message: '', severity: 'success' });
    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        lensItem: CartItemWithDetails | null;
        parentItem: CartItemWithDetails | null;
    }>({ open: false, lensItem: null, parentItem: null });

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleQuantityChange = useCallback(async (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        try {
            setUpdating(true);
            await updateItemQuantity(itemId, quantity);
        } catch (err: unknown) {
            const msg =
                err instanceof Error && err.message
                    ? err.message
                    : 'Insufficient stock or failed to update quantity';
            showSnackbar(msg, 'error');
        } finally {
            setUpdating(false);
        }
    }, [updateItemQuantity]);

    const handleRemoveItem = useCallback(async (itemId: string) => {
        try {
            setUpdating(true);
            await removeCartItem(itemId);
            showSnackbar('Item removed from cart', 'success');
        } catch {
            showSnackbar('Failed to remove item', 'error');
        } finally {
            setUpdating(false);
        }
    }, [removeCartItem]);

    const handleFavorite = useCallback((_itemId: string) => {
        showSnackbar('Added to wishlist', 'success');
    }, []);

    const handleViewLensDetails = useCallback((lensItem: CartItemWithDetails, parentItem: CartItemWithDetails) => {
        setDetailDialog({ open: true, lensItem, parentItem });
    }, []);

    const handleEditItem = useCallback((item: CartItemWithDetails) => {
        const slug = item.product.slug;
        if (!slug) {
            setSnackbar({ open: true, message: 'Unable to open this product. Please reload the page.', severity: 'error' });
            return;
        }
        const sku = item.variant_details?.sku || 'default';
        const hasLens = item.children.some(c => c.item_type === 'LENS');
        const params = new URLSearchParams();
        params.set('editCartItemId', item.id);
        if (hasLens) {
            params.set('lens', 'open');
        }
        navigate(`/product/${slug}/${sku}?${params.toString()}`);
    }, [navigate, setSnackbar]);

    const handleApplyCoupon = async () => {
        if (!promoCode.trim()) return;
        try {
            setUpdating(true);
            const result = await applyCoupon(promoCode);
            showSnackbar(result.message, result.success ? 'success' : 'error');
        } catch {
            showSnackbar('Failed to apply coupon', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveCoupon = async () => {
        try {
            setUpdating(true);
            await removeCoupon();
            setPromoCode('');
            showSnackbar('Coupon removed', 'success');
        } catch {
            showSnackbar('Failed to remove coupon', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const [showStockDialog, setShowStockDialog] = useState(false);

    const hasCoupon = !!summary.applied_coupon;
    const couponMatches = hasCoupon && summary.applied_coupon?.code === promoCode.toUpperCase();
    const items = cartData?.items || [];
    const exceededItems = items.filter(
        (i) => i.stock_quantity != null && i.quantity > i.stock_quantity,
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f8f8', py: 5, px: 3 }}>
            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
                {/* Header */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        mb: 4,
                        color: '#111',
                        letterSpacing: '-0.5px',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1.5,
                    }}
                >
                    Cart
                    <Typography
                        component="span"
                        sx={{ fontSize: '1.1rem', fontWeight: 400, color: '#999' }}
                    >
                        {isLoading ? '...' : summary.items_count}
                    </Typography>
                </Typography>

                {/* Cart Table */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '16px',
                        border: '1px solid #e5e5e5',
                        bgcolor: '#fff',
                        overflow: 'hidden',
                        mb: 3,
                    }}
                >
                    {/* Table Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                            py: 2,
                            px: 3,
                            bgcolor: '#fafafa',
                            borderBottom: '1px solid #eee',
                        }}
                    >
                        <Box sx={{ width: 80 }} />
                        <Typography
                            sx={{
                                flex: 1,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Item
                        </Typography>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                minWidth: 70,
                                textAlign: 'right',
                            }}
                        >
                            Price
                        </Typography>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                minWidth: 100,
                                textAlign: 'center',
                            }}
                        >
                            Quantity
                        </Typography>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                minWidth: 80,
                                textAlign: 'right',
                            }}
                        >
                            Total
                        </Typography>
                        <Box sx={{ minWidth: 88 }} />
                    </Box>

                    {/* Cart Items */}
                    {isLoading ? (
                        <>
                            <CartItemSkeleton />
                            <Divider sx={{ borderColor: '#f0f0f0' }} />
                            <CartItemSkeleton />
                            <Divider sx={{ borderColor: '#f0f0f0' }} />
                            <CartItemSkeleton />
                        </>
                    ) : items.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <Typography sx={{ color: '#999', fontSize: '1rem' }}>
                                Your cart is empty
                            </Typography>
                            <Button
                                onClick={() => navigate('/products')}
                                sx={{
                                    mt: 2,
                                    color: '#333',
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#f5f5f5' },
                                }}
                            >
                                Continue Shopping
                            </Button>
                        </Box>
                    ) : (() => {
                        const groups: { shopName: string; shopId: string; items: CartItemWithDetails[] }[] = [];
                        for (const item of items) {
                            const key = item.shop_id || 'unknown';
                            const name = item.shop_name || '';
                            const existing = groups.find(g => g.shopId === key);
                            if (existing) existing.items.push(item);
                            else groups.push({ shopId: key, shopName: name, items: [item] });
                        }
                        return groups.map((group, gi) => (
                            <React.Fragment key={group.shopId}>
                                {gi > 0 && <Divider sx={{ borderColor: '#f0f0f0' }} />}
                                {/* Shop Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1.5, bgcolor: '#fafafa' }}>
                                    <StorefrontIcon sx={{ fontSize: 10, color: '#555' }} />
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', letterSpacing: '0.5px' }}>
                                        {group.shopName || 'SHOP'}
                                    </Typography>
                                </Box>
                                <Divider sx={{ borderColor: '#f0f0f0' }} />
                                {group.items.map((item, idx) => (
                                    <React.Fragment key={item.id}>
                                        {idx > 0 && <Divider sx={{ borderColor: '#f0f0f0' }} />}
                                        <CartItemRow
                                            item={item}
                                            onQuantityChange={handleQuantityChange}
                                            onRemove={handleRemoveItem}
                                            onFavorite={handleFavorite}
                                            onEdit={handleEditItem}
                                            onViewLensDetails={handleViewLensDetails}
                                            loading={updating}
                                        />
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ));
                    })()}
                </Paper>

                {/* Promo Code Section */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        mb: 4,
                        flexWrap: 'wrap',
                    }}
                >
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem', color: '#666' }}>
                        Promocode
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TextField
                            size="small"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter code"
                            disabled={updating}
                            sx={{
                                width: 150,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    bgcolor: '#fff',
                                    fontSize: '0.9rem',
                                    '& fieldset': { borderColor: '#ddd', borderWidth: '1.5px' },
                                    '&:hover fieldset': { borderColor: '#bbb' },
                                    '&.Mui-focused fieldset': { borderColor: '#888', borderWidth: '1.5px' },
                                },
                            }}
                            InputProps={{
                                endAdornment: couponMatches && (
                                    <CheckCircleIcon sx={{ color: '#333', fontSize: 20 }} />
                                ),
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleApplyCoupon();
                            }}
                        />
                        {!couponMatches && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleApplyCoupon}
                                disabled={updating || !promoCode.trim()}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: '#ddd',
                                    borderWidth: '1.5px',
                                    color: '#333',
                                    px: 2.5,
                                    '&:hover': {
                                        borderColor: '#aaa',
                                        bgcolor: '#fafafa',
                                        borderWidth: '1.5px',
                                    },
                                }}
                            >
                                Apply
                            </Button>
                        )}
                        {hasCoupon && (
                            <Button
                                size="small"
                                onClick={handleRemoveCoupon}
                                disabled={updating}
                                sx={{
                                    color: '#888',
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    '&:hover': { color: '#333', bgcolor: 'transparent' },
                                }}
                            >
                                Remove
                            </Button>
                        )}
                    </Box>

                    {hasCoupon && (
                        <Typography sx={{ fontSize: '0.9rem', color: '#444', fontWeight: 500 }}>
                            Congrats! You have{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: '#111' }}>
                                {summary.applied_coupon?.discount_type === 'percentage'
                                    ? `${summary.applied_coupon.discount_value}%`
                                    : formatCurrency(summary.applied_coupon?.discount_value ?? 0)}
                            </Box>{' '}
                            discount
                        </Typography>
                    )}

                    {summary.coupon_discount > 0 && (
                        <Typography
                            sx={{ ml: 'auto', fontSize: '0.9rem', fontWeight: 500, color: '#666' }}
                        >
                            Discount:{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: '#111' }}>
                                -{formatCurrency(summary.coupon_discount)}
                            </Box>
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ borderColor: '#e5e5e5', mb: 3 }} />

                {/* Footer */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        variant="contained"
                        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                        onClick={() => navigate('/products')}
                        disableElevation
                        sx={{
                            bgcolor: '#111',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#333', boxShadow: 'none' },
                        }}
                    >
                        Back to shopping
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Stack spacing={0.5} sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
                                Subtotal: {formatCurrency(summary.items_subtotal)}
                            </Typography>
                            {summary.coupon_discount > 0 && (
                                <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
                                    Discount: -{formatCurrency(summary.coupon_discount)}
                                </Typography>
                            )}
                        </Stack>

                        <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>
                            Total Price:{' '}
                            <Box
                                component="span"
                                sx={{
                                    fontWeight: 700,
                                    color: '#111',
                                    fontSize: '1.3rem',
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                {formatCurrency(summary.total_amount)}
                            </Box>
                        </Typography>

                        <Box
                            onClick={exceededItems.length > 0 && !isLoading && !updating ? () => setShowStockDialog(true) : undefined}
                            sx={{ cursor: exceededItems.length > 0 ? 'not-allowed' : 'default' }}
                        >
                            <Button
                                variant="contained"
                                size="large"
                                disableElevation
                                disabled={isLoading || updating || items.length === 0}
                                onClick={exceededItems.length > 0 ? undefined : () => navigate('/checkout')}
                                sx={{
                                    bgcolor: '#111',
                                    color: '#fff',
                                    px: 5,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    letterSpacing: '0.3px',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: exceededItems.length > 0 ? '#111' : '#333' },
                                    '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' },
                                    ...(exceededItems.length > 0 && {
                                        opacity: 0.5,
                                        filter: 'blur(0.4px)',
                                        pointerEvents: 'none',
                                    }),
                                }}
                            >
                                Check out
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Stock exceeded dialog */}
            <Dialog open={showStockDialog} onClose={() => setShowStockDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#d32f2f' }}>
                            Exceeds available stock
                        </Typography>
                        <IconButton size="small" onClick={() => setShowStockDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ fontSize: 13, color: '#555', mb: 1.5 }}>
                        Some items exceed the available stock. Please adjust the quantity before checkout:
                    </Typography>
                    {exceededItems.map((item) => (
                        <Box
                            key={item.id}
                            sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f0f0f0' }}
                        >
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }} noWrap>
                                {item.product?.name || 'Product'}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#d32f2f', flexShrink: 0, ml: 2 }}>
                                Requested {item.quantity} / Available {item.stock_quantity ?? 0}
                            </Typography>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="contained"
                        disableElevation
                        onClick={() => setShowStockDialog(false)}
                        sx={{ bgcolor: '#d32f2f', color: '#fff', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none', fontWeight: 600 }}
                    >
                        Close & Adjust
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Lens Detail Dialog */}
            <LensDetailDialog
                open={detailDialog.open}
                onClose={() => setDetailDialog({ open: false, lensItem: null, parentItem: null })}
                lensItem={detailDialog.lensItem}
                parentItem={detailDialog.parentItem}
                onEdit={handleEditItem}
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    sx={{
                        bgcolor: snackbar.severity === 'success' ? '#222' : '#d32f2f',
                        color: '#fff',
                        '& .MuiAlert-icon': { color: '#fff' },
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ShoppingCart;
