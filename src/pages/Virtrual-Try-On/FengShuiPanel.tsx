// ─── FengShuiPanel.tsx ────────────────────────────────────────────────────────

import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState, type JSX } from "react";
import type { FengShuiResult, WuXingElement, YinYang } from "@/services/FengShuiAnalyzer";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const TEAL        = "#006470";
const TEAL_LIGHT  = "rgba(0,100,112,0.08)";
const TEAL_BORDER = "rgba(0,100,112,0.2)";
const TEXT        = "#111111";
const TEXT_SEC    = "#555555";
const TEXT_MUTED  = "#888888";
const BORDER      = "rgba(0,0,0,0.08)";
const BG_SEC      = "#f7f8f8";
const fontSans    = "'Inter', 'DM Sans', sans-serif";
const fontSerif   = "'Playfair Display', serif";

// ─── Element palette ──────────────────────────────────────────────────────────

const ELEMENT_PALETTE: Record<WuXingElement, {
    bg: string; border: string; text: string; accent: string; icon: string;
}> = {
    metal: { bg: "rgba(180,180,200,0.10)", border: "rgba(150,150,180,0.28)", text: "#4a4a6a", accent: "#7c7caa", icon: "⬡" },
    wood:  { bg: "rgba(40,120,60,0.08)",   border: "rgba(40,120,60,0.22)",   text: "#2a6040", accent: "#3a8a55", icon: "⬡" },
    water: { bg: "rgba(30,60,140,0.08)",   border: "rgba(30,60,140,0.22)",   text: "#1e3c8a", accent: "#2d5abf", icon: "⬡" },
    fire:  { bg: "rgba(200,60,30,0.08)",   border: "rgba(200,60,30,0.22)",   text: "#8a2a10", accent: "#c8411e", icon: "⬡" },
    earth: { bg: "rgba(160,110,30,0.08)",  border: "rgba(160,110,30,0.22)",  text: "#6a4a10", accent: "#a06e20", icon: "⬡" },
};

// ─── Element SVG icon ─────────────────────────────────────────────────────────

const ElementIcon = ({ element, size = 32 }: { element: WuXingElement; size?: number }) => {
    const s = size;
    const icons: Record<WuXingElement, JSX.Element> = {
        metal: (
            <polygon
                points={`${s/2},${s*0.08} ${s*0.92},${s*0.35} ${s*0.92},${s*0.65} ${s/2},${s*0.92} ${s*0.08},${s*0.65} ${s*0.08},${s*0.35}`}
                fill="none" stroke="currentColor" strokeWidth="1.8"
            />
        ),
        wood: (
            <>
                <line x1={s/2} y1={s*0.08} x2={s/2} y2={s*0.92} stroke="currentColor" strokeWidth="1.8"/>
                <path d={`M${s*0.2} ${s*0.35} Q${s/2} ${s*0.12} ${s*0.8} ${s*0.35}`} fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d={`M${s*0.15} ${s*0.58} Q${s/2} ${s*0.35} ${s*0.85} ${s*0.58}`} fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </>
        ),
        water: (
            <path
                d={`M${s/2} ${s*0.12} Q${s*0.72} ${s*0.3} ${s*0.72} ${s*0.52} Q${s*0.72} ${s*0.82} ${s/2} ${s*0.88} Q${s*0.28} ${s*0.82} ${s*0.28} ${s*0.52} Q${s*0.28} ${s*0.3} ${s/2} ${s*0.12}Z`}
                fill="none" stroke="currentColor" strokeWidth="1.8"
            />
        ),
        fire: (
            <path
                d={`M${s/2} ${s*0.08} Q${s*0.75} ${s*0.28} ${s*0.72} ${s*0.52} Q${s*0.82} ${s*0.38} ${s*0.78} ${s*0.28} Q${s*0.95} ${s*0.52} ${s*0.88} ${s*0.72} Q${s*0.78} ${s*0.92} ${s/2} ${s*0.92} Q${s*0.22} ${s*0.92} ${s*0.12} ${s*0.72} Q${s*0.05} ${s*0.52} ${s*0.22} ${s*0.28} Q${s*0.18} ${s*0.38} ${s*0.28} ${s*0.52} Q${s*0.25} ${s*0.28} ${s/2} ${s*0.08}Z`}
                fill="none" stroke="currentColor" strokeWidth="1.6"
            />
        ),
        earth: (
            <rect x={s*0.12} y={s*0.22} width={s*0.76} height={s*0.56} rx={s*0.06}
                fill="none" stroke="currentColor" strokeWidth="1.8"/>
        ),
    };
    return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {icons[element]}
        </svg>
    );
};

