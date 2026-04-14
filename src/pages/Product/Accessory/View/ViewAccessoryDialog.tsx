import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    IconButton,
    Grid,
    Chip,
    Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import type { Accessory } from './AccessoryCard';

interface ViewAccessoryDialogProps {
    open: boolean;
    onClose: () => void;
    accessory: Accessory | null;
}

const ViewAccessoryDialog = ({ open, onClose, accessory }: ViewAccessoryDialogProps) => {
    const theme = useTheme();

    const renderField = (label: string, value?: string | boolean | null) => (
        <Box>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                {value != null ? String(value) : '-'}
            </Typography>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Box>
                    <Typography fontWeight={600}>Accessory Details</Typography>
                    {accessory && (
                        <Typography fontSize={11} color="gray">
                            {accessory.id.slice(0, 8).toUpperCase()}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose}><Close /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {accessory && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            {renderField('Accessory Name', accessory.name)}
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                                Type
                            </Typography>
                            <Chip
                                label={accessory.type}
                                size="small"
                                sx={{
                                    mt: 0.5,
                                    bgcolor: '#F3E8FF',
                                    color: '#7C3AED',
                                    fontWeight: 600,
                                    fontSize: 12,
                                }}
                            />
                        </Grid>

                        {accessory.description && (
                            <Grid size={{ xs: 12 }}>
                                {renderField('Description', accessory.description)}
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
                                Variants ({accessory.variants.length})
                            </Typography>
                            {accessory.variants.length === 0 ? (
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                                    No variants
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {accessory.variants.map(v => (
                                        <Box
                                            key={v.id}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 0.75,
                                                px: 1, py: 0.5, borderRadius: 1.5,
                                                border: `1px solid ${theme.palette.custom.border.light}`,
                                                bgcolor: theme.palette.custom.neutral[50],
                                            }}
                                        >
                                            {v.colorHex && (
                                                <Box
                                                    sx={{
                                                        width: 12, height: 12, borderRadius: '50%',
                                                        bgcolor: v.colorHex,
                                                        border: '1px solid rgba(0,0,0,0.12)',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[700] }}>
                                                {v.name ?? v.color ?? '—'}
                                                {v.size ? ` · ${v.size}` : ''}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ViewAccessoryDialog;