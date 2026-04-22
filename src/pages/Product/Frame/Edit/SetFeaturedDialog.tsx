import {
    Dialog,
    Box,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { CustomButton } from '@/components/custom';
import ProductAPI from '@/api/product-api';
import type { FrameVariantResponse } from '../View/FrameGroupCard';
import { useState } from 'react';

interface SetFeaturedDialogProps {
    open: boolean;
    onClose: () => void;
    variant: FrameVariantResponse | null;
    onSuccess?: () => void;
}

const SetFeaturedDialog = ({
    open,
    onClose,
    variant,
    onSuccess,
}: SetFeaturedDialogProps) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!variant) return;

        try {
            setLoading(true);

            await ProductAPI.setIsFeaturedProduct(variant.productId ?? '');

            toast.success('Set featured successfully');

            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error('Failed to set featured');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 1 }}>
                    Set Featured Product
                </Typography>

                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
                    Do you want to set this variant as the featured product?
                </Typography>

                {variant && (
                    <Box
                        sx={{
                            bgcolor: theme.palette.custom.neutral[50],
                            p: 1.5,
                            borderRadius: 1.5,
                            mb: 2,
                        }}
                    >
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {variant.size} - {variant.colorName}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <CustomButton
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </CustomButton>

                    <CustomButton
                        fullWidth
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Confirm'}
                    </CustomButton>
                </Box>
            </Box>
        </Dialog>
    );
};

export default SetFeaturedDialog;