// ─── Animated score ring ──────────────────────────────────────────────────────

const ScoreRing = ({ value, color, size = 56 }: { value: number; color: string; size?: number }) => {
    const circleRef = useRef<SVGCircleElement>(null);
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;

    useEffect(() => {
        const el = circleRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)";
            el.style.strokeDashoffset = String(circ * (1 - value / 100));
        });
    }, [value, circ]);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={TEAL_BORDER} strokeWidth="4"/>
            <circle
                ref={circleRef}
                cx={size/2} cy={size/2} r={r}
                fill="none" stroke={color} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ}
            />
        </svg>
    );
};

// ─── Fortune bar ──────────────────────────────────────────────────────────────

const FortuneBar = ({ label, value, delay }: { label: string; value: number; delay: number }) => {
    const barRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = barRef.current;
        if (!el) return;
        const t = setTimeout(() => {
            el.style.transition = "width 0.9s cubic-bezier(0.4,0,0.2,1)";
            el.style.width = `${value}%`;
        }, delay);
        return () => clearTimeout(t);
    }, [value, delay]);

    const color = value >= 75 ? "#2a8a55" : value >= 50 ? TEAL : value >= 35 ? "#a06e20" : "#c8411e";

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.9 }}>
            <Typography sx={{ fontFamily: fontSans, fontSize: "0.72rem", color: TEXT_MUTED, width: 68, flexShrink: 0 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, height: 5, bgcolor: TEAL_LIGHT, borderRadius: 3, overflow: "hidden" }}>
                <Box ref={barRef} sx={{ height: "100%", width: 0, bgcolor: color, borderRadius: 3 }}/>
            </Box>
            <Typography sx={{ fontFamily: fontSans, fontSize: "0.68rem", color, fontWeight: 600, minWidth: 28, textAlign: "right" }}>
                {value}
            </Typography>
        </Box>
    );
};

// ─── Zone row ─────────────────────────────────────────────────────────────────

