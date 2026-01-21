import React, { useState } from 'react';
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

// Types
interface CartItemAccessory {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: 'accessory' | 'gift';
}

interface CartItem {
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    image?: string;
    accessories?: CartItemAccessory[];
}

interface PromoCode {
    code: string;
    discountPercent: number;
    isValid: boolean;
}

// Mock Data
const initialCartItems: CartItem[] = [
    {
        id: '1',
        name: 'Vel pellentesque bibendum',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        price: 33.9,
        quantity: 1,
        accessories: [
            {
                id: '1a',
                name: 'Bảo hành mở rộng 12 tháng',
                price: 5.0,
                quantity: 1,
                type: 'accessory',
            },
            {
                id: '1b',
                name: 'Túi đựng cao cấp',
                price: 0,
                quantity: 1,
                type: 'gift',
            },
        ],
    },
    {
        id: '2',
        name: 'Magna quis at non',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Libero.',
        price: 14.9,
        quantity: 1,
    },
    {
        id: '3',
        name: 'Cursus tortor ac eget',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        price: 16.9,
        quantity: 1,
        accessories: [
            {
                id: '3a',
                name: 'Dây đeo thay thế',
                price: 3.5,
                quantity: 1,
                type: 'accessory',
            },
        ],
    },
];

// Quantity Selector Component
const QuantitySelector: React.FC<{
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    size?: 'small' | 'medium';
}> = ({ quantity, onIncrease, onDecrease, size = 'medium' }) => {
    const isSmall = size === 'small';

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1.5px solid',
                borderColor: isSmall ? '#e0e0e0' : '#d0d0d0',
                borderRadius: isSmall ? '6px' : '8px',
                bgcolor: '#fff',
            }}
        >
            <IconButton
                size="small"
                onClick={onDecrease}
                disabled={quantity <= 1}
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
                sx={{
                    borderRadius: 0,
                    p: isSmall ? '2px 6px' : '6px 10px',
                    color: '#666',
                    '&:hover': { bgcolor: '#f5f5f5' },
                }}
            >
                <AddIcon sx={{ fontSize: isSmall ? 14 : 18 }} />
            </IconButton>
        </Box>
    );
};

