// ============================================
// RecommendationSearchButton — Dialog version
// Nút AI Recommend → mở Dialog giữa màn hình
// ============================================

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
    WOOD:  { bg: '#EAF3DE', text: '#3B6D11', label: 'Wood' },
    FIRE:  { bg: '#FAECE7', text: '#993C1D', label: 'Fire' },
    EARTH: { bg: '#FAEEDA', text: '#854F0B', label: 'Earth' },
    METAL: { bg: '#F1EFE8', text: '#5F5E5A', label: 'Metal' },
    WATER: { bg: '#E6F1FB', text: '#185FA5', label: 'Water' },
};

const yinYangColor: Record<string, { bg: string; text: string }> = {
    YIN:  { bg: '#EEEDFE', text: '#534AB7' },
    YANG: { bg: '#FAEEDA', text: '#854F0B' },
};

const faceShapeLabel: Record<string, string> = {
    OVAL: 'Oval', ROUND: 'Round', SQUARE: 'Square',
    HEART: 'Heart', OBLONG: 'Oblong', DIAMOND: 'Diamond',
};

const buildSearchParams = (rec: UserRecommendationResponse): URLSearchParams => {
    const params = new URLSearchParams();
    if (rec.faceShape)              params.set('faceShape', rec.faceShape);
    if (rec.recommendedFrameStyles) params.set('frameStyles', rec.recommendedFrameStyles);
    if (rec.luckyColors)            params.set('colors', rec.luckyColors);
    if (rec.recommendedLens)        params.set('lens', rec.recommendedLens);
    if (rec.element)                params.set('element', rec.element);
    if (rec.yinYang)                params.set('yinYang', rec.yinYang);
    params.set('recId', rec.id);
    return params;
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    onSearchWithRec?: (rec: UserRecommendationResponse) => void;
}

