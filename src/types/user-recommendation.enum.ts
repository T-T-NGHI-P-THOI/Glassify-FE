import { BrowseGallery } from "@mui/icons-material";

export const Color = {
    BLACK: "BLACK",
    WHITE: "WHITE",
    RED: "RED",
    BLUE: "BLUE",
    GREEN: "GREEN",
    YELLOW: "YELLOW",
    GOLD: "GOLD",
    SILVER: "SILVER",
    BROWN: "BROWN",
    PINK: "PINK",
    PURPLE: "PURPLE",

    LIGHT_BLUE: "LIGHT_BLUE",
    NAVY: "NAVY",
    DARK_GRAY: "DARK_GRAY",
    ORANGE: "ORANGE",
    DEEP_PINK: "DEEP_PINK",
    BEIGE: "BEIGE",

    TRANSPARENT: "TRANSPARENT"
} as const;

export const FrameShape = {
    RECTANGLE: "RECTANGLE",
    ROUND: "ROUND",
    OVAL: "OVAL",
    CAT_EYE: "CAT_EYE",
    AVIATOR: "AVIATOR",
    WAYFARER: "WAYFARER",
    SQUARE: "SQUARE",
    GEOMETRIC: "GEOMETRIC",
    BROWLINE: "BROWLINE"
} as const;

export type Color = typeof Color[keyof typeof Color];
export type FrameShape = typeof FrameShape[keyof typeof FrameShape];