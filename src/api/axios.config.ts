// ============================================
// AXIOS INSTANCE - Cấu hình Axios chuẩn chỉnh
// Bao gồm: interceptors, logging, error handling, token refresh
// ============================================


// ==================== CONFIGURATION ====================

import { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import axios from "axios";

/**
 * Cấu hình base cho API
 */
const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083',
    TIMEOUT: 30000, // 30 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000, // 1 second
};

/**
 * Các endpoint không cần authentication
 */
const PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/google',
    '/api/v1/auth/google',
    '/product',
    '/categories'
];

// ==================== LOGGER ====================

/**
 * Logger utility cho API calls
 * Có thể bật/tắt qua environment variable
 */
const Logger = {
    isEnabled: import.meta.env.VITE_API_LOGGING === 'true' || import.meta.env.DEV,

    /**
     * Log request info
     */
    request: (config: InternalAxiosRequestConfig) => {
        if (!Logger.isEnabled) return;

        console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log('📍 Full URL:', `${config.baseURL}${config.url}`);
        console.log('📋 Headers:', config.headers);
        if (config.params) console.log('🔍 Params:', config.params);
        if (config.data) console.log('📦 Body:', config.data);
        console.log('⏱️ Timestamp:', new Date().toISOString());
        console.groupEnd();
    },

    /**
     * Log response info
     */
    response: (response: AxiosResponse) => {
        if (!Logger.isEnabled) return;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const duration = response.config.metadata?.endTime - response.config.metadata?.startTime;

        console.group(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        console.log('📊 Status:', response.status, response.statusText);
        console.log('📦 Data:', response.data);
        console.log('⏱️ Duration:', `${duration}ms`);
        console.groupEnd();
    },

    /**
     * Log error info
     */
    error: (error: AxiosError) => {
        if (!Logger.isEnabled) return;

        console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        console.log('📊 Status:', error.response?.status);
        console.log('💬 Message:', error.message);
        console.log('📦 Response Data:', error.response?.data);
        console.log('⏱️ Timestamp:', new Date().toISOString());
        console.groupEnd();
    },
};

// ==================== TOKEN MANAGEMENT ====================

/**
 * Quản lý token trong localStorage
 */
export const TokenManager = {
    ACCESS_TOKEN_KEY: 'accessToken',
    REFRESH_TOKEN_KEY: 'refreshToken',

    getAccessToken: (): string | null => {
        return localStorage.getItem(TokenManager.ACCESS_TOKEN_KEY);
    },

    getRefreshToken: (): string | null => {
        return localStorage.getItem(TokenManager.REFRESH_TOKEN_KEY);
    },

    setTokens: (accessToken: string, refreshToken?: string) => {
        localStorage.setItem(TokenManager.ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(TokenManager.REFRESH_TOKEN_KEY, refreshToken);
        }
    },

    clearTokens: () => {
        localStorage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
        localStorage.removeItem(TokenManager.REFRESH_TOKEN_KEY);
    },

    isAuthenticated: (): boolean => {
        return !!TokenManager.getAccessToken();
    },
};

// ==================== AXIOS INSTANCE ====================

/**
 * Tạo Axios instance với cấu hình chuẩn
 */
const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    // ========== REQUEST INTERCEPTOR ==========
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            // Thêm metadata để tracking thời gian
            config.metadata = { startTime: Date.now() };

            // Thêm Authorization header nếu có token
            const token = TokenManager.getAccessToken();
            if (token && !isPublicEndpoint(config.url)) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Log request
            Logger.request(config);

            return config;
        },
        (error: AxiosError) => {
            Logger.error(error);
            return Promise.reject(error);
        }
    );

    // ========== RESPONSE INTERCEPTOR ==========
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            // Thêm end time để tính duration
            response.config.metadata = {
                ...response.config.metadata,
                endTime: Date.now(),
            };

            // Log response
            Logger.response(response);

            return response;
        },
        async (error: AxiosError) => {
            Logger.error(error);

            const originalRequest = error.config as InternalAxiosRequestConfig & {
                _retry?: boolean;
            };

            // Handle 401 Unauthorized - Token expired
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Thử refresh token
                    const refreshToken = TokenManager.getRefreshToken();
                    if (refreshToken) {
                        const response = await axios.post(
                            `${API_CONFIG.BASE_URL}/auth/refresh`,
                            { refreshToken }
                        );

                        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                        TokenManager.setTokens(accessToken, newRefreshToken);

                        // Retry request với token mới
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh token failed - logout user
                    TokenManager.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }

            // Handle other errors
            return Promise.reject(formatError(error));
        }
    );

    return instance;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Kiểm tra endpoint có phải public không
 */
const isPublicEndpoint = (url?: string): boolean => {
    if (!url) return false;
    return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

/**
 * Format error để dễ handle hơn
 */
interface FormattedError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
    originalError: AxiosError;
}

const formatError = (error: AxiosError): FormattedError => {
    const response = error.response;

    return {
        status: response?.status || 500,
        message:
            (response?.data as { message?: string })?.message ||
            error.message ||
            'An unexpected error occurred',
        errors: (response?.data as { errors?: Record<string, string[]> })?.errors,
        originalError: error,
    };
};

// ==================== EXPORT ====================

/**
 * Axios instance đã được cấu hình
 */
const axiosInstance = createAxiosInstance();

export default axiosInstance;

// ==================== TYPE AUGMENTATION ====================

/**
 * Mở rộng type cho axios config để thêm metadata
 */
declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        metadata?: {
            startTime?: number;
            endTime?: number;
        };
    }
}
