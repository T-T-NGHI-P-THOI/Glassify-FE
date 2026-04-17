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
    Chip,
    CircularProgress,
    FormControlLabel,
    Switch,
    Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close, Save } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { CustomButton } from '@/components/custom';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import Upload3DModelPage, { type Model3DFile } from '../Create/Upload3DModel';
import ProductAPI from '@/api/product-api';
import { toast } from 'react-toastify';
import type { FrameGroup } from '../View/FrameGroupCard';

// ─── Types ────────────────────────────────────────────────────────────────────



export interface EditFrameGroupFormData {
    frameName: string;
    frameShape: string;
    frameStructure: string;
    frameMaterial: string;
    genderTarget: string;
    ageGroup: string;
    vrEnabled: boolean;
    hasNosePads: boolean;
    hasSpringHinge: boolean;
    description: string;
    model3dFile?: Model3DFile | null;
}

interface EditFrameGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onSaved: (id: string, data: EditFrameGroupFormData) => Promise<void> | void;
    frameGroup: FrameGroup | null;
    loading?: boolean;
}

// ─── Options ──────────────────────────────────────────────────────────────────

export const FRAME_SHAPES = [
    { value: 'RECTANGLE', label: 'Rectangle' },
    { value: 'SQUARE', label: 'Square' },
    { value: 'ROUND', label: 'Round' },
    { value: 'OVAL', label: 'Oval' },
    { value: 'CAT_EYE', label: 'Cat-Eye' },
    { value: 'AVIATOR', label: 'Aviator' },
    { value: 'BROWLINE', label: 'Browline' },
    { value: 'GEOMETRIC', label: 'Geometric' }
] as const;

export const FRAME_STRUCTURES = [
    { value: 'FULL_RIM', label: 'Full-Rim' },
    { value: 'HALF_RIM', label: 'Half-Rim' },
    { value: 'RIMLESS', label: 'Rimless' }
] as const;

export const FRAME_MATERIALS = [
    { value: 'ACETATE', label: 'Acetate' },
    { value: 'METAL', label: 'Metal' },
    { value: 'TITANIUM', label: 'Titanium' },
    { value: 'PLASTIC', label: 'Plastic' },
    { value: 'MIXED', label: 'Mixed' },
    { value: 'CARBON', label: 'Carbon' }
] as const;

export const GENDER_TARGETS = [
    { value: 'MALE', label: 'Men' },
    { value: 'FEMALE', label: 'Women' },
    { value: 'OTHERS', label: 'Unisex' }
] as const;

export const AGE_GROUPS = [
    { value: 'KIDS', label: 'Kids' },
    { value: 'TEENS', label: 'Teens' },
    { value: 'ADULTS', label: 'Adults' },
    { value: 'SENIORS', label: 'Seniors' }
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const EditFrameGroupDialog = ({
    open,
    onClose,
    onSaved,
    frameGroup,
    loading = false,
}: EditFrameGroupDialogProps) => {
    const theme = useTheme();
    const initializedRef = useRef(false);
    const [modelLoading, setModelLoading] = useState(false);
    const [formData, setFormData] = useState<EditFrameGroupFormData>({
        frameName: '',
        frameShape: '',
        frameStructure: '',
        frameMaterial: '',
        genderTarget: '',
        ageGroup: '',
        hasNosePads: false,
        hasSpringHinge: false,
        vrEnabled: false,
        description: '',
        model3dFile: null,
    });

    const getFileName = (contentDisposition?: string) => {
        if (!contentDisposition) return 'model.glb';

        const match = contentDisposition.match(/filename="(.+)"/);
        return match ? match[1] : 'model.glb';
    };

    const loadModel = async () => {
        try {
            if (!frameGroup) return;

            setModelLoading(true);

            const response = await ProductAPI.getModel3D(frameGroup.id);
            const blob = response.data;

            const filename = getFileName(
                response.headers['content-disposition']
            );

            const file = new File([blob], filename, {
                type: blob.type,
            });

            const url = URL.createObjectURL(file);

            setFormData(prev => ({
                ...prev,
                model3dFile: {
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url,
                }
            }));
        } catch (err) {
            console.error('LOAD MODEL ERROR:', err);
        } finally {
            setModelLoading(false); // 👈 stop loading
        }
    };

    const handleUpdateFrameGroup = async (id: string, data: EditFrameGroupFormData) => {
        try {
            const formData = new FormData();

            formData.append("frameName", data.frameName);
            formData.append("frameShape", data.frameShape);
            formData.append("frameStructure", data.frameStructure);
            formData.append("frameMaterial", data.frameMaterial);
            formData.append("genderTarget", data.genderTarget);
            formData.append("ageGroup", data.ageGroup);
            formData.append("vrEnabled", String(data.vrEnabled));
            formData.append("hasNosePads", String(data.hasNosePads));
            formData.append("hasSpringHinge", String(data.hasSpringHinge));
            formData.append("description", data.description);

            // 👇 chỉ append nếu có file
            if (data.model3dFile?.file) {
                formData.append("model3dFile", data.model3dFile.file);
            }

            await toast.promise(
                ProductAPI.updateFrameGroup(id, formData),
                {
                    pending: "Updating...",
                    success: "Updated frame variant successfully",
                    error: "Update failed",
                }
            );

            onClose();
        } catch (err: any) {
            toast.error(err || "Update failed ❌");
        }
    };
    const handleInputChange =
        (field: keyof EditFrameGroupFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setFormData(prev => ({ ...prev, [field]: e.target.value }));
            };

    // Init data
    useEffect(() => {
        if (frameGroup && !initializedRef.current) {
            setFormData(prev => ({
                ...prev,
                frameName: frameGroup.frameName,
                frameShape: frameGroup.frameShape,
                frameStructure: frameGroup.frameStructure,
                frameMaterial: frameGroup.frameMaterial,
                genderTarget: frameGroup.genderTarget,
                ageGroup: frameGroup.ageGroup,
                hasNosePads: frameGroup.hasNosePads,
                hasSpringHinge: frameGroup.hasSpringHinge,
                description: frameGroup.description,
                vrEnabled: frameGroup.vrEnabled ?? false,
            }));

            initializedRef.current = true;
        }
    }, [frameGroup]);

    useEffect(() => {
        if (open && frameGroup?.vrEnabled) {
            loadModel();
        }
    }, [open, frameGroup]);

    const set = (key: keyof EditFrameGroupFormData, value: unknown) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!frameGroup) return;
        await handleUpdateFrameGroup(frameGroup.id, formData);
        await onSaved(frameGroup.id, formData);
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            fontSize: 13,
            '& fieldset': { borderColor: theme.palette.custom.border.light },
        },
        '& .MuiInputLabel-root': { fontSize: 13 },
    };

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            maxWidth="sm"
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
            {/* Title */}
            <DialogTitle
                sx={{
                    px: 2.5,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.custom.border.light}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom.neutral[800] }}>
                        Edit Frame Group
                    </Typography>
                    {frameGroup && (
                        <Typography sx={{ fontSize: 11, color: theme.palette.custom.neutral[400], mt: 0.25, fontFamily: 'monospace' }}>
                            {frameGroup.id.slice(0, 8).toUpperCase()}
                        </Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: theme.palette.custom.neutral[400] }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ px: 2.5, py: 2.5, overflowY: 'auto' }} >
                <Grid container spacing={2} marginTop={2}>
                    {/* Frame name */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Frame name"
                            value={formData.frameName}
                            onChange={(e) => set('frameName', e.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        />
                    </Grid>

                    {/* Shape + Structure */}
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            select
                            label="Frame shape"
                            value={formData.frameShape}
                            onChange={(e) => set('frameShape', e.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        >
                            {FRAME_SHAPES.map((s) => (
                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>{s.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            select
                            label="Frame structure"
                            value={formData.frameStructure}
                            onChange={(e) => set('frameStructure', e.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        >
                            {FRAME_STRUCTURES.map((s) => (
                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>{s.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Material */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            select
                            label="Frame material"
                            value={formData.frameMaterial}
                            onChange={(e) => set('frameMaterial', e.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        >
                            {FRAME_MATERIALS.map((s) => (
                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>{s.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.hasNosePads}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, hasNosePads: e.target.checked }))
                                    }
                                />
                            }
                            label="Nose Pads"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.hasSpringHinge}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, hasSpringHinge: e.target.checked }))
                                    }
                                />
                            }
                            label="Spring Hinge"
                        />
                    </Grid>

                    {/* Gender + Age */}
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            select
                            label="Gender target"
                            value={formData.genderTarget}
                            onChange={(e) => set('genderTarget', e.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        >
                            {GENDER_TARGETS.map((s) => (
                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>{s.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            select
                            label="Age group"
                            value={formData.ageGroup}
                            onChange={(e) => set('ageGroup', e.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                        >
                            {AGE_GROUPS.map((s) => (
                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>{s.label}</MenuItem>
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
                            onChange={handleInputChange('description')}
                            placeholder="Describe your frame..."
                            inputProps={{ maxLength: 1000 }}
                            helperText={`${formData.description?.length || 0}/1000`}
                        />
                    </Grid>

                    {/* VR toggle */}
                    <Grid size={{ xs: 12 }}>
                        <Box
                            sx={{
                                border: `1px solid`,
                                borderColor: formData.vrEnabled
                                    ? theme.palette.primary.main
                                    : theme.palette.custom.neutral[200],
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'border-color 0.2s ease',
                            }}
                        >
                            {/* Header row: toggle */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 3,
                                    py: 2,
                                    bgcolor: formData.vrEnabled
                                        ? `${theme.palette.primary.main}08`
                                        : theme.palette.custom.neutral[50],
                                    transition: 'background-color 0.2s ease',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <ViewInArIcon
                                        sx={{
                                            color: formData.vrEnabled
                                                ? theme.palette.primary.main
                                                : theme.palette.custom.neutral[400],
                                            transition: 'color 0.2s ease',
                                        }}
                                    />
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                fontWeight: 600,
                                                color: formData.vrEnabled
                                                    ? theme.palette.primary.main
                                                    : theme.palette.custom.neutral[700],
                                                transition: 'color 0.2s ease',
                                            }}
                                        >
                                            VR Enabled
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                color: theme.palette.custom.neutral[500],
                                                mt: 0.25,
                                            }}
                                        >
                                            {formData.vrEnabled
                                                ? 'Upload a 3D model below. Texture can be applied in the next step.'
                                                : 'Enable to upload a 3D model for virtual try-on.'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Switch
                                    checked={formData.vrEnabled}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, vrEnabled: e.target.checked }))
                                    }
                                    color="primary"
                                />
                            </Box>

                            {/* Collapsible 3D upload area */}
                            {formData.vrEnabled && (
                                <Box
                                    sx={{
                                        px: 3,
                                        pb: 3,
                                        pt: 2,
                                        borderTop: `1px dashed ${theme.palette.custom.neutral[200]}`,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: 120,
                                    }}
                                >
                                    {modelLoading ? (
                                        <Box sx={{ textAlign: 'center' }}>
                                            <CircularProgress size={24} />
                                            <Typography sx={{ fontSize: 12, mt: 1 }}>
                                                Loading 3D model...
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Upload3DModelPage
                                            key={formData.model3dFile?.name}
                                            variantId={undefined}
                                            initialFile={formData.model3dFile}
                                            onUploaded={(url, file) => {
                                                setFormData(prev => ({ ...prev, model3dFile: file }));
                                            }}
                                        />
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            {/* Actions */}
            <DialogActions
                sx={{
                    px: 2.5,
                    pb: 2.5,
                    pt: 0,
                    gap: 1,
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
                    disabled={loading || !formData.frameName.trim()}
                    startIcon={
                        loading
                            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                            : <Save sx={{ fontSize: 16 }} />
                    }
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        minWidth: 120,
                        bgcolor: theme.palette.primary.main,
                    }}
                >
                    {loading ? 'Saving...' : 'Save changes'}
                </CustomButton>
            </DialogActions>
        </Dialog>
    );
};

export default EditFrameGroupDialog;
export type { EditFrameGroupDialogProps };