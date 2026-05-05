import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Receipt,
  AccessTime,
  CreditCard,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/formatCurrency';
import { paymentApi, type PaymentResultResponse } from '@/api/payment-api';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResultResponse | null>(null);
  const [error, setError] = useState(false);
  const [payingAgain, setPayingAgain] = useState(false);

  useLayoutConfig({ showNavbar: true, showFooter: true });

  useEffect(() => {
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    if (!vnpResponseCode) {
      setLoading(false);
      setError(true);
      return;
    }

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    paymentApi.processVnpayReturn(params)
      .then((res) => {
        setResult(res);
        if (!res.orderId && res.status === 'SUCCESS') {
          const returnTo = sessionStorage.getItem('topup_return_to');
          if (returnTo) {
            sessionStorage.removeItem('topup_return_to');
            navigate(returnTo);
          }
        }
      })
      .catch(() => {
        const amount = searchParams.get('vnp_Amount');
        const pendingOrderId = sessionStorage.getItem('pending_vnpay_order_id') || '';
        sessionStorage.removeItem('pending_vnpay_order_id');
        setResult({
          status: vnpResponseCode === '00' ? 'SUCCESS' : 'FAILED',
          message: vnpResponseCode === '00' ? 'Payment completed successfully!' : 'Payment failed.',
          txnRef: searchParams.get('vnp_TxnRef') || '',
          orderId: pendingOrderId,
          orderNumber: searchParams.get('vnp_OrderInfo') || '',
          amount: amount ? parseInt(amount) / 100 : 0,
          transactionNo: searchParams.get('vnp_TransactionNo') || '',
          bankCode: searchParams.get('vnp_BankCode') || '',
          cardType: searchParams.get('vnp_CardType') || '',
          payDate: searchParams.get('vnp_PayDate') || '',
          responseCode: vnpResponseCode,
        });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handlePayAgain = async () => {
    if (!result) return;
    // orderId may be empty in fallback path — navigate to my-orders so user can retry from there
    if (!result.orderId) {
      navigate('/my-orders');
      return;
    }
    try {
      setPayingAgain(true);
      const res = await paymentApi.createVnpayPayment({ orderId: result.orderId });
      if (res.data) {
        window.location.href = res.data;
      }
    } catch {
      setPayingAgain(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
        <Cancel sx={{ fontSize: 72, color: '#d32f2f', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 1 }}>Invalid Payment Link</Typography>
        <Typography sx={{ fontSize: 14, color: '#666', mb: 3 }}>No payment data found. Please check your orders.</Typography>
        <Button variant="contained" onClick={() => navigate('/my-orders')} disableElevation
          sx={{ bgcolor: '#111', color: '#fff', px: 4, py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#333' } }}>
          View My Orders
        </Button>
      </Box>
    );
  }

  const isSuccess = result.status === 'SUCCESS';
  // Detect failed/cancelled order payment — check responseCode directly so fallback path
  // (where orderId may be empty string) also works correctly.
  const isCancelledOrFailed =
    !isSuccess &&
    result.responseCode !== undefined &&
    result.responseCode !== '' &&
    // Only show for order payments, not wallet top-ups (top-ups have no order context)
    (!!result.orderId || (result.txnRef && !result.txnRef.startsWith('TOPUP_')));

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', px: 3, py: 8 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e5e5e5', textAlign: 'center' }}>
        {/* Status Icon */}
        {isSuccess ? (
          <CheckCircle sx={{ fontSize: 72, color: '#4caf50', mb: 2 }} />
        ) : (
          <Cancel sx={{ fontSize: 72, color: '#d32f2f', mb: 2 }} />
        )}

        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111', mb: 1 }}>
          {isSuccess ? 'Payment Successful' : 'Payment Failed'}
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#666', mb: 3 }}>
          {result?.message || 'Unable to determine payment status.'}
        </Typography>

        {/* 24h Warning for failed/cancelled order payments */}
        {isCancelledOrFailed && (
          <Alert
            severity="warning"
            icon={<AccessTime fontSize="small" />}
            sx={{ mb: 3, textAlign: 'left', fontSize: 13 }}
          >
            <strong>Đơn hàng chưa được thanh toán.</strong> Nếu không hoàn tất thanh toán trong vòng{' '}
            <strong>24 giờ</strong> kể từ khi đặt hàng, đơn hàng sẽ tự động bị huỷ.
          </Alert>
        )}

        {/* Payment Details */}
        <Box sx={{ textAlign: 'left', bgcolor: '#f9f9f9', borderRadius: 2, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Receipt sx={{ fontSize: 20, color: '#666' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
              Transaction Details
            </Typography>
          </Box>

          {[
            { label: 'Amount', value: formatCurrency(result.amount) },
            { label: 'Transaction No', value: result.transactionNo || '---' },
            { label: 'Reference', value: result.txnRef || '---' },
            { label: 'Bank', value: result.bankCode || '---' },
            { label: 'Card Type', value: result.cardType || '---' },
            { label: 'Date', value: result.payDate ? formatPayDate(result.payDate) : '---' },
          ].map((row) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
              <Typography sx={{ fontSize: 13, color: '#888' }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{row.value}</Typography>
            </Box>
          ))}
        </Box>

        {/* Actions */}
        {isCancelledOrFailed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              disableElevation
              disabled={payingAgain}
              onClick={handlePayAgain}
              startIcon={payingAgain ? <CircularProgress size={16} color="inherit" /> : <CreditCard />}
              sx={{
                bgcolor: '#111',
                color: '#fff',
                py: 1.3,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&:hover': { bgcolor: '#333' },
              }}
            >
              {payingAgain ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/my-orders')}
              sx={{
                py: 1.3,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#ddd',
                color: '#555',
                '&:hover': { borderColor: '#bbb', bgcolor: '#f5f5f5' },
              }}
            >
              Xem đơn hàng của tôi
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate(result.orderId ? '/my-orders' : '/wallet')}
              disableElevation
              sx={{
                bgcolor: '#111',
                color: '#fff',
                px: 4,
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#333' },
              }}
            >
              {result.orderId ? 'View My Orders' : 'View My Wallet'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/products')}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#ddd',
                color: '#555',
                '&:hover': { borderColor: '#bbb', bgcolor: '#f5f5f5' },
              }}
            >
              Continue Shopping
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

function formatPayDate(payDate: string): string {
  if (payDate.length === 14) {
    const y = payDate.slice(0, 4);
    const m = payDate.slice(4, 6);
    const d = payDate.slice(6, 8);
    const h = payDate.slice(8, 10);
    const min = payDate.slice(10, 12);
    const s = payDate.slice(12, 14);
    return `${d}/${m}/${y} ${h}:${min}:${s}`;
  }
  return payDate;
}

export default PaymentResultPage;
