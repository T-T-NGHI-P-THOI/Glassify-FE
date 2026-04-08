import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Button,
    TextField,
    Grid,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Skeleton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    AutoAwesome,
    Edit,
    Delete,
    Save,
    Close,
    Face,
    Palette,
} from '@mui/icons-material';
import type { Color, FrameShape } from '@/types/user-recommendation.enum';
import type { UserRecommendationResponse } from '@/models/Recommendation';
import { getHexColor } from '@/utils/color-helpers';

// ── Helpers ─────────────────────────────────────────────────────────────────
const faceShapeLabel: Record<string, string> = {
    OVAL: 'Oval',
    ROUND: 'Round',
    SQUARE: 'Square',
    HEART: 'Heart',
    OBLONG: 'Oblong',
    DIAMOND: 'Diamond',
};

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

const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

// ── Sub-component: một recommendation card ──────────────────────────────────
const RecCard = ({
    rec,
    onEdit,
    onDelete,
    isEditing,
    editName,
    onEditNameChange,
    onSaveEdit,
    onCancelEdit,
    saving,
}: {
    rec: UserRecommendationResponse;
    onEdit: () => void;
    onDelete: () => void;
    isEditing: boolean;
    editName: string;
    onEditNameChange: (v: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    saving: boolean;
}) => {
    const theme = useTheme();
    const el = elementColor[rec.element] ?? { bg: '#F1EFE8', text: '#5F5E5A', label: rec.element };
    const yy = yinYangColor[rec.yinYang] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
    const confidencePct = Math.round(rec.faceConfidence * 100);

    return (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.custom?.border?.light ?? '#e5e7eb'}`,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.07)' },
            }}
        >
            {/* Score bar top */}
            <Box sx={{ height: 4, bgcolor: `${theme.palette.primary.main}20` }}>
                <Box
                    sx={{
                        height: '100%',
                        width: `${rec.overallScore}%`,
                        bgcolor: theme.palette.primary.main,
                        transition: 'width 0.6s ease',
                    }}
                />
            </Box>

            <Box sx={{ p: 2.5 }}>
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Name + badges */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                <TextField
                                    value={editName}
                                    onChange={e => onEditNameChange(e.target.value)}
                                    size="small"
                                    autoFocus
                                    sx={{ flex: 1 }}
                                    inputProps={{ style: { fontWeight: 600, fontSize: 14 } }}
                                />
                                <Tooltip title="Save">
                                    <IconButton size="small" onClick={onSaveEdit} disabled={saving} color="primary">
                                        <Save sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                    <IconButton size="small" onClick={onCancelEdit}>
                                        <Close sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.custom?.neutral?.[800] ?? '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {rec.name || 'Untitled scan'}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            <Chip
                                label={faceShapeLabel[rec.faceShape] ?? rec.faceShape}
                                size="small"
                                icon={<Face sx={{ fontSize: '14px !important' }} />}
                                sx={{ fontSize: 12, fontWeight: 500, bgcolor: '#F1EFE8', color: '#5F5E5A' }}
                            />
                            <Chip
                                label={el.label}
                                size="small"
                                sx={{ fontSize: 12, fontWeight: 500, bgcolor: el.bg, color: el.text }}
                            />
                            <Chip
                                label={rec.yinYang}
                                size="small"
                                sx={{ fontSize: 12, fontWeight: 500, bgcolor: yy.bg, color: yy.text }}
                            />
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    {!isEditing && (
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                            <Tooltip title="Edit name">
                                <IconButton size="small" onClick={onEdit}>
                                    <Edit sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={onDelete}>
                                    <Delete sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>

                {/* Divider */}
                <Box sx={{ my: 2, height: '1px', bgcolor: theme.palette.custom?.border?.light ?? '#f3f4f6' }} />

                {/* Info grid — 2 columns */}
                <Grid container spacing={2}>

                    {/* ── Cột trái: Face confidence + Face shape | Frame styles | Lens ── */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        {/* Row: Face confidence + Face shape */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 6 }}>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                    Face confidence
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={confidencePct}
                                        sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: `${theme.palette.primary.main}20`, '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
                                    />
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>
                                        {confidencePct}%
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                    Face shape
                                </Typography>
                                <Chip
                                    label={faceShapeLabel[rec.faceShape] ?? rec.faceShape}
                                    size="small"
                                    icon={<Face sx={{ fontSize: '14px !important' }} />}
                                    sx={{ fontSize: 12, fontWeight: 500, bgcolor: '#F1EFE8', color: '#5F5E5A' }}
                                />
                            </Grid>
                        </Grid>

                        {/* Frame styles */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                Frame styles
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {rec.recommendedFrameStyles.map(s => s.trim()).filter(Boolean).map(style => (
                                    <Chip key={style} label={style} size="small"
                                        sx={{ fontSize: 12, bgcolor: '#E6F1FB', color: '#185FA5' }} />
                                ))}
                            </Box>
                        </Box>

                        {/* Lens */}
                        <Box>
                            <Typography sx={{ fontSize: 11, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                Lens
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: theme.palette.custom?.neutral?.[700] ?? '#374151' }}>
                                {rec.recommendedLens}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* ── Cột phải: Element + Yin Yang | Lucky colors ── */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        {/* Row: Element + Yin Yang */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 6 }}>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                    Element
                                </Typography>
                                <Chip
                                    label={el.label}
                                    size="small"
                                    sx={{ fontSize: 12, fontWeight: 500, bgcolor: el.bg, color: el.text }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <Typography sx={{ fontSize: 11, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                    Yin Yang
                                </Typography>
                                <Chip
                                    label={rec.yinYang}
                                    size="small"
                                    sx={{ fontSize: 12, fontWeight: 500, bgcolor: yy.bg, color: yy.text }}
                                />
                            </Grid>
                        </Grid>

                        {/* Lucky colors */}

                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 0.5
                                }}
                            >
                                Lucky colors
                            </Typography>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                {rec.luckyColors
                                    .map(c => c.trim())
                                    .filter(Boolean)
                                    .map(color => {
                                        const hex = getHexColor(color);

                                        return (
                                            <Tooltip key={color} title={color}>
                                                <Box
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        bgcolor: hex || '#000',
                                                        border: '1px solid #e5e7eb',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s ease',
                                                        '&:hover': {
                                                            transform: 'scale(1.2)',
                                                        }
                                                    }}
                                                />
                                            </Tooltip>
                                        );
                                    })}
                            </Box>
                        </Box>
                    </Grid>

                </Grid>

                {/* Footer */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: 12, color: theme.palette.custom?.neutral?.[400] ?? '#9ca3af' }}>
                        {formatDate(rec.createdAt)}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

// ── MAIN TAB COMPONENT ───────────────────────────────────────────────────────
const RecommendationsTabContent = ({
    recommendations,
    loading,
    onDeleteRecommendation,
    onUpdateRecommendationName,
}: {
    recommendations: UserRecommendationResponse[];
    loading: boolean;
    onDeleteRecommendation: (id: string) => Promise<void>;
    onUpdateRecommendationName: (id: string, name: string) => Promise<void>;
}) => {
    const theme = useTheme();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleEdit = (rec: UserRecommendationResponse) => {
        setEditingId(rec.id);
        setEditName(rec.name);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        setSaving(true);
        await onUpdateRecommendationName(editingId, editName.trim());
        setSaving(false);
        setEditingId(null);
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        setDeleting(true);
        await onDeleteRecommendation(deleteConfirmId);
        setDeleting(false);
        setDeleteConfirmId(null);
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2].map(i => (
                    <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                ))}
            </Box>
        );
    }

    if (!loading && recommendations.length === 0) {
        return (
            <Box sx={{ p: 6, textAlign: 'center' }}>
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: theme.palette.custom?.neutral?.[100] ?? '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    }}
                >
                    <AutoAwesome sx={{ fontSize: 36, color: theme.palette.custom?.neutral?.[300] ?? '#d1d5db' }} />
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom?.neutral?.[700] ?? '#374151', mb: 1 }}>
                    No recommendations yet
                </Typography>
                <Typography sx={{ fontSize: 14, color: theme.palette.custom?.neutral?.[500] ?? '#6b7280', maxWidth: 360, mx: 'auto' }}>
                    Use our AI face analysis to get personalized eyewear recommendations based on your face shape and elemental profile.
                </Typography>
                <Button variant="contained" startIcon={<AutoAwesome />} sx={{ mt: 3 }}>
                    Start AI Analysis
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Summary header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.palette.custom?.neutral?.[800] ?? '#1f2937' }}>
                        Your Recommendations
                    </Typography>
                    <Chip
                        label={recommendations.length}
                        size="small"
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 12,
                            height: 20,
                        }}
                    />
                </Box>
            </Box>

            {/* Card list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recommendations.map(rec => (
                    <RecCard
                        key={rec.id}
                        rec={rec}
                        isEditing={editingId === rec.id}
                        editName={editName}
                        onEditNameChange={setEditName}
                        onEdit={() => handleEdit(rec)}
                        onDelete={() => setDeleteConfirmId(rec.id)}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingId(null)}
                        saving={saving}
                    />
                ))}
            </Box>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Delete recommendation?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: 14, color: theme.palette.custom?.neutral?.[600] ?? '#4b5563' }}>
                        This action cannot be undone. The recommendation and its analysis data will be permanently removed.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmId(null)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleting}
                        startIcon={<Delete />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export { RecommendationsTabContent };