export const ProductSize = {
    EXTRA_SMALL: "EXTRA_SMALL",
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
    LARGE: "LARGE",
    EXTRA_LARGE: "EXTRA_LARGE",
} as const;

export type ProductSize = typeof ProductSize[keyof typeof ProductSize];