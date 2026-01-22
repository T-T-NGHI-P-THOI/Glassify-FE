import type { ProductType } from "@/api/service/Type";
import type { Brand } from "./Brand";

export interface Product {
    id: string;
    parent_product_id?: string;
    brand?: Brand;
    product_type: ProductType;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    is_featured: boolean;
    is_instock: boolean;
    created_at: string;
    updated_at: string;
}