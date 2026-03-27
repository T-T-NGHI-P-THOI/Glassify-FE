import React, { useState, useEffect, useCallback } from 'react';
import {
    TableCell,
    Chip,
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
    Backdrop,
} from '@mui/material';
import {
    PhotoLibrary as PhotoLibraryIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { fetchImage } from '@vladmandic/face-api';
import ProductAPI from '@/api/product-api';

interface ImageLightboxProps {
    images: string[];
    open: boolean;
    initialIndex?: number;
    onClose: () => void;
}

function ImageLightbox({ images, open, initialIndex = 0, onClose }: ImageLightboxProps) {
    const [current, setCurrent] = useState(initialIndex);

    useEffect(() => {
        if (open) setCurrent(initialIndex);
    }, [open, initialIndex]);

    const prev = useCallback(() => {
        setCurrent((i) => (i - 1 + images.length) % images.length);
    }, [images.length]);

    const next = useCallback(() => {
        setCurrent((i) => (i + 1) % images.length);
    }, [images.length]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, prev, next, onClose]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.85)' } },
            }}
            PaperProps={{
                sx: {
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    overflow: 'visible',
                    m: 0,
                },
            }}
        >
            <DialogContent
                sx={{
                    p: 0,
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {/* Close button */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
                        color: '#fff',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        zIndex: 10,
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {/* Image container */}
                <Box
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Prev arrow */}
                    {images.length > 1 && (
                        <IconButton
                            onClick={prev}
                            sx={{
                                position: 'absolute',
                                left: -56,
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                zIndex: 10,
                            }}
                        >
                            <ChevronLeftIcon fontSize="large" />
                        </IconButton>
                    )}

                    <Box
                        component="img"
                        src={images[current]}
                        alt={`Image ${current + 1}`}
                        sx={{
                            maxWidth: '80vw',
                            maxHeight: '80vh',
                            borderRadius: 2,
                            objectFit: 'contain',
                            display: 'block',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                        }}
                    />

                    {/* Next arrow */}
                    {images.length > 1 && (
                        <IconButton
                            onClick={next}
                            sx={{
                                position: 'absolute',
                                right: -56,
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                                zIndex: 10,
                            }}
                        >
                            <ChevronRightIcon fontSize="large" />
                        </IconButton>
                    )}
                </Box>

                {/* Counter */}
                {images.length > 1 && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        {current + 1} / {images.length}
                    </Typography>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {images.map((_, i) => (
                            <Box
                                key={i}
                                onClick={() => setCurrent(i)}
                                sx={{
                                    width: i === current ? 20 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Usage trong TableCell ──────────────────────────────────────────
interface ProductImagesCellProps {
    productId: string; // từ API response data[]
    size: string;     // prop của bạn
}

export function ProductImagesCell({ productId, size }: ProductImagesCellProps) {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [images, setImages] = useState<string[]>([])

    const fetchImages = useCallback(async () => {
        try {
            const data = await ProductAPI.getProductImages(productId);
            setImages(data);
        } catch (error) {
            console.error("Cannot load product iamges: ", error);
        }
    }, [productId]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    return (
        <>
            <TableCell>
                <Chip
                    component="button"
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhotoLibraryIcon sx={{ fontSize: 11 }} />
                            {size}
                        </Box>
                    }
                    size="small"
                    onClick={() => images.length > 0 && setOpen(true)}
                    sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        bgcolor: theme.palette.custom?.neutral?.[100],
                        color: theme.palette.custom?.neutral?.[600],
                        border: 'none',
                        cursor: images.length > 0 ? 'pointer' : 'default',
                        '& .MuiChip-label': { px: 1 },
                        '&:hover': images.length > 0
                            ? { bgcolor: theme.palette.custom?.neutral?.[200] }
                            : {},
                    }}
                />
            </TableCell>

            <ImageLightbox
                images={images}
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}