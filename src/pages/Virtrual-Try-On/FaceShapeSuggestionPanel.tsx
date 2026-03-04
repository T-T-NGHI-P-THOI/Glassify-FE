import { Box, Typography, Chip } from "@mui/material";
import { useEffect, useRef, useState, type JSX } from "react";
import type { FaceAnalysisResult, FaceShape } from "@/services/FaceShapeAnalyzer";

// ─── Shape SVG icons ──────────────────────────────────────────────────────────

const ShapeIcon = ({ shape, size = 48 }: { shape: FaceShape; size?: number }) => {
    const s = size;
    const svgs: Record<FaceShape, JSX.Element> = {
        oval: (
            <ellipse cx={s / 2} cy={s / 2} rx={s * 0.30} ry={s * 0.42}
                fill="none" stroke="currentColor" strokeWidth="2" />
        ),
        round: (
            <circle cx={s / 2} cy={s / 2} r={s * 0.38}
                fill="none" stroke="currentColor" strokeWidth="2" />
        ),
        square: (
            <rect x={s * 0.14} y={s * 0.12} width={s * 0.72} height={s * 0.76}
                rx={s * 0.04}
                fill="none" stroke="currentColor" strokeWidth="2" />
        ),
        heart: (
            <path d={`M${s / 2} ${s * 0.82} C${s * 0.1} ${s * 0.5} ${s * 0.05} ${s * 0.18} ${s / 2} ${s * 0.28} C${s * 0.95} ${s * 0.18} ${s * 0.9} ${s * 0.5} ${s / 2} ${s * 0.82}Z`}
                fill="none" stroke="currentColor" strokeWidth="2" />
        ),
        oblong: (
            <ellipse cx={s / 2} cy={s / 2} rx={s * 0.24} ry={s * 0.44}
                fill="none" stroke="currentColor" strokeWidth="2" />
        ),
        diamond: (
            <polygon points={`${s / 2},${s * 0.08} ${s * 0.85},${s / 2} ${s / 2},${s * 0.92} ${s * 0.15},${s / 2}`}
                fill="none" stroke="currentColor" strokeWidth="2" />
        ),
    };

    return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {svgs[shape]}
        </svg>
    );
};

// ─── Glasses shape SVG thumbnails ─────────────────────────────────────────────

const GlassesThumb = ({ shape }: { shape: string }) => {
    const w = 64, h = 28;
    const paths: Record<string, JSX.Element> = {
        rectangle: (
            <>
                <rect x="2" y="6" width="25" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <rect x="37" y="6" width="25" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="27" y1="14" x2="37" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="10" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" />
                <line x1="62" y1="10" x2="64" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </>
        ),
        round: (
            <>
                <circle cx="17" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="47" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="27" y1="14" x2="37" y2="14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1.5" />
                <line x1="57" y1="10" x2="64" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </>
        ),
        aviator: (
            <>
                <path d="M4 8 Q17 4 17 16 Q17 24 4 22 Q2 20 2 14 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M60 8 Q47 4 47 16 Q47 24 60 22 Q62 20 62 14 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="27" y1="12" x2="37" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="10" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" />
                <line x1="62" y1="10" x2="64" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </>
        ),
        'cat-eye': (
            <>
                <path d="M2 16 Q2 6 14 5 Q22 4 27 10 Q22 18 2 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M62 16 Q62 6 50 5 Q42 4 37 10 Q42 18 62 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="27" y1="12" x2="37" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="13" x2="2" y2="13" stroke="currentColor" strokeWidth="1.5" />
                <line x1="62" y1="13" x2="64" y2="13" stroke="currentColor" strokeWidth="1.5" />
            </>
        ),
        wayfarers: (
            <>
                <path d="M2 18 L4 6 L26 6 L27 10 L27 18 Q14 22 2 18Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M62 18 L60 6 L38 6 L37 10 L37 18 Q50 22 62 18Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="27" y1="13" x2="37" y2="13" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="12" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="62" y1="12" x2="64" y2="12" stroke="currentColor" strokeWidth="1.5" />
            </>
        ),
        geometric: (
            <>
                <polygon points="6,6 24,4 27,10 27,18 6,20" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <polygon points="58,6 40,4 37,10 37,18 58,20" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <line x1="27" y1="13" x2="37" y2="13" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="58" y1="12" x2="64" y2="12" stroke="currentColor" strokeWidth="1.5" />
            </>
        ),
    };

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ color: '#c9a84c' }}>
            {paths[shape] ?? paths['rectangle']}
        </svg>
    );
};

// ─── Confidence bar ───────────────────────────────────────────────────────────

