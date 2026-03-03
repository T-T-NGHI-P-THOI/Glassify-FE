import axiosInstance from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/models/ApiResponse';
import type { BeCartResponse, BeCartItemRequest, BeCartCreateRequest } from './service/Type';

export default class CartAPI {
    static async createCart(request: BeCartCreateRequest): Promise<BeCartResponse> {
        const response = await axiosInstance.post<ApiResponse<BeCartResponse>>(
            API_ENDPOINTS.CART.CREATE, request
        );
        return response.data.data!;
    }

    static async getMyCart(): Promise<BeCartResponse> {
        const response = await axiosInstance.get<ApiResponse<BeCartResponse>>(
            API_ENDPOINTS.CART.GET_MY_CART
        );
        return response.data.data!;
    }

    static async getActiveCart(userId?: string, sessionId?: string): Promise<BeCartResponse> {
        const params: Record<string, string> = {};
        if (userId) params.userId = userId;
        if (sessionId) params.sessionId = sessionId;
        const response = await axiosInstance.get<ApiResponse<BeCartResponse>>(
            API_ENDPOINTS.CART.GET_ACTIVE, { params }
        );
        return response.data.data!;
    }

    static async addItem(cartId: string, item: BeCartItemRequest): Promise<BeCartResponse> {
        const response = await axiosInstance.post<ApiResponse<BeCartResponse>>(
            API_ENDPOINTS.CART.ADD_ITEM(cartId), item
        );
        return response.data.data!;
    }

    static async updateItem(cartId: string, itemId: string, item: BeCartItemRequest): Promise<BeCartResponse> {
        const response = await axiosInstance.put<ApiResponse<BeCartResponse>>(
            API_ENDPOINTS.CART.UPDATE_ITEM(cartId, itemId), item
        );
        return response.data.data!;
    }

    static async removeItem(cartId: string, itemId: string): Promise<BeCartResponse> {
        const response = await axiosInstance.delete<ApiResponse<BeCartResponse>>(
            API_ENDPOINTS.CART.REMOVE_ITEM(cartId, itemId)
        );
        return response.data.data!;
    }

    static async deleteCart(cartId: string): Promise<void> {
        await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.CART.DELETE(cartId)
        );
    }
}
