import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    IconButton,
    TextField,
    MenuItem,
    Grid,
    CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close, Save } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { CustomButton } from '@/components/custom';
import { toast } from 'react-toastify';
import type { Accessory } from '../View/AccessoryCard';
import ProductAPI from '@/api/product-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditAccessoryFormData {
    name: string;
    type: string;
    description: string;
}

interface EditAccessoryDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (id: string, data: EditAccessoryFormData) => Promise<void> | void;
    shopId?: string;
    accessory: Accessory | null;
    loading?: boolean;
}

// ─── Options ──────────────────────────────────────────────────────────────────

export const ACCESSORY_TYPES = [
    { value: 'CASE', label: 'Case' },
    { value: 'STRAP', label: 'Strap' },
    { value: 'LENS_CLOTH', label: 'Lens Cloth' },
    { value: 'CHAIN', label: 'Chain' },
    { value: 'RETAINER', label: 'Retainer' },
    { value: 'REPAIR_KIT', label: 'Repair Kit' },
    { value: 'OTHER', label: 'Other' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const EditAccessoryDialog = ({
    open,
    onClose,
    onSave,
    shopId,
    accessory,
    loading = false,
}: EditAccessoryDialogProps) => {
    const theme = useTheme();
    const initializedRef = useRef(false);

    const [formData, setFormData] = useState<EditAccessoryFormData>({
        name: '',
        type: '',
        description: '',
    });

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            fontSize: 13,
            '& fieldset': { borderColor: theme.palette.custom.border.light },
        },
        '& .MuiInputLabel-root': { fontSize: 13 },
    };

    useEffect(() => {
        if (accessory && !initializedRef.current) {
            setFormData({
                name: accessory.name,
                type: accessory.type,
                description: accessory.description ?? '',
            });
            initializedRef.current = true;
        }
    }, [accessory]);

    // reset when closed
    useEffect(() => {
        if (!open) {
            initializedRef.current = false;
        }
    }, [open]);

    const handleSave = async () => {
        if (!accessory) return;
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }
        try {
            const requestBody =  { ...formData, shopId: shopId}
            await ProductAPI.updateAccessory(accessory.id, requestBody);
            toast.success('Accessory updated successfully!');
            await onSave(accessory.id, formData);
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Update failed');
        }
    };

    const set = (key: keyof EditAccessoryFormData, value: string) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.custom.border.light}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: 2.5, py: 2,
                    borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
            >
                <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                        Edit Accessory
                    </Typography>
                    {accessory && (
                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mt: 0.25, fontFamily: 'monospace' }}>
                            {accessory.id.slice(0, 8).toUpperCase()}
                        </Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: theme.palette.custom.neutral[400] }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, py: 2.5, overflowY: 'auto' }}>
                <Grid container spacing={2} marginTop={1}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Accessory Name"
                            value={formData.name}
                            onChange={(e) => set('name', e.target.value)}
                            fullWidth
                            required
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            select
                            label="Accessory Type"
                            value={formData.type}
                            onChange={(e) => set('type', e.target.value)}
                            fullWidth
                            required
                            size="small"
                            sx={fieldSx}
                        >
                            {ACCESSORY_TYPES.map(t => (
                                <MenuItem key={t.value} value={t.value} sx={{ fontSize: 13 }}>
                                    {t.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={formData.description}
                            onChange={(e) => set('description', e.target.value)}
                            placeholder="Describe this accessory..."
                            inputProps={{ maxLength: 1000 }}
                            helperText={`${formData.description?.length ?? 0}/1000`}
                            sx={fieldSx}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 2.5, pb: 2.5, pt: 0, gap: 1,
                    borderTop: `1px solid ${theme.palette.custom.border.light}`,
                    mt: 1,
                }}
            >
                <CustomButton
                    variant="outlined"
                    onClick={onClose}
                    disabled={loading}
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 500, fontSize: 13, minWidth: 90 }}
                >
                    Cancel
                </CustomButton>
                <CustomButton
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading || !formData.name.trim()}
                    startIcon={
                        loading
                            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                            : <Save sx={{ fontSize: 16 }} />
                    }
                    sx={{
                        borderRadius: 1.5, textTransform: 'none', fontWeight: 600,
                        fontSize: 13, minWidth: 120,
                        bgcolor: theme.palette.primary.main,
                    }}
                >
                    {loading ? 'Saving...' : 'Save changes'}
                </CustomButton>
            </DialogActions>
        </Dialog>
    );
};

export default EditAccessoryDialog;
export type { EditAccessoryDialogProps };