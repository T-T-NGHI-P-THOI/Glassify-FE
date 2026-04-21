import axiosInstance from '@/api/axios.config';
import type { ApiResponse } from '@/models/ApiResponse';

export interface ReviewResponse {
    id: string;
    productId: string;
    userId: string;
    username?: string;
    fullName?: string;
    rating: number;
    title?: string;
    comment?: string;
    imageUrls?: string[];
    isVerifiedPurchase: boolean;
    isPublished: boolean;
    shopResponse?: string;
    createdAt: string;
    updatedAt?: string;
}

export const reviewApi = {
    getReviewByOrderItemId: async (orderItemId: string): Promise<ReviewResponse | null> => {
        const response = await axiosInstance.get<ApiResponse<ReviewResponse | null>>(
            `/api/reviews/order-item/${orderItemId}`
        );
        return response.data.data ?? null;
    },

    getMyReviewedOrderItemIds: async (): Promise<string[]> => {
        const response = await axiosInstance.get<ApiResponse<string[]>>(
            '/api/reviews/my-reviewed-order-items'
        );
        return response.data.data ?? [];
    },

    createReview: async (params: {
        orderItemId: string;
        rating: number;
        comment?: string;
        images?: File[];
    }): Promise<ApiResponse<ReviewResponse>> => {
        const formData = new FormData();
        formData.append('orderItemId', params.orderItemId);
        formData.append('rating', String(params.rating));
        if (params.comment) formData.append('comment', params.comment);
        params.images?.forEach((file) => formData.append('images', file));

        const response = await axiosInstance.post<ApiResponse<ReviewResponse>>(
            '/api/reviews',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },
};
