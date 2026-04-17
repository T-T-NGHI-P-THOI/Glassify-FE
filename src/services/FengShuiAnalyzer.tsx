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

    const foreheadH = d2(top, { x: (browL.x + browR.x) / 2, y: (browL.y + browR.y) / 2 });
    const foreheadW = d2(fL, fR);
    const ratio = foreheadW / Math.max(foreheadH, 1);

    const score = clamp(norm(ratio, 1.5, 3.5, 30, 90));
    const reading = ratio > 2.8
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

    const browWidth = d2(bL, biL);
    const browGap = d2(biL, biR);
    const symmetry = Math.abs(d2(bL, biL) - d2(bR, biR)) / Math.max(browWidth, 1);

    const score = clamp(norm(1 - symmetry, 0, 0.2, 50, 95) * (browGap < 50 ? 0.9 : 1));
    const reading = symmetry < 0.05
        ? 'Balanced eyebrows — consistent and reliable personality.'
        : symmetry < 0.12
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

    const score = clamp(norm(eyeRatio, 0.30, 0.55, 40, 95));
    const reading = eyeRatio > 0.48
        ? 'Large, well-spaced eyes — strong intuition and attractive presence.'
        : eyeRatio > 0.38
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

    const score = clamp(norm(noseRatio, 0.8, 2.0, 40, 90));
    const reading = noseRatio > 1.6
        ? 'High and straight nose — strong wealth potential and decisiveness.'
        : noseRatio > 1.1
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

    const score = clamp(norm(mRatio, 0.30, 0.55, 50, 90));
    const reading = mRatio > 0.48
        ? 'Wide mouth with full lips — prosperity and persuasive communication.'
        : mRatio > 0.35
            ? 'Balanced mouth — good communication skills.'
            : 'Small mouth — careful and thoughtful speaker.';

    return { zone: 'Mouth & Lips', lmIndices: [13, 14, 61, 291], reading, fortuneArea: 'Prosperity & Communication', score };
}

function analyzeChin(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const jawL = px(lms[LM.jawLeft], w, h);
    const jawR = px(lms[LM.jawRight], w, h);

    const chinW = d2(jawL, jawR);
    const cheekW = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));
    const chinRatio = chinW / Math.max(cheekW, 1);

    const score = clamp(norm(chinRatio, 0.55, 0.90, 45, 90));
    const reading = chinRatio > 0.80
        ? 'Wide and strong chin — persistence and long-term stability.'
        : chinRatio > 0.65
            ? 'Balanced chin — patient and adaptable.'
            : 'Pointed chin — flexible but needs stability.';

    return { zone: 'Chin & Jaw', lmIndices: [152, 172, 397, 58, 288], reading, fortuneArea: 'Later Life & Willpower', score };
}

// ─── Core logic giữ nguyên ─────────────────────────────────────────────────────

function deriveElement(faceShape: string, ratio: number, fNorm: number, jNorm: number, tNorm: number): WuXingElement {
    const scores: Record<WuXingElement, number> = {
        metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
    };

    scores.metal += (1 - Math.abs(fNorm - 0.82)) * 2;
    scores.metal += (1 - Math.abs(jNorm - 0.82)) * 2;
    scores.metal += ratio > 0.74 && ratio < 0.88 ? 1 : 0;

    scores.wood += clamp(norm(1 - ratio, 0.10, 0.45, 0, 3), 0, 3);
    scores.wood += fNorm > 0.85 ? 1.5 : 0;

    scores.water += clamp(norm(ratio, 0.85, 1.10, 0, 3), 0, 3);
    scores.water += fNorm > 0.80 && jNorm > 0.80 ? 1 : 0;

    scores.fire += faceShape === 'heart' ? 2.5 : 0;
    scores.fire += faceShape === 'diamond' ? 1.5 : 0;
    scores.fire += fNorm < 0.75 ? 1.5 : 0;

    scores.earth += faceShape === 'square' ? 2.5 : 0;
    scores.earth += jNorm > 0.88 ? 2 : 0;
    scores.earth += Math.abs(fNorm - jNorm) < 0.08 ? 1 : 0;

    return (Object.keys(scores) as WuXingElement[]).sort((a, b) => scores[b] - scores[a])[0];
}

function deriveYinYang(ratio: number, symmetryScore: number, element: WuXingElement): YinYang {
    const yinScore = ratio * 0.6 + symmetryScore * 0.4;
    const yangScore = (1 - ratio) * 0.4 + (element === 'fire' || element === 'metal' ? 0.6 : 0.2);

    if (Math.abs(yinScore - yangScore) < 0.08) return 'balanced';
    return yinScore > yangScore ? 'yin' : 'yang';
}

// ─── Fortune areas (fixed keys) ───────────────────────────────────────────────

function calcFortuneAreas(zones: FacialZoneReading[]) {
    const z = Object.fromEntries(zones.map(z => [z.zone, z.score]));
    return {
        wealth: Math.round((z['Nose'] * 0.5 + (z['Mouth & Lips'] ?? 70) * 0.3 + (z['Chin & Jaw'] ?? 70) * 0.2)),
        career: Math.round((z['Forehead'] * 0.5 + z['Brows'] * 0.3 + z['Eyes'] * 0.2)),
        love: Math.round((z['Brows'] * 0.4 + z['Eyes'] * 0.3 + (z['Mouth & Lips'] ?? 70) * 0.3)),
        health: Math.round((z['Nose'] * 0.35 + z['Eyes'] * 0.35 + (z['Chin & Jaw'] ?? 70) * 0.3)),
        wisdom: Math.round((z['Forehead'] * 0.45 + z['Eyes'] * 0.35 + z['Brows'] * 0.2)),
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

    const fNorm = measurements.foreheadWidth / measurements.cheekWidth;
    const jNorm = measurements.jawWidth / measurements.cheekWidth;
    const tNorm = measurements.templeWidth / measurements.cheekWidth;

    const facialZones = [
        analyzeForehead(landmarks, imageWidth, imageHeight),
        analyzeBrows(landmarks, imageWidth, imageHeight),
        analyzeEyes(landmarks, imageWidth, imageHeight),
        analyzeNose(landmarks, imageWidth, imageHeight),
        analyzeMouth(landmarks, imageWidth, imageHeight),
        analyzeChin(landmarks, imageWidth, imageHeight),
    ];

    const element = deriveElement(faceShape, measurements.ratio, fNorm, jNorm, tNorm);
    const yinYang = deriveYinYang(measurements.ratio, measurements.symmetryScore, element);
    const info = ELEMENT_INFO[element];

    const fortuneAreas = calcFortuneAreas(facialZones);

    const zoneAvg = facialZones.reduce((s, z) => s + z.score, 0) / facialZones.length;
    const symBonus = measurements.symmetryScore * 10;
    const overallScore = Math.round(clamp(zoneAvg * 0.7 + symBonus * 0.3 + 5, 0, 100));

    return {
        element,
        elementLabel: info.label,
        elementDescription: info.description,
        yinYang,
        yinYangLabel: yinYang,
        luckyColors: info.colors,
        luckyDirections: info.directions,
        luckyNumbers: info.numbers,
        strengths: info.strengths,
        challenges: info.challenges,
        facialZones,
        fortuneAreas,
        overallScore,
    };
}