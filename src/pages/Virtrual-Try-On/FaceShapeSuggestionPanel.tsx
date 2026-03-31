import { Box, Typography, Chip } from "@mui/material";
import { useEffect, useRef, useState, type JSX } from "react";
import type { FaceAnalysisResult, FaceShape } from "@/services/FaceShapeAnalyzer";
import type { FengShuiResult } from "@/services/FengShuiAnalyzer";
import { FengShuiPanel } from "./FengShuiPanel";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const TEAL = "#006470";
const TEAL_LIGHT = "rgba(0,100,112,0.08)";
const TEAL_BORDER = "rgba(0,100,112,0.2)";
const TEXT = "#111111";
const TEXT_SEC = "#555555";
const TEXT_MUTED = "#888888";
const BORDER = "rgba(0,0,0,0.08)";
const BG_SEC = "#f7f8f8";
const fontSans = "'Inter', 'DM Sans', sans-serif";
const fontSerif = "'Playfair Display', serif";

// ─── Shape SVG ────────────────────────────────────────────────────────────────

const ShapeIcon = ({ shape, size = 44 }: { shape: FaceShape; size?: number }) => {
    const s = size;
    const svgs: Record<FaceShape, JSX.Element> = {
        oval: <ellipse cx={s / 2} cy={s / 2} rx={s * 0.30} ry={s * 0.42} fill="none" stroke="currentColor" strokeWidth="2" />,
        round: <circle cx={s / 2} cy={s / 2} r={s * 0.38} fill="none" stroke="currentColor" strokeWidth="2" />,
        square: <rect x={s * 0.14} y={s * 0.12} width={s * 0.72} height={s * 0.76} rx={s * 0.04} fill="none" stroke="currentColor" strokeWidth="2" />,
        heart: <path d={`M${s / 2} ${s * 0.82} C${s * 0.1} ${s * 0.5} ${s * 0.05} ${s * 0.18} ${s / 2} ${s * 0.28} C${s * 0.95} ${s * 0.18} ${s * 0.9} ${s * 0.5} ${s / 2} ${s * 0.82}Z`} fill="none" stroke="currentColor" strokeWidth="2" />,
        oblong: <ellipse cx={s / 2} cy={s / 2} rx={s * 0.24} ry={s * 0.44} fill="none" stroke="currentColor" strokeWidth="2" />,
        diamond: <polygon points={`${s / 2},${s * 0.08} ${s * 0.85},${s / 2} ${s / 2},${s * 0.92} ${s * 0.15},${s / 2}`} fill="none" stroke="currentColor" strokeWidth="2" />,
    };
    return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{svgs[shape]}</svg>;
};

// ─── Glasses thumb ────────────────────────────────────────────────────────────

