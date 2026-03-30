import { Box, Typography } from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { type FaceAnalysisResult } from "@/services/FaceShapeAnalyzer";
import { FaceShapeSuggestionPanel } from "../FaceShapeSuggestionPanel";
import VideoTryOn from "./VideoTryOn";
import ImageTryOn from "./ImageTryOn";
import {
    T,
    LENS_VENDORS,
    type DrawerType,
    type LensOption,
    type TextureVariant,
} from "./TryOnTypes";
import ProductAPI from "@/api/product-api";
import type { FengShuiResult } from "@/services/FengShuiAnalyzer";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GlassesTryOnPopupProps {
    frameGroupId: string,
    open: boolean;
    onClose: () => void;
    onAddToCart?: (lensId: string | null, textureId: string | null) => void;
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

const CANVAS_W = 880;
const DRAWER_W = 300;
const MODAL_H = 540;

// ─── Icon button (on dark canvas) ────────────────────────────────────────────

const CanvasIconBtn = ({
    onClick, active, title, hasDot, children,
}: {
    onClick: () => void;
    active: boolean;
    title: string;
    hasDot?: boolean;
    children: React.ReactNode;
}) => (
    <Box
        component="button"
        onClick={onClick}
        title={title}
        sx={{
            width: 34, height: 34, borderRadius: "50%",
            border: `1.5px solid ${active ? T.teal : T.overlayBorder}`,
            bgcolor: active ? T.teal : T.overlayBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: active ? "#fff" : T.overlayTextMuted,
            transition: "all 0.18s", position: "relative",
            "&:hover": { borderColor: T.teal, bgcolor: T.teal, color: "#fff" },
        }}
    >
        {children}
        {hasDot && (
            <Box sx={{
                position: "absolute", top: 3, right: 3,
                width: 7, height: 7, borderRadius: "50%",
                bgcolor: "#22c55e",
                border: "1.5px solid rgba(0,0,0,0.3)",
            }} />
        )}
    </Box>
);

// ─── Lens drawer ──────────────────────────────────────────────────────────────

const LensDrawer = ({
    activeLensId, onSelect,
}: {
    activeLensId: string | null;
    onSelect: (lens: LensOption) => void;
}) => (
    <Box sx={{
        flex: 1, overflowY: "auto",
        "&::-webkit-scrollbar": { width: "3px" },
        "&::-webkit-scrollbar-thumb": { bgcolor: T.tealBorder, borderRadius: "2px" },
    }}>
        {LENS_VENDORS.map((vendor) => (
            <Box key={vendor.vendor} sx={{ mb: 1, px: 1.5 }}>
                <Typography sx={{
                    fontFamily: T.fontSans, fontSize: "0.65rem", fontWeight: 600,
                    color: T.teal, textTransform: "uppercase", letterSpacing: "0.08em",
                    py: 0.8, mb: 0.4,
                    borderBottom: `1px solid ${T.borderSubtle}`,
                }}>
                    {vendor.vendor}
                </Typography>

                {vendor.items.map((item) => {
                    const isActive = activeLensId === item.id;
                    return (
                        <Box
                            key={item.id}
                            component="button"
                            onClick={() => onSelect(item)}
                            sx={{
                                width: "100%", display: "flex", alignItems: "center",
                                gap: 1.2, px: 1, py: 0.9,
                                border: `1px solid ${isActive ? T.teal : "transparent"}`,
                                borderRadius: "8px",
                                bgcolor: isActive ? T.tealLight : "transparent",
                                cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                                "&:hover": { bgcolor: T.tealLight, borderColor: T.tealBorder },
                            }}
                        >
                            <Box sx={{
                                width: 22, height: 22, borderRadius: "5px",
                                border: `1px solid ${T.border}`,
                                flexShrink: 0,
                                ...Object.fromEntries(
                                    item.cssPreview.split(";").filter(Boolean).map((s) => {
                                        const [k, v] = s.split(":").map((x) => x.trim());
                                        return [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v];
                                    })
                                ),
                            }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{
                                    fontFamily: T.fontSans, fontSize: "0.78rem",
                                    fontWeight: 500, color: T.text,
                                }}>
                                    {item.name}
                                </Typography>
                                <Typography sx={{ fontFamily: T.fontSans, fontSize: "0.66rem", color: T.textMuted }}>
                                    {item.desc}
                                </Typography>
                            </Box>
                            <Typography sx={{
                                fontFamily: T.fontSans, fontSize: "0.78rem",
                                fontWeight: 600, color: T.teal, flexShrink: 0,
                            }}>
                                {item.price}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        ))}
    </Box>
);

// ─── Rec drawer ───────────────────────────────────────────────────────────────

const RecDrawer = ({ result, fengShuiResult }: { result: FaceAnalysisResult | null, fengShuiResult: FengShuiResult | null }) => {
    if (!result) {
        return (
            <Box sx={{
                flex: 1, display: "flex", alignItems: "center",
                justifyContent: "center", px: 2.5, flexDirection: "column", gap: 1.5,
            }}>
                <Box sx={{
                    width: 48, height: 48, borderRadius: "50%",
                    bgcolor: T.tealLight, border: `1px solid ${T.tealBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.teal,
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                </Box>
                <Typography sx={{
                    fontFamily: T.fontSans, fontSize: "0.78rem",
                    color: T.textMuted, textAlign: "center", lineHeight: 1.6,
                }}>
                    Face shape analysis will appear here once a face is detected.
                </Typography>
            </Box>
        );
    }
    return (
        <Box sx={{
            flex: 1, overflowY: "auto",
            "&::-webkit-scrollbar": { width: "3px" },
            "&::-webkit-scrollbar-thumb": { bgcolor: T.tealBorder, borderRadius: "2px" },
        }}>
            <FaceShapeSuggestionPanel
                result={result}
                fengShuiResult={fengShuiResult}   // ← thêm dòng này
                isAnalyzing={false}
            />
        </Box>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const GlassesTryOnPopup = ({ frameGroupId, open, onClose, onAddToCart }: GlassesTryOnPopupProps) => {

    const [mode, setMode] = useState<"video" | "image">("video");
    const [drawer, setDrawer] = useState<DrawerType>(null);
    const [activeTexture, setActiveTexture] = useState<TextureVariant | null>(null);
    const [activeLens, setActiveLens] = useState<LensOption | null>(null);
    const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult | null>(null);
    const [fengShuiResult, setFengShuiResult] = useState<FengShuiResult | null>(null);
    const [reloadSignal, setReloadSignal] = useState(0);
    const [textures, setTextures] = useState<TextureVariant[]>([]);
    const [loadingTextures, setLoadingTextures] = useState(false);

    const drawerOpen = drawer !== null;

    const toggleDrawer = (type: NonNullable<DrawerType>) => {
        setDrawer((prev) => (prev === type ? null : type));
    };

    const handleClose = useCallback(() => {
        setDrawer(null);
        setAnalysisResult(null);
        setFengShuiResult(null);
        onClose();
    }, [onClose]);

    const handleReload = useCallback(() => {
        setAnalysisResult(null);
        setFengShuiResult(null);
        setReloadSignal((n) => n + 1);
    }, []);

    const handleModeSwitch = (m: "video" | "image") => {
        setMode(m);
        setAnalysisResult(null);
        setFengShuiResult(null);
        setReloadSignal((n) => n + 1);
    };


    useEffect(() => {
        if (!frameGroupId) return;

        const fetchTextures = async () => {
            try {
                setLoadingTextures(true);

                const data = await ProductAPI.getTextureFiles(frameGroupId);

                setTextures(data);
                setActiveTexture(data[0])
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingTextures(false);
            }
        };

        fetchTextures();
    }, [frameGroupId]);

    if (!open) return null;

    return (
        <Box
            onClick={handleClose}
            sx={{
                position: "fixed", inset: 0, zIndex: 1200,
                bgcolor: "transparent",
                backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                p: 2,
            }}
        >
            {/* ══ Modal ══ */}
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    width: drawerOpen ? CANVAS_W + DRAWER_W : CANVAS_W,
                    maxWidth: "100%",
                    height: MODAL_H,
                    bgcolor: T.bg,
                    borderRadius: "16px",
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    overflow: "hidden",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
                    transition: "width 0.26s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                {/* ══ Canvas panel ══ */}
                <Box sx={{
                    width: CANVAS_W,
                    minWidth: CANVAS_W,
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    bgcolor: T.canvasBg,
                    borderRadius: drawerOpen ? "16px 0 0 16px" : "16px",
                    transition: "border-radius 0.26s",
                }}>
                    {/* Try-on content */}
                    <Box sx={{ position: "absolute", inset: 0 }}>
                        {mode === "video" ? (
                            <VideoTryOn
                                frameGroupId={frameGroupId}
                                activeTexture={activeTexture}
                                onAnalysisReady={setAnalysisResult}
                                onAgeReady={() => { }}
                                onReload={handleReload}
                            />
                        ) : (
                            <ImageTryOn
                                frameGroupId={frameGroupId}
                                activeTexture={activeTexture}
                                onAnalysisReady={setAnalysisResult}
                                onFengShuiReady={setFengShuiResult}
                                onAgeReady={() => { }}
                                reloadSignal={reloadSignal}
                            />
                        )}
                    </Box>

                    {/* ── TOP BAR ── */}
                    <Box sx={{
                        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        pt: 1.5, px: 1.5,
                    }}>
                        {/* Mode tabs */}
                        <Box sx={{
                            display: "flex",
                            border: `1px solid ${T.overlayBorder}`,
                            borderRadius: "8px", overflow: "hidden",
                        }}>
                            {(["video", "image"] as const).map((m) => (
                                <Box
                                    key={m}
                                    component="button"
                                    onClick={() => handleModeSwitch(m)}
                                    sx={{
                                        border: "none", cursor: "pointer",
                                        fontFamily: T.fontSans, fontSize: "0.78rem",
                                        px: 2.2, py: 0.65,
                                        bgcolor: mode === m ? T.teal : T.overlayBg,
                                        color: mode === m ? "#fff" : T.overlayTextMuted,
                                        fontWeight: mode === m ? 600 : 400,
                                        transition: "all 0.18s",
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    {m === "video" ? "Video" : "Image"}
                                </Box>
                            ))}
                        </Box>

                        {/* Close */}
                        <Box
                            component="button"
                            onClick={handleClose}
                            sx={{
                                position: "absolute", right: 12,
                                width: 30, height: 30, borderRadius: "50%",
                                border: `1px solid ${T.overlayBorder}`,
                                bgcolor: T.overlayBg, color: T.overlayTextMuted,
                                cursor: "pointer", fontSize: "13px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.18s",
                                "&:hover": { bgcolor: "rgba(255,255,255,0.2)", color: "#fff" },
                            }}
                        >✕</Box>
                    </Box>

                    {/* ── BOTTOM BAR ── */}
                    <Box sx={{
                        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
                        px: 1.8, py: 1.4,
                        display: "flex", alignItems: "center",
                        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                    }}>
                        {/* Reload */}
                        <Box
                            component="button"
                            onClick={handleReload}
                            title={mode === "video" ? "Restart camera" : "Upload new photo"}
                            sx={{
                                width: 36, height: 36, borderRadius: "50%",
                                border: `1px solid ${T.overlayBorder}`,
                                bgcolor: T.overlayBg, color: T.overlayTextMuted,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", flexShrink: 0, transition: "all 0.18s",
                                "&:hover": { bgcolor: T.teal, borderColor: T.teal, color: "#fff" },
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-3" />
                            </svg>
                        </Box>

                        {/* Texture swatches — centered */}
                        <Box sx={{
                            flex: 1, display: "flex",
                            alignItems: "center", justifyContent: "center", gap: 0.8,
                        }}>
                            <Typography sx={{
                                fontFamily: T.fontSans, fontSize: "0.7rem",
                                color: T.overlayTextMuted, flexShrink: 0,
                            }}>
                                Variant:
                            </Typography>
                            {textures.map((tv) => {
                                const isActive = activeTexture?.colorHex === tv.colorHex;

                                const isColor = tv.colorHex; // ví dụ field backend trả

                                return (
                                    <Box
                                        key={tv.colorHex}
                                        onClick={() => {
                                            console.log("CLICK", tv);
                                            setActiveTexture(tv);
                                        }}
                                        sx={{
                                            width: 25,
                                            height: 25,
                                            borderRadius: "50%",
                                            cursor: "pointer",
                                            border: isActive ? "2px solid white" : "1px solid #ccc",
                                            overflow: "hidden"
                                        }}
                                    >
                                        {isColor ? (
                                            // 🎨 Render color
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderRadius: "50%",
                                                    backgroundColor: tv.colorHex
                                                }}
                                            />
                                        ) : (
                                            // 🖼️ Render image
                                            <img
                                                src={tv.url}
                                                style={{
                                                    margin: "auto",   // 🔥 center ngang

                                                    borderRadius: "50%",
                                                    objectFit: "contain"
                                                }}
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Icon buttons */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flexShrink: 0 }}>
                            <CanvasIconBtn
                                onClick={() => toggleDrawer("rec")}
                                active={drawer === "rec"}
                                title="Recommendations"
                                hasDot={!!analysisResult}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                            </CanvasIconBtn>
                            <CanvasIconBtn
                                onClick={() => toggleDrawer("lens")}
                                active={drawer === "lens"}
                                title="Lenses"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="7" cy="12" r="3.5" />
                                    <circle cx="17" cy="12" r="3.5" />
                                    <line x1="10.5" y1="12" x2="13.5" y2="12" />
                                    <line x1="1" y1="9" x2="3.5" y2="9" />
                                    <line x1="20.5" y1="9" x2="23" y2="9" />
                                </svg>
                            </CanvasIconBtn>
                        </Box>
                    </Box>
                </Box>

                {/* ══ Drawer panel ══ */}
                <Box sx={{
                    width: drawerOpen ? DRAWER_W : 0,
                    minWidth: 0,
                    height: "100%",
                    overflow: "hidden",
                    transition: "width 0.26s cubic-bezier(0.4,0,0.2,1)",
                    flexShrink: 0,
                    display: "flex", flexDirection: "column",
                    bgcolor: T.bg,
                    opacity: drawerOpen ? 1 : 0,
                    transitionProperty: "width, opacity",
                    transitionDuration: "0.26s, 0.15s",
                }}>
                    <Box sx={{ width: DRAWER_W, height: "100%", display: "flex", flexDirection: "column" }}>
                        {/* Drawer header */}
                        <Box sx={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            px: 2, py: 1.5,
                            borderBottom: `1px solid ${T.borderSubtle}`,
                            flexShrink: 0,
                        }}>
                            <Typography sx={{
                                fontFamily: T.fontSans, fontSize: "0.88rem",
                                fontWeight: 600, color: T.text,
                            }}>
                                {drawer === "lens" ? "Lenses" : "Recommendations"}
                            </Typography>
                            <Box
                                component="button"
                                onClick={() => setDrawer(null)}
                                sx={{
                                    width: 26, height: 26, borderRadius: "50%",
                                    border: `1px solid ${T.border}`,
                                    bgcolor: "transparent", color: T.textMuted,
                                    cursor: "pointer", fontSize: "12px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.15s",
                                    "&:hover": { bgcolor: T.bgSecondary, color: T.text },
                                }}
                            >✕</Box>
                        </Box>

                        {/* Drawer body */}
                        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            {drawer === "lens" && (
                                <LensDrawer
                                    activeLensId={activeLens?.id ?? null}
                                    onSelect={setActiveLens}
                                />
                            )}
                            {drawer === "rec" && (
                                <RecDrawer result={analysisResult} fengShuiResult={fengShuiResult} />
                            )}
                        </Box>

                        {/* Drawer footer */}
                        {drawer === "lens" && (
                            <Box sx={{
                                px: 2, py: 1.5,
                                borderTop: `1px solid ${T.borderSubtle}`,
                                flexShrink: 0,
                            }}>
                                {activeLens && (
                                    <Typography sx={{
                                        fontFamily: T.fontSans, fontSize: "0.72rem",
                                        color: T.textMuted, mb: 0.8,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {activeLens.name} · {activeTexture?.colorHex}
                                    </Typography>
                                )}
                                <Box
                                    component="button"
                                    disabled={!activeLens}
                                    onClick={() => onAddToCart?.(activeLens?.id ?? null, activeTexture!.colorHex)}
                                    sx={{
                                        width: "100%", border: "none", borderRadius: "8px",
                                        bgcolor: activeLens ? T.teal : T.bgTertiary,
                                        color: activeLens ? "#fff" : T.textDim,
                                        fontFamily: T.fontSans, fontWeight: 600,
                                        fontSize: "0.85rem", letterSpacing: "0.01em",
                                        py: 1.1, cursor: activeLens ? "pointer" : "not-allowed",
                                        transition: "all 0.18s",
                                        "&:hover:not(:disabled)": { bgcolor: "#005560" },
                                    }}
                                >
                                    Add to Cart
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default GlassesTryOnPopup;