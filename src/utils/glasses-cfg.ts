// glasses-cfg.utils.ts

import type { CFG } from "@/services/FaceLandmarkerService";

export interface GlassesMeasurements {
    frameWidthMm: number;      // Tổng chiều rộng frame (ví dụ: 140mm)
    lensWidthMm: number;       // Chiều rộng 1 tròng (ví dụ: 52mm)
    lensHeightMm: number;      // Chiều cao tròng (ví dụ: 40mm)
    bridgeWidthMm: number;     // Chiều rộng cầu mũi (ví dụ: 18mm)
    templeLengthMm: number;    // Độ dài gọng tai (ví dụ: 140mm)
}

/**
 * Khuôn mặt người lớn trung bình:
 *   - Chiều rộng mặt (temple-to-temple): ~138mm
 *   - Chiều cao mặt (forehead-to-chin):  ~210mm
 *
 * Model đã được normalizeModel() → TARGET_WIDTH = 140px tương ứng fW pixel-space.
 * => scale = frameWidthMm / REF_FACE_WIDTH_MM
 */
const REF_FACE_WIDTH_MM = 138;    // mm — chiều rộng mặt trung bình
const REF_FACE_HEIGHT_MM = 210;   // mm — chiều cao mặt trung bình (dùng để tính offset Y)

// Pixel-space constants (phải khớp với CFG.refHeadWidth)
const REF_HEAD_WIDTH_PX = 140;
const REF_FACE_HEIGHT_PX = 210;

// Depth baseline — kính nằm trước mặt ~10–12mm
const BASE_DEPTH_MM = 12;

export function buildCfgFromMeasurements(
    m: GlassesMeasurements,
    mode: "VIDEO" | "IMAGE" = "VIDEO"
): typeof CFG {

    // ── 1. Scale ──────────────────────────────────────────────────────────────
    // frameWidthMm / REF_FACE_WIDTH_MM cho ta tỉ lệ kính so với mặt.
    // Nhân thêm hệ số 1.0 (có thể tune nếu model 3D bị to/nhỏ hơn thực tế).
    const glassesScale = m.frameWidthMm / REF_FACE_WIDTH_MM;

    // ── 2. glassesDown (Y-offset, pixel-space) ────────────────────────────────
    // Mắt nằm ở ~42% chiều cao mặt từ đỉnh (theo chuẩn nhân trắc học).
    // Tròng kính cần căn giữa ngang trục mắt, nhưng kính thực tế
    // hơi thấp hơn tâm mắt khoảng lensHeightMm * 0.1
    //
    // Chuyển mm → pixel-space:
    //   pixelPerMm = REF_HEAD_WIDTH_PX / REF_FACE_WIDTH_MM
    const pixelPerMm = REF_HEAD_WIDTH_PX / REF_FACE_WIDTH_MM;
    const lensOffsetPx = m.lensHeightMm * 0.10 * pixelPerMm;

    // VIDEO: glassesDown âm = đẩy lên (trục Y lật); IMAGE: dương = đẩy xuống
    const glassesDown = mode === "VIDEO"
        ? -(lensOffsetPx)   // ví dụ lensHeight=40mm → ~4px
        : +(lensOffsetPx);

    // ── 3. glassesDepth (Z-offset, pixel-space) ───────────────────────────────
    // Kính nhô ra trước mặt khoảng BASE_DEPTH_MM + một phần bridge.
    // Bridge rộng → kính phẳng hơn, depth ít hơn.
    // Bridge hẹp → kính cong hơn, cần depth lớn hơn.
    const bridgeDepthAdj = (18 - m.bridgeWidthMm) * 0.3; // 18mm = chuẩn trung bình
    const depthMm = BASE_DEPTH_MM + bridgeDepthAdj;
    const glassesDepth = -(depthMm * pixelPerMm); // âm = về phía camera

    return {
        refHeadWidth: REF_HEAD_WIDTH_PX,
        refFaceHeight: REF_FACE_HEIGHT_PX,
        glassesDepth,
        glassesDown,
        glassesCenterX: 0,
        glassesScale,
    };
}

// ── Convenience exports ───────────────────────────────────────────────────────

export function buildVideoCfg(m: GlassesMeasurements) {

    // ── 1. Scale ──────────────────────────────────────────────────────────────
    const glassesScale = m.frameWidthMm / REF_FACE_WIDTH_MM;

    const pixelPerMm = REF_HEAD_WIDTH_PX / REF_FACE_WIDTH_MM;
    const lensOffsetPx = m.lensHeightMm * pixelPerMm;

    // ── 2. glassesDown (Y-offset, pixel-space) ────────────────────────────────
    const glassesDown = -lensOffsetPx

    // ── 3. glassesDepth (Z-offset, pixel-space) ───────────────────────────────
    const bridgeDepthAdj = (18 - m.bridgeWidthMm) * 0.3; // 18mm = chuẩn trung bình
    const depthMm = 100 + bridgeDepthAdj;
    const glassesDepth = -(depthMm * pixelPerMm);

    return {
        refHeadWidth: REF_HEAD_WIDTH_PX,
        refFaceHeight: REF_FACE_HEIGHT_PX,
        glassesDepth,
        glassesDown,
        glassesCenterX: 0,
        glassesScale,
    };
}

export function buildImageCfg(m: GlassesMeasurements) {
    const glassesScale = m.frameWidthMm / REF_FACE_WIDTH_MM;

    // ── 2. glassesDown (Y-offset, pixel-space) ────────────────────────────────
    const pixelPerMm = REF_HEAD_WIDTH_PX / REF_FACE_WIDTH_MM;
    const lensOffsetPx = m.lensHeightMm * 0.1 * pixelPerMm;

    // VIDEO: glassesDown âm = đẩy lên (trục Y lật); IMAGE: dương = đẩy xuống
    const glassesDown = +(lensOffsetPx);

    // ── 3. glassesDepth (Z-offset, pixel-space) ───────────────────────────────
    const bridgeDepthAdj = (18 - m.bridgeWidthMm) * 0.3; // 18mm = chuẩn trung bình
    const depthMm = 12 + bridgeDepthAdj;
    const glassesDepth = -(depthMm * pixelPerMm);

    return {
        refHeadWidth: REF_HEAD_WIDTH_PX,
        refFaceHeight: REF_FACE_HEIGHT_PX,
        glassesDepth,
        glassesDown,
        glassesCenterX: 0,
        glassesScale,
    };
}