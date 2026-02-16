import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  Payment,
  ShoppingBag,
} from '@mui/icons-material';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { orderApi } from '@/api/order-api';
import { paymentApi } from '@/api/payment-api';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/formatCurrency';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartData, summary, isLoading: cartLoading, loadCart } = useCart();
  const { user } = useAuth();

  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setShippingName(user.fullName || '');
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = cartData?.items ?? [];
  const cartId = cartData?.cart?.id;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!shippingName.trim()) newErrors.shippingName = 'Name is required';
    if (!shippingPhone.trim()) newErrors.shippingPhone = 'Phone number is required';
    else if (!/^[0-9]{9,11}$/.test(shippingPhone.replace(/\s/g, ''))) newErrors.shippingPhone = 'Invalid phone number';
    if (!shippingAddress.trim()) newErrors.shippingAddress = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!cartId) {
      toast.error('Cart not found. Please add items first.');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await orderApi.createOrder({
        cartId,
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
      });

      const order = response.data;
      if (!order) {
        toast.error('Failed to create order');
        return;
      }

      if (paymentMethod === 'VNPAY') {
        // Create VNPay payment and redirect
        try {
          const paymentResponse = await paymentApi.createVnpayPayment({
            orderId: order.id,
            orderInfo: `Payment for order ${order.orderNumber}`,
          });
          const paymentUrl = paymentResponse.data;
          if (paymentUrl) {
            window.location.href = paymentUrl;
            return;
          }
        } catch {
          toast.error('Failed to create payment. Your order has been created, please pay later from My Orders.');
        }
      }

      toast.success('Order placed successfully!');
      navigate('/my-orders');
    } catch (error: unknown) {
      console.error('Failed to create order:', error);
      const msg = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateItemTotal = (item: typeof items[0]): number => {
    const selfTotal = item.unit_price * item.quantity;
    const childrenTotal = item.children.reduce((sum, child) => sum + child.unit_price * child.quantity, 0);
    return selfTotal + childrenTotal;
  };

  if (cartLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 8, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>Your cart is empty</Typography>
        <Button variant="contained" onClick={() => navigate('/products')} sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' } }}>
          Continue Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: 3, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/cart')}
          sx={{ color: '#666', textTransform: 'none' }}
        >
          Back to Cart
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111' }}>
          Checkout
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Left: Form */}
        <Box sx={{ flex: 1 }}>
          {/* Shipping Info */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e5e5e5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <LocalShipping sx={{ color: '#555' }} />
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                Shipping Information
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Full Name"
                fullWidth
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                error={!!errors.shippingName}
                helperText={errors.shippingName}
                size="small"
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                error={!!errors.shippingPhone}
                helperText={errors.shippingPhone}
                size="small"
              />
              <TextField
                label="Shipping Address"
                fullWidth
                multiline
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                error={!!errors.shippingAddress}
                helperText={errors.shippingAddress}
                size="small"
              />
              <TextField
                label="City (Optional)"
                fullWidth
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                size="small"
              />
              <TextField
                label="Note for seller (Optional)"
                fullWidth
                multiline
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                size="small"
              />
            </Box>
          </Paper>

          {/* Payment Method */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e5e5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Payment sx={{ color: '#555' }} />
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                Payment Method
              </Typography>
            </Box>

            <FormControl>
              <FormLabel sx={{ fontSize: 14, mb: 1, color: '#666' }}>
                Select your preferred payment method
              </FormLabel>
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <FormControlLabel
                  value="COD"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Cash on Delivery (COD)</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>Pay when you receive the package</Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
                <FormControlLabel
                  value="VNPAY"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>VNPay</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>Pay online via VNPay (ATM/Credit/Debit card)</Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
                <FormControlLabel
                  value="BANK_TRANSFER"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Bank Transfer</Typography>
                      <Typography sx={{ fontSize: 12, color: '#888' }}>Transfer directly to our bank account</Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Box>

        {/* Right: Order Summary */}
        <Box sx={{ width: 380, flexShrink: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e5e5', position: 'sticky', top: 20 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111', mb: 2 }}>
              Order Summary
            </Typography>

            {/* Items */}
            <Box sx={{ maxHeight: 320, overflowY: 'auto', mb: 2 }}>
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', gap: 1.5, mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: '#f5f5f5',
                      backgroundImage: item.variant_details?.image_url ? `url(${item.variant_details.image_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111' }} noWrap>
                      {item.product?.name || 'Product'}
                    </Typography>
                    {item.children.length > 0 && (
                      <Typography sx={{ fontSize: 11, color: '#888' }}>
                        + {item.children.map(c => c.product?.name || c.item_type).join(', ')}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111', mt: 0.5 }}>
                      {formatCurrency(calculateItemTotal(item))}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
                    x{item.quantity}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Totals */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, color: '#666' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{formatCurrency(summary.items_subtotal)}</Typography>
              </Box>
              {summary.coupon_discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: '#666' }}>Discount</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#d32f2f' }}>
                    -{formatCurrency(summary.coupon_discount)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, color: '#666' }}>Shipping</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {summary.shipping_fee > 0 ? formatCurrency(summary.shipping_fee) : 'Free'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Total</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                  {formatCurrency(summary.total_amount)}
                </Typography>
              </Box>
            </Box>

            {/* Place Order Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              disableElevation
              disabled={submitting}
              onClick={handlePlaceOrder}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{
                mt: 3,
                bgcolor: '#111',
                color: '#fff',
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#333' },
                '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' },
              }}
            >
              {submitting ? 'Placing Order...' : paymentMethod === 'VNPAY' ? 'Place Order & Pay' : 'Place Order'}
            </Button>

            {paymentMethod === 'VNPAY' && (
              <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
                You will be redirected to VNPay to complete payment after placing the order.
              </Alert>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CheckoutPage;
