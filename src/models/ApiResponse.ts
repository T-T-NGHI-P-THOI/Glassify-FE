/**
 * Interface cho API Response chuẩn
 */
export interface ApiResponse<T> {
    status: number;
    success?: boolean;
    message: string;
    data?: T;
    errors?: string[] | Record<string, string[]>;
}