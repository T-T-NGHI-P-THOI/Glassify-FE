import * as THREE from 'three';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceShape =
    | 'oval'
    | 'round'
    | 'square'
    | 'heart'
    | 'oblong'
    | 'diamond';

export interface GlassesRecommendation {
    style: string;
    reason: string;
    shape: 'rectangle' | 'round' | 'aviator' | 'cat-eye' | 'wayfarers' | 'geometric';
    icon: string;
}

export interface FaceAnalysisResult {
    shape: FaceShape;
    label: string;
    description: string;
    confidence: number; // 0–1
    measurements: {
        foreheadWidth: number;
        cheekWidth: number;
        jawWidth: number;
        faceHeight: number;
        ratio: number; // width / height
    };
    recommendations: GlassesRecommendation[];
}

// ─── Landmark indices (MediaPipe 478-point model) ─────────────────────────────

const LM_IDX = {
    // Forehead edges
    foreheadLeft: 54,
    foreheadRight: 284,
    // Cheekbones
    cheekLeft: 234,
    cheekRight: 454,
    // Jawline width (just above chin)
    jawLeft: 172,
    jawRight: 397,
    // Chin
    chin: 152,
    // Top of forehead (hairline proxy)
    forehead: 10,
    // Temple
    templeLeft: 127,
    templeRight: 356,
    // Jaw angle
    jawAngleLeft: 58,
    jawAngleRight: 288,
};

// ─── Glasses recommendation data ─────────────────────────────────────────────

const GLASSES_DB: Record<FaceShape, GlassesRecommendation[]> = {
    oval: [
        {
            style: 'Wayfarers',
            reason: 'Oval faces suit almost any frame. Wayfarers add bold character.',
            shape: 'wayfarers',
            icon: '🕶️',
        },
        {
            style: 'Geometric',
            reason: 'Angular geometric frames create an artistic contrast with soft oval features.',
            shape: 'geometric',
            icon: '🔷',
        },
        {
            style: 'Aviator',
            reason: 'Classic aviators elongate naturally and complement the balanced oval silhouette.',
            shape: 'aviator',
            icon: '✈️',
        },
    ],
    round: [
        {
            style: 'Rectangle',
            reason: 'Rectangular frames add definition and make a round face appear slimmer.',
            shape: 'rectangle',
            icon: '▬',
        },
        {
            style: 'Wayfarers',
            reason: 'The square corners of wayfarers balance soft, curved features beautifully.',
            shape: 'wayfarers',
            icon: '🕶️',
        },
        {
            style: 'Geometric',
            reason: 'Bold angular geometry creates eye-catching contrast with round softness.',
            shape: 'geometric',
            icon: '🔷',
        },
    ],
    square: [
        {
            style: 'Round',
            reason: 'Round frames soften strong jawlines and add a touch of elegance.',
            shape: 'round',
            icon: '⭕',
        },
        {
            style: 'Aviator',
            reason: 'Gently curved aviators contrast a square jaw without looking too playful.',
            shape: 'aviator',
            icon: '✈️',
        },
        {
            style: 'Cat-Eye',
            reason: 'Upswept cat-eye frames draw the eye upward, away from a strong jaw.',
            shape: 'cat-eye',
            icon: '😸',
        },
    ],
    heart: [
        {
            style: 'Aviator',
            reason: 'Wider at the bottom, aviators balance a broad forehead with a narrow chin.',
            shape: 'aviator',
            icon: '✈️',
        },
        {
            style: 'Round',
            reason: 'Round frames soften the forehead and complement a pointed chin.',
            shape: 'round',
            icon: '⭕',
        },
        {
            style: 'Rectangle',
            reason: 'Low-set rectangular frames add width to the lower half of the face.',
            shape: 'rectangle',
            icon: '▬',
        },
    ],
    oblong: [
        {
            style: 'Round',
            reason: 'Round or oversized frames add width and break up a long face shape.',
            shape: 'round',
            icon: '⭕',
        },
        {
            style: 'Cat-Eye',
            reason: 'Decorative cat-eye frames add width and lift at the temples.',
            shape: 'cat-eye',
            icon: '😸',
        },
        {
            style: 'Wayfarers',
            reason: 'Bold wayfarers add horizontal emphasis to widen an oblong face.',
            shape: 'wayfarers',
            icon: '🕶️',
        },
    ],
    diamond: [
        {
            style: 'Cat-Eye',
            reason: 'Cat-eye frames accentuate cheekbones — the diamond face\'s best feature.',
            shape: 'cat-eye',
            icon: '😸',
        },
        {
            style: 'Oval',
            reason: 'Rimless or oval frames soften angular cheekbones without adding width.',
            shape: 'round',
            icon: '⭕',
        },
        {
            style: 'Rectangle',
            reason: 'Broad rectangular frames add width at the forehead to balance narrow temples.',
            shape: 'rectangle',
            icon: '▬',
        },
    ],
};