// Accessory/Gift Item Component
const AccessoryItem: React.FC<{
    accessory: CartItemAccessory;
    onRemove: () => void;
    onQuantityChange: (newQuantity: number) => void;
    isLast: boolean;
}> = ({ accessory, onRemove, onQuantityChange, isLast }) => {
    const isGift = accessory.type === 'gift';

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

                {/* Name + Tag */}
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
                            {accessory.name}
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
                </Box>

                {/* Price */}
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
                    {isGift ? 'Free' : `$${accessory.price.toFixed(2)}`}
                </Typography>

                {/* Quantity */}
                <Box sx={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
                    {!isGift ? (
                        <QuantitySelector
                            quantity={accessory.quantity}
                            onIncrease={() => onQuantityChange(accessory.quantity + 1)}
                            onDecrease={() => onQuantityChange(accessory.quantity - 1)}
                            size="small"
                        />
                    ) : (
                        <Typography
                            sx={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}
                        >
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
                    {isGift ? '$0.00' : `$${(accessory.price * accessory.quantity).toFixed(2)}`}
                </Typography>

                {/* Remove */}
                <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                    {!isGift && (
                        <IconButton
                            size="small"
                            onClick={onRemove}
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

// Main Cart Item Row
const CartItemRow: React.FC<{
    item: CartItem;
    onRemove: () => void;
    onQuantityChange: (newQuantity: number) => void;
    onAccessoryRemove: (accessoryId: string) => void;
    onAccessoryQuantityChange: (accessoryId: string, newQuantity: number) => void;
    onFavorite: () => void;
}> = ({
    item,
    onRemove,
    onQuantityChange,
    onAccessoryRemove,
    onAccessoryQuantityChange,
    onFavorite,
}) => {
        const itemTotal = item.price * item.quantity;
        const accessoriesTotal =
            item.accessories?.reduce((sum, acc) => sum + acc.price * acc.quantity, 0) || 0;

        return (
            <Box sx={{ py: 2.5, px: 3 }}>
                {/* Main Item */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                    }}
                >
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
                        }}
                    >
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
                    </Box>

                    {/* Product Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                color: '#111',
                                mb: 0.5,
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                '&:hover': { color: '#444' },
                            }}
                        >
                            {item.name}
                        </Typography>
                        <Typography
                            sx={{
                                color: '#888',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {item.description}
                        </Typography>
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
                        ${item.price.toFixed(1)}
                    </Typography>

                    {/* Quantity */}
                    <Box sx={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                        <QuantitySelector
                            quantity={item.quantity}
                            onIncrease={() => onQuantityChange(item.quantity + 1)}
                            onDecrease={() => onQuantityChange(item.quantity - 1)}
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
                        ${(itemTotal + accessoriesTotal).toFixed(2)}
                    </Typography>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.5} sx={{ minWidth: 64 }}>
                        <IconButton
                            size="small"
                            onClick={onFavorite}
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
                            onClick={onRemove}
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

                {/* Accessories Section */}
                {item.accessories && item.accessories.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                        {item.accessories.map((accessory, index) => (
                            <AccessoryItem
                                key={accessory.id}
                                accessory={accessory}
                                onRemove={() => onAccessoryRemove(accessory.id)}
                                onQuantityChange={(qty) => onAccessoryQuantityChange(accessory.id, qty)}
                                isLast={index === (item.accessories?.length || 0) - 1}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

// Main Component
const ShoppingCart: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
    const [promoCode, setPromoCode] = useState<string>('HAPPY');
    const [appliedPromo, setAppliedPromo] = useState<PromoCode>({
        code: 'HAPPY',
        discountPercent: 10,
        isValid: true,
    });

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCartItems((items) =>
            items.map((item) =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleRemoveItem = (itemId: string) => {
        setCartItems((items) => items.filter((item) => item.id !== itemId));
    };

    const handleAccessoryQuantityChange = (
        itemId: string,
        accessoryId: string,
        newQuantity: number
    ) => {
        if (newQuantity < 1) return;
        setCartItems((items) =>
            items.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        accessories: item.accessories?.map((acc) =>
                            acc.id === accessoryId ? { ...acc, quantity: newQuantity } : acc
                        ),
                    }
                    : item
            )
        );
    };

    const handleRemoveAccessory = (itemId: string, accessoryId: string) => {
        setCartItems((items) =>
            items.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        accessories: item.accessories?.filter((acc) => acc.id !== accessoryId),
                    }
                    : item
            )
        );
    };

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === 'HAPPY') {
            setAppliedPromo({ code: 'HAPPY', discountPercent: 10, isValid: true });
        } else {
            setAppliedPromo({ code: promoCode, discountPercent: 0, isValid: false });
        }
    };

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => {
        const itemTotal = item.price * item.quantity;
        const accessoriesTotal =
            item.accessories?.reduce((sum, acc) => sum + acc.price * acc.quantity, 0) || 0;
        return total + itemTotal + accessoriesTotal;
    }, 0);

    const discount = appliedPromo.isValid
        ? (subtotal * appliedPromo.discountPercent) / 100
        : 0;

    const total = subtotal - discount;
    const itemCount = cartItems.length;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#f8f8f8',
                py: 5,
                px: 3,
            }}
        >
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
                        sx={{
                            fontSize: '1.1rem',
                            fontWeight: 400,
                            color: '#999',
                        }}
                    >
                        {itemCount}
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
                    {cartItems.map((item, index) => (
                        <React.Fragment key={item.id}>
                            {index > 0 && <Divider sx={{ borderColor: '#f0f0f0' }} />}
                            <CartItemRow
                                item={item}
                                onRemove={() => handleRemoveItem(item.id)}
                                onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                                onAccessoryRemove={(accId) => handleRemoveAccessory(item.id, accId)}
                                onAccessoryQuantityChange={(accId, qty) =>
                                    handleAccessoryQuantityChange(item.id, accId, qty)
                                }
                                onFavorite={() => { }}
                            />
                        </React.Fragment>
                    ))}
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
                    <Typography
                        sx={{
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            color: '#666',
                        }}
                    >
                        Promocode
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TextField
                            size="small"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter code"
                            sx={{
                                width: 150,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    bgcolor: '#fff',
                                    fontSize: '0.9rem',
                                    '& fieldset': {
                                        borderColor: '#ddd',
                                        borderWidth: '1.5px',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#bbb',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#888',
                                        borderWidth: '1.5px',
                                    },
                                },
                            }}
                            InputProps={{
                                endAdornment: appliedPromo.isValid &&
                                    appliedPromo.code === promoCode.toUpperCase() && (
                                        <CheckCircleIcon sx={{ color: '#333', fontSize: 20 }} />
                                    ),
                            }}
                        />
                        {(!appliedPromo.isValid ||
                            appliedPromo.code !== promoCode.toUpperCase()) && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleApplyPromo}
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
                    </Box>

                    {appliedPromo.isValid && (
                        <Typography
                            sx={{
                                fontSize: '0.9rem',
                                color: '#444',
                                fontWeight: 500,
                            }}
                        >
                            Congrats! You have{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: '#111' }}>
                                {appliedPromo.discountPercent}%
                            </Box>{' '}
                            discount
                        </Typography>
                    )}

                    {appliedPromo.isValid && (
                        <Typography
                            sx={{
                                ml: 'auto',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color: '#666',
                            }}
                        >
                            Discount:{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: '#111' }}>
                                ${discount.toFixed(2)}
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
                            '&:hover': {
                                bgcolor: 'transparent',
                                color: '#333',
                            },
                        }}
                    >
                        Back to shopping
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                                ${total.toFixed(2)}
                            </Box>
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            disableElevation
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
                                '&:hover': {
                                    bgcolor: '#333',
                                },
                            }}
                        >
                            Check out
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ShoppingCart;