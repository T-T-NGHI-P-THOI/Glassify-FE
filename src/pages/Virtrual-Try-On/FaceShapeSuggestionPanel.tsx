// ─── FaceShapeSuggestionPanel (PREMIUM) ─────────────────────────────────────

import { Box, Typography, Chip, Button } from "@mui/material";
import { useEffect, useState } from "react";
import type { FaceAnalysisResult, FaceShape } from "@/services/FaceShapeAnalyzer";
import type { FengShuiResult } from "@/services/FengShuiAnalyzer";
import { FengShuiPanel } from "./FengShuiPanel";
import userApi from "@/api/service/userApi";
import { toast } from "react-toastify";

// ─── Tokens ─────────────────────────────────────────────────────────────

const TEAL = "#006470";
const TEAL_LIGHT = "rgba(0,100,112,0.08)";
const TEAL_BORDER = "rgba(0,100,112,0.2)";
const TEXT = "#111";
const TEXT_SEC = "#555";
const TEXT_MUTED = "#888";
const BORDER = "rgba(0,0,0,0.08)";
const BG_SEC = "#f7f8f8";
const fontSans = "'Inter', sans-serif";
const fontSerif = "'Playfair Display', serif";

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

// ─── Premium Card ──────────────────────────────────────────────────────

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

// ─── Lens Recommendation ───────────────────────────────────────────────

function getLens(shape: FaceShape, feng?: FengShuiResult) {
    let base = "";
    switch (shape) {
        case "round":
            base = "Tròng mỏng + chống phản quang giúp gương mặt sắc nét hơn";
            break;
        case "square":
            base = "Tròng bo nhẹ giúp giảm góc cạnh";
            break;
        case "oval":
            base = "Phù hợp đa dạng, ưu tiên chống ánh sáng xanh";
            break;
        case "heart":
            base = "Tròng nhẹ, gradient giúp cân bằng trán";
            break;
        case "oblong":
            base = "Tròng cao + chống chói giúp cân đối chiều dài";
            break;
        case "diamond":
            base = "Tròng sáng + chống phản xạ làm mềm nét";
            break;
    }

    if (feng?.element === "water") base += " • Nên thêm phủ xanh nhẹ";
    if (feng?.element === "fire") base += " • Tròng chống UV mạnh";

    return base;
}

// ─── Frame Recommendation (🔥 combine AI + FengShui) ───────────────────

function getFrameCombo(face: FaceShape, feng?: FengShuiResult) {
    let frame = "";
    switch (face) {
        case "round":
            frame = "Rectangle / Wayfarer";
            break;
        case "square":
            frame = "Round / Aviator";
            break;
        case "oval":
            frame = "All styles (Wayfarer / Geometric)";
            break;
        case "heart":
            frame = "Aviator / Round";
            break;
        case "oblong":
            frame = "Oversized / Wayfarer";
            break;
        case "diamond":
            frame = "Cat-eye / Oval";
            break;
    }

    let fengBoost = "";
    if (!feng) return frame;

    switch (feng.element) {
        case "metal":
            fengBoost = " → Gọng mảnh, kim loại";
            break;
        case "wood":
            fengBoost = " → Gọng tự nhiên, màu xanh";
            break;
        case "water":
            fengBoost = " → Gọng tối màu, trơn";
            break;
        case "fire":
            fengBoost = " → Gọng nổi bật, đỏ/cam";
            break;
        case "earth":
            fengBoost = " → Gọng dày, màu nâu/be";
            break;
    }

    return frame + fengBoost;
}

// ─── Color Chips ──────────────────────────────────────────────────────

const ColorChips = ({ colors }: { colors: string[] }) => (
    <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mt: 0.6 }}>
        {colors.map(c => (
            <Chip
                key={c}
                label={c}
                size="small"
                sx={{
                    fontSize: "0.65rem",
                    bgcolor: BG_SEC,
                }}
            />
        ))}
    </Box>
);

// ─── Main ─────────────────────────────────────────────────────────────

interface Props {
    result: FaceAnalysisResult | null;
    fengShuiResult?: FengShuiResult | null;
    setSaveModalOpen: (open: boolean) => void;
    isAnalyzing?: boolean;
}

export const FaceShapeSuggestionPanel = ({
    result,
    fengShuiResult,
    setSaveModalOpen,
    isAnalyzing = false
}: Props) => {

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (result) {
            setVisible(false);
            setTimeout(() => setVisible(true), 60);
        }
    }, [result]);

    if (!result && !isAnalyzing) return null;

    return (
        <Box sx={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.4s ease"
        }}>
            {/* LOADING */}
            {isAnalyzing && (
                <Box sx={{ px: 2, py: 2 }}>
                    <Typography sx={{ color: TEXT_MUTED }}>
                        AI đang phân tích khuôn mặt...
                    </Typography>
                </Box>
            )}

            {result && visible && (
                <>
                    {/* ───────── FACE SECTION ───────── */}
                    <SectionTitle title="Phân tích khuôn mặt" />

                    <Card>
                        <Typography sx={{
                            fontFamily: fontSerif,
                            fontSize: "1.1rem",
                            fontWeight: 700
                        }}>
                            {result.label} Face
                        </Typography>

                        <Typography sx={{
                            fontSize: "0.78rem",
                            color: TEXT_SEC,
                            mt: 0.4
                        }}>
                            {result.description}
                        </Typography>

                        <Typography sx={{
                            fontSize: "0.7rem",
                            mt: 0.8,
                            color: TEAL,
                            fontWeight: 600
                        }}>
                            Độ chính xác: {Math.round(result.confidence * 100)}%
                        </Typography>
                    </Card>


                    {/* ───────── FENG SHUI ───────── */}
                    {fengShuiResult && (
                        <>
                            <SectionTitle title="Phong thuỷ ngũ hành" />
                            <FengShuiPanel result={fengShuiResult} />
                        </>
                    )}

                    {/* ───────── SMART COMBO ───────── */}
                    <SectionTitle title="Gợi ý thông minh" />

                    <Card>
                        <Typography sx={{ fontWeight: 600 }}>
                            👓 Gọng kính phù hợp
                        </Typography>

                        <Typography sx={{ fontSize: "0.75rem", color: TEXT_SEC }}>
                            {getFrameCombo(result.shape, fengShuiResult ?? undefined)}
                        </Typography>

                        <Typography sx={{ fontWeight: 600, mt: 1 }}>
                            🔍 Tròng kính
                        </Typography>

                        <Typography sx={{ fontSize: "0.75rem", color: TEXT_SEC }}>
                            {getLens(result.shape, fengShuiResult ?? undefined)}
                        </Typography>

                        {fengShuiResult && (
                            <>
                                <Typography sx={{ fontWeight: 600, mt: 1 }}>
                                    🎨 Màu hợp mệnh
                                </Typography>
                                <ColorChips colors={fengShuiResult.luckyColors} />
                            </>
                        )}
                    </Card>


                    <Button onClick={() => setSaveModalOpen(true)}>
                        Save
                    </Button>
                </>
            )}
        </Box>
    );
};