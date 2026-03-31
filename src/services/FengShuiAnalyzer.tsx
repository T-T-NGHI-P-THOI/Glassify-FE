// ─── FengShuiAnalyzer.ts ──────────────────────────────────────────────────────

export type WuXingElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth';
export type YinYang = 'yin' | 'yang' | 'balanced';

export interface FacialZoneReading {
    zone: string;         // "Trán", "Mũi", "Mắt", …
    lmIndices: number[];  // MediaPipe indices dùng để đo
    reading: string;      // Nhận xét cụ thể
    fortuneArea: string;  // Lĩnh vực ảnh hưởng: "Tài lộc", "Sự nghiệp", …
    score: number;        // 0–100
}

export interface FengShuiResult {
    element: WuXingElement;
    elementLabel: string;            // "Thổ", "Kim", …
    elementDescription: string;
    yinYang: YinYang;
    yinYangLabel: string;
    luckyColors: string[];
    luckyDirections: string[];
    luckyNumbers: number[];
    strengths: string[];             // Điểm mạnh tướng số
    challenges: string[];            // Điểm cần chú ý
    facialZones: FacialZoneReading[];
    fortuneAreas: {
        wealth: number;    // 0–100
        career: number;
        love: number;
        health: number;
        wisdom: number;
    };
    overallScore: number;           // 0–100
}

// ─── Landmark indices ─────────────────────────────────────────────────────────

