export type WuXingElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth';
export type YinYang = 'yin' | 'yang' | 'balanced';

export interface FacialZoneReading {
    zone: string;
    lmIndices: number[];
    reading: string;
    fortuneArea: string;
    score: number;
}

export interface FengShuiResult {
    element: WuXingElement;
    elementLabel: string;
    elementDescription: string;
    yinYang: YinYang;
    yinYangLabel: string;
    luckyColors: string[];
    luckyDirections: string[];
    luckyNumbers: number[];
    strengths: string[];
    challenges: string[];
    facialZones: FacialZoneReading[];
    fortuneAreas: {
        wealth: number;
        career: number;
        love: number;
        health: number;
        wisdom: number;
    };
    overallScore: number;
}

// ─── Landmark indices ─────────────────────────────────────────────────────────

const LM = {
    forehead: 10,
    foreheadLeft: 54, foreheadRight: 284,
    browLeft: 70, browRight: 300,
    browInLeft: 107, browInRight: 336,
    eyeLidLeft: 159, eyeLidRight: 386,
    eyeLeft: 33, eyeRight: 263,
    cheekLeft: 234, cheekRight: 454,
    noseTip: 4,
    noseBridgeTop: 6,
    noseBaseLeft: 129, noseBaseRight: 358,
    lipTop: 13, lipBot: 14,
    lipLeft: 61, lipRight: 291,
    chin: 152,
    jawLeft: 172, jawRight: 397,
    jawAngleLeft: 58, jawAngleRight: 288,
    templeLeft: 127, templeRight: 356,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LM3D = { x: number; y: number; z: number };

function px(lm: LM3D, w: number, h: number) {
    return { x: lm.x * w, y: lm.y * h };
}
function d2(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
function clamp(v: number, lo = 0, hi = 100) {
    return Math.max(lo, Math.min(hi, v));
}
function norm(value: number, lo: number, hi: number, outLo = 0, outHi = 100) {
    return clamp(((value - lo) / (hi - lo)) * (outHi - outLo) + outLo, outLo, outHi);
}

/**
 * Gaussian bump: returns 1 at ideal, decays with tolerance.
 * Used so each element has a "home" range without hard cutoffs.
 */
function gauss(value: number, ideal: number, tol: number): number {
    const z = (value - ideal) / tol;
    return Math.exp(-0.5 * z * z);
}

// ─── Element info ─────────────────────────────────────────────────────────────

const ELEMENT_INFO: Record<WuXingElement, any> = {
    metal: {
        label: 'Metal',
        description: 'Represents discipline, determination, and sharp thinking. Balanced face with defined cheekbones and jaw.',
        colors: ['White', 'Gold', 'Silver'],
        directions: ['West', 'Northwest'],
        numbers: [6, 7],
        strengths: ['Decisive', 'Organized', 'Reliable'],
        challenges: ['Can be rigid', 'Difficulty letting go'],
    },
    wood: {
        label: 'Wood',
        description: 'Symbolizes growth, creativity, and compassion. Long face with a broad forehead.',
        colors: ['Green', 'Light blue'],
        directions: ['East', 'Southeast'],
        numbers: [3, 4],
        strengths: ['Creative', 'Flexible', 'Quick learner'],
        challenges: ['Indecisive', 'Easily distracted'],
    },
    water: {
        label: 'Water',
        description: 'Associated with intelligence, intuition, and adaptability. Soft facial features with deep eyes.',
        colors: ['Black', 'Navy', 'Dark gray'],
        directions: ['North'],
        numbers: [1],
        strengths: ['Strong intuition', 'Good communication', 'Adaptable'],
        challenges: ['Overthinking', 'Needs emotional stability'],
    },
    fire: {
        label: 'Fire',
        description: 'Represents passion, leadership, and charisma. Face tapers toward forehead or chin.',
        colors: ['Red', 'Orange', 'Deep pink'],
        directions: ['South'],
        numbers: [2, 9],
        strengths: ['Natural leader', 'Passionate', 'Inspiring'],
        challenges: ['Impulsive', 'Emotional control needed'],
    },
    earth: {
        label: 'Earth',
        description: 'Symbolizes stability, honesty, and reliability. Square and full face shape.',
        colors: ['Yellow', 'Brown', 'Beige'],
        directions: ['Center', 'Northeast', 'Southwest'],
        numbers: [5, 8],
        strengths: ['Patient', 'Loyal', 'Practical'],
        challenges: ['Resistant to change', 'Less flexible'],
    },
};

// ─── Zone analysers ───────────────────────────────────────────────────────────

function analyzeForehead(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const top = px(lms[LM.forehead], w, h);
    const fL = px(lms[LM.foreheadLeft], w, h);
    const fR = px(lms[LM.foreheadRight], w, h);
    const browL = px(lms[LM.browLeft], w, h);
    const browR = px(lms[LM.browRight], w, h);

    const browMidY = (browL.y + browR.y) / 2;
    const foreheadH = Math.abs(top.y - browMidY);
    const foreheadW = d2(fL, fR);
    const ratio = foreheadW / Math.max(foreheadH, 1);

    const score = clamp(norm(ratio, 1.4, 3.8, 30, 92));
    const reading = ratio > 2.9
        ? 'Wide and high forehead — indicates strong intelligence and long-term vision.'
        : ratio > 2.0
            ? 'Balanced forehead — harmony between logic and intuition.'
            : 'Narrow forehead — emotionally driven and deeply perceptive.';

    return { zone: 'Forehead', lmIndices: [10, 54, 284, 70, 300], reading, fortuneArea: 'Career & Wisdom', score };
}

function analyzeBrows(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const bL = px(lms[LM.browLeft], w, h);
    const bR = px(lms[LM.browRight], w, h);
    const biL = px(lms[LM.browInLeft], w, h);
    const biR = px(lms[LM.browInRight], w, h);

    const browWidthL = d2(bL, biL);
    const browWidthR = d2(bR, biR);
    const symmetry = Math.abs(browWidthL - browWidthR) / Math.max(browWidthL + browWidthR, 1) * 2;
    const browGap = d2(biL, biR);
    // Wider gap = more open / generous personality in mian xiang
    const gapBonus = clamp(norm(browGap, 20, 70, 0, 10));

    const score = clamp(norm(1 - symmetry, 0, 0.25, 45, 92) + gapBonus);
    const reading = symmetry < 0.05
        ? 'Balanced eyebrows — consistent and reliable personality.'
        : symmetry < 0.14
            ? 'Slightly uneven eyebrows — stable with some flexibility.'
            : 'Asymmetrical eyebrows — unique and unconventional thinking.';

    return { zone: 'Brows', lmIndices: [70, 300, 107, 336], reading, fortuneArea: 'Love & Relationships', score };
}

function analyzeEyes(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const eL = px(lms[LM.eyeLeft], w, h);
    const eR = px(lms[LM.eyeRight], w, h);
    const lidL = px(lms[LM.eyeLidLeft], w, h);
    const lidR = px(lms[LM.eyeLidRight], w, h);

    const eyeSpan = d2(eL, eR);
    const cheekW = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));
    const eyeRatio = eyeSpan / Math.max(cheekW, 1);

    // Eye openness: distance from pupil landmark to lid (vertical)
    const eyeOpenL = Math.abs(eL.y - lidL.y);
    const eyeOpenR = Math.abs(eR.y - lidR.y);
    const openness = ((eyeOpenL + eyeOpenR) / 2) / Math.max(cheekW * 0.05, 1);
    const opennessBonus = clamp(norm(openness, 0.5, 2.5, 0, 8));

    const score = clamp(norm(eyeRatio, 0.28, 0.58, 38, 92) + opennessBonus);
    const reading = eyeRatio > 0.48
        ? 'Large, well-spaced eyes — strong intuition and attractive presence.'
        : eyeRatio > 0.37
            ? 'Balanced eyes — observant and attentive.'
            : 'Smaller eyes — focused and detail-oriented.';

    return { zone: 'Eyes', lmIndices: [33, 263, 159, 386], reading, fortuneArea: 'Wisdom & Destiny', score };
}

