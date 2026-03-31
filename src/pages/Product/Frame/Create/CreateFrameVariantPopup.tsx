import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box } from '@mui/material';
import CreateFrameVariantPage, { type CreateFrameVariantPageRef } from './CreateFrameVariantPage';
import { Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ProductAPI from '@/api/product-api';
import type { Model3DFile } from './Upload3DModel';

interface FrameVariantPopupProps {
    open: boolean;
    onClose: () => void;
    shopId?: string;
    frameGroupId?: string;
    onCreated?: (variantId: string, productId: string, data: any) => void;
}

export default function CreateFrameVariantPopup({
    open,
    onClose,
    shopId,
    frameGroupId,
    onCreated,
}: FrameVariantPopupProps) {
    const theme = useTheme();
    const variantRef = useRef<CreateFrameVariantPageRef>(null);
    const [modelFile, setModelFile] = useState<Model3DFile | null>(null);
    const [modelLoading, setModelLoading] = useState(false);

    const handleSave = async () => {
        try {
            await variantRef.current?.submit();
            onClose();
        } catch (err) {
            console.error('Validation or submit failed', err);
        }
    };

    const getFileName = (contentDisposition?: string) => {
        if (!contentDisposition) return 'model.glb';

        const match = contentDisposition.match(/filename="(.+)"/);
        return match ? match[1] : 'model.glb';
    };

    const loadModel = async () => {
        try {
            if (!frameGroupId) return;

            setModelLoading(true);

            const response = await ProductAPI.getModel3D(frameGroupId);
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
            setModelLoading(false); // 👈 stop loading
        }
    };

    useEffect(() => {
    let active = true;
    const fetchModel = async () => {
        if (!open || !frameGroupId) return;
        setModelLoading(true);
        try {
            const response = await ProductAPI.getModel3D(frameGroupId);
            if (!active) return;
            const blob = response.data;
            const filename = getFileName(response.headers['content-disposition']);
            const file = new File([blob], filename, { type: blob.type });
            setModelFile({ file, name: file.name, size: file.size, type: file.type });
        } catch (err) {
            console.error('LOAD MODEL ERROR:', err);
        } finally {
            if (active) setModelLoading(false);
        }
    };
    fetchModel();
    return () => { active = false; }
}, [open, frameGroupId]);

    console.log("Model file: ", modelFile)

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                        Create Frame Variant
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.custom.neutral[400] }}>
                    <Close sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {modelLoading ? (
                    <Box
                        sx={{
                            width: '100%',
                            height: 300,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ color: theme.palette.custom.neutral[400] }}>Loading model...</Typography>
                    </Box>
                ) : (
                    <CreateFrameVariantPage
                        ref={variantRef}
                        shopId={shopId}
                        frameGroupId={frameGroupId}
                        onCreated={onCreated}
                        modelFile={modelFile}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}