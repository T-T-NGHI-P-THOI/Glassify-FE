import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close, DeleteOutline, WarningAmberRounded } from '@mui/icons-material';
import { useState } from 'react';
import { CustomButton } from '@/components/custom';
import ProductAPI from '@/api/product-api';
import { toast } from 'react-toastify';
import type { ProductSize } from '@/types/product.enums';


interface DeleteVariantDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    variantId?: string;
    variantSize: ProductSize;
    colorName?: string;
}

const DeleteVariantDialog = ({
    open,
    onClose,
    onConfirm,
    variantId,
    variantSize,
    colorName
}: DeleteVariantDialogProps) => {

    const theme = useTheme();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!variantId) return;

        try {
            setIsDeleting(true);

            await ProductAPI.deleteFrameVariant(variantId);

            toast.success('Delete variant successful!');
            onConfirm?.();
            onClose();
        } catch (err: any) {
            err.errors.map((message: any) => {
                toast.error(message);
            })
        } finally {
            setIsDeleting(false);
        }
    };

    const variantName = `${variantSize} - ${colorName}`;

    return (
        <Dialog
            open={open}
            onClose={!isDeleting ? onClose : undefined}
            disableEscapeKeyDown={isDeleting}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                },
            }}
        >
            <DialogTitle sx={{ p: 2.5, pb: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: theme.palette.custom.status.error.light,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.5,
                        }}
                    >
                        <WarningAmberRounded
                            sx={{ color: theme.palette.custom.status.error.main, fontSize: 22 }}
                        />
                    </Box>

                    <IconButton
                        size="small"
                        onClick={onClose}
                        disabled={isDeleting}
                        sx={{ mt: -0.5, color: theme.palette.custom.neutral[400] }}
                    >
                        <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                <Typography
                    sx={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: theme.palette.custom.neutral[800]
                    }}
                >
                    Delete Frame Variant
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, py: 1.5 }}>
                {variantName && (
                    <Box
                        sx={{
                            bgcolor: theme.palette.custom.neutral[50],
                            border: `1px solid ${theme.palette.custom.border.light}`,
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 1,
                            mb: 1.5,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: theme.palette.custom.neutral[700]
                            }}
                        >
                            {variantName}
                        </Typography>
                    </Box>
                )}

                <Typography
                    sx={{
                        fontSize: 13,
                        color: theme.palette.custom.neutral[500],
                        lineHeight: 1.6
                    }}
                >
                    This action cannot be undone. The selected variant and all related data will be permanently removed.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>

                <CustomButton
                    variant="outlined"
                    onClick={onClose}
                    disabled={isDeleting}
                    fullWidth
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: 13
                    }}
                >
                    Cancel
                </CustomButton>

                <CustomButton
                    variant="contained"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    fullWidth
                    startIcon={
                        isDeleting
                            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                            : <DeleteOutline sx={{ fontSize: 16 }} />
                    }
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        bgcolor: theme.palette.custom.status.error.main,
                        '&:hover': { bgcolor: '#b91c1c' },
                    }}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </CustomButton>

            </DialogActions>
        </Dialog>
    );
};

export default DeleteVariantDialog;