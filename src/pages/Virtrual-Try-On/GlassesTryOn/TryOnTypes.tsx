// ─── Shared types ─────────────────────────────────────────────────────────────

export type DrawerType = "lens" | "rec" | "save_rec"| null;

// export interface TextureVariant {
//     id: string;
//     label: string;
//     cssPreview: string;
//     texturePath: string;
// }
export interface TextureVariant {
    colorHex: string;
    url: string;
}
export interface LensOption {
    id: string;
    name: string;
    desc: string;
    price: string;
    cssPreview: string;
}

export interface LensVendor {
    vendor: string;
    items: LensOption[];
}

// ─── Design tokens — light theme matching app palette ─────────────────────────

export const T = {
    // Primary teal
    teal: "#006470",
    tealLight: "rgba(0,100,112,0.08)",
    tealBorder: "rgba(0,100,112,0.25)",
    tealHover: "rgba(0,100,112,0.14)",

    // Surfaces
    bg: "#ffffff",
    bgSecondary: "#f7f8f8",
    bgTertiary: "#f0f2f2",

    // Text
    text: "#111111",
    textSecondary: "#444444",
    textMuted: "#888888",
    textDim: "#aaaaaa",

    // Borders
    border: "rgba(0,0,0,0.1)",
    borderSubtle: "rgba(0,0,0,0.06)",

    // Canvas overlays (dark bg)
    canvasBg: "#0d1a1c",
    overlayBg: "rgba(13,26,28,0.55)",
    overlayBorder: "rgba(255,255,255,0.15)",
    overlayText: "rgba(255,255,255,0.85)",
    overlayTextMuted: "rgba(255,255,255,0.5)",

    fontSans: "'Inter', 'DM Sans', sans-serif",
    fontSerif: "'Playfair Display', serif",
} as const;

// ─── Static data ───────────────────────────────────────────────────────────────

// export const TEXTURE_VARIANTS: TextureVariant[] = [
//     {
//         id: "wood",
//         label: "Wood",
//         cssPreview: "repeating-linear-gradient(90deg,#c8a870 0px,#b8945c 3px,#c8a870 6px)",
//         texturePath: "/textures/wood.jpg",
//     },
//     {
//         id: "acetate-black",
//         label: "Acetate",
//         cssPreview: "repeating-linear-gradient(45deg,#2a2a2a 0px,#444 2px,#2a2a2a 4px)",
//         texturePath: "/textures/acetate-black.jpg",
//     },
//     {
//         id: "tortoise",
//         label: "Tortoise",
//         cssPreview: "repeating-linear-gradient(30deg,#7a4e2d 0px,#5a3520 3px,#9a6040 6px)",
//         texturePath: "/textures/tortoise.jpg",
//     }
// ];

export const LENS_VENDORS: LensVendor[] = [
    {
        vendor: "Essilor",
        items: [
            { id: "essilor-1", name: "Crizal Sapphire", desc: "Anti-reflective · UV400", price: "$89", cssPreview: "background:#d4e8f5" },
            { id: "essilor-2", name: "Varilux Comfort", desc: "Progressive", price: "$149", cssPreview: "background:#c8dff0" },
        ],
    },
    {
        vendor: "Zeiss",
        items: [
            { id: "zeiss-1", name: "DuraVision Platinum", desc: "Scratch resistant", price: "$95", cssPreview: "background:#e0e0e0" },
            { id: "zeiss-2", name: "PhotoFusion X", desc: "Photochromic", price: "$120", cssPreview: "background:#b8c8b8" },
        ],
    },
    {
        vendor: "Hoya",
        items: [
            { id: "hoya-1", name: "Hilux 1.6", desc: "Thin · lightweight", price: "$75", cssPreview: "background:#f0e8d0" },
            { id: "hoya-2", name: "MiYOSMART", desc: "Myopia control", price: "$185", cssPreview: "background:#dde8dd" },
        ],
    },
];