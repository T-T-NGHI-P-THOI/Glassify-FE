// ─── FengShuiPanel.tsx ────────────────────────────────────────────────────────

import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { FengShuiResult, WuXingElement } from "@/services/FengShuiAnalyzer";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const TEAL        = "#006470";
const TEAL_BORDER = "rgba(0,100,112,0.2)";
const TEXT        = "#111111";
const TEXT_SEC    = "#555555";
const TEXT_MUTED  = "#888888";
const BORDER      = "rgba(0,0,0,0.08)";
const fontSans    = "'Inter', 'DM Sans', sans-serif";
const fontSerif   = "'Playfair Display', serif";

// ─── Element palette ──────────────────────────────────────────────────────────

const ELEMENT_PALETTE: Record<WuXingElement, {
    bg: string; border: string; text: string; accent: string;
}> = {
    metal: { bg: "rgba(180,180,200,0.10)", border: "rgba(150,150,180,0.28)", text: "#4a4a6a", accent: "#7c7caa" },
    wood:  { bg: "rgba(40,120,60,0.08)",   border: "rgba(40,120,60,0.22)",   text: "#2a6040", accent: "#3a8a55" },
    water: { bg: "rgba(30,60,140,0.08)",   border: "rgba(30,60,140,0.22)",   text: "#1e3c8a", accent: "#2d5abf" },
    fire:  { bg: "rgba(200,60,30,0.08)",   border: "rgba(200,60,30,0.22)",   text: "#8a2a10", accent: "#c8411e" },
    earth: { bg: "rgba(160,110,30,0.08)",  border: "rgba(160,110,30,0.22)",  text: "#6a4a10", accent: "#a06e20" },
};

// ─── Animated score ring ──────────────────────────────────────────────────────

const ScoreRing = ({
    value,
    color,
    size = 56,
}: {
    value: number;
    color: string;
    size?: number;
}) => {
    const circleRef = useRef<SVGCircleElement>(null);
    const r    = (size - 6) / 2;
    const circ = 2 * Math.PI * r;

    useEffect(() => {
        const el = circleRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.style.transition       = "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)";
            el.style.strokeDashoffset = String(circ * (1 - value / 100));
        });
    }, [value, circ]);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: "rotate(-90deg)" }}
        >
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={TEAL_BORDER}
                strokeWidth="4"
            />
            <circle
                ref={circleRef}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
            />
        </svg>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    result: FengShuiResult | null;
    isAnalyzing?: boolean;
}

export const FengShuiPanel = ({ result, isAnalyzing = false }: Props) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (result) {
            setVisible(false);
            const t = setTimeout(() => setVisible(true), 60);
            return () => clearTimeout(t);
        }
    }, [result]);

    if (!result && !isAnalyzing) return null;

    if (isAnalyzing) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 2 }}>
                <Box sx={{
                    width: 8, height: 8, borderRadius: "50%", bgcolor: TEAL,
                    animation: "fsPulse 1s infinite",
                    "@keyframes fsPulse": {
                        "0%,100%": { opacity: 1 },
                        "50%":     { opacity: 0.2 },
                    },
                }} />
                <Typography sx={{ fontFamily: fontSans, color: TEXT_MUTED, fontSize: "0.82rem" }}>
                    Analysing feng shui…
                </Typography>
            </Box>
        );
    }

    if (!result || !visible) return null;

    const pal = ELEMENT_PALETTE[result.element];

    return (
        <Box sx={{
            mx: 2,
            mb: 1.2,
            p: 1.4,
            borderRadius: "14px",
            border: `1px solid ${BORDER}`,
            bgcolor: "#fff",
            boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            gap: 2,
        }}>
            {/* Info */}
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                    <Typography sx={{
                        fontFamily: fontSerif,
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: TEXT,
                    }}>
                        {result.elementLabel}
                    </Typography>

                    <Box sx={{
                        px: 1,
                        py: 0.2,
                        bgcolor: pal.bg,
                        border: `1px solid ${pal.border}`,
                        borderRadius: "20px",
                    }}>
                        <Typography sx={{
                            fontFamily: fontSans,
                            fontSize: "0.62rem",
                            color: pal.text,
                            fontWeight: 600,
                        }}>
                            {result.yinYangLabel}
                        </Typography>
                    </Box>
                </Box>

                <Typography sx={{
                    fontFamily: fontSans,
                    color: TEXT_SEC,
                    fontSize: "0.76rem",
                    lineHeight: 1.5,
                }}>
                    {result.elementDescription}
                </Typography>
            </Box>

            {/* Score ring */}
            <Box sx={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                <ScoreRing value={result.overallScore} color={pal.accent} size={56} />
                <Typography sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fontSans,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: pal.text,
                }}>
                    {result.overallScore}
                </Typography>
            </Box>
        </Box>
    );
};