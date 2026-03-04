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

interface PaymentResult {
  status: string;
  message: string;
  txnRef: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  transactionNo: string;
  bankCode: string;
  cardType: string;
  payDate: string;
  responseCode: string;
}

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    // Parse VNPay return params from URL
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const vnpTxnRef = searchParams.get('vnp_TxnRef');
    const vnpAmount = searchParams.get('vnp_Amount');
    const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
    const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
    const vnpBankCode = searchParams.get('vnp_BankCode');
    const vnpCardType = searchParams.get('vnp_CardType');
    const vnpPayDate = searchParams.get('vnp_PayDate');

    if (vnpResponseCode) {
      const isSuccess = vnpResponseCode === '00';
      setResult({
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        message: isSuccess ? 'Payment completed successfully!' : 'Payment failed. Please try again or contact support.',
        txnRef: vnpTxnRef || '',
        orderId: '',
        orderNumber: vnpOrderInfo || '',
        amount: vnpAmount ? parseInt(vnpAmount) / 100 : 0, // VNPay returns amount * 100
        transactionNo: vnpTransactionNo || '',
        bankCode: vnpBankCode || '',
        cardType: vnpCardType || '',
        payDate: vnpPayDate || '',
        responseCode: vnpResponseCode,
      });
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isSuccess = result?.status === 'SUCCESS';

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
            onClick={() => navigate('/my-orders')}
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
            View My Orders
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
