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
export type ShopStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type ShopTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

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

  businessLicense: string;
  taxId: string;

  status: ShopStatus;
  isVerified: boolean;

  tier: ShopTier;
  commissionRate: number;

  totalOrders: number;
  totalProducts: number;
  avgRating: number;

  ghnShopId: number;
  ghnProvinceId: number;
  ghnDistrictId: number;
  ghnWardCode: string;

  joinedAt: string;
  createdAt: string;
  updatedAt: string;

  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

// ==================== Shop Types ====================
export interface ShopRegisterRequest {
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  businessLicense: string;
  businessLicenseUrl: string;
  logoUrl: string;
  ghnProvinceId: number;
  ghnDistrictId: number;
  ghnWardCode: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  taxId: string;
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
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  businessLicense?: string;
  taxId?: string;
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
