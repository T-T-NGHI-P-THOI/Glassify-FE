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
                        <Grid size={{ xs: 12 }}>
                            {renderField('Accessory Name', accessory.name)}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
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

                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.custom.neutral[700], mb: 1 }}>
                                Variants ({accessory.accessoryVariants.length})
                            </Typography>
                            {accessory.accessoryVariants.length === 0 ? (
                                <Typography sx={{ fontSize: 13, color: theme.palette.custom.neutral[400] }}>
                                    No variants
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {accessory.accessoryVariants.map(v => (
                                        <Chip
                                            key={v.id}
                                            label={`${v.color || '—'} ${v.size ? `· ${v.size}` : ''}`}
                                            size="small"
                                            sx={{ fontSize: 12 }}
                                        />
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