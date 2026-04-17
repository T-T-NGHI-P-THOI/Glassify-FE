// ─── FaceShapeSuggestionPanel (PREMIUM) ─────────────────────────────────────

import { Box, Typography, Chip, Button } from "@mui/material";
import { useEffect, useState } from "react";
import type { FaceAnalysisResult, FaceShape } from "@/services/FaceShapeAnalyzer";
import type { FengShuiResult } from "@/services/FengShuiAnalyzer";
import { FengShuiPanel } from "./FengShuiPanel";
import type { Color, FrameShape } from "@/types/user-recommendation.enum";
import { useNavigate } from "react-router-dom";

// ─── Tokens ─────────────────────────────────────────────────────────────

const TEAL = "#006470";
const TEXT_SEC = "#555";
const TEXT_MUTED = "#888";
const BORDER = "rgba(0,0,0,0.08)";
const BG_SEC = "#f7f8f8";
const fontSans = "'Inter', sans-serif";
const fontSerif = "'Playfair Display', serif";

// ─── Helpers ──────────────────────────────────────────────────────────

const buildSearchParams = (recommendedFrameStyles: FrameShape[], luckColors: string[]): URLSearchParams => {
    const params = new URLSearchParams();
    recommendedFrameStyles.forEach(style => params.append("frameShapes", style));
    luckColors.forEach(color => params.append("colors", color));
    return params;
};

// ─── Section Title ─────────────────────────────────────────────────────

const SectionTitle = ({ title }: { title: string }) => (
    <Typography sx={{
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: TEXT_MUTED,
        px: 2,
        pt: 1.5,
        pb: 0.6,
        fontFamily: fontSans,
    }}>
        {title}
    </Typography>
);

// ─── Card ──────────────────────────────────────────────────────────────

const Card = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{
        mx: 2,
        mb: 1.2,
        p: 1.4,
        borderRadius: "14px",
        border: `1px solid ${BORDER}`,
        bgcolor: "#fff",
        boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
    }}>
        {children}
    </Box>
);

// ─── Divider ──────────────────────────────────────────────────────────

const RowDivider = () => (
    <Box sx={{ height: "0.5px", bgcolor: BORDER, my: 0.8 }} />
);

// ─── Frame shapes ─────────────────────────────────────────────────────

function getFrameShapes(face: FaceShape): FrameShape[] {
    switch (face) {
        case "ROUND": return ["RECTANGLE", "WAYFARER"];
        case "SQUARE": return ["ROUND", "AVIATOR"];
        case "OVAL": return ["WAYFARER", "GEOMETRIC"];
        case "HEART": return ["AVIATOR", "ROUND"];
        case "OBLONG": return ["WAYFARER"];
        case "DIAMOND": return ["CAT_EYE", "OVAL"];
        default: return [];
    }
}

// ─── Frame label ─────────────────────────────────────────────────────

function getFrameCombo(face: FaceShape, feng?: FengShuiResult): string {
    let frame = "";
    switch (face) {
        case "ROUND": frame = "Rectangle / Wayfarer"; break;
        case "SQUARE": frame = "Round / Aviator"; break;
        case "OVAL": frame = "All styles (Wayfarer / Geometric)"; break;
        case "HEART": frame = "Aviator / Round"; break;
        case "OBLONG": frame = "Oversized / Wayfarer"; break;
        case "DIAMOND": frame = "Cat-eye / Oval"; break;
    }

    if (!feng) return frame;

    switch (feng.element) {
        case "metal": return frame + " → Thin, metallic frame";
        case "wood": return frame + " → Natural material, green tones";
        case "water": return frame + " → Dark, smooth frame";
        case "fire": return frame + " → Bold frame, red / orange";
        case "earth": return frame + " → Thick frame, brown or beige";
    }

    return frame;
}

// ─── Lens label ─────────────────────────────────────────────────────

function getLens(shape: FaceShape, feng?: FengShuiResult): string {
    let base = "";
    switch (shape) {
        case "ROUND": base = "Thin lens + anti-reflective coating to sharpen features"; break;
        case "SQUARE": base = "Slightly rounded lens to soften angular features"; break;
        case "OVAL": base = "Versatile fit — prioritise blue-light blocking"; break;
        case "HEART": base = "Light gradient lens to balance a wider forehead"; break;
        case "OBLONG": base = "Tall lens + anti-glare to offset face length"; break;
        case "DIAMOND": base = "Bright lens + anti-reflective to soften edges"; break;
    }

    if (feng?.element === "water") base += " • Add a subtle blue tint";
    if (feng?.element === "fire") base += " • Strong UV protection";

    return base;
}

// ─── Color Chips ──────────────────────────────────────────────────────

