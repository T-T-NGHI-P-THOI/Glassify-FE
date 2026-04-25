// ==================== GHN Location Types ====================
export interface GhnProvince {
  ProvinceID: number;
  ProvinceName: string;
}

export interface GhnDistrict {
  DistrictID: number;
  ProvinceID: number;
  DistrictName: string;
}

export interface GhnWard {
  WardCode: string;
  DistrictID: number;
  WardName: string;
}

// ==================== Shop Enums ====================
export type ShopStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'PENDING_DEACTIVATION' | 'CLOSING' | 'CLOSED';

// ==================== Business License ====================
export interface BusinessLicense {
  id: string;
  licenseNumber: string;
  businessName: string;
  legalRepresentative: string;
  registeredAddress: string;
  taxId: string;
  businessType: string;
  issuedDate: string;
  issuedBy: string;
  expiryDate: string;
  licenseImageUrl: string;
  status: string;
  reviewedById: string;
  reviewedByName: string;
  reviewedAt: string;
  rejectionReason: string | null;
  adminNote: string | null;
}

export interface BusinessLicenseRequest {
  licenseNumber: string;
  businessName: string;
  legalRepresentative: string;
  registeredAddress: string;
  taxId: string;
  businessType: string;
  issuedDate: string;
  issuedBy: string;
  expiryDate: string;
  licenseImageUrl: string;
}

// ==================== Shop Detail Response ====================
export interface ShopDetailResponse {
  id: string;
  shopCode: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logoUrl: string;

  businessLicense: BusinessLicense;

  status: ShopStatus;
  isVerified: boolean;

  commissionTierId?: string;
  commissionTierName?: string;
  commissionRate: number;

  totalOrders: number | null;
  totalProducts: number | null;
  avgRating: number | null;

  ghnShopId: number;
  ghnProvinceId: number;
  ghnDistrictId: number;
  ghnWardCode: string;
  provinceName: string;
  districtName: string;
  wardName: string;

  joinedAt: string;
  createdAt: string;
  updatedAt: string;

  ownerId: string;
  ownerName: string;
  ownerEmail: string;

  // Latest registration request info
  latestRequestStatus?: string;
  rejectionReason?: string;
  adminComment?: string;
  warning?: string | null;

  scheduledCloseAt?: string;
  scheduledDeactivateAt?: string;
}

// ==================== Shop Types ====================
export interface ShopRegisterRequest {
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logoUrl: string;
  ghnProvinceId: number;
  ghnDistrictId: number;
  ghnWardCode: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  businessLicense: BusinessLicenseRequest;
}

export interface ShopRegisterResponse {
  requestId: string;
  shopId: string;
  shopCode: string;
  shopName: string;
  status: string;
  version: number;
  submittedAt: string;
}

// ==================== Shop Update Types ====================
export interface UpdateShopRequest {
  shopName?: string;
  phone?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  ghnProvinceId?: number;
  ghnDistrictId?: number;
  ghnWardCode?: string;
}

// ==================== Shop Bank Account Types ====================
export interface ShopBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault?: boolean;
}

// ==================== Admin Shop Request Types ====================
export interface ShopRequest {
  id: string;
  shopId: string;
  shopCode: string;
  status: string;
  version: number;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  logoUrl: string;
  businessLicense: BusinessLicense;
  userId: string;
  userName: string;
  userEmail: string;
  reviewedByName: string;
  reviewedAt: string;
  adminComment: string;
  rejectionReason: string;
  submittedAt: string;
  updatedAt: string;
}

export interface ShopRequestsResponse {
  requests: ShopRequest[];
  total: number;
}

// ==================== Admin Shop List Types ====================
export interface AdminShopItem {
  id: string;
  shopCode: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logoUrl: string | null;
  businessLicense: BusinessLicense;
  status: ShopStatus;
  isVerified: boolean;
  commissionTierId?: string;
  commissionTierName?: string;
  commissionRate: number;
  totalOrders: number | null;
  totalProducts: number | null;
  avgRating: number | null;
  joinedAt: string | null;
  createdAt: string;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
}

export interface ReviewShopRequest {
  requestId: string;
  action: string;
  comment?: string;
  rejectionReason?: string;
}