function analyzeNose(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const tip = px(lms[LM.noseTip], w, h);
    const bridge = px(lms[LM.noseBridgeTop], w, h);
    const nL = px(lms[LM.noseBaseLeft], w, h);
    const nR = px(lms[LM.noseBaseRight], w, h);

    const noseH = d2(tip, bridge);
    const noseW = d2(nL, nR);
    const noseRatio = noseH / Math.max(noseW, 1);
    // Fleshy tip (wide base relative to height) = generosity in mian xiang
    const fleshBonus = clamp(norm(noseW / Math.max(noseH, 1), 0.3, 1.4, 0, 6));

    const score = clamp(norm(noseRatio, 0.75, 2.2, 38, 90) + fleshBonus);
    const reading = noseRatio > 1.6
        ? 'High and straight nose — strong wealth potential and decisiveness.'
        : noseRatio > 1.05
            ? 'Balanced nose — stable finances and good money management.'
            : 'Low nose — generous and values relationships over money.';

    return { zone: 'Nose', lmIndices: [4, 6, 129, 358], reading, fortuneArea: 'Wealth & Health', score };
}

function analyzeMouth(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const mL = px(lms[LM.lipLeft], w, h);
    const mR = px(lms[LM.lipRight], w, h);
    const mT = px(lms[LM.lipTop], w, h);
    const mB = px(lms[LM.lipBot], w, h);

    const mouthW = d2(mL, mR);
    const cheekW = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));
    const mRatio = mouthW / Math.max(cheekW, 1);
    // Lip fullness (vertical thickness relative to width)
    const lipH = d2(mT, mB);
    const fullness = lipH / Math.max(mouthW, 1);
    const fullBonus = clamp(norm(fullness, 0.08, 0.35, 0, 8));

    const score = clamp(norm(mRatio, 0.28, 0.57, 48, 91) + fullBonus);
    const reading = mRatio > 0.48
        ? 'Wide mouth with full lips — prosperity and persuasive communication.'
        : mRatio > 0.34
            ? 'Balanced mouth — good communication skills.'
            : 'Small mouth — careful and thoughtful speaker.';

    return { zone: 'Mouth & Lips', lmIndices: [13, 14, 61, 291], reading, fortuneArea: 'Prosperity & Communication', score };
}

