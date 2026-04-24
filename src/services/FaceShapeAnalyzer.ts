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
        templeWidth: number;
        faceHeight: number;
        ratio: number;
        symmetryScore: number;
        goldenRatioScore: number;
    };
    recommendations: GlassesRecommendation[];
}

// ─── Landmark indices (MediaPipe 478-point) ───────────────────────────────────

const LM = {
    foreheadLeft: 54, foreheadRight: 284,
    cheekLeft: 234, cheekRight: 454,
    jawLeft: 172, jawRight: 397,
    jawAngleLeft: 58, jawAngleRight: 288,
    templeLeft: 127, templeRight: 356,
    chin: 152,
    forehead: 10,
    eyeLeft: 33, eyeRight: 263,
    noseLeft: 4, noseRight: 1,
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

// ─── Shape profiles ────────────────────────────────────────────────────────────
// Each profile uses WEIGHTED scoring per feature to avoid SQUARE bias.
// Key insight: use Mahalanobis-style per-feature tolerances, not a single tolerance.

interface ShapeProfile {
    // Ratio = cheekWidth / faceHeight (larger = wider/rounder face)
    ratioIdeal: number;
    ratioTol: number;
    // Normalized widths relative to cheekWidth
    fIdeal: number;   // forehead / cheek  (>1 = broad forehead)
    fTol: number;
    jIdeal: number;   // jaw / cheek       (>1 = wide jaw)
    jTol: number;
    tIdeal: number;   // temple / cheek
    tTol: number;
    // Derived: jaw taper = jaw/forehead  (< 1 means narrow jaw vs forehead)
    taperIdeal: number;
    taperTol: number;
    // Feature weights: how much each dimension matters for this shape
    weights: { ratio: number; f: number; j: number; t: number; taper: number };
}

const PROFILES: Record<FaceShape, ShapeProfile> = {
    // Oval: moderate ratio, forehead slightly wider than jaw, gentle taper
    OVAL: {
        ratioIdeal: 0.78, ratioTol: 0.08,
        fIdeal: 0.82, fTol: 0.07,
        jIdeal: 0.74, jTol: 0.07,
        tIdeal: 0.88, tTol: 0.08,
        taperIdeal: 0.90, taperTol: 0.08,
        weights: { ratio: 2.0, f: 1.5, j: 2.0, t: 1.0, taper: 2.5 },
    },
    // Round: high ratio (width ≈ height), uniform widths, minimal taper
    ROUND: {
        ratioIdeal: 0.96, ratioTol: 0.08,
        fIdeal: 0.87, fTol: 0.06,
        jIdeal: 0.86, jTol: 0.07,
        tIdeal: 0.92, tTol: 0.07,
        taperIdeal: 0.99, taperTol: 0.06,
        weights: { ratio: 3.0, f: 1.0, j: 1.5, t: 0.8, taper: 1.5 },
    },
    // Square: moderate ratio, jaw nearly as wide as forehead, low taper
    SQUARE: {
        ratioIdeal: 0.84, ratioTol: 0.07,
        fIdeal: 0.90, fTol: 0.06,
        jIdeal: 0.92, jTol: 0.06,
        tIdeal: 0.93, tTol: 0.07,
        taperIdeal: 1.02, taperTol: 0.06,
        weights: { ratio: 1.5, f: 1.5, j: 3.0, t: 1.0, taper: 3.0 },
    },
    // Heart: wide forehead, narrow jaw, high taper
    HEART: {
        ratioIdeal: 0.80, ratioTol: 0.09,
        fIdeal: 0.96, fTol: 0.07,
        jIdeal: 0.65, jTol: 0.08,
        tIdeal: 0.90, tTol: 0.09,
        taperIdeal: 0.68, taperTol: 0.09,
        weights: { ratio: 1.0, f: 2.0, j: 2.5, t: 0.8, taper: 3.5 },
    },
    // Oblong: very low ratio (tall/narrow), moderate widths
    OBLONG: {
        ratioIdeal: 0.63, ratioTol: 0.07,
        fIdeal: 0.80, fTol: 0.08,
        jIdeal: 0.77, jTol: 0.08,
        tIdeal: 0.84, tTol: 0.09,
        taperIdeal: 0.96, taperTol: 0.08,
        weights: { ratio: 4.0, f: 1.0, j: 1.0, t: 0.8, taper: 1.0 },
    },
    // Diamond: narrow forehead AND narrow jaw, wide temples/cheeks
    DIAMOND: {
        ratioIdeal: 0.81, ratioTol: 0.08,
        fIdeal: 0.71, fTol: 0.07,
        jIdeal: 0.67, jTol: 0.07,
        tIdeal: 0.83, tTol: 0.08,
        taperIdeal: 0.94, taperTol: 0.07,
        weights: { ratio: 1.0, f: 3.0, j: 2.5, t: 1.5, taper: 1.5 },
    },
};

/**
 * Weighted Gaussian score per feature.
 * Each feature contributes exp(-0.5*(delta/tol)^2), scaled by weight.
 * Returns a score in (0, 1].
 */
function scoreShape(
    shape: FaceShape,
    ratio: number,
    fNorm: number,
    jNorm: number,
    tNorm: number,
    taper: number
): number {
    const p = PROFILES[shape];
    const w = p.weights;

    const totalWeight = w.ratio + w.f + w.j + w.t + w.taper;

    function gauss(value: number, ideal: number, tol: number, weight: number) {
        const z = (value - ideal) / tol;
        return weight * Math.exp(-0.5 * z * z);
    }

    const score =
        gauss(ratio, p.ratioIdeal, p.ratioTol, w.ratio) +
        gauss(fNorm, p.fIdeal, p.fTol, w.f) +
        gauss(jNorm, p.jIdeal, p.jTol, w.j) +
        gauss(tNorm, p.tIdeal, p.tTol, w.t) +
        gauss(taper, p.taperIdeal, p.taperTol, w.taper);

    return score / totalWeight; // normalise to (0, 1]
}

// ─── GLASSES_DB & meta ────────────────────────────────────────────────────────

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
    OVAL: 'Oval', ROUND: 'Round', SQUARE: 'Square',
    HEART: 'Heart', OBLONG: 'Oblong', DIAMOND: 'Diamond',
};

