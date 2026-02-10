// Lens-related models for eyewear customization

export type LensUsageType = 
    | 'NON_PRESCRIPTION'
    | 'SINGLE_VISION'
    | 'READING'
    | 'BIFOCAL'
    | 'PROGRESSIVE';

export interface LensUsage {
    id: string;
    name: string;
    description: string;
    type?: LensUsageType;
    icon?: string;
}

export interface LensType {
    id: string;
    name: string;
    description: string;
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

// Preset common prescription values
export const SPHERE_VALUES = [
    '0.00', '-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00',
    '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00',
    '-4.25', '-4.50', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00',
    '-6.25', '-6.50', '-6.75', '-7.00', '-7.50', '-8.00', '-8.50', '-9.00',
    '-9.50', '-10.00',
    '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00',
    '+2.25', '+2.50', '+2.75', '+3.00', '+3.50', '+4.00', '+4.50', '+5.00',
    '+5.50', '+6.00'
];

export const CYLINDER_VALUES = [
    '0.00', '-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75',
    '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00'
];

export const ADD_VALUES = [
    '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'
];

export const PD_VALUES = [
    '56', '57', '58', '59', '60', '61', '62', '63', '64', '65',
    '66', '67', '68', '69', '70', '71', '72', '73', '74', '75',
    '76', '77', '78', '79'
];

export const PD_MONOCULAR_VALUES = [
    '17.5', '18.0', '18.5', '19.0', '19.5', '20.0', '20.5', '21.0', '21.5', '22.0',
    '22.5', '23.0', '23.5', '24.0', '24.5', '25.0', '25.5', '26.0', '26.5', '27.0',
    '27.5', '28.0', '28.5', '29.0', '29.5', '30.0', '30.5', '31.0', '31.5', '32.0',
    '32.5', '33.0', '33.5', '34.0', '34.5', '35.0', '35.5', '36.0', '36.5', '37.0',
    '37.5', '38.0', '38.5', '39.0', '39.5', '40.0'
];

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
    type: string;
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
    basePrice: number;
    isProgressive: boolean;
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