function analyzeChin(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const jawL = px(lms[LM.jawLeft], w, h);
    const jawR = px(lms[LM.jawRight], w, h);
    const chin = px(lms[LM.chin], w, h);
    const cheekW = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));

    const chinW = d2(jawL, jawR);
    const chinRatio = chinW / Math.max(cheekW, 1);
    // Chin projection: how far chin extends below jaw line (roundness/fullness)
    const jawMidY = (jawL.y + jawR.y) / 2;
    const chinDrop = Math.abs(chin.y - jawMidY);
    const dropBonus = clamp(norm(chinDrop / Math.max(cheekW, 1), 0.02, 0.18, 0, 7));

    const score = clamp(norm(chinRatio, 0.52, 0.93, 43, 90) + dropBonus);
    const reading = chinRatio > 0.80
        ? 'Wide and strong chin — persistence and long-term stability.'
        : chinRatio > 0.64
            ? 'Balanced chin — patient and adaptable.'
            : 'Pointed chin — flexible but needs stability.';

    return { zone: 'Chin & Jaw', lmIndices: [152, 172, 397, 58, 288], reading, fortuneArea: 'Later Life & Willpower', score };
}

// ─── Element derivation ───────────────────────────────────────────────────────
//
// Each element maps to a distinct facial archetype (mian xiang / Wu Xing):
//
//   Metal  → balanced proportions, defined jaw, fNorm & jNorm both ~0.82–0.92
//   Wood   → elongated (low ratio), broad forehead, taper toward jaw
//   Water  → wide/round (high ratio), soft uniform widths
//   Fire   → narrow at one end: either wide-forehead+narrow-jaw (heart)
//              OR narrow-forehead+wide-jaw (inverted triangle)
//   Earth  → square (jaw ≈ forehead), sturdy, moderate ratio
//
// Using Gaussian bumps ensures no single element dominates the edges.