const FACE_DESCRIPTIONS: Record<FaceShape, string> = {
    OVAL: 'Balanced proportions with a gently tapered jaw and slightly wider cheekbones.',
    ROUND: 'Similar width and height with soft, curved features and full cheeks.',
    SQUARE: 'Strong jawline with roughly equal forehead, cheek, and jaw widths.',
    HEART: 'Wide forehead tapering to a narrow, pointed chin.',
    OBLONG: 'Face length notably greater than width with a long cheek line.',
    DIAMOND: 'Narrow forehead and jaw with pronounced, wide cheekbones.',
};

// ─── Main analyser ────────────────────────────────────────────────────────────

export function analyzeFaceShape(
    landmarks: { x: number; y: number; z: number }[],
    imageWidth: number,
    imageHeight: number
): FaceAnalysisResult {
    const w = imageWidth, h = imageHeight;

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

    const foreheadWidth = dist(fL, fR);
    const cheekWidth = dist(cL, cR);
    const jawWidth = dist(jL, jR);
    const templeWidth = dist(tL, tR);
    const faceHeight = dist(top, chin);

    // Core ratios
    const ratio = cheekWidth / Math.max(faceHeight, 1);
    const fNorm = foreheadWidth / Math.max(cheekWidth, 1);
    const jNorm = jawWidth / Math.max(cheekWidth, 1);
    const tNorm = templeWidth / Math.max(cheekWidth, 1);
    const taper = jawWidth / Math.max(foreheadWidth, 1); // key discriminator

    // Symmetry: compare left/right eye distance from midline
    const midX = (cL.x + cR.x) / 2;
    const eyeLDist = Math.abs(eyeL.x - midX);
    const eyeRDist = Math.abs(eyeR.x - midX);
    const symmetryScore = clamp(
        1 - Math.abs(eyeLDist - eyeRDist) / Math.max(cheekWidth * 0.08, 1),
        0, 1
    );

    // Golden ratio score: cheek/jaw ≈ 1.618
    const goldenRatio = 1.6180339887;
    const goldenRatioScore = clamp(
        1 - Math.abs((cheekWidth / Math.max(jawWidth, 1)) - goldenRatio) / goldenRatio,
        0, 1
    );

    // ── Weighted Gaussian classification ─────────────────────────────────────
    const shapes = Object.keys(PROFILES) as FaceShape[];
    const scored = shapes
        .map(s => ({ shape: s, score: scoreShape(s, ratio, fNorm, jNorm, tNorm, taper) }))
        .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const runnerUp = scored[1];
    const third = scored[2];

    // Softmax-style confidence: how much best stands out from the field
    const sumScores = scored.reduce((acc, s) => acc + s.score, 0);
    const softmaxTop = best.score / Math.max(sumScores, 1e-9);

    // Margin-based bonus: larger gap → higher confidence
    const margin = (best.score - runnerUp.score) / Math.max(best.score, 1e-9);

    // Combine: softmax gives base, margin sharpens it
    const rawConf = softmaxTop * 0.55 + margin * 0.45;
    const confidence = clamp(rawConf * 1.25, 0.55, 0.95); // scale to readable range

    return {
        shape: best.shape,
        label: FACE_LABELS[best.shape],
        description: FACE_DESCRIPTIONS[best.shape],
        confidence: Math.round(confidence * 100) / 100,
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