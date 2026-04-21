// Lens-related models for eyewear customization

export type LensUsageType = string;

export interface LensUsage {
    id: string;
    name: string;
    description: string;
    type?: string;
    isNonPrescription?: boolean;
    icon?: string;
}

export interface LensType {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    price: number;
    isPrescription: boolean;
    isProgressive?: boolean;
    
    usage_id: string;
}

export interface PrescriptionValue {
    sphere: string;      // SPH (độ cận/viễn): -10.00 to +6.00
    cylinder?: string;   // CYL (độ loạn): 0 to -4.00
    axis?: string;       // Axis (trục loạn): 0 to 180
    add?: string;        // ADD (độ cộng cho đa tròng): +0.75 to +3.00
    pd?: string;         // PD (khoảng cách đồng tử): 54-74mm
}

export interface Prescription {
    left_eye: PrescriptionValue;
    right_eye: PrescriptionValue;
}

export interface LensFeature {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'coating' | 'tint' | 'protection' | 'other';
    icon?: string;
}

export interface LensTint {
    id: string;
    name: string;
    description: string;
    price: number;
    cssValue: string;    // CSS color value (hex, rgb, rgba, etc.)
    opacity: number;      // 0-1 (0 = transparent, 1 = opaque)
}

export interface LensSelection {
    usage: LensUsage;
    lens_type: LensType;
    prescription?: Prescription;
    tint?: LensTint;
    features: LensFeature[];
    total_price: number;
}

export interface PrescriptionValidationRequest {
    sphRight: number;
    sphLeft: number;
    cylRight: number;
    cylLeft: number;
    axisRight: number;
    axisLeft: number;
    add?: number;
    pd?: number;
    pdLeft?: number;
    pdRight?: number;
}

export interface PrescriptionValidationIssue {
    code: string;
    field: string;
    message: string;
    level: string;
    metadata?: Record<string, any>;
}

export interface PrescriptionValidationSummary {
    prescriptionType: string;
    requiresAdd: boolean;
    hasAstigmatism: boolean;
    recommendedLensCategories: string[];
    notes: string[];
}

export interface PrescriptionValidationData {
    valid: boolean;
    issues: PrescriptionValidationIssue[];
    summary: PrescriptionValidationSummary;
}

export interface PrescriptionValidationResponse {
    status: number;
    message: string;
    data: PrescriptionValidationData;
    errors: string[];
}

// Lens-Frame Validation Types (for lens + frame + features compatibility)
export interface LensFrameValidationRequest {
    lensId: string;
    frameVariantId: string;
    featureIds: string[];
}

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue {
    code: string;
    path: string;
    message: string;
    severity: ValidationSeverity;
    meta?: Record<string, any>;
}

export interface LensFrameValidationResponse {
    valid: boolean;
    issues: ValidationIssue[];
}

// Lens Catalog API Types
export interface LensCatalogUsage {
    usageId: string;
    type?: string;
    isNonPrescription?: boolean;
    name: string;
    description: string;
    allowTint: boolean;
    allowProgressive: boolean;
    minPriceAdjustment: number;
}

export interface LensCatalogFeature {
    featureId: string;
    sku: string;
    name: string;
    description: string;
    extraPrice: number;
    isDefault: boolean;
    sphLimit: number;
}

export interface LensCatalogTint {
    tintId: string;
    code: string;
    name: string;
    cssValue: string;
    opacity: number;
    behavior: string;
    basePrice: number;
    extraPrice: number;
    isDefault: boolean;
}

export interface LensCatalogProgressiveOption {
    progressiveOptionId: string;
    name: string;
    description: string;
    progressiveType: string;
    maxViewDistanceFt: number;
    extraPrice: number;
    isRecommended: boolean;
    isActive: boolean;
}

export interface LensCatalogLens {
    lensId: string;
    lensSku: string;
    lensName: string;
    imageUrl?: string;
    lensImageUrl?: string;
    basePrice: number;    
    category?: string;
    usages: LensCatalogUsage[];
    features: LensCatalogFeature[];
    tints: LensCatalogTint[];
    progressiveOptions: LensCatalogProgressiveOption[];
}

export interface LensCatalogData {
    frameVariantId: string;
    frameVariantSku: string;
    lenses: LensCatalogLens[];
}

export interface LensCatalogResponse {
    status: number;
    message: string;
    data: LensCatalogData;
    errors: string[];
}
