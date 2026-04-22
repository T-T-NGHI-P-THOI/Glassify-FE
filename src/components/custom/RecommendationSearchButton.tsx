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
    Paper,
    useTheme,
} from '@mui/material';
import {
    AutoAwesome,
    Close,
    Face,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userApi from '@/api/service/userApi';
import type { UserRecommendationResponse } from '@/models/Recommendation';
import { getHexColor } from '@/utils/color-helpers';

// ── Helpers ────────────────────────────────────────────────────────────────

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
    BALANCED: { bg: '#FAEEDA', text: '#854F0B' },
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
    rec.luckyColors?.forEach(color => params.append('colors', color.toUpperCase()));
    return params;
};

// ── Component ───────────────────────────────────────────────────────────────

export const RecommendationSearchButton = () => {
    const theme = useTheme();
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

        const url = `/products?${buildSearchParams(selectedRec).toString()}`;

        if (window.location.pathname === "/products") {
            window.location.href = url; // reload full page
        } else {
            navigate(url);
        }

        handleClose();
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                sx={{
                    width: 45,
                    height: 40,
                    minWidth: 0,
                    borderRadius: '50%',
                    borderColor: '#e5e7eb',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    p: 0,
                    '&:hover': {
                        borderColor: theme.palette.custom.status.teal.light,
                        backgroundColor: '#f5f3ff'
                    },
                }}
            >
                <AutoAwesome sx={{ fontSize: '20px', color: theme.palette.custom.status.teal.main }} />
            </Button>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: { sx: { borderRadius: 3, overflow: 'hidden' } }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: '1px solid #f3f4f6',
                }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 2, bgcolor: '#f5f3ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AutoAwesome sx={{ fontSize: 18, color: theme.palette.custom.status.teal.main }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
                            Recommendations
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
                            Choose a recommedation profile to find suitable products
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}>
                        <Close sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2, bgcolor: '#f9fafb' }}>
                    {loading ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <CircularProgress size={32} />
                            <Typography sx={{ mt: 1, fontSize: 14, color: '#6b7280' }}>Đang tải...</Typography>
                        </Box>
                    ) : recs.length === 0 ? (
                        // 👉 EMPTY STATE
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <AutoAwesome sx={{ fontSize: 36, color: '#d1d5db', mb: 1 }} />
                            <Typography sx={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                                No recommendations yet
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#9ca3af', mt: 0.5 }}>
                                Try scanning your face to get personalized suggestions
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {recs.map(rec => {
                                const isSelected = rec.id === selectedId;
                                const el = elementColor[rec.element] ?? { bg: '#F1EFE8', text: '#5F5E5A', label: rec.element };
                                const yy = yinYangColor[rec.yinYang] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
                                const confidencePct = Math.round((rec.faceConfidence ?? 0) * 100);

                                return (
                                    <Paper
                                        key={rec.id}
                                        elevation={0}
                                        onClick={() => setSelectedId(isSelected ? null : rec.id)}
                                        sx={{
                                            border: isSelected ? `2px solid ${theme.palette.custom.status.teal.main}` : '1px solid #e5e7eb',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                        }}
                                    >

                                        <Box sx={{ p: 2 }}>
                                            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 1 }}>
                                                {rec.name || 'Untitled scan'}
                                            </Typography>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                                                <Chip
                                                    label={faceShapeLabel[rec.faceShape] || rec.faceShape}
                                                    size="small"
                                                    icon={<Face sx={{ fontSize: '14px !important' }} />}
                                                    sx={{ fontSize: 11, fontWeight: 500, bgcolor: '#F1EFE8', color: '#5F5E5A' }}
                                                />
                                                <Chip
                                                    label={el.label}
                                                    size="small"
                                                    sx={{ fontSize: 11, fontWeight: 500, bgcolor: el.bg, color: el.text }}
                                                />
                                                <Chip
                                                    label={rec.yinYang}
                                                    size="small"
                                                    sx={{ fontSize: 11, fontWeight: 500, bgcolor: yy.bg, color: yy.text }}
                                                />
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', mb: 0.5 }}>
                                                        Frames
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                                                        {rec.recommendedFrameStyles?.join(', ') || 'N/A'}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    <Typography sx={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', mb: 0.5 }}>
                                                        Colors
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {rec.luckyColors?.map(color => (
                                                            <Box
                                                                key={color}
                                                                sx={{
                                                                    width: 16, height: 16, borderRadius: '50%',
                                                                    bgcolor: getHexColor(color) || '#000',
                                                                    border: '1px solid #e5e7eb'
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #f3f4f6' }}>
                    <Button
                        variant="contained"
                        disabled={!selectedId}
                        onClick={handleSearchNow}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '8px',
                            px: 3,
                            bgcolor: theme.palette.custom.status.teal.main,
                            '&:hover': { bgcolor: theme.palette.custom.status.teal.main }
                        }}
                    >
                        Find Products
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RecommendationSearchButton;