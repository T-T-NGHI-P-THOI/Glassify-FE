// Lens-related models for eyewear customization

export interface LensUsage {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface LensType {
    id: string;
    name: string;
    description: string;
    price: number;
    isPrescription: boolean;
    usage_id: string;
}

export interface PrescriptionValue {
    sphere: string;      // SPH (độ cận/viễn): -10.00 to +6.00
    cylinder?: string;   // CYL (độ loạn): 0 to -4.00
    axis?: string;       // Axis (trục loạn): 0 to 180
    add?: string;        // ADD (độ cộng cho đa tròng): +0.75 to +3.00
    pd?: string;         // PD (khoảng cách đồng tử): 54-74mm
}

export interface Prescription {
    left_eye: PrescriptionValue;
    right_eye: PrescriptionValue;
}

export interface LensFeature {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'coating' | 'tint' | 'protection' | 'other';
    icon?: string;
}

export interface LensTint {
    id: string;
    name: string;
    description: string;
    price: number;
    cssValue: string;    // CSS color value (hex, rgb, rgba, etc.)
    opacity: number;      // 0-1 (0 = transparent, 1 = opaque)
}

export interface LensSelection {
    usage: LensUsage;
    lens_type: LensType;
    prescription?: Prescription;
    tint?: LensTint;
    features: LensFeature[];
    total_price: number;
}

// Preset common prescription values
export const SPHERE_VALUES = [
    '0.00', '-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00',
    '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00',
    '-4.25', '-4.50', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00',
    '-6.25', '-6.50', '-6.75', '-7.00', '-7.50', '-8.00', '-8.50', '-9.00',
    '-9.50', '-10.00',
    '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00',
    '+2.25', '+2.50', '+2.75', '+3.00', '+3.50', '+4.00', '+4.50', '+5.00',
    '+5.50', '+6.00'
];

export const CYLINDER_VALUES = [
    '0.00', '-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75',
    '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00'
];

export const ADD_VALUES = [
    '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'
];

// Sample data
export const SAMPLE_LENS_USAGES: LensUsage[] = [
    {
        id: 'everyday',
        name: 'Everyday Use',
        description: 'Perfect for daily activities, work, and general use',
    },
    {
        id: 'computer',
        name: 'Computer & Digital Devices',
        description: 'Reduce eye strain from screens with blue light protection',
    },
    {
        id: 'reading',
        name: 'Reading',
        description: 'Optimized for close-up work and reading',
    },
    {
        id: 'driving',
        name: 'Driving',
        description: 'Enhanced clarity and glare reduction for driving',
    },
    {
        id: 'outdoor',
        name: 'Outdoor & Sports',
        description: 'UV protection and durability for outdoor activities',
    },
];

export const SAMPLE_LENS_TYPES: LensType[] = [
    {
        id: 'single_vision',
        name: 'Single Vision',
        description: 'Corrects one field of vision (near or far)',
        price: 500000,
        isPrescription: true,
        usage_id: 'everyday',
    },
    {
        id: 'progressive',
        name: 'Progressive',
        description: 'Multiple prescriptions in one lens without visible lines',
        price: 1500000,
        isPrescription: true,
        usage_id: 'everyday',
    },
    {
        id: 'bifocal',
        name: 'Bifocal',
        description: 'Two prescriptions with a visible line',
        price: 1000000,
        isPrescription: true,
        usage_id: 'reading',
    },
    {
        id: 'non_prescription',
        name: 'Non-Prescription (Plano)',
        description: 'Fashion lenses without vision correction',
        price: 300000,
        isPrescription: false,
        usage_id: 'everyday',
    },
    {
        id: 'blue_light',
        name: 'Blue Light Filter',
        description: 'Blocks harmful blue light from digital screens',
        price: 600000,
        isPrescription: false,
        usage_id: 'computer',
    },
];

export const SAMPLE_LENS_FEATURES: LensFeature[] = [
    {
        id: 'anti_scratch',
        name: 'Anti-Scratch Coating',
        description: 'Protects lenses from daily wear and scratches',
        price: 200000,
        category: 'coating',
    },
    {
        id: 'anti_reflective',
        name: 'Anti-Reflective Coating',
        description: 'Reduces glare and reflections for clearer vision',
        price: 300000,
        category: 'coating',
    },
    {
        id: 'uv_protection',
        name: 'UV Protection',
        description: '100% UVA and UVB protection',
        price: 250000,
        category: 'protection',
    },
    {
        id: 'photochromic',
        name: 'Photochromic (Transitions)',
        description: 'Automatically darkens in sunlight',
        price: 800000,
        category: 'tint',
    },
    {
        id: 'polarized',
        name: 'Polarized',
        description: 'Eliminates glare from reflective surfaces',
        price: 700000,
        category: 'protection',
    },
    {
        id: 'hydrophobic',
        name: 'Hydrophobic Coating',
        description: 'Repels water and prevents smudges',
        price: 150000,
        category: 'coating',
    },
    {
        id: 'tint_gray',
        name: 'Gray Tint',
        description: 'Reduces brightness while maintaining true colors',
        price: 400000,
        category: 'tint',
    },
    {
        id: 'tint_brown',
        name: 'Brown Tint',
        description: 'Enhances contrast and depth perception',
        price: 400000,
        category: 'tint',
    },
];

export const SAMPLE_LENS_TINTS: LensTint[] = [
    {
        id: 'clear',
        name: 'Không màu (Clear)',
        description: 'Trong suốt hoàn toàn, phù hợp cho mọi môi trường',
        price: 0,
        cssValue: 'transparent',
        opacity: 0,
    },
    {
        id: 'gray',
        name: 'Xám (Gray)',
        description: 'Giảm độ sáng nhưng giữ màu sắc tự nhiên',
        price: 400000,
        cssValue: '#808080',
        opacity: 0.7,
    },
    {
        id: 'brown',
        name: 'Nâu (Brown)',
        description: 'Tăng độ tương phản và độ sâu',
        price: 400000,
        cssValue: '#8B4513',
        opacity: 0.7,
    },
    {
        id: 'green',
        name: 'Xanh lá (Green)',
        description: 'Giảm chói và bảo vệ mắt ngoài trời',
        price: 400000,
        cssValue: '#228B22',
        opacity: 0.65,
    },
    {
        id: 'blue',
        name: 'Xanh dương (Blue)',
        description: 'Phong cách thời trang, giảm ánh sáng vàng',
        price: 400000,
        cssValue: '#4169E1',
        opacity: 0.6,
    },
    {
        id: 'yellow',
        name: 'Vàng (Yellow)',
        description: 'Tăng độ tương phản trong điều kiện ánh sáng yếu',
        price: 400000,
        cssValue: '#FFD700',
        opacity: 0.5,
    },
    {
        id: 'pink',
        name: 'Hồng (Pink)',
        description: 'Phong cách thời trang, tạo cảm giác dịu mắt',
        price: 400000,
        cssValue: '#FF69B4',
        opacity: 0.55,
    },
    {
        id: 'gradient_gray',
        name: 'Xám Gradient',
        description: 'Chuyển sắc từ đậm xuống nhạt, phong cách thời trang',
        price: 500000,
        cssValue: 'linear-gradient(to bottom, #808080, transparent)',
        opacity: 0.75,
    },
    {
        id: 'gradient_brown',
        name: 'Nâu Gradient',
        description: 'Chuyển sắc nâu sang trong suốt, phù hợp lái xe',
        price: 500000,
        cssValue: 'linear-gradient(to bottom, #8B4513, transparent)',
        opacity: 0.75,
    },
];