const GlassesThumb = ({ shape }: { shape: string }) => {
    const paths: Record<string, JSX.Element> = {
        rectangle: (<><rect x="2" y="6" width="25" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><rect x="37" y="6" width="25" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="27" y1="14" x2="37" y2="14" stroke="currentColor" strokeWidth="1.5" /><line x1="0" y1="10" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="62" y1="10" x2="64" y2="10" stroke="currentColor" strokeWidth="1.5" /></>),
        round: (<><circle cx="17" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="47" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="27" y1="14" x2="37" y2="14" stroke="currentColor" strokeWidth="1.5" /><line x1="0" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="57" y1="10" x2="64" y2="10" stroke="currentColor" strokeWidth="1.5" /></>),
        aviator: (<><path d="M4 8 Q17 4 17 16 Q17 24 4 22 Q2 20 2 14 Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M60 8 Q47 4 47 16 Q47 24 60 22 Q62 20 62 14 Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="27" y1="12" x2="37" y2="12" stroke="currentColor" strokeWidth="1.5" /><line x1="0" y1="10" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="62" y1="10" x2="64" y2="10" stroke="currentColor" strokeWidth="1.5" /></>),
        "cat-eye": (<><path d="M2 16 Q2 6 14 5 Q22 4 27 10 Q22 18 2 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M62 16 Q62 6 50 5 Q42 4 37 10 Q42 18 62 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="27" y1="12" x2="37" y2="12" stroke="currentColor" strokeWidth="1.5" /><line x1="0" y1="13" x2="2" y2="13" stroke="currentColor" strokeWidth="1.5" /><line x1="62" y1="13" x2="64" y2="13" stroke="currentColor" strokeWidth="1.5" /></>),
        wayfarers: (<><path d="M2 18 L4 6 L26 6 L27 10 L27 18 Q14 22 2 18Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M62 18 L60 6 L38 6 L37 10 L37 18 Q50 22 62 18Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="27" y1="13" x2="37" y2="13" stroke="currentColor" strokeWidth="1.5" /><line x1="0" y1="12" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" /><line x1="62" y1="12" x2="64" y2="12" stroke="currentColor" strokeWidth="1.5" /></>),
        geometric: (<><polygon points="6,6 24,4 27,10 27,18 6,20" fill="none" stroke="currentColor" strokeWidth="1.8" /><polygon points="58,6 40,4 37,10 37,18 58,20" fill="none" stroke="currentColor" strokeWidth="1.8" /><line x1="27" y1="13" x2="37" y2="13" stroke="currentColor" strokeWidth="1.5" /><line x1="0" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" /><line x1="58" y1="12" x2="64" y2="12" stroke="currentColor" strokeWidth="1.5" /></>),
    };
    return (
        <svg width="64" height="28" viewBox="0 0 64 28" style={{ color: TEAL }}>
            {paths[shape] ?? paths["rectangle"]}
        </svg>
    );
};


// ─── Confidence bar ───────────────────────────────────────────────────────────

const ConfidenceBar = ({ value }: { value: number }) => {
    const barRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = barRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.style.transition = "width 1s cubic-bezier(0.4,0,0.2,1)";
            el.style.width = `${Math.round(value * 100)}%`;
        });
    }, [value]);

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
            <Box sx={{ flex: 1, height: 4, bgcolor: TEAL_LIGHT, borderRadius: 2, overflow: "hidden" }}>
                <Box
                    ref={barRef}
                    sx={{ height: "100%", width: 0, bgcolor: TEAL, borderRadius: 2 }}
                />
            </Box>
            <Typography sx={{ fontFamily: fontSans, fontSize: "0.72rem", color: TEAL, minWidth: 32, textAlign: "right", fontWeight: 600 }}>
                {Math.round(value * 100)}%
            </Typography>
        </Box>
    );
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = "shape" | "fengshui";

const TabBar = ({ active, onChange, hasFengShui }: {
    active: Tab;
    onChange: (t: Tab) => void;
    hasFengShui: boolean;
}) => (
    <Box sx={{
        display: "flex",
        borderBottom: `1px solid ${BORDER}`,
        px: 2,
    }}>
        {([
            { key: "shape", label: "Khuôn mặt" },
            { key: "fengshui", label: "Phong thuỷ" },
        ] as { key: Tab; label: string }[]).map(tab => (
            <Box
                key={tab.key}
                onClick={() => onChange(tab.key)}
                sx={{
                    py: 1.2, px: 0.5, mr: 2.5,
                    cursor: "pointer",
                    borderBottom: active === tab.key ? `2px solid ${TEAL}` : "2px solid transparent",
                    mb: "-1px",
                    opacity: tab.key === "fengshui" && !hasFengShui ? 0.4 : 1,
                    pointerEvents: tab.key === "fengshui" && !hasFengShui ? "none" : "auto",
                    transition: "all 0.18s",
                }}
            >
                <Typography sx={{
                    fontFamily: fontSans,
                    fontSize: "0.76rem",
                    fontWeight: active === tab.key ? 600 : 400,
                    color: active === tab.key ? TEAL : TEXT_MUTED,
                    transition: "all 0.18s",
                }}>
                    {tab.label}
                </Typography>
            </Box>
        ))}
    </Box>
);

// ─── Main panel ───────────────────────────────────────────────────────────────


interface Props {
    result: FaceAnalysisResult | null;
    fengShuiResult?: FengShuiResult | null;  // ← thêm prop này
    isAnalyzing?: boolean;
}

