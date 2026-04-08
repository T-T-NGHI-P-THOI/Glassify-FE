import * as THREE from 'three';

export type FaceShape =
    | 'OVAL' | 'ROUND' | 'SQUARE'
    | 'HEART' | 'OBLONG' | 'DIAMOND';

export interface GlassesRecommendation {
    style: string;
    reason: string;
    shape: 'RECTANGLE' | 'ROUND' | 'AVIATOR' | 'CAT_EYE' | 'WAYFARERS' | 'GEOMETRIC';
    icon: string;
}

export interface FaceAnalysisResult {
    shape: FaceShape;
    label: string;
    description: string;
    confidence: number;
    measurements: {
        foreheadWidth: number;
        cheekWidth: number;
        jawWidth: number;
        templeWidth: number;   // MỚI
        faceHeight: number;
        ratio: number;
        symmetryScore: number;     // MỚI: 0–1, càng cao càng cân đối
        goldenRatioScore: number;  // MỚI: độ gần với tỉ lệ vàng 1.618
    };
    recommendations: GlassesRecommendation[];
}

// ─── Landmark indices (MediaPipe 478-point) ───────────────────────────────────

const LM = {
    foreheadLeft: 54, foreheadRight: 284,
    cheekLeft: 234, cheekRight: 454,
    jawLeft: 172, jawRight: 397,
    jawAngleLeft: 58, jawAngleRight: 288,
    templeLeft: 127, templeRight: 356,  // thái dương
    chin: 152,
    forehead: 10,
    // Thêm điểm kiểm tra đối xứng
    eyeLeft: 33, eyeRight: 263,
    noseLeft: 4, noseRight: 1,  // sống mũi
    noseTip: 4,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dist(a: THREE.Vector2, b: THREE.Vector2) { return a.distanceTo(b); }
function lm2v(lm: { x: number; y: number }, w: number, h: number): THREE.Vector2 {
    return new THREE.Vector2(lm.x * w, lm.y * h);
}
function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

// ─── Classification weights ───────────────────────────────────────────────────
//  Mỗi shape: [ratioMin, ratioMax, fNorm_ideal, jNorm_ideal, tNorm_ideal, weight]
//  fNorm = forehead/cheek, jNorm = jaw/cheek, tNorm = temple/cheek

interface ShapeProfile {
    ratioRange: [number, number];  // cheekWidth/faceHeight
    fIdeal: number;                // forehead / cheek
    jIdeal: number;                // jaw / cheek
    tIdeal: number;                // temple / cheek
    tolerance: number;             // độ mềm dẻo khi tính khoảng cách
}

const PROFILES: Record<FaceShape, ShapeProfile> = {
    OVAL: { ratioRange: [0.74, 0.86], fIdeal: 0.82, jIdeal: 0.75, tIdeal: 0.88, tolerance: 0.12 },
    ROUND: { ratioRange: [0.88, 1.10], fIdeal: 0.85, jIdeal: 0.85, tIdeal: 0.90, tolerance: 0.10 },
    SQUARE: { ratioRange: [0.75, 0.92], fIdeal: 0.90, jIdeal: 0.92, tIdeal: 0.92, tolerance: 0.10 },
    HEART: { ratioRange: [0.72, 0.90], fIdeal: 0.95, jIdeal: 0.68, tIdeal: 0.90, tolerance: 0.11 },
    OBLONG: { ratioRange: [0.55, 0.73], fIdeal: 0.80, jIdeal: 0.78, tIdeal: 0.84, tolerance: 0.13 },
    DIAMOND: { ratioRange: [0.72, 0.90], fIdeal: 0.72, jIdeal: 0.68, tIdeal: 0.82, tolerance: 0.11 },
};

function scoreShape(
    shape: FaceShape,
    ratio: number,
    fNorm: number,
    jNorm: number,
    tNorm: number
): number {
    const p = PROFILES[shape];
    const [rMin, rMax] = p.ratioRange;

    // Penalty nếu ratio nằm ngoài khoảng lý tưởng
    const rPenalty = ratio < rMin ? rMin - ratio :
        ratio > rMax ? ratio - rMax : 0;

    // Khoảng cách Euclidean từ bộ ba (f, j, t) tới ideal
    const featureDist = Math.sqrt(
        (fNorm - p.fIdeal) ** 2 +
        (jNorm - p.jIdeal) ** 2 +
        (tNorm - p.tIdeal) ** 2
    );

    // Score cao = khớp tốt
    const score = 1 / (1 + featureDist / p.tolerance + rPenalty * 3);
    return clamp(score, 0, 1);
}

// ─── GLASSES_DB & meta (giữ nguyên từ file gốc) ───────────────────────────────

const GLASSES_DB: Record<FaceShape, GlassesRecommendation[]> = {
    OVAL: [
        { style: 'Wayfarers', reason: 'Oval faces suit almost any frame. Wayfarers add bold character.', shape: 'WAYFARERS', icon: '🕶️' },
        { style: 'Geometric', reason: 'Angular geometric frames create contrast with soft oval features.', shape: 'GEOMETRIC', icon: '🔷' },
        { style: 'Aviator', reason: 'Classic aviators complement the balanced oval silhouette.', shape: 'AVIATOR', icon: '✈️' },
    ],
    ROUND: [
        { style: 'Rectangle', reason: 'Rectangular frames add definition and slim a round face.', shape: 'RECTANGLE', icon: '▬' },
        { style: 'Wayfarers', reason: 'Square corners balance soft, curved features.', shape: 'WAYFARERS', icon: '🕶️' },
        { style: 'Geometric', reason: 'Angular geometry contrasts round softness.', shape: 'GEOMETRIC', icon: '🔷' },
    ],
    SQUARE: [
        { style: 'Round', reason: 'Round frames soften strong jawlines.', shape: 'ROUND', icon: '⭕' },
        { style: 'Aviator', reason: 'Curved aviators contrast square jaws.', shape: 'AVIATOR', icon: '✈️' },
        { style: 'Cat-Eye', reason: 'Cat-eye draws attention upward.', shape: 'CAT_EYE', icon: '😸' },
    ],
    HEART: [
        { style: 'Aviator', reason: 'Balances wide forehead and narrow chin.', shape: 'AVIATOR', icon: '✈️' },
        { style: 'Round', reason: 'Softens forehead and complements chin.', shape: 'ROUND', icon: '⭕' },
        { style: 'Rectangle', reason: 'Adds width to lower face.', shape: 'RECTANGLE', icon: '▬' },
    ],
    OBLONG: [
        { style: 'Round', reason: 'Adds width and breaks face length.', shape: 'ROUND', icon: '⭕' },
        { style: 'Cat-Eye', reason: 'Adds width and lift.', shape: 'CAT_EYE', icon: '😸' },
        { style: 'Wayfarers', reason: 'Adds horizontal emphasis.', shape: 'WAYFARERS', icon: '🕶️' },
    ],
    DIAMOND: [
        { style: 'Cat-Eye', reason: 'Highlights cheekbones.', shape: 'CAT_EYE', icon: '😸' },
        { style: 'Oval', reason: 'Softens angular cheekbones.', shape: 'ROUND', icon: '⭕' },
        { style: 'Rectangle', reason: 'Adds width at forehead.', shape: 'RECTANGLE', icon: '▬' },
    ],
};
const FACE_LABELS: Record<FaceShape, string> = {
    OVAL: 'Oval',
    ROUND: 'Round',
    SQUARE: 'Square',
    HEART: 'Heart',
    OBLONG: 'Oblong',
    DIAMOND: 'Diamond',
};

const FACE_DESCRIPTIONS: Record<FaceShape, string> = {
    OVAL:    'Balanced proportions with a gently tapered jaw and slightly wider cheekbones.',
    ROUND:   'Similar width and height with soft, curved features and full cheeks.',
    SQUARE:  'Strong jawline with roughly equal forehead, cheek, and jaw widths.',
    HEART:   'Wide forehead tapering to a narrow, pointed chin.',
    OBLONG:  'Face length greater than width with a long cheek line.',
    DIAMOND: 'Narrow forehead and jaw with wide cheekbones.',
};

// ─── Main analyser ────────────────────────────────────────────────────────────

export function analyzeFaceShape(
    landmarks: { x: number; y: number; z: number }[],
    imageWidth: number,
    imageHeight: number
): FaceAnalysisResult {
    const w = imageWidth, h = imageHeight;

    // Key points
    const fL = lm2v(landmarks[LM.foreheadLeft], w, h);
    const fR = lm2v(landmarks[LM.foreheadRight], w, h);
    const cL = lm2v(landmarks[LM.cheekLeft], w, h);
    const cR = lm2v(landmarks[LM.cheekRight], w, h);
    const jL = lm2v(landmarks[LM.jawAngleLeft], w, h);
    const jR = lm2v(landmarks[LM.jawAngleRight], w, h);
    const tL = lm2v(landmarks[LM.templeLeft], w, h);
    const tR = lm2v(landmarks[LM.templeRight], w, h);
    const eyeL = lm2v(landmarks[LM.eyeLeft], w, h);
    const eyeR = lm2v(landmarks[LM.eyeRight], w, h);
    const chin = lm2v(landmarks[LM.chin], w, h);
    const top = lm2v(landmarks[LM.forehead], w, h);

    // Measurements
    const foreheadWidth = dist(fL, fR);
    const cheekWidth = dist(cL, cR);
    const jawWidth = dist(jL, jR);
    const templeWidth = dist(tL, tR);
    const faceHeight = dist(top, chin);
    const ratio = cheekWidth / faceHeight;

    // Normalise (relative to cheek width)
    const fNorm = foreheadWidth / cheekWidth;
    const jNorm = jawWidth / cheekWidth;
    const tNorm = templeWidth / cheekWidth;

    // Symmetry score: so sánh khoảng cách mắt trái/phải từ midline
    const midX = (cL.x + cR.x) / 2;
    const eyeLDist = Math.abs(eyeL.x - midX);
    const eyeRDist = Math.abs(eyeR.x - midX);
    const symmetryScore = clamp(
        1 - Math.abs(eyeLDist - eyeRDist) / (cheekWidth * 0.1),
        0, 1
    );

    // Golden ratio score: tỉ lệ vàng = 1.618 → cheek / jaw ≈ 1.618
    const goldenRatio = 1.6180339887;
    const goldenRatioScore = clamp(
        1 - Math.abs((cheekWidth / jawWidth) - goldenRatio) / goldenRatio,
        0, 1
    );

    // ── Weighted classification ───────────────────────────────────────────────
    const shapes = Object.keys(PROFILES) as FaceShape[];
    const scores = shapes.map(s => ({
        shape: s,
        score: scoreShape(s, ratio, fNorm, jNorm, tNorm),
    }));
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    const runnerUp = scores[1];

    // Confidence = khoảng cách giữa best và runner-up, chuẩn hoá
    const rawConf = clamp((best.score - runnerUp.score) / best.score, 0, 1);
    const confidence = clamp(0.60 + rawConf * 0.35, 0.60, 0.95);

    return {
        shape: best.shape,
        label: FACE_LABELS[best.shape],
        description: FACE_DESCRIPTIONS[best.shape],
        confidence,
        measurements: {
            foreheadWidth: Math.round(foreheadWidth),
            cheekWidth: Math.round(cheekWidth),
            jawWidth: Math.round(jawWidth),
            templeWidth: Math.round(templeWidth),
            faceHeight: Math.round(faceHeight),
            ratio: Math.round(ratio * 100) / 100,
            symmetryScore: Math.round(symmetryScore * 100) / 100,
            goldenRatioScore: Math.round(goldenRatioScore * 100) / 100,
        },
        recommendations: GLASSES_DB[best.shape],
    };
}