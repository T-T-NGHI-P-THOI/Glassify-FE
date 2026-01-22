// Base entities
export interface Brand {
    id: string;
    logo_image?: string;
    code: string;
    name: string;
    country?: string;
    founded_year?: string;
    description?: string;
    is_active: boolean;
}
