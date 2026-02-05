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