function deriveElement(
    faceShape: string,
    ratio: number,
    fNorm: number,
    jNorm: number,
    tNorm: number,
    taper: number,          // jaw / forehead
    symmetry: number
): WuXingElement {

    const scores: Record<WuXingElement, number> = {
        metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
    };

    // ── Metal: balanced, well-defined – moderate ratio, forehead ≈ jaw ≈ 0.85
    scores.metal =
        gauss(ratio, 0.82, 0.08) * 2.5 +
        gauss(fNorm, 0.86, 0.07) * 1.5 +
        gauss(jNorm, 0.86, 0.07) * 1.5 +
        gauss(taper, 1.00, 0.08) * 2.0 +
        symmetry * 1.5;

    // ── Wood: tall/narrow face (low ratio), forehead-dominant
    scores.wood =
        gauss(ratio, 0.63, 0.08) * 3.0 +
        gauss(fNorm, 0.88, 0.08) * 2.0 +
        gauss(taper, 0.88, 0.10) * 1.5 +
        (faceShape === 'OBLONG' ? 2.0 : 0);

    // ── Water: wide/round face (high ratio), soft uniform features
    scores.water =
        gauss(ratio, 0.97, 0.07) * 3.5 +
        gauss(fNorm, 0.87, 0.07) * 1.5 +
        gauss(jNorm, 0.87, 0.07) * 1.5 +
        gauss(taper, 1.00, 0.06) * 1.0 +
        (faceShape === 'ROUND' ? 2.0 : 0);

    // ── Fire: strong taper (heart or inverted heart), passion/dynamic asymmetry
    scores.fire =
        gauss(taper, 0.68, 0.10) * 4.0 +   // narrow jaw vs forehead (heart)
        gauss(fNorm, 0.95, 0.08) * 2.0 +    // broad forehead
        gauss(jNorm, 0.65, 0.09) * 2.0 +    // narrow jaw
        (faceShape === 'HEART' ? 3.0 : 0) +
        (faceShape === 'DIAMOND' ? 1.5 : 0);

    // ── Earth: square, jaw ≈ forehead, sturdy proportions
    scores.earth =
        gauss(taper, 1.02, 0.07) * 3.0 +   // jaw ≈ forehead
        gauss(jNorm, 0.93, 0.06) * 3.0 +   // wide jaw
        gauss(fNorm, 0.92, 0.06) * 2.0 +
        gauss(ratio, 0.84, 0.07) * 1.5 +
        (faceShape === 'SQUARE' ? 3.0 : 0);

    // Softmax normalisation — prevents any element inflating via raw accumulation
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalized = Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, v / Math.max(total, 1e-9)])
    ) as Record<WuXingElement, number>;

    return (Object.keys(normalized) as WuXingElement[])
        .sort((a, b) => normalized[b] - normalized[a])[0];
}

// ─── Yin / Yang ───────────────────────────────────────────────────────────────