const FACE_LABELS: Record<FaceShape, string> = {
    oval: 'Oval',
    round: 'Round',
    square: 'Square',
    heart: 'Heart',
    oblong: 'Oblong',
    diamond: 'Diamond',
};

const FACE_DESCRIPTIONS: Record<FaceShape, string> = {
    oval: 'Balanced proportions with a gently tapered jaw and slightly wider cheekbones.',
    round: 'Similar width and height with soft, curved features and full cheeks.',
    square: 'Strong jawline with roughly equal forehead, cheek, and jaw widths.',
    heart: 'Wide forehead tapering to a narrow, pointed chin.',
    oblong: 'Face length noticeably greater than width with a long, straight cheek line.',
    diamond: 'Narrow forehead and jaw with wide, prominent cheekbones.',
};

// ─── Analyser ─────────────────────────────────────────────────────────────────

function dist(a: THREE.Vector2, b: THREE.Vector2): number {
    return a.distanceTo(b);
}

function lm2v(lm: { x: number; y: number }, w: number, h: number): THREE.Vector2 {
    return new THREE.Vector2(lm.x * w, lm.y * h);
}

export function analyzeFaceShape(
    landmarks: { x: number; y: number; z: number }[],
    imageWidth: number,
    imageHeight: number
): FaceAnalysisResult {
    const w = imageWidth;
    const h = imageHeight;

    // Key points
    const foreheadL = lm2v(landmarks[LM_IDX.foreheadLeft], w, h);
    const foreheadR = lm2v(landmarks[LM_IDX.foreheadRight], w, h);
    const cheekL = lm2v(landmarks[LM_IDX.cheekLeft], w, h);
    const cheekR = lm2v(landmarks[LM_IDX.cheekRight], w, h);
    const jawL = lm2v(landmarks[LM_IDX.jawAngleLeft], w, h);
    const jawR = lm2v(landmarks[LM_IDX.jawAngleRight], w, h);
    const chin = lm2v(landmarks[LM_IDX.chin], w, h);
    const top = lm2v(landmarks[LM_IDX.forehead], w, h);

    // Measurements
    const foreheadWidth = dist(foreheadL, foreheadR);
    const cheekWidth = dist(cheekL, cheekR);
    const jawWidth = dist(jawL, jawR);
    const faceHeight = dist(top, chin);
    const ratio = cheekWidth / faceHeight; // width-to-height ratio

    // Normalise widths relative to cheek width
    const fNorm = foreheadWidth / cheekWidth; // forehead / cheek
    const jNorm = jawWidth / cheekWidth;       // jaw / cheek

    // ── Classification ────────────────────────────────────────────────────
    let shape: FaceShape;
    let confidence = 0.75;

    if (ratio < 0.72) {
        // Very tall face
        shape = 'oblong';
        confidence = 0.80;
    } else if (ratio > 0.88) {
        // Width ≈ height → round
        shape = 'round';
        confidence = 0.78;
    } else if (jNorm > 0.85 && fNorm > 0.85) {
        // Wide jaw AND wide forehead → square
        shape = 'square';
        confidence = 0.82;
    } else if (fNorm < 0.78 && jNorm < 0.72) {
        // Narrow forehead, narrow jaw, prominent cheeks → diamond
        shape = 'diamond';
        confidence = 0.76;
    } else if (fNorm > 0.90 && jNorm < 0.75) {
        // Wide forehead, narrow jaw → heart
        shape = 'heart';
        confidence = 0.79;
    } else {
        // Default balanced → oval
        shape = 'oval';
        confidence = 0.70;
    }

    return {
        shape,
        label: FACE_LABELS[shape],
        description: FACE_DESCRIPTIONS[shape],
        confidence,
        measurements: {
            foreheadWidth: Math.round(foreheadWidth),
            cheekWidth: Math.round(cheekWidth),
            jawWidth: Math.round(jawWidth),
            faceHeight: Math.round(faceHeight),
            ratio: Math.round(ratio * 100) / 100,
        },
        recommendations: GLASSES_DB[shape],
    };
}