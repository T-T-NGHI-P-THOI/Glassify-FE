import axiosInstance from '../axios.config';
import type { LensSelection, Prescription, LensFrameValidationRequest, LensFrameValidationResponse, LensCatalogData } from '@/models/Lens';
import { API_ENDPOINTS } from '../endpoints';

export interface AddToCartWithLensRequest {
    product_id: string;
    quantity: number;
    lens_selection: LensSelection;
}

export interface AddToCartWithLensResponse {
    success: boolean;
    cart_item_id: string;
    message?: string;
}

export interface LensValidationResult {
    is_valid: boolean;
    errors?: string[];
}

class LensService {
    /**
     * Get available lens options for a specific product
     */
    async getLensOptions(productId: string) {
        try {
            const response = await axiosInstance.get(`/lenses/options/${productId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching lens options:', error);
            throw error;
        }
    }

    /**
     * Add product with lens customization to cart
     */
    async addToCartWithLens(request: AddToCartWithLensRequest): Promise<AddToCartWithLensResponse> {
        try {
            const response = await axiosInstance.post('/cart/add-with-lens', request);
            return response.data;
        } catch (error) {
            console.error('Error adding lens to cart:', error);
            throw error;
        }
    }

    /**
     * Validate prescription values
     */
    validatePrescription(prescription: Prescription): LensValidationResult {
        const errors: string[] = [];

        // Validate right eye
        if (!this.isValidSphereValue(prescription.right_eye.sphere)) {
            errors.push('Độ cận/viễn mắt phải không hợp lệ');
        }

        if (prescription.right_eye.cylinder && !this.isValidCylinderValue(prescription.right_eye.cylinder)) {
            errors.push('Độ loạn mắt phải không hợp lệ');
        }

        // Validate left eye
        if (!this.isValidSphereValue(prescription.left_eye.sphere)) {
            errors.push('Độ cận/viễn mắt trái không hợp lệ');
        }

        if (prescription.left_eye.cylinder && !this.isValidCylinderValue(prescription.left_eye.cylinder)) {
            errors.push('Độ loạn mắt trái không hợp lệ');
        }

        return {
            is_valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Calculate total lens price
     */
    calculateLensPrice(selection: LensSelection): number {
        let total = selection.lens_type.price;
        selection.features.forEach((feature) => {
            total += feature.price;
        });
        total += selection.tint?.price || 0;
        return total;
    }

    /**
     * Helper: Validate sphere value
     */
    private isValidSphereValue(value: string): boolean {
        const num = parseFloat(value);
        return !isNaN(num) && num >= -10.0 && num <= 6.0;
    }

    /**
     * Helper: Validate cylinder value
     */
    private isValidCylinderValue(value: string): boolean {
        const num = parseFloat(value);
        return !isNaN(num) && num >= -4.0 && num <= 0.0;
    }

    /**
     * Get lens catalog options for a specific frame variant
     * Returns all available lenses, usages, features, tints, and progressive options for the frame
     */
    async getLensCatalogForFrame(frameVariantId: string): Promise<LensCatalogData> {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.LENS.CATALOG_FOR_FRAME(frameVariantId));
            return response.data.data;
        } catch (error) {
            console.error('Error fetching lens catalog for frame:', error);
            throw error;
        }
    }

    /**
     * Validate lens-frame compatibility
     * Validates if a specific lens can be fitted into a frame variant with prescription values
     */
    async validateLensFrame(request: LensFrameValidationRequest): Promise<LensFrameValidationResponse> {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.VALIDATION.LENS_FRAME, request);
            return response.data;
        } catch (error) {
            console.error('Error validating lens-frame compatibility:', error);
            throw error;
        }
    }
}

export const lensService = new LensService();
export default lensService;
