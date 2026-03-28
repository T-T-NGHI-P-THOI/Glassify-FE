import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { AgeGenderResult } from "@/services/AgeDetectionService";

// ─── Gender icon ──────────────────────────────────────────────────────────────
const GenderIcon = ({ gender, size = 14 }: { gender: "male" | "female"; size?: number }) =>
    gender === "female" ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="5" />
            <line x1="12" y1="13" x2="12" y2="21" />
            <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
    ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="14" r="5" />
            <line x1="14.35" y1="9.65" x2="21" y2="3" />
            <polyline points="16 3 21 3 21 8" />
        </svg>
    );

// ─── Animated digit counter ───────────────────────────────────────────────────
const AnimatedAge = ({ target }: { target: number }) => {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        let start: number | null = null;
        const duration = 800;
        const from = 0;

        const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (target - from) * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(step);
        };

        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target]);

    return <>{display}</>;
};

// ─── Main badge ───────────────────────────────────────────────────────────────
interface Props {
    result: AgeGenderResult | null;
    isDetecting?: boolean;
}

export const AgeGenderBadge = ({ result, isDetecting = false }: Props) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (result) {
            setVisible(false);
            const t = setTimeout(() => setVisible(true), 60);
            return () => clearTimeout(t);
        }
    }, [result]);

    if (!result && !isDetecting) return null;

    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                opacity: visible || isDetecting ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.45s ease, transform 0.45s ease",
                animation: isDetecting ? "shimmer 1.6s infinite" : "none",
                "@keyframes shimmer": {
                    "0%,100%": { opacity: 0.5 },
                    "50%": { opacity: 1 },
                },
            }}
        >
            {isDetecting && !result ? (
                <Box sx={{
                    px: 2, py: 0.75,
                    borderRadius: "20px",
                    border: "1px solid rgba(201,168,76,0.2)",
                    bgcolor: "rgba(201,168,76,0.05)",
                    display: "flex", alignItems: "center", gap: 1,
                }}>
                    <Box sx={{
                        width: 6, height: 6, borderRadius: "50%",
                        bgcolor: "#c9a84c",
                        animation: "pulse 1s infinite",
                        "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.2 } },
                    }} />
                    <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "rgba(240,230,200,0.4)" }}>
                        Estimating age…
                    </Typography>
                </Box>
            ) : result ? (
                <>
                    {/* Age pill */}
                    <Box sx={{
                        px: 2.5, py: 0.8,
                        borderRadius: "20px",
                        border: "1px solid rgba(201,168,76,0.35)",
                        bgcolor: "rgba(201,168,76,0.08)",
                        display: "flex", alignItems: "baseline", gap: 0.6,
                    }}>
                        <Typography sx={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "1.4rem", fontWeight: 700,
                            color: "#e8cc7a", lineHeight: 1,
                        }}>
                            <AnimatedAge target={result.age} />
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.7rem", color: "rgba(240,230,200,0.45)",
                            letterSpacing: "0.06em",
                        }}>
                            yrs
                        </Typography>
                    </Box>

                    {/* Range + gender */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                            <Box sx={{ color: result.gender === "female" ? "#e8a0c0" : "#90c0e8", display: "flex" }}>
                                <GenderIcon gender={result.gender} size={13} />
                            </Box>
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.78rem", fontWeight: 500,
                                color: result.gender === "female" ? "#e8a0c0" : "#90c0e8",
                                textTransform: "capitalize",
                            }}>
                                {result.gender}
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.68rem",
                                color: "rgba(240,230,200,0.3)",
                            }}>
                                · {Math.round(result.genderProbability * 100)}%
                            </Typography>
                        </Box>
                        <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.7rem",
                            color: "rgba(240,230,200,0.35)",
                            letterSpacing: "0.04em",
                        }}>
                            Est. range {result.ageRange} · {result.ageGroup}
                        </Typography>
                    </Box>
                </>
            ) : null}
        </Box>
    );
};