const ColorChips = ({ colors }: { colors: string[] }) => (
    <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mt: 0.6, pl: "22px" }}>
        {colors.map(c => (
            <Chip
                key={c}
                label={c}
                size="small"
                sx={{ fontSize: "0.65rem", bgcolor: BG_SEC }}
            />
        ))}
    </Box>
);

// ─── Suggest Row ─────────────────────────────────────────────────────

const SuggestItem = ({
    icon,
    label,
    value,
    children,
}: {
    icon: string;
    label: string;
    value?: string;
    children?: React.ReactNode;
}) => (
    <Box>
        <Typography sx={{
            fontWeight: 600,
            fontSize: "0.76rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            mb: 0.3,
        }}>
            <span style={{ fontSize: "14px", lineHeight: 1 }}>{icon}</span>
            {label}
        </Typography>
        {value && (
            <Typography sx={{ fontSize: "0.73rem", color: TEXT_SEC, pl: "22px" }}>
                {value}
            </Typography>
        )}
        {children}
    </Box>
);

// ─── Main ─────────────────────────────────────────────────────────────

interface Props {
    result: FaceAnalysisResult | null;
    fengShuiResult?: FengShuiResult | null;
    setSaveModalOpen: (open: boolean) => void;
    isAnalyzing?: boolean;
    onRecommendReady?: (frames: FrameShape[], lens: string) => void;
    handleClose?: () => void;
}

export const FaceShapeSuggestionPanel = ({
    result,
    fengShuiResult,
    setSaveModalOpen,
    isAnalyzing = false,
    onRecommendReady,
    handleClose
}: Props) => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (result) {
            setVisible(false);
            const t = setTimeout(() => setVisible(true), 60);
            return () => clearTimeout(t);
        }
    }, [result]);

    useEffect(() => {
        if (!result) return;
        const frames = getFrameShapes(result.shape);
        const lens = getLens(result.shape, fengShuiResult ?? undefined);
        onRecommendReady?.(frames, lens);
    }, [result, fengShuiResult]);

    const handleFind = () => {
        if (!result) return;
        const params = buildSearchParams(
            getFrameShapes(result.shape),
            fengShuiResult?.luckyColors ?? [],
        );
        handleClose?.();
        navigate(`/products?${params.toString()}`);
    };

    if (!result && !isAnalyzing) return null;

    return (
        <Box sx={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.4s ease",
        }}>

            {/* LOADING */}
            {isAnalyzing && (
                <Box sx={{ px: 2, py: 2 }}>
                    <Typography sx={{ color: TEXT_MUTED, fontFamily: fontSans, fontSize: "0.82rem" }}>
                        AI is analysing your face…
                    </Typography>
                </Box>
            )}

            {result && visible && (
                <>
                    {/* ── FACE SHAPE ── */}
                    <SectionTitle title="Face shape" />
                    <Card>
                        <Typography sx={{
                            fontFamily: fontSerif,
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            mb: 0.4,
                        }}>
                            {result.label} face
                        </Typography>

                        <Typography sx={{ fontSize: "0.76rem", color: TEXT_SEC, mb: 0.8 }}>
                            {result.description}
                        </Typography>

                        <Typography sx={{ fontSize: "0.68rem", color: TEAL, fontWeight: 600 }}>
                            Accuracy: {Math.round(result.confidence * 100)}%
                        </Typography>
                    </Card>

                    {/* ── FENG SHUI ── */}
                    {fengShuiResult && (
                        <>
                            <SectionTitle title="Feng shui" />
                            <FengShuiPanel result={fengShuiResult} />
                        </>
                    )}

                    {/* ── SMART SUGGESTIONS ── */}
                    <SectionTitle title="Smart suggestions" />
                    <Card>
                        <SuggestItem
                            icon="👓"
                            label="Frames"
                            value={getFrameCombo(result.shape, fengShuiResult ?? undefined)}
                        />

                        <RowDivider />

                        <SuggestItem
                            icon="🔍"
                            label="Lenses"
                            value={getLens(result.shape, fengShuiResult ?? undefined)}
                        />

                        {fengShuiResult && (
                            <>
                                <RowDivider />
                                <SuggestItem icon="🎨" label="Lucky colors">
                                    <ColorChips colors={fengShuiResult.luckyColors} />
                                </SuggestItem>
                            </>
                        )}
                    </Card>

                    {/* ── ACTIONS ── */}
                    <Box sx={{ display: "flex", gap: 1, px: 1.5, pb: 1.5, pt: 0.5 }}>
                        <Button
                            onClick={handleFind}
                            variant="outlined"
                            sx={{
                                flex: 1,
                                textTransform: "none",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                fontFamily: fontSans,
                            }}
                        >
                            Find ↗
                        </Button>

                        <Button
                            onClick={() => setSaveModalOpen(true)}
                            variant="contained"
                            sx={{
                                flex: 1,
                                textTransform: "none",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                fontFamily: fontSans,
                            }}
                        >
                            Save
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};