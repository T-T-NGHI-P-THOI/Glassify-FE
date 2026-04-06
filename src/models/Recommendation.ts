export interface UserRecommendationResponse {
    id: string;
    name: string;
    faceShape: string;       // e.g. "OVAL", "ROUND", "SQUARE"
    faceConfidence: number;  // 0.0 – 1.0
    element: string;         // WuXingElement e.g. "WOOD", "FIRE"...
    yinYang: string;         // "YIN" | "YANG"
    overallScore: number;
    luckyColors: string[];
    recommendedFrameStyles: string[];
    recommendedLens: string;
    createdAt: string;
}