const LM = {
    forehead:     10,
    foreheadLeft: 54,   foreheadRight: 284,
    browLeft:     70,   browRight:     300,   // Lông mày (ngoài)
    browInLeft:   107,  browInRight:   336,   // Lông mày (trong)
    eyeLidLeft:   159,  eyeLidRight:   386,   // Mi mắt
    eyeLeft:       33,  eyeRight:      263,
    cheekLeft:    234,  cheekRight:    454,
    noseTip:        4,
    noseBridgeTop: 6,
    noseBaseLeft: 129,  noseBaseRight: 358,
    lipTop:        13,  lipBot:         14,
    lipLeft:       61,  lipRight:      291,
    chin:         152,
    jawLeft:      172,  jawRight:      397,
    jawAngleLeft:  58,  jawAngleRight: 288,
    templeLeft:   127,  templeRight:   356,
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

// ─── Ngũ hành mapping ─────────────────────────────────────────────────────────

const ELEMENT_INFO: Record<WuXingElement, {
    label: string;
    description: string;
    colors: string[];
    directions: string[];
    numbers: number[];
    strengths: string[];
    challenges: string[];
}> = {
    metal: {
        label: 'Kim',
        description: 'Hành Kim chủ về ý chí, kỷ luật và tư duy sắc bén. Khuôn mặt cân đối, xương gò má và cằm rõ nét.',
        colors: ['Trắng', 'Vàng kim', 'Bạc'],
        directions: ['Tây', 'Tây Bắc'],
        numbers: [6, 7],
        strengths: ['Quyết đoán, nhất quán', 'Tổ chức tốt', 'Đáng tin cậy'],
        challenges: ['Có thể cứng nhắc', 'Khó buông bỏ'],
    },
    wood: {
        label: 'Mộc',
        description: 'Hành Mộc tượng trưng cho sự phát triển, sáng tạo và nhân từ. Khuôn mặt thon dài, trán rộng.',
        colors: ['Xanh lá', 'Xanh dương nhạt'],
        directions: ['Đông', 'Đông Nam'],
        numbers: [3, 4],
        strengths: ['Sáng tạo, linh hoạt', 'Đồng cảm cao', 'Học hỏi nhanh'],
        challenges: ['Hay do dự', 'Dễ bị phân tâm'],
    },
    water: {
        label: 'Thuỷ',
        description: 'Hành Thuỷ liên quan tới trí tuệ, trực giác và khả năng thích nghi. Khuôn mặt mềm mại, đôi mắt sâu.',
        colors: ['Đen', 'Xanh navy', 'Xám đậm'],
        directions: ['Bắc'],
        numbers: [1],
        strengths: ['Trực giác mạnh', 'Khéo léo trong giao tiếp', 'Thích nghi tốt'],
        challenges: ['Hay lo lắng', 'Cần điểm tựa ổn định'],
    },
    fire: {
        label: 'Hoả',
        description: 'Hành Hoả đại diện cho nhiệt huyết, lãnh đạo và sức hút. Khuôn mặt nhọn về phía trán hoặc cằm.',
        colors: ['Đỏ', 'Cam', 'Hồng đậm'],
        directions: ['Nam'],
        numbers: [2, 9],
        strengths: ['Lãnh đạo thiên bẩm', 'Đam mê cuồng nhiệt', 'Truyền cảm hứng'],
        challenges: ['Nóng vội', 'Cần kiểm soát cảm xúc'],
    },
    earth: {
        label: 'Thổ',
        description: 'Hành Thổ biểu thị sự bền vững, trung thực và đáng tin. Khuôn mặt vuông vắn, đầy đặn.',
        colors: ['Vàng đất', 'Nâu', 'Be'],
        directions: ['Trung tâm', 'Đông Bắc', 'Tây Nam'],
        numbers: [5, 8],
        strengths: ['Kiên nhẫn, bền bỉ', 'Trung thành, đáng tin', 'Thực tế'],
        challenges: ['Khó thay đổi', 'Đôi khi thiếu linh hoạt'],
    },
};

// ─── Zone analysers ───────────────────────────────────────────────────────────

function analyzeForehead(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const top  = px(lms[LM.forehead],      w, h);
    const fL   = px(lms[LM.foreheadLeft],  w, h);
    const fR   = px(lms[LM.foreheadRight], w, h);
    const browL = px(lms[LM.browLeft],     w, h);
    const browR = px(lms[LM.browRight],    w, h);

    const foreheadH = d2(top, { x: (browL.x + browR.x) / 2, y: (browL.y + browR.y) / 2 });
    const foreheadW = d2(fL, fR);
    const ratio = foreheadW / Math.max(foreheadH, 1);

    // Trán rộng và cao = tốt cho sự nghiệp và trí tuệ
    const score = clamp(norm(ratio, 1.5, 3.5, 30, 90));
    const reading = ratio > 2.8
        ? 'Trán rộng và cao — biểu hiện của trí tuệ vượt trội và tầm nhìn xa.'
        : ratio > 2.0
        ? 'Trán cân đối — cân bằng giữa lý trí và trực giác.'
        : 'Trán hẹp — tinh tế, sâu sắc, thiên về cảm xúc hơn lý trí.';

    return { zone: 'Trán', lmIndices: [10, 54, 284, 70, 300], reading, fortuneArea: 'Sự nghiệp & Trí tuệ', score };
}

function analyzeBrows(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const bL  = px(lms[LM.browLeft],   w, h);
    const bR  = px(lms[LM.browRight],  w, h);
    const biL = px(lms[LM.browInLeft], w, h);
    const biR = px(lms[LM.browInRight],w, h);

    const browWidth = d2(bL, biL); // chiều dài lông mày trái
    const browGap   = d2(biL, biR); // khoảng cách giữa 2 đầu mày
    const symmetry  = Math.abs(d2(bL, biL) - d2(bR, biR)) / Math.max(browWidth, 1);

    const score = clamp(norm(1 - symmetry, 0, 0.2, 50, 95) * (browGap < 50 ? 0.9 : 1));
    const reading = symmetry < 0.05
        ? 'Lông mày cân đối, rõ nét — tướng số nhất quán, đáng tin cậy.'
        : symmetry < 0.12
        ? 'Lông mày tương đối đều — tính cách ổn định với đôi chút biến hoá.'
        : 'Lông mày lệch nhau — cá tính đặc biệt, tư duy sáng tạo ngoài khuôn khổ.';

    return { zone: 'Lông mày', lmIndices: [70, 300, 107, 336], reading, fortuneArea: 'Tình duyên & Quan hệ', score };
}

function analyzeEyes(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const eL  = px(lms[LM.eyeLeft],     w, h);
    const eR  = px(lms[LM.eyeRight],    w, h);
    const lidL = px(lms[LM.eyeLidLeft],  w, h);
    const lidR = px(lms[LM.eyeLidRight], w, h);

    const eyeSpan  = d2(eL, eR);
    const cheekW   = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));
    const eyeRatio = eyeSpan / Math.max(cheekW, 1);
    const lidH     = (lidL.y - eL.y + lidR.y - eR.y) / 2; // độ mở mi (thô)

    // Mắt to, cách xa vừa phải = tướng tốt
    const score = clamp(norm(eyeRatio, 0.30, 0.55, 40, 95));
    const reading = eyeRatio > 0.48
        ? 'Mắt to, khoảng cách hài hoà — trực giác sắc bén, dễ thu hút người khác.'
        : eyeRatio > 0.38
        ? 'Mắt cân đối — quan sát tinh tế, biết lắng nghe.'
        : 'Mắt nhỏ, nhìn sâu — tập trung cao, cẩn thận trong từng quyết định.';

    return { zone: 'Đôi mắt', lmIndices: [33, 263, 159, 386], reading, fortuneArea: 'Trí tuệ & Duyên số', score };
}

