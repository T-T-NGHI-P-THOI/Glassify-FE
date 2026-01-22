import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';
import type { CartItemWithDetails, CartResponse, CartSummary } from '@/api/service/Type';
import { CartService } from '@/api/service/CartService';
// =====================================================
// Quantity Selector Component
// =====================================================
interface QuantitySelectorProps {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    size?: 'small' | 'medium';
    disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onIncrease,
    onDecrease,
    size = 'medium',
    disabled = false,
}) => {
    const isSmall = size === 'small';

    return (
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
                disabled={disabled}
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
    );
};

// =====================================================
// Child Item (Accessory/Gift) Component
// =====================================================
interface ChildItemProps {
    item: CartItemWithDetails;
    isLast: boolean;
    onQuantityChange: (itemId: string, quantity: number) => void;
    onRemove: (itemId: string) => void;
    loading?: boolean;
}

const ChildItem: React.FC<ChildItemProps> = ({
    item,
    isLast,
    onQuantityChange,
    onRemove,
    loading = false,
}) => {
    const isGift = item.is_gift || item.unit_price === 0;
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
                    bgcolor: '#ddd',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: '20px',
                    height: '1px',
                    bgcolor: '#ddd',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    ml: '28px',
                    py: 1.5,
                    px: 2,
                    bgcolor: isGift ? '#fafafa' : '#fff',
                    border: '1px dashed',
                    borderColor: '#ddd',
                    borderRadius: '8px',
                    gap: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: '#bbb',
                        bgcolor: '#f8f8f8',
                    },
                }}
            >
                {/* Icon */}
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '6px',
                        bgcolor: isGift ? '#f0f0f0' : '#f5f5f5',
                        border: '1px solid',
                        borderColor: isGift ? '#e0e0e0' : '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {isGift ? (
                        <GiftIcon sx={{ fontSize: 16, color: '#666' }} />
                    ) : (
                        <AccessoryIcon sx={{ fontSize: 16, color: '#888' }} />
                    )}
                </Box>

                {/* Name + SKU + Tag */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#555',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {item.product.name}
                        </Typography>
                        {isGift && (
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
                        )}
                    </Stack>
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
                        color: isGift ? '#888' : '#555',
                        minWidth: 55,
                        textAlign: 'right',
                        fontStyle: isGift ? 'italic' : 'normal',
                    }}
                >
                    {isGift ? 'Free' : `$${item.unit_price.toFixed(2)}`}
                </Typography>

                {/* Quantity */}
                <Box sx={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
                    {!isGift ? (
                        <QuantitySelector
                            quantity={item.quantity}
                            onIncrease={() => onQuantityChange(item.id, item.quantity + 1)}
                            onDecrease={() => onQuantityChange(item.id, item.quantity - 1)}
                            size="small"
                            disabled={loading}
                        />
                    ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
                            ×1
                        </Typography>
                    )}
                </Box>

                {/* Total */}
                <Typography
                    sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isGift ? '#888' : '#333',
                        minWidth: 55,
                        textAlign: 'right',
                    }}
                >
                    {isGift ? '$0.00' : `$${itemTotal.toFixed(2)}`}
                </Typography>

                {/* Remove button */}
                <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                    {!isGift && (
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
    loading?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
    item,
    onQuantityChange,
    onRemove,
    onFavorite,
    loading = false,
}) => {
    // Calculate totals including children
    const calculateItemTotal = (cartItem: CartItemWithDetails): number => {
        const selfTotal = cartItem.unit_price * cartItem.quantity;
        const childrenTotal = cartItem.children.reduce(
            (sum: number, child: { unit_price: number; quantity: number; }) => sum + child.unit_price * child.quantity,
            0
        );
        return selfTotal + childrenTotal;
    };

    const itemTotal = calculateItemTotal(item);

    return (
        <Box sx={{ py: 2.5, px: 3 }}>
            {/* Main Item */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                {/* Product Image */}
                <Box
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
                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: '1rem',
                            color: '#111',
                            mb: 0.25,
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            '&:hover': { color: '#444' },
                        }}
                    >
                        {item.product.name}
                    </Typography>
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
                    ${item.unit_price.toFixed(2)}
                </Typography>

                {/* Quantity */}
                <Box sx={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                    <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => onQuantityChange(item.id, item.quantity + 1)}
                        onDecrease={() => onQuantityChange(item.id, item.quantity - 1)}
                        disabled={loading}
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
                    ${itemTotal.toFixed(2)}
                </Typography>

                {/* Actions */}
                <Stack direction="row" spacing={0.5} sx={{ minWidth: 64 }}>
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

            {/* Child Items (Accessories/Gifts) */}
            {item.children && item.children.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                    {item.children.map((child: any, index: number) => (
                        <ChildItem
                            key={child.id}
                            item={child}
                            isLast={index === item.children.length - 1}
                            onQuantityChange={onQuantityChange}
                            onRemove={onRemove}
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
            </Box>
        </Box>
    </Box>
);

// =====================================================
// Main Shopping Cart Component
// =====================================================
const ShoppingCart: React.FC = () => {
    const [cartData, setCartData] = useState<CartResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({ open: false, message: '', severity: 'success' });

    // Fetch cart data on mount
    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const data = await CartService.getCart();
            setCartData(data);
            if (data.summary.applied_coupon) {
                setPromoCode(data.summary.applied_coupon.code);
            }
        } catch (error) {
            showSnackbar('Failed to load cart', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleQuantityChange = useCallback(async (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        try {
            setUpdating(true);
            const data = await CartService.updateItemQuantity(itemId, quantity);
            setCartData(data);
        } catch (error) {
            showSnackbar('Failed to update quantity', 'error');
        } finally {
            setUpdating(false);
        }
    }, []);

    const handleRemoveItem = useCallback(async (itemId: string) => {
        try {
            setUpdating(true);
            const data = await CartService.removeItem(itemId);
            setCartData(data);
            showSnackbar('Item removed from cart', 'success');
        } catch (error) {
            showSnackbar('Failed to remove item', 'error');
        } finally {
            setUpdating(false);
        }
    }, []);

    const handleFavorite = useCallback((itemId: string) => {
        // TODO: Implement wishlist API
        showSnackbar('Added to wishlist', 'success');
    }, []);

    const handleApplyCoupon = async () => {
        if (!promoCode.trim()) return;
        try {
            setUpdating(true);
            const result = await CartService.applyCoupon(promoCode);
            if (result.success && result.data) {
                setCartData(result.data);
                showSnackbar(result.message, 'success');
            } else {
                showSnackbar(result.message, 'error');
            }
        } catch (error) {
            showSnackbar('Failed to apply coupon', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveCoupon = async () => {
        try {
            setUpdating(true);
            const data = await CartService.removeCoupon();
            setCartData(data);
            setPromoCode('');
            showSnackbar('Coupon removed', 'success');
        } catch (error) {
            showSnackbar('Failed to remove coupon', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const summary: CartSummary = cartData?.summary || {
        items_count: 0,
        items_subtotal: 0,
        promotion_discount: 0,
        coupon_discount: 0,
        shipping_fee: 0,
        tax_amount: 0,
        total_amount: 0,
        applied_promotions: [],
    };

    const hasCoupon = !!summary.applied_coupon;
    const couponMatches = hasCoupon && summary.applied_coupon?.code === promoCode.toUpperCase();

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
                        {loading ? '...' : summary.items_count}
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
                        <Box sx={{ minWidth: 64 }} />
                    </Box>

                    {/* Cart Items */}
                    {loading ? (
                        <>
                            <CartItemSkeleton />
                            <Divider sx={{ borderColor: '#f0f0f0' }} />
                            <CartItemSkeleton />
                            <Divider sx={{ borderColor: '#f0f0f0' }} />
                            <CartItemSkeleton />
                        </>
                    ) : cartData?.items.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                            <Typography sx={{ color: '#999', fontSize: '1rem' }}>
                                Your cart is empty
                            </Typography>
                            <Button
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
                    ) : (
                        cartData?.items.map((item: any, index: number) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <Divider sx={{ borderColor: '#f0f0f0' }} />}
                                <CartItemRow
                                    item={item}
                                    onQuantityChange={handleQuantityChange}
                                    onRemove={handleRemoveItem}
                                    onFavorite={handleFavorite}
                                    loading={updating}
                                />
                            </React.Fragment>
                        ))
                    )}
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
                            onKeyPress={(e) => {
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
                                    : `$${summary.applied_coupon?.discount_value.toFixed(2)}`}
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
                                -${summary.coupon_discount.toFixed(2)}
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
                        startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                        sx={{
                            color: '#888',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            '&:hover': { bgcolor: 'transparent', color: '#333' },
                        }}
                    >
                        Back to shopping
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {/* Summary breakdown */}
                        <Stack spacing={0.5} sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
                                Subtotal: ${summary.items_subtotal.toFixed(2)}
                            </Typography>
                            {summary.coupon_discount > 0 && (
                                <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
                                    Discount: -${summary.coupon_discount.toFixed(2)}
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
                                ${summary.total_amount.toFixed(2)}
                            </Box>
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            disableElevation
                            disabled={loading || updating || (cartData?.items.length || 0) === 0}
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
                                '&:hover': { bgcolor: '#333' },
                                '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' },
                            }}
                        >
                            Check out
                        </Button>
                    </Box>
                </Box>
            </Box>

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