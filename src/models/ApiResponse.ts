/**
 * Interface cho API Response chuẩn
 */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}