export const FaceShapeSuggestionPanel = ({ result, fengShuiResult, isAnalyzing = false }: Props) => {
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("shape");

    useEffect(() => {
        if (result) {
            setVisible(false);
            setActiveTab("shape");
            const t = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(t);
        }
    }, [result]);

    if (!result && !isAnalyzing) return null;

    return (
        <Box sx={{
            width: "100%",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.45s ease, transform 0.45s ease",
        }}>
            {/* Analyzing state */}
            {isAnalyzing && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 2 }}>
                    <Box sx={{
                        width: 8, height: 8, borderRadius: "50%", bgcolor: TEAL,
                        animation: "fspPulse 1s infinite",
                        "@keyframes fspPulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.25 } },
                    }} />
                    <Typography sx={{ fontFamily: fontSans, color: TEXT_MUTED, fontSize: "0.82rem" }}>
                        Đang phân tích…
                    </Typography>
                </Box>
            )}

            {result && visible && (
                <Box>
                    {/* Tab bar */}
                    <TabBar
                        active={activeTab}
                        onChange={setActiveTab}
                        hasFengShui={!!fengShuiResult}
                    />

                    {/* Tab: Khuôn mặt */}
                    {activeTab === "shape" && (
                        <Box>
                            {/* ── Header ── */}
                            <Box sx={{
                                px: 2, py: 2,
                                borderBottom: `1px solid ${BORDER}`,
                                display: "flex", alignItems: "center", gap: 2,
                            }}>
                                <Box sx={{
                                    width: 52, height: 52, borderRadius: "50%",
                                    bgcolor: TEAL_LIGHT, border: `1.5px solid ${TEAL_BORDER}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: TEAL, flexShrink: 0,
                                }}>
                                    <ShapeIcon shape={result.shape} size={28} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                                        <Typography sx={{ fontFamily: fontSerif, fontWeight: 700, fontSize: "1.1rem", color: TEXT }}>
                                            {result.label} Face
                                        </Typography>
                                        <Box sx={{ px: 1, py: 0.2, bgcolor: TEAL_LIGHT, border: `1px solid ${TEAL_BORDER}`, borderRadius: "20px" }}>
                                            <Typography sx={{ fontFamily: fontSans, fontSize: "0.62rem", color: TEAL, fontWeight: 600 }}>
                                                AI Detected
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography sx={{ fontFamily: fontSans, color: TEXT_SEC, fontSize: "0.78rem", lineHeight: 1.5 }}>
                                        {result.description}
                                    </Typography>
                                    <ConfidenceBar value={result.confidence} />
                                </Box>
                            </Box>

                            {/* ── Recommendations ── */}
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography sx={{ fontFamily: fontSans, fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED, mb: 1.2 }}>
                                    Recommended Styles
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                                    {result.recommendations.map((rec, i) => (
                                        <Box
                                            key={rec.style}
                                            sx={{
                                                display: "flex", alignItems: "center", gap: 1.5,
                                                p: 1.2, borderRadius: "10px",
                                                bgcolor: i === 0 ? TEAL_LIGHT : BG_SEC,
                                                border: `1px solid ${i === 0 ? TEAL_BORDER : BORDER}`,
                                                transition: "all 0.18s",
                                                "&:hover": { borderColor: TEAL_BORDER, bgcolor: TEAL_LIGHT },
                                                animation: `fspSlide 0.35s ease ${i * 0.08 + 0.15}s both`,
                                                "@keyframes fspSlide": {
                                                    from: { opacity: 0, transform: "translateX(-6px)" },
                                                    to: { opacity: 1, transform: "translateX(0)" },
                                                },
                                            }}
                                        >
                                            <Box sx={{
                                                width: 64, minWidth: 64,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                py: 0.5, px: 0.5,
                                                bgcolor: i === 0 ? "rgba(0,100,112,0.06)" : "rgba(0,0,0,0.03)",
                                                borderRadius: "7px",
                                            }}>
                                                <GlassesThumb shape={rec.shape} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.2 }}>
                                                    {i === 0 && (
                                                        <Box sx={{ px: 0.8, py: 0.15, bgcolor: TEAL, borderRadius: "20px", flexShrink: 0 }}>
                                                            <Typography sx={{ fontFamily: fontSans, fontSize: "0.58rem", color: "#fff", fontWeight: 700 }}>
                                                                Best Match
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    <Typography sx={{ fontFamily: fontSans, fontWeight: 600, fontSize: "0.82rem", color: TEXT }}>
                                                        {rec.style}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontFamily: fontSans, fontSize: "0.72rem", color: TEXT_MUTED, lineHeight: 1.4 }}>
                                                    {rec.reason}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Tab: Phong thuỷ */}
                    {activeTab === "fengshui" && (
                        <FengShuiPanel result={fengShuiResult ?? null} />
                    )}
                </Box>
            )}
        </Box>
    );
};