function analyzeNose(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const tip   = px(lms[LM.noseTip],       w, h);
    const bridge = px(lms[LM.noseBridgeTop], w, h);
    const nL    = px(lms[LM.noseBaseLeft],  w, h);
    const nR    = px(lms[LM.noseBaseRight], w, h);

    const noseH     = d2(tip, bridge);
    const noseW     = d2(nL, nR);
    const noseRatio = noseH / Math.max(noseW, 1); // cao / rộng

    // Mũi cao, thẳng, cánh mũi đầy = tài lộc
    const score = clamp(norm(noseRatio, 0.8, 2.0, 40, 90));
    const reading = noseRatio > 1.6
        ? 'Mũi cao và thẳng — cung tài lộc vượng, quyết đoán trong kinh doanh.'
        : noseRatio > 1.1
        ? 'Mũi cân đối — tài lộc ổn định, biết quản lý chi tiêu.'
        : 'Mũi thấp, cánh rộng — hào phóng, trọng tình nghĩa hơn tiền bạc.';

    return { zone: 'Mũi', lmIndices: [4, 6, 129, 358], reading, fortuneArea: 'Tài lộc & Sức khoẻ', score };
}

function analyzeMouth(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const mL = px(lms[LM.lipLeft],  w, h);
    const mR = px(lms[LM.lipRight], w, h);
    const mT = px(lms[LM.lipTop],   w, h);
    const mB = px(lms[LM.lipBot],   w, h);

    const mouthW = d2(mL, mR);
    const lipH   = d2(mT, mB);
    const cheekW = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));
    const mRatio = mouthW / Math.max(cheekW, 1);

    // Miệng vừa, môi đầy = phúc lộc
    const score = clamp(norm(mRatio, 0.30, 0.55, 50, 90));
    const reading = mRatio > 0.48
        ? 'Miệng rộng, môi đầy — phúc lộc dồi dào, khả năng thuyết phục tốt.'
        : mRatio > 0.35
        ? 'Miệng hài hoà — giao tiếp khéo léo, tạo thiện cảm dễ dàng.'
        : 'Miệng nhỏ, thanh tú — cẩn thận lời nói, suy nghĩ trước khi nói.';

    return { zone: 'Miệng & Môi', lmIndices: [13, 14, 61, 291], reading, fortuneArea: 'Phúc lộc & Giao tiếp', score };
}

function analyzeChin(lms: LM3D[], w: number, h: number): FacialZoneReading {
    const chin  = px(lms[LM.chin],        w, h);
    const jawL  = px(lms[LM.jawLeft],     w, h);
    const jawR  = px(lms[LM.jawRight],    w, h);
    const jaL   = px(lms[LM.jawAngleLeft], w, h);
    const jaR   = px(lms[LM.jawAngleRight], w, h);

    const chinW  = d2(jawL, jawR);
    const cheekW = d2(px(lms[LM.cheekLeft], w, h), px(lms[LM.cheekRight], w, h));
    const chinRatio = chinW / Math.max(cheekW, 1);

    // Cằm rộng, vuông = bền bỉ, ý chí
    const score = clamp(norm(chinRatio, 0.55, 0.90, 45, 90));
    const reading = chinRatio > 0.80
        ? 'Cằm rộng, hàm chắc — ý chí kiên cường, bền vững lâu dài.'
        : chinRatio > 0.65
        ? 'Cằm cân đối — nhẫn nại, biết khi nào nên kiên trì khi nào nên buông.'
        : 'Cằm thon, nhọn — linh hoạt, dễ thích nghi nhưng cần lực tựa ổn định.';

    return { zone: 'Cằm & Hàm', lmIndices: [152, 172, 397, 58, 288], reading, fortuneArea: 'Vận cuối đời & Ý chí', score };
}

// ─── Ngũ hành từ hình dạng khuôn mặt ─────────────────────────────────────────
//  Dựa trên tướng học cổ điển:
//   Kim = mặt hình chữ nhật ngang, gò má nổi
//   Mộc = mặt dài, trán cao
//   Thuỷ = mặt tròn, đầy đặn
//   Hoả = mặt nhọn, trán hẹp hoặc cằm nhọn
//   Thổ = mặt vuông, cằm rộng

