// ============================================
// USER MODELS - Định nghĩa các TypeScript interfaces
// Tương ứng với Entity User và UserAuthProvider từ Backend
// ============================================

/**
 * Const object cho các loại Auth Provider
 * Tương ứng với AuthProvider enum trong Java
 * Sử dụng "as const" thay vì enum để compatible với erasableSyntaxOnly
 */
export const AuthProvider = {
    LOCAL: 'LOCAL',
    GOOGLE: 'GOOGLE',
    FACEBOOK: 'FACEBOOK',
} as const;

// Type cho AuthProvider values
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

/**
 * Interface cho Role của User
 */
export interface Role {
    id: number;
    name: string;
    description?: string;
}

/**
 * Interface cho thông tin Auth Provider
 * Tương ứng với UserAuthProvider entity
 */
export interface UserAuthProvider {
    id: string; // UUID
    provider: AuthProvider;
    providerUid?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Interface cho Shop (tham chiếu)
 */
export interface ShopReference {
    id: number;
    shopName: string;
    shopLogo?: string;
}

/**
 * Interface chính cho User
 * Tương ứng với User entity từ Backend
 */
export interface UserResponse {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    enabled: boolean;
    authProviders: UserAuthProvider[];
    shop?: ShopReference;
    roles: Role[];
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Interface cho User Profile Response từ API
 * Có thể bao gồm thêm các thông tin computed
 */
export interface UserProfileResponse {
    user: UserResponse;
    stats?: UserStats;
}

/**
 * Interface cho thống kê User (optional)
 */
export interface UserStats {
    totalOrders: number;
    totalSpent: number;
    totalReviews: number;
    memberSince: string;
}

/**
 * Interface cho request Update Profile
 */
export interface UpdateProfileRequest {
    fullName?: string;
    avatarUrl?: string;
}

/**
 * Interface cho request Change Password
 */
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}



/**
 * Interface cho Upload Avatar Response
 */
export interface UploadAvatarResponse {
    avatarUrl: string;
}