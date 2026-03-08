import axiosInstance from './axios.config';

const BASE = '/api/v1/admin/analytics';

// ==================== Shared Types ====================

export interface KpiCard {
  value: number;
  previousValue: number;
  growthRate: number;
}

export interface TrendSeries {
  labels: string[];
  series: Record<string, (number | null)[]>;
}

// ==================== Shop ====================

export interface ShopSummaryResponse {
  total: number;
  byStatus: Record<string, number>;
  newThisMonth: KpiCard;
  pendingApproval: number;
}

export interface ShopRegistrationSummaryResponse {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface ShopDetailAnalyticsResponse {
  shopInfo: {
    id: string;
    shopName: string;
    shopCode: string;
    status: string;
    tier: string;
    commissionRate: number;
    joinedAt: string;
    isVerified: boolean;
  };
  products: { total: number; active: number; pendingApproval: number; inactive: number; rejected: number };
  orders: { total: number; delivered: number; cancelled: number; returned: number; refunded: number };
  revenue: { totalGmv: number; totalSoldUnits: number; commissionEarned: number; avgOrderValue: number };
  wallet: { available: number; pending: number; frozen: number; totalEarned: number; totalWithdrawn: number };
  returnRate: number;
  avgRating: number;
  topProducts: { productId: string; name: string; soldCount: number; revenue: number }[];
}

// ==================== User ====================

export interface UserSummaryResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  shopOwners: {
    total: number;
    withActiveShop: number;
    withInactiveShop: number;
    withPendingShop: number;
    withSuspendedShop: number;
  };
  newThisMonth: KpiCard;
}

// ==================== Product ====================

export interface TopSellingProductResponse {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  sku: string;
  soldCount: number;
  revenue: number;
}

export interface ProductSummaryResponse {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalSoldUnits: number;
  lowStockCount: number;
  topCategories: { categoryId: string; name: string; productCount: number; soldCount: number }[];
}

// ==================== Finance ====================

export interface FinanceSummaryResponse {
  gmv: { total: number; thisMonth: number; lastMonth: number; growthRate: number };
  platformRevenue: { total: number; thisMonth: number; commissionOnly: number };
  topUps: { totalAmount: number; count: number; thisMonth: number };
  refunds: { totalAmount: number; count: number; refundRate: number };
  escrow: { currentHeld: number; releasedThisMonth: number; refundedThisMonth: number };
  shopWithdrawals: { pendingCount: number; pendingAmount: number; completedThisMonth: number };
}

export interface OrderFunnelResponse {
  created: number;
  paid: number;
  delivered: number;
  returned: number;
  refunded: number;
  cancelled: number;
}

// ==================== Order ====================

export interface OrderSummaryResponse {
  total: number;
  byStatus: Record<string, number>;
  cancellationRate: number;
  returnRate: number;
  avgOrderValue: number;
  newThisMonth: KpiCard;
}

// ==================== Query Params ====================

export interface TrendParams {
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  from?: string;
  to?: string;
}

// ==================== API ====================

const wrap = <T>(promise: Promise<{ data: { data: T } }>) =>
  promise.then((r) => r.data.data);

export const adminAnalyticsApi = {
  // Shop
  getShopSummary: () => wrap<ShopSummaryResponse>(axiosInstance.get(`${BASE}/shops/summary`)),
  getShopTrend: (p: TrendParams) => wrap<TrendSeries>(axiosInstance.get(`${BASE}/shops/trend`, { params: p })),
  getShopRegistrationSummary: () => wrap<ShopRegistrationSummaryResponse>(axiosInstance.get(`${BASE}/shops/requests/summary`)),
  getShopDetail: (shopId: string) => wrap<ShopDetailAnalyticsResponse>(axiosInstance.get(`${BASE}/shops/${shopId}/detail`)),
  exportShops: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open(`${BASE}/shops/export?${params}`, '_blank');
  },

  // User
  getUserSummary: () => wrap<UserSummaryResponse>(axiosInstance.get(`${BASE}/users/summary`)),
  getUserTrend: (p: TrendParams) => wrap<TrendSeries>(axiosInstance.get(`${BASE}/users/trend`, { params: p })),
  exportUsers: () => window.open(`${BASE}/users/export`, '_blank'),

  // Product
  getProductSummary: () => wrap<ProductSummaryResponse>(axiosInstance.get(`${BASE}/products/summary`)),
  getProductTrend: (p: TrendParams) => wrap<TrendSeries>(axiosInstance.get(`${BASE}/products/trend`, { params: p })),
  getTopSellingProducts: (limit = 10) =>
    wrap<TopSellingProductResponse[]>(axiosInstance.get(`${BASE}/products/top-selling`, { params: { limit } })),
  exportProducts: () => window.open(`${BASE}/products/export`, '_blank'),

  // Finance
  getFinanceSummary: () => wrap<FinanceSummaryResponse>(axiosInstance.get(`${BASE}/finance/summary`)),
  getRevenueTrend: (p: TrendParams) => wrap<TrendSeries>(axiosInstance.get(`${BASE}/finance/revenue-trend`, { params: p })),
  getIncomeOutcome: (p: TrendParams) => wrap<TrendSeries>(axiosInstance.get(`${BASE}/finance/income-outcome`, { params: p })),
  getOrderFunnel: (from?: string, to?: string) =>
    wrap<OrderFunnelResponse>(axiosInstance.get(`${BASE}/finance/order-funnel`, { params: { from, to } })),
  getPaymentMethods: (from?: string, to?: string) =>
    wrap<Record<string, number>>(axiosInstance.get(`${BASE}/finance/payment-methods`, { params: { from, to } })),
  exportFinance: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open(`${BASE}/finance/export?${params}`, '_blank');
  },

  // Order
  getOrderSummary: () => wrap<OrderSummaryResponse>(axiosInstance.get(`${BASE}/orders/summary`)),
  getOrderTrend: (p: TrendParams) => wrap<TrendSeries>(axiosInstance.get(`${BASE}/orders/trend`, { params: p })),
  exportOrders: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open(`${BASE}/orders/export?${params}`, '_blank');
  },
};