function deriveElement(
    faceShape: string,
    ratio: number,   // cheek/height
    fNorm: number,   // forehead/cheek
    jNorm: number,   // jaw/cheek
    tNorm: number,   // temple/cheek
): WuXingElement {
    // Cho điểm mỗi hành
    const scores: Record<WuXingElement, number> = {
        metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
    };

    // Kim: cheek rộng hơn trán và hàm, tỉ lệ trung bình
    scores.metal += (1 - Math.abs(fNorm - 0.82)) * 2;
    scores.metal += (1 - Math.abs(jNorm - 0.82)) * 2;
    scores.metal += clamp(ratio > 0.74 && ratio < 0.88 ? 1 : 0, 0, 1);

    // Mộc: mặt dài (ratio thấp), trán rộng
    scores.wood += clamp(norm(1 - ratio, 0.10, 0.45, 0, 3), 0, 3);
    scores.wood += fNorm > 0.85 ? 1.5 : 0;

    // Thuỷ: mặt tròn, đầy
    scores.water += clamp(norm(ratio, 0.85, 1.10, 0, 3), 0, 3);
    scores.water += fNorm > 0.80 && jNorm > 0.80 ? 1 : 0;

    // Hoả: trán hẹp hoặc cằm nhọn (heart / diamond)
    scores.fire += faceShape === 'heart'   ? 2.5 : 0;
    scores.fire += faceShape === 'diamond' ? 1.5 : 0;
    scores.fire += fNorm < 0.75 ? 1.5 : 0;

    // Thổ: cằm và trán đều rộng (square / oblong)
    scores.earth += faceShape === 'square' ? 2.5 : 0;
    scores.earth += jNorm > 0.88 ? 2 : 0;
    scores.earth += Math.abs(fNorm - jNorm) < 0.08 ? 1 : 0;

    const best = (Object.keys(scores) as WuXingElement[])
        .sort((a, b) => scores[b] - scores[a])[0];
    return best;
}

// ─── Yin/Yang từ tỉ lệ và đặc điểm ──────────────────────────────────────────

function deriveYinYang(
    ratio: number,
    symmetryScore: number,
    element: WuXingElement
): YinYang {
    // Yin: mặt tròn mềm mại, đối xứng cao
    // Yang: mặt góc cạnh, tỉ lệ cao hơn
    const yinScore  = ratio * 0.6 + symmetryScore * 0.4;
    const yangScore = (1 - ratio) * 0.4 + (element === 'fire' || element === 'metal' ? 0.6 : 0.2);

    if (Math.abs(yinScore - yangScore) < 0.08) return 'balanced';
    return yinScore > yangScore ? 'yin' : 'yang';
}

const YIN_YANG_LABELS: Record<YinYang, string> = {
    yin: 'Âm (Yin)',
    yang: 'Dương (Yang)',
    balanced: 'Âm Dương cân bằng',
};

// ─── Fortune areas từ zone scores ────────────────────────────────────────────

function calcFortuneAreas(zones: FacialZoneReading[]) {
    const z = Object.fromEntries(zones.map(z => [z.zone, z.score]));
    return {
        wealth:  Math.round((z['Mũi'] * 0.5 + (z['Miệng & Môi'] ?? 70) * 0.3 + (z['Cằm & Hàm'] ?? 70) * 0.2)),
        career:  Math.round((z['Trán'] * 0.5 + z['Lông mày'] * 0.3 + z['Đôi mắt'] * 0.2)),
        love:    Math.round((z['Lông mày'] * 0.4 + z['Đôi mắt'] * 0.3 + (z['Miệng & Môi'] ?? 70) * 0.3)),
        health:  Math.round((z['Mũi'] * 0.35 + z['Đôi mắt'] * 0.35 + (z['Cằm & Hàm'] ?? 70) * 0.3)),
        wisdom:  Math.round((z['Trán'] * 0.45 + z['Đôi mắt'] * 0.35 + z['Lông mày'] * 0.2)),
    };
}

// ─── Main export ──────────────────────────────────────────────────────────────

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
    const w = imageWidth, h = imageHeight;

    const fNorm = measurements.foreheadWidth / measurements.cheekWidth;
    const jNorm = measurements.jawWidth      / measurements.cheekWidth;
    const tNorm = measurements.templeWidth   / measurements.cheekWidth;

    // Phân tích từng cung
    const facialZones: FacialZoneReading[] = [
        analyzeForehead(landmarks, w, h),
        analyzeBrows(landmarks, w, h),
        analyzeEyes(landmarks, w, h),
        analyzeNose(landmarks, w, h),
        analyzeMouth(landmarks, w, h),
        analyzeChin(landmarks, w, h),
    ];

    // Ngũ hành & Âm Dương
    const element  = deriveElement(faceShape, measurements.ratio, fNorm, jNorm, tNorm);
    const yinYang  = deriveYinYang(measurements.ratio, measurements.symmetryScore, element);
    const info     = ELEMENT_INFO[element];

    // Fortune areas
    const fortuneAreas = calcFortuneAreas(facialZones);

    // Overall score: trung bình có trọng số
    const zoneAvg = facialZones.reduce((s, z) => s + z.score, 0) / facialZones.length;
    const symBonus = measurements.symmetryScore * 10;
    const overallScore = Math.round(clamp(zoneAvg * 0.7 + symBonus * 0.3 + 5, 0, 100));

    return {
        element,
        elementLabel: info.label,
        elementDescription: info.description,
        yinYang,
        yinYangLabel: YIN_YANG_LABELS[yinYang],
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