import axiosInstance from '@/api/axios.config';
import type {
    ProductVerificationItem,
    VerificationStatus,
    ProductType,
    VerifyPayload,
    VerificationStatsResponse,
    VerificationPageResponse,
} from '@/types/verifications';

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ListVerificationsParams {
    status?: VerificationStatus | 'ALL';
    productType?: ProductType | 'ALL';
    search?: string;
    shopId?: string;
    page?: number;       // 0-indexed (Spring PageRequest)
    size?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const VerificationAPI = {

    /**
     * GET /api/v1/product-verifications
     * Returns a paginated page of verification items with full product/shop info.
     */
    list: async (params: ListVerificationsParams): Promise<VerificationPageResponse> => {
        const query: Record<string, string | number> = {
            page: params.page ?? 0,
            size: params.size ?? 10,
        };
        if (params.status && params.status !== 'ALL')      query.status      = params.status;
        if (params.productType && params.productType !== 'ALL') query.productType = params.productType;
        if (params.search?.trim())                          query.search      = params.search.trim();

        const res = await axiosInstance.get('/api/v1/product-verifications', { params: query });
        return res.data.data;
    },

    /**
     * GET /api/v1/product-verifications/stats
     * Returns pending / approved / rejected / total counts.
     */
    getStats: async (): Promise<VerificationStatsResponse> => {
        const res = await axiosInstance.get('/api/v1/product-verifications/stats');
        return res.data.data;
    },

    /**
     * POST /api/v1/product-verifications/:id/verify
     * Admin approves or rejects a verification.
     */
    verify: async (id: string, payload: VerifyPayload): Promise<ProductVerificationItem> => {
        const res = await axiosInstance.post(`/api/v1/product-verifications/${id}/verify`, payload);
        return res.data.data;
    },
};

export default VerificationAPI;