function deriveYinYang(
    ratio: number,
    symmetryScore: number,
    taper: number,
    element: WuXingElement
): YinYang {
    // Yin = soft, round, high ratio, high symmetry, gentle taper
    const yinScore =
        gauss(ratio, 0.95, 0.12) * 2.0 +
        symmetryScore * 1.5 +
        gauss(taper, 0.95, 0.12) * 1.0 +
        (element === 'water' || element === 'wood' ? 0.8 : 0);

    // Yang = defined, angular, lower ratio, strong taper
    const yangScore =
        gauss(ratio, 0.72, 0.10) * 2.0 +
        gauss(taper, 0.78, 0.12) * 2.0 +
        (1 - symmetryScore) * 0.8 +
        (element === 'fire' || element === 'metal' ? 0.8 : 0);

    const diff = Math.abs(yinScore - yangScore);
    if (diff < 0.25) return 'balanced';
    return yinScore > yangScore ? 'yin' : 'yang';
}

// ─── Fortune areas ────────────────────────────────────────────────────────────

function calcFortuneAreas(zones: FacialZoneReading[]) {
    const z = Object.fromEntries(zones.map(z => [z.zone, z.score]));
    const g = (key: string, fallback = 68) => z[key] ?? fallback;
    return {
        wealth: Math.round(g('Nose') * 0.5 + g('Mouth & Lips') * 0.3 + g('Chin & Jaw') * 0.2),
        career: Math.round(g('Forehead') * 0.5 + g('Brows') * 0.3 + g('Eyes') * 0.2),
        love: Math.round(g('Brows') * 0.4 + g('Eyes') * 0.3 + g('Mouth & Lips') * 0.3),
        health: Math.round(g('Nose') * 0.35 + g('Eyes') * 0.35 + g('Chin & Jaw') * 0.3),
        wisdom: Math.round(g('Forehead') * 0.45 + g('Eyes') * 0.35 + g('Brows') * 0.2),
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function analyzeFengShui(
    landmarks: LM3D[],
    imageWidth: number,
    imageHeight: number,
    faceShape: string,
    measurements: {
        foreheadWidth: number;
        cheekWidth: number;
        jawWidth: number;
        templeWidth: number;
        faceHeight: number;
        ratio: number;
        symmetryScore: number;
    }
): FengShuiResult {

    const fNorm = measurements.foreheadWidth / Math.max(measurements.cheekWidth, 1);
    const jNorm = measurements.jawWidth / Math.max(measurements.cheekWidth, 1);
    const tNorm = measurements.templeWidth / Math.max(measurements.cheekWidth, 1);
    const taper = measurements.jawWidth / Math.max(measurements.foreheadWidth, 1);

    const facialZones = [
        analyzeForehead(landmarks, imageWidth, imageHeight),
        analyzeBrows(landmarks, imageWidth, imageHeight),
        analyzeEyes(landmarks, imageWidth, imageHeight),
        analyzeNose(landmarks, imageWidth, imageHeight),
        analyzeMouth(landmarks, imageWidth, imageHeight),
        analyzeChin(landmarks, imageWidth, imageHeight),
    ];

    const element = deriveElement(
        faceShape.toUpperCase(),
        measurements.ratio,
        fNorm, jNorm, tNorm, taper,
        measurements.symmetryScore
    );

    const yinYang = deriveYinYang(
        measurements.ratio,
        measurements.symmetryScore,
        taper,
        element
    );

    const info = ELEMENT_INFO[element];
    const fortuneAreas = calcFortuneAreas(facialZones);

    const zoneAvg = facialZones.reduce((s, z) => s + z.score, 0) / facialZones.length;
    const symBonus = measurements.symmetryScore * 12;
    const overallScore = Math.round(clamp(zoneAvg * 0.68 + symBonus * 0.32 + 4, 0, 100));

    function toEnumFormat(value: string): string {
        return value
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '_');
    }
    
    return {
        element,
        elementLabel: info.label,
        elementDescription: info.description,
        yinYang,
        yinYangLabel: yinYang,
        luckyColors: info.colors.map(toEnumFormat),
        luckyDirections: info.directions,
        luckyNumbers: info.numbers,
        strengths: info.strengths,
        challenges: info.challenges,
        facialZones,
        fortuneAreas,
        overallScore,
    };
}