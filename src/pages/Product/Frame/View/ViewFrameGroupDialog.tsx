import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    IconButton,
    Grid,
    Chip,
    Divider,
    CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import Upload3DModelPage, { type Model3DFile } from '../Create/Upload3DModel';
import ProductAPI from '@/api/product-api';
import type { FrameGroup } from '../View/FrameGroupCard';

interface ViewFrameGroupDialogProps {
    open: boolean;
    onClose: () => void;
    frameGroup: FrameGroup | null;
}

const ViewFrameGroupDialog = ({
    open,
    onClose,
    frameGroup,
}: ViewFrameGroupDialogProps) => {
    const theme = useTheme();
    const [modelLoading, setModelLoading] = useState(false);
    const [modelFile, setModelFile] = useState<Model3DFile | null>(null);

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

            setModelFile({
                file,
                name: file.name,
                size: file.size,
                type: file.type,
            });
        } catch (err) {
            console.error('LOAD MODEL ERROR:', err);
        } finally {
            setModelLoading(false);
        }
    };

    useEffect(() => {
        if (open && frameGroup?.vrEnabled) {
            loadModel();
        }
    }, [open, frameGroup]);

    const renderField = (label: string, value?: string | boolean) => (
        <Box>
            <Typography sx={{ fontSize: 12, color: theme.palette.custom.neutral[500] }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                {value ?? '-'}
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
            {/* Title */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box>
                    <Typography fontWeight={600}>
                        Frame Group Details
                    </Typography>
                    {frameGroup && (
                        <Typography fontSize={11} color="gray">
                            {frameGroup.id.slice(0, 8).toUpperCase()}
                        </Typography>
                    )}
                </Box>

                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {frameGroup && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            {renderField("Frame Name", frameGroup.frameName)}
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            {renderField("Shape", frameGroup.frameShape)}
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            {renderField("Structure", frameGroup.frameStructure)}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            {renderField("Material", frameGroup.frameMaterial)}
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            {renderField("Gender", frameGroup.genderTarget)}
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            {renderField("Age Group", frameGroup.ageGroup)}
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            <Chip
                                label="Nose Pads"
                                color={frameGroup.hasNosePads ? 'success' : 'default'}
                            />
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            <Chip
                                label="Spring Hinge"
                                color={frameGroup.hasSpringHinge ? 'success' : 'default'}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography fontSize={12} color="gray">
                                Description
                            </Typography>
                            <Typography fontSize={14}>
                                {frameGroup.description || '-'}
                            </Typography>
                        </Grid>

                        {/* VR Section */}
                        <Grid size={{ xs: 12 }}>
                            <Box
                                sx={{
                                    border: `1px solid ${
                                        frameGroup.vrEnabled
                                            ? theme.palette.primary.main
                                            : theme.palette.custom.neutral[200]
                                    }`,
                                    borderRadius: 2,
                                    p: 2,
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1}>
                                    <ViewInArIcon />
                                    <Typography fontWeight={600}>
                                        VR Enabled: {frameGroup.vrEnabled ? 'Yes' : 'No'}
                                    </Typography>
                                </Box>

                                {frameGroup.vrEnabled && (
                                    <Box mt={2}>
                                        {modelLoading ? (
                                            <CircularProgress size={24} />
                                        ) : modelFile ? (
                                            <Upload3DModelPage
                                                variantId={undefined}
                                                initialFile={modelFile}
                                                readOnly
                                            />
                                        ) : (
                                            <Typography fontSize={12}>
                                                No model available
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ViewFrameGroupDialog;