export const RecommendationSearchButton = ({ onSearchWithRec }: Props) => {
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
        onSearchWithRec?.(selectedRec);
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
                        width: 7, height: 7,
                        borderRadius: '50%',
                        background: '#7c3aed',
                        position: 'absolute',
                        top: 6, right: 6,
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
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    pb: 1.5, borderBottom: '1px solid #f3f4f6',
                }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        bgcolor: '#f5f3ff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AutoAwesome sx={{ fontSize: 18, color: '#7c3aed' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
                            AI Recommendations
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>
                            Chọn một profile để tìm kiếm kính phù hợp
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose} sx={{ color: '#9ca3af' }}>
                        <Close sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress size={32} sx={{ color: '#7c3aed' }} />
                            <Typography sx={{ fontSize: 13, color: '#9ca3af' }}>
                                Đang tải recommendations...
                            </Typography>
                        </Box>
                    ) : recs.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Box sx={{
                                width: 64, height: 64, borderRadius: '50%',
                                bgcolor: '#f9fafb', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2,
                            }}>
                                <AutoAwesome sx={{ fontSize: 28, color: '#d1d5db' }} />
                            </Box>
                            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#374151', mb: 0.5 }}>
                                Chưa có recommendation nào
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: '#9ca3af', mb: 2.5 }}>
                                Hãy thực hiện phân tích khuôn mặt để nhận gợi ý cá nhân hóa
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AutoAwesome />}
                                onClick={() => { handleClose(); navigate('/profile?tab=recommendations'); }}
                                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 2, textTransform: 'none' }}
                            >
                                Bắt đầu phân tích AI
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ py: 1 }}>
                            {recs.map((rec, idx) => {
                                const isSelected = rec.id === selectedId;
                                const el = elementColor[rec.element] ?? { bg: '#F1EFE8', text: '#5F5E5A', label: rec.element };
                                const yy = yinYangColor[rec.yinYang] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
                                const confPct = Math.round((rec.faceConfidence ?? 0) * 100);

                                return (
                                    <Box
                                        key={rec.id}
                                        onClick={() => setSelectedId(isSelected ? null : rec.id)}
                                        sx={{
                                            mx: 2, mb: 1.5,
                                            p: 2,
                                            border: isSelected ? '2px solid #7c3aed' : '1px solid #f3f4f6',
                                            borderRadius: 2.5,
                                            cursor: 'pointer',
                                            bgcolor: isSelected ? '#faf9ff' : '#fff',
                                            transition: 'all .15s',
                                            '&:hover': {
                                                borderColor: isSelected ? '#7c3aed' : '#e9d5ff',
                                                bgcolor: '#faf9ff',
                                            },
                                            ...(idx === 0 ? { mt: 1.5 } : {}),
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            {/* Score circle */}
                                            <Box sx={{
                                                minWidth: 52, height: 52, borderRadius: '50%',
                                                border: `2px solid ${isSelected ? '#7c3aed' : '#e5e7eb'}`,
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                transition: 'border-color .15s', flexShrink: 0,
                                            }}>
                                                <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#7c3aed', lineHeight: 1 }}>
                                                    {rec.overallScore}
                                                </Typography>
                                                <Typography sx={{ fontSize: 9, color: '#a78bfa' }}>/100</Typography>
                                            </Box>

                                            {/* Info */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                                                        {rec.name || 'Untitled scan'}
                                                    </Typography>
                                                    {isSelected && (
                                                        <CheckCircle sx={{ fontSize: 16, color: '#7c3aed' }} />
                                                    )}
                                                </Box>

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
                                                    <Chip label={faceShapeLabel[rec.faceShape] ?? rec.faceShape} size="small"
                                                        sx={{ fontSize: 11, height: 20, bgcolor: '#F1EFE8', color: '#5F5E5A' }} />
                                                    <Chip label={el.label} size="small"
                                                        sx={{ fontSize: 11, height: 20, bgcolor: el.bg, color: el.text }} />
                                                    <Chip label={rec.yinYang} size="small"
                                                        sx={{ fontSize: 11, height: 20, bgcolor: yy.bg, color: yy.text }} />
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography sx={{ fontSize: 11, color: '#9ca3af', minWidth: 90 }}>
                                                        Face confidence
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={confPct}
                                                        sx={{
                                                            flex: 1, height: 5, borderRadius: 3,
                                                            bgcolor: '#f3f4f6',
                                                            '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed', borderRadius: 3 },
                                                        }}
                                                    />
                                                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', minWidth: 32 }}>
                                                        {confPct}%
                                                    </Typography>
                                                </Box>

                                                <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 1 }}>
                                                    Frames: <strong style={{ color: '#374151' }}>{rec.recommendedFrameStyles}</strong>
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>

                {recs.length > 0 && (
                    <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f3f4f6', gap: 1 }}>
                        {selectedRec ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <CheckCircle sx={{ fontSize: 15, color: '#7c3aed' }} />
                                <Typography sx={{ fontSize: 12, color: '#6b7280' }} noWrap>
                                    Đang dùng: <strong>{selectedRec.name || 'Untitled'}</strong>
                                </Typography>
                            </Box>
                        ) : (
                            <Typography sx={{ fontSize: 12, color: '#9ca3af', flex: 1 }}>
                                Chọn một recommendation để bắt đầu
                            </Typography>
                        )}
                        <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none', borderRadius: 2 }}>
                            Huỷ
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!selectedRec}
                            startIcon={<Search sx={{ fontSize: '16px !important' }} />}
                            onClick={handleSearchNow}
                            sx={{
                                bgcolor: '#7c3aed', borderRadius: 2, textTransform: 'none',
                                '&:hover': { bgcolor: '#6d28d9' },
                                '&.Mui-disabled': { bgcolor: '#e9d5ff', color: '#fff' },
                            }}
                        >
                            Tìm kiếm ngay
                        </Button>
                    </DialogActions>
                )}
            </Dialog>
        </>
    );
};

export default RecommendationSearchButton;