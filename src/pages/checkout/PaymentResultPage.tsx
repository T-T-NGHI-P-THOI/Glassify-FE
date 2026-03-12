import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Receipt,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/formatCurrency';
import { paymentApi, type PaymentResultResponse } from '@/api/payment-api';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResultResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    if (!vnpResponseCode) {
      setLoading(false);
      setError(true);
      return;
    }

    // Forward all vnp_* params to BE so it can validate signature and credit wallet
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    paymentApi.processVnpayReturn(params)
      .then((res) => setResult(res))
      .catch(() => {
        // Fallback: build result from URL params directly (display only)
        const amount = searchParams.get('vnp_Amount');
        setResult({
          status: vnpResponseCode === '00' ? 'SUCCESS' : 'FAILED',
          message: vnpResponseCode === '00' ? 'Payment completed successfully!' : 'Payment failed.',
          txnRef: searchParams.get('vnp_TxnRef') || '',
          orderId: '',
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

        {/* Payment Details */}
        {result && (
          <Box
            sx={{
              textAlign: 'left',
              bgcolor: '#f9f9f9',
              borderRadius: 2,
              p: 2.5,
              mb: 3,
            }}
          >
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
        )}

        {/* Actions */}
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
      </Paper>
    </Box>
  );
};

function formatPayDate(payDate: string): string {
  // VNPay format: yyyyMMddHHmmss
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