const ZoneRow = ({ zone, reading, fortuneArea, score, delay }: {
    zone: string; reading: string; fortuneArea: string; score: number; delay: number;
}) => {
    const [open, setOpen] = useState(false);
    const dotColor = score >= 75 ? "#2a8a55" : score >= 50 ? TEAL : "#a06e20";

    return (
        <Box
            onClick={() => setOpen(o => !o)}
            sx={{
                p: 1.2, borderRadius: "9px",
                border: `1px solid ${BORDER}`,
                bgcolor: open ? TEAL_LIGHT : "transparent",
                cursor: "pointer", mb: 0.7,
                transition: "all 0.18s",
                animation: `fsSlide 0.32s ease ${delay}s both`,
                "@keyframes fsSlide": {
                    from: { opacity: 0, transform: "translateX(-5px)" },
                    to:   { opacity: 1, transform: "translateX(0)" },
                },
                "&:hover": { bgcolor: TEAL_LIGHT, borderColor: TEAL_BORDER },
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }}/>
                <Typography sx={{ fontFamily: fontSans, fontWeight: 600, fontSize: "0.80rem", color: TEXT, flex: 1 }}>
                    {zone}
                </Typography>
                <Typography sx={{ fontFamily: fontSans, fontSize: "0.65rem", color: TEXT_MUTED }}>
                    {fortuneArea}
                </Typography>
                <Typography sx={{ fontFamily: fontSans, fontSize: "0.68rem", color: dotColor, fontWeight: 600, ml: 0.8 }}>
                    {score}
                </Typography>
                <Typography sx={{ color: TEXT_MUTED, fontSize: "0.65rem", ml: 0.3 }}>
                    {open ? "▲" : "▼"}
                </Typography>
            </Box>
            {open && (
                <Typography sx={{ fontFamily: fontSans, fontSize: "0.73rem", color: TEXT_SEC, mt: 0.8, lineHeight: 1.55, pl: 2 }}>
                    {reading}
                </Typography>
            )}
        </Box>
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
                    "@keyframes fsPulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.2 } },
                }}/>
                <Typography sx={{ fontFamily: fontSans, color: TEXT_MUTED, fontSize: "0.82rem" }}>
                    Đang phân tích phong thuỷ…
                </Typography>
            </Box>
        );
    }

    if (!result || !visible) return null;

    const pal = ELEMENT_PALETTE[result.element];

    const fortuneEntries: { label: string; key: keyof typeof result.fortuneAreas }[] = [
        { label: "Tài lộc",    key: "wealth"  },
        { label: "Sự nghiệp",  key: "career"  },
        { label: "Tình duyên", key: "love"    },
        { label: "Sức khoẻ",  key: "health"  },
        { label: "Trí tuệ",   key: "wisdom"  },
    ];

    return (
        <Box sx={{
            width: "100%",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>

            {/* ── Header: element + overall score ── */}
            <Box sx={{
                px: 2, py: 2,
                borderBottom: `1px solid ${BORDER}`,
                display: "flex", alignItems: "center", gap: 2,
            }}>
                {/* Element icon circle */}
                <Box sx={{
                    width: 52, height: 52, borderRadius: "50%",
                    bgcolor: pal.bg, border: `1.5px solid ${pal.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: pal.accent, flexShrink: 0,
                }}>
                    <ElementIcon element={result.element} size={26}/>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                        <Typography sx={{ fontFamily: fontSerif, fontWeight: 700, fontSize: "1.1rem", color: TEXT }}>
                            Hành {result.elementLabel}
                        </Typography>
                        <Box sx={{
                            px: 1, py: 0.2,
                            bgcolor: pal.bg, border: `1px solid ${pal.border}`,
                            borderRadius: "20px",
                        }}>
                            <Typography sx={{ fontFamily: fontSans, fontSize: "0.62rem", color: pal.text, fontWeight: 600 }}>
                                {result.yinYangLabel}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography sx={{ fontFamily: fontSans, color: TEXT_SEC, fontSize: "0.76rem", lineHeight: 1.5 }}>
                        {result.elementDescription}
                    </Typography>
                </Box>

                {/* Overall score ring */}
                <Box sx={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                    <ScoreRing value={result.overallScore} color={pal.accent} size={56}/>
                    <Typography sx={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: fontSans, fontSize: "0.78rem", fontWeight: 700, color: pal.text,
                    }}>
                        {result.overallScore}
                    </Typography>
                </Box>
            </Box>

            {/* ── Lucky info row ── */}
            <Box sx={{
                px: 2, py: 1.4,
                borderBottom: `1px solid ${BORDER}`,
                display: "flex", gap: 1, flexWrap: "wrap",
            }}>
                {[
                    { label: "Màu may mắn", values: result.luckyColors },
                    { label: "Hướng tốt",   values: result.luckyDirections },
                    { label: "Số may mắn",  values: result.luckyNumbers.map(String) },
                ].map(group => (
                    <Box key={group.label} sx={{ mr: 2 }}>
                        <Typography sx={{ fontFamily: fontSans, fontSize: "0.60rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, mb: 0.5 }}>
                            {group.label}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {group.values.map(v => (
                                <Box key={v} sx={{
                                    px: 0.9, py: 0.25,
                                    bgcolor: pal.bg, border: `1px solid ${pal.border}`,
                                    borderRadius: "20px",
                                }}>
                                    <Typography sx={{ fontFamily: fontSans, fontSize: "0.68rem", color: pal.text, fontWeight: 500 }}>
                                        {v}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* ── Fortune bars ── */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontFamily: fontSans, fontSize: "0.60rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, mb: 1.1 }}>
                    Vận hạn các lĩnh vực
                </Typography>
                {fortuneEntries.map(({ label, key }, i) => (
                    <FortuneBar key={key} label={label} value={result.fortuneAreas[key]} delay={i * 80}/>
                ))}
            </Box>

            {/* ── Facial zones ── */}
            {/* <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontFamily: fontSans, fontSize: "0.60rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, mb: 1 }}>
                    Phân tích các cung mặt
                </Typography>
                {result.facialZones.map((z, i) => (
                    <ZoneRow
                        key={z.zone}
                        zone={z.zone}
                        reading={z.reading}
                        fortuneArea={z.fortuneArea}
                        score={z.score}
                        delay={i * 0.06}
                    />
                ))}
            </Box> */}

            {/* ── Strengths & Challenges ── */}
            <Box sx={{ px: 2, pt: 1.4, pb: 1.8, display: "flex", gap: 1.5 }}>
                {[
                    { title: "Điểm mạnh", items: result.strengths,   dotColor: "#2a8a55" },
                    { title: "Lưu ý",     items: result.challenges,   dotColor: "#a06e20" },
                ].map(col => (
                    <Box key={col.title} sx={{ flex: 1 }}>
                        <Typography sx={{ fontFamily: fontSans, fontSize: "0.60rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, mb: 0.8 }}>
                            {col.title}
                        </Typography>
                        {col.items.map(item => (
                            <Box key={item} sx={{ display: "flex", alignItems: "flex-start", gap: 0.7, mb: 0.6 }}>
                                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: col.dotColor, flexShrink: 0, mt: "5px" }}/>
                                <Typography sx={{ fontFamily: fontSans, fontSize: "0.72rem", color: TEXT_SEC, lineHeight: 1.5 }}>
                                    {item}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};