import axiosInstance from '../axios.config';
import type { 
    LensSelection, 
    LensFrameValidationRequest, 
    LensFrameValidationResponse, 
    LensCatalogData,
    PrescriptionValidationRequest,
    PrescriptionValidationResponse
} from '@/models/Lens';
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
     * Validates if a specific lens can be fitted into a frame variant with features
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

    /**
     * Validate prescription values
     * Validates prescription data before lens selection
     */
    async validatePrescription(request: PrescriptionValidationRequest): Promise<PrescriptionValidationResponse> {
        try {
            const response = await axiosInstance.post(API_ENDPOINTS.VALIDATION.PRESCRIPTION, request);
            return response.data;
        } catch (error) {
            console.error('Error validating prescription:', error);
            throw error;
        }
    }
}

export const lensService = new LensService();
export default lensService;
