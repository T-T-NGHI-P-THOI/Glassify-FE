// SetActiveDialog.tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { CheckCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { useState } from 'react';
import type { FrameVariantResponse } from '@/pages/Product/Frame/View/FrameGroupCard';
import ProductAPI from '@/api/product-api';
import { toast } from 'react-toastify';

interface SetActiveDialogProps {
    open: boolean;
    name: string;
    productId: string;
    isCurrentlyActive: boolean;
    onClose: () => void;
    onSuccess: (newActiveState: boolean) => void;
}

const SetActiveDialog = ({ open, name, productId, isCurrentlyActive, onClose, onSuccess }: SetActiveDialogProps) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Call your API here, e.g.:
            await ProductAPI.updateProductActivation(productId, !isCurrentlyActive);
            onSuccess(!isCurrentlyActive);
            onClose();
        } catch (err: any) {
            toast.error(err?.errors?.[0] ?? err?.message ?? "Something went wrong");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: 15 }}>
                {isCurrentlyActive ? 'Deactivate Variant' : 'Activate Variant'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    {isCurrentlyActive
                        ? <RemoveCircleOutline sx={{ color: '#dc2626', mt: 0.25 }} />
                        : <CheckCircleOutline sx={{ color: '#16a34a', mt: 0.25 }} />
                    }
                    <Typography fontSize={13} color="text.secondary">
                        {isCurrentlyActive
                            ? <>Are you sure you want to <strong>deactivate</strong> <strong>{name}</strong>? It will be hidden from customers.</>
                            : <>Are you sure you want to <strong>activate</strong> <strong>{name}</strong>? It will become visible to customers.</>
                        }
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} size="small" variant="outlined">Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    size="small"
                    variant="contained"
                    disabled={loading}
                    sx={{
                        bgcolor: isCurrentlyActive ? '#dc2626' : '#16a34a',
                        '&:hover': { bgcolor: isCurrentlyActive ? '#b91c1c' : '#15803d' },
                    }}
                >
                    {loading
                        ? (isCurrentlyActive ? 'Deactivating…' : 'Activating…')
                        : (isCurrentlyActive ? 'Deactivate' : 'Activate')
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SetActiveDialog;