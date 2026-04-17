// ─── Core enums ───────────────────────────────────────────────────────────────

export type ProductType = 'FRAME' | 'LENS' | 'ACCESSORY';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VerificationType = 'INITIAL' | 'UPDATE';

// ─── Reject reasons ───────────────────────────────────────────────────────────

export const REJECT_REASONS = [
    { value: 'INCOMPLETE_INFO',   label: 'Incomplete product information' },
    { value: 'INVALID_IMAGES',    label: 'Invalid or low-quality images' },
    { value: 'PRICE_VIOLATION',   label: 'Price does not meet policy' },
    { value: 'COUNTERFEIT',       label: 'Suspected counterfeit / IP violation' },
    { value: 'PROHIBITED_ITEM',   label: 'Prohibited item category' },
    { value: 'DUPLICATE',         label: 'Duplicate product listing' },
    { value: 'INCORRECT_CATEGORY',label: 'Incorrect product category' },
    { value: 'OTHER',             label: 'Other reason' },
] as const;

export type RejectionReason = typeof REJECT_REASONS[number]['value'];

// ─── Verification item returned by the API ────────────────────────────────────

export interface ProductVerificationItem {
    id: string;
    productId: string;
    productName: string;
    productType: ProductType;
    verificationType: VerificationType;
    sku: string | null;
    basePrice: number;
    costPrice: number;
    stockQuantity: number;
    submittedAt: string;      // ISO string
    status: VerificationStatus;
    rejectionReason: RejectionReason | null;
    rejectionNote: string | null;
    reviewedByName: string | null;
    reviewedAt: string | null;
    submissionCount: number;

    // Proposed changes snapshot (UPDATE type only)
    proposedChangesJson: string | null;    // raw JSON string, parse on demand
    pendingSnapshotJson: string | null;    // current live state audit (UPDATE only)

    // Full product/variant detail
    variantInfo: FrameVariantInfo | AccessoryVariantInfo;
    groupInfo: FrameGroupInfo | AccessoryGroupInfo;

    // Shop
    shop: ShopBasicInfo;

    // Product images of the variant being verified
    productImages: string[];
}

// ─── Variant info ─────────────────────────────────────────────────────────────

export interface FrameVariantInfo {
    colorName: string;
    colorHex: string;
    size: string;
    frameWidthMm: number;
    lensWidthMm: number;
    lensHeightMm: number;
    bridgeWidthMm: number;
    templeLengthMm: number;
    warrantyMonths: number;
    isReturnable: boolean;
    isFeatured: boolean;
    textureFile: string | null;
}

export interface AccessoryVariantInfo {
    name: string | null;
    color: string | null;
    colorHex: string | null;
    size: string | null;
    warrantyMonths: number;
    isReturnable: boolean;
    isFeatured: boolean;
}

// ─── Group info ───────────────────────────────────────────────────────────────

export interface FrameGroupInfo {
    id: string;
    frameName: string;
    frameShape: string;
    frameStructure: string;
    frameMaterial: string;
    genderTarget: string;
    ageGroup: string;
    hasNosePads: boolean;
    hasSpringHinge: boolean;
    vrEnabled: boolean;
    description: string;
    suitableFaceShapes: string[] | null;
    model3dUrl: string | null;
}

export interface AccessoryGroupInfo {
    id: string;
    name: string;
    type: string;
    description: string;
}

// ─── Shop info ────────────────────────────────────────────────────────────────

export interface ShopBasicInfo {
    id: string;
    shopCode: string;
    shopName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    logoUrl: string;
    isVerified: boolean;
    tier: string;
    commissionRate: number;
    avgRating: number | null;
    totalProducts: number | null;
    totalOrders: number | null;
    ownerName: string;
    ownerEmail: string;
    joinedAt: string;
    provinceName: string;
    districtName: string;
    wardName: string;
}

// ─── API request / response shapes ───────────────────────────────────────────

export interface VerifyPayload {
    action: 'APPROVED' | 'REJECTED';
    rejectionReason?: RejectionReason;
    rejectionNote?: string;
    adminNote?: string;
}

export interface VerificationStatsResponse {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

/** Spring Page<T> shape */
export interface VerificationPageResponse {
    content: ProductVerificationItem[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;          // current page (0-indexed)
    first: boolean;
    last: boolean;
    empty: boolean;
}