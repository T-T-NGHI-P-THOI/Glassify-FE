import { useState, useEffect } from 'react';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Button,
    Chip,
    CircularProgress,
    LinearProgress,
} from '@mui/material';
import {
    AutoAwesome,
    Search,
    Close,
    CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userApi from '@/api/service/userApi';
import type { UserRecommendationResponse } from '@/models/Recommendation';

// ─── Helpers ────────────────────────────────────────────────────────────────

const elementColor: Record<string, { bg: string; text: string; label: string }> = {
    WOOD: { bg: '#EAF3DE', text: '#3B6D11', label: 'Wood' },
    FIRE: { bg: '#FAECE7', text: '#993C1D', label: 'Fire' },
    EARTH: { bg: '#FAEEDA', text: '#854F0B', label: 'Earth' },
    METAL: { bg: '#F1EFE8', text: '#5F5E5A', label: 'Metal' },
    WATER: { bg: '#E6F1FB', text: '#185FA5', label: 'Water' },
};

const yinYangColor: Record<string, { bg: string; text: string }> = {
    YIN: { bg: '#EEEDFE', text: '#534AB7' },
    YANG: { bg: '#FAEEDA', text: '#854F0B' },
};

const faceShapeLabel: Record<string, string> = {
    OVAL: 'Oval',
    ROUND: 'Round',
    SQUARE: 'Square',
    HEART: 'Heart',
    OBLONG: 'Oblong',
    DIAMOND: 'Diamond',
};

const buildSearchParams = (rec: UserRecommendationResponse): URLSearchParams => {
    const params = new URLSearchParams();

    rec.recommendedFrameStyles?.forEach(style => params.append('frameShapes', style));
    rec.luckyColors?.forEach(color => params.append('colors', color));

    return params;
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
}

export const RecommendationSearchButton = ({  }: Props) => {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [recs, setRecs] = useState<UserRecommendationResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!open || recs.length > 0) return;

        setLoading(true);
        userApi.getMyRecommendations()
            .then(res => setRecs(res.data ?? []))
            .catch(() => setRecs([]))
            .finally(() => setLoading(false));
    }, [open]);

    const selectedRec = recs.find(r => r.id === selectedId) ?? null;

    const handleClose = () => {
        setOpen(false);
        setSelectedId(null);
    };

    const handleSearchNow = () => {
        if (!selectedRec) return;

        navigate(`/products?${buildSearchParams(selectedRec).toString()}`);
        handleClose();
    };

    return (
        <>
            {/* Trigger button */}
            <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                size="small"
                startIcon={<AutoAwesome sx={{ fontSize: '15px !important', color: '#7c3aed' }} />}
                sx={{
                    borderRadius: '24px',
                    borderColor: '#e5e7eb',
                    color: '#1f2937',
                    fontWeight: 500,
                    fontSize: 13,
                    px: 1.75,
                    height: 38,
                    whiteSpace: 'nowrap',
                    textTransform: 'none',
                    position: 'relative',
                    backgroundColor: '#fff',
                    '&:hover': { borderColor: '#c4b5fd', backgroundColor: '#f5f3ff' },
                    '&::after': {
                        content: '""',
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#7c3aed',
                        position: 'absolute',
                        top: 6,
                        right: 6,
                    },
                }}
            >
                AI Recommend
            </Button>

            {/* Dialog */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { borderRadius: 3, overflow: 'hidden' }
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: 1.5,
                    borderBottom: '1px solid #f3f4f6',
                }}>
                    <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: '#f5f3ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <AutoAwesome sx={{ fontSize: 18, color: '#7c3aed' }} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
                            AI Recommendations
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
                            Chọn một profile để tìm kiếm kính phù hợp
                        </Typography>
                    </Box>

                    <IconButton size="small" onClick={handleClose}>
                        <Close sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <CircularProgress />
                            <Typography sx={{ mt: 1 }}>
                                Đang tải...
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ py: 1 }}>
                            {recs.map(rec => {
                                const isSelected = rec.id === selectedId;
                                const el = elementColor[rec.element] ?? elementColor.METAL;
                                const yy = yinYangColor[rec.yinYang] ?? yinYangColor.YIN;
                                const confPct = Math.round((rec.faceConfidence ?? 0) * 100);

                                return (
                                    <Box
                                        key={rec.id}
                                        onClick={() => setSelectedId(isSelected ? null : rec.id)}
                                        sx={{
                                            mx: 2,
                                            mb: 1.5,
                                            p: 2,
                                            border: isSelected ? '2px solid #7c3aed' : '1px solid #eee',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Typography fontWeight={600}>
                                            {rec.name || 'Untitled'}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 0.5, my: 1 }}>
                                            <Chip label={faceShapeLabel[rec.faceShape]} size="small" />
                                            <Chip label={el.label} size="small" />
                                            <Chip label={rec.yinYang} size="small" />
                                        </Box>

                                        <Typography fontSize={12}>
                                            Frames: <b>{rec.recommendedFrameStyles ?? []}</b>
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                            {rec.luckyColors?.map(color => (
                                                <Chip key={color} label={color} size="small" />
                                            ))}
                                        </Box>

                                        <LinearProgress
                                            variant="determinate"
                                            value={confPct}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>Huỷ</Button>
                    <Button
                        variant="contained"
                        disabled={!selectedRec}
                        onClick={handleSearchNow}
                    >
                        Tìm kiếm ngay
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RecommendationSearchButton;