const ConfidenceBar = ({ value }: { value: number }) => {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = barRef.current;
        if (!el) return;
        // Animate width on mount
        requestAnimationFrame(() => {
            el.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
            el.style.width = `${Math.round(value * 100)}%`;
        });
    }, [value]);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
            <Box sx={{ flex: 1, height: 4, bgcolor: 'rgba(201,168,76,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                    ref={barRef}
                    sx={{
                        height: '100%',
                        width: 0,
                        background: 'linear-gradient(90deg, #c9a84c, #e8cc7a)',
                        borderRadius: 2,
                    }}
                />
            </Box>
            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#c9a84c', minWidth: 32, textAlign: 'right' }}>
                {Math.round(value * 100)}%
            </Typography>
        </Box>
    );
};

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props {
    result: FaceAnalysisResult | null;
    isAnalyzing?: boolean;
}

export const FaceShapeSuggestionPanel = ({ result, isAnalyzing = false }: Props) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (result) {
            setVisible(false);
            // Small delay so animation re-triggers on new result
            const t = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(t);
        }
    }, [result]);

    if (!result && !isAnalyzing) return null;

    return (
        <Box
            sx={{
                mt: 3,
                width: '100%',
                maxWidth: 640,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
        >
            {/* ── Analyzing state ── */}
            {isAnalyzing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c9a84c', animation: 'pulse 1s infinite' }} />
                    <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(240,230,200,0.5)', fontSize: '0.85rem' }}>
                        Analysing face shape…
                    </Typography>
                    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
                </Box>
            )}

            {/* ── Result ── */}
            {result && visible && (
                <Box
                    sx={{
                        border: '1px solid rgba(201,168,76,0.2)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        bgcolor: 'rgba(255,255,255,0.025)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            px: 3, py: 2.5,
                            borderBottom: '1px solid rgba(201,168,76,0.12)',
                            display: 'flex', alignItems: 'center', gap: 2.5,
                        }}
                    >
                        <Box sx={{ color: '#c9a84c', opacity: 0.9 }}>
                            <ShapeIcon shape={result.shape} size={52} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontWeight: 700, fontSize: '1.35rem', color: '#f0e6c8',
                                }}>
                                    {result.label} Face
                                </Typography>
                                <Chip
                                    label="AI Detected"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(201,168,76,0.12)',
                                        color: '#c9a84c',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '0.68rem',
                                        height: 20,
                                        border: '1px solid rgba(201,168,76,0.3)',
                                    }}
                                />
                            </Box>
                            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(240,230,200,0.55)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                {result.description}
                            </Typography>
                            <ConfidenceBar value={result.confidence} />
                        </Box>
                    </Box>

                    {/* Measurements strip */}
                    <Box sx={{
                        px: 3, py: 1.5,
                        borderBottom: '1px solid rgba(201,168,76,0.08)',
                        display: 'flex', gap: 3, flexWrap: 'wrap',
                    }}>
                        {[
                            { label: 'Forehead', value: result.measurements.foreheadWidth },
                            { label: 'Cheeks', value: result.measurements.cheekWidth },
                            { label: 'Jaw', value: result.measurements.jawWidth },
                            { label: 'W:H Ratio', value: result.measurements.ratio },
                        ].map(({ label, value }) => (
                            <Box key={label}>
                                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: 'rgba(240,230,200,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {label}
                                </Typography>
                                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: 'rgba(240,230,200,0.75)', fontWeight: 500 }}>
                                    {value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Recommendations */}
                    <Box sx={{ px: 3, py: 2.5 }}>
                        <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.72rem', textTransform: 'uppercase',
                            letterSpacing: '0.14em', color: 'rgba(240,230,200,0.35)',
                            mb: 2,
                        }}>
                            Recommended Styles for You
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {result.recommendations.map((rec, i) => (
                                <Box
                                    key={rec.style}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        p: 1.5, borderRadius: '10px',
                                        bgcolor: i === 0 ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${i === 0 ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.04)'}`,
                                        transition: 'all 0.2s',
                                        cursor: 'default',
                                        '&:hover': { bgcolor: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.3)' },
                                        // Staggered fade-in
                                        animation: `fadeSlide 0.4s ease ${i * 0.1 + 0.2}s both`,
                                        '@keyframes fadeSlide': {
                                            from: { opacity: 0, transform: 'translateX(-8px)' },
                                            to: { opacity: 1, transform: 'translateX(0)' },
                                        },
                                    }}
                                >
                                    {/* Glasses thumbnail */}
                                    <Box sx={{
                                        width: 72, minWidth: 72,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        p: 1,
                                        bgcolor: 'rgba(201,168,76,0.06)',
                                        borderRadius: '8px',
                                    }}>
                                        <GlassesThumb shape={rec.shape} />
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                                            {i === 0 && (
                                                <Chip
                                                    label="Best Match"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#c9a84c', color: '#0a0a0f',
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 700, fontSize: '0.62rem',
                                                        height: 18,
                                                    }}
                                                />
                                            )}
                                            <Typography sx={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 600, fontSize: '0.9rem', color: '#f0e6c8',
                                            }}>
                                                {rec.style}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: '0.78rem', color: 'rgba(240,230,200,0.45)',
                                            lineHeight: 1.45,
                                        }}>
                                            {rec.reason}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};