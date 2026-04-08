import { Color } from "@/types/user-recommendation.enum";

const colorOptions: { val: Color; hex: string }[] = [
    { val: Color.BLACK, hex: '#1a1a1a' },
    { val: Color.WHITE, hex: '#e5e5e5' },
    { val: Color.GOLD, hex: '#c8a84b' },
    { val: Color.SILVER, hex: '#a8a9ad' },
    { val: Color.BROWN, hex: '#8b6914' },
    { val: Color.BLUE, hex: '#2563eb' },
    { val: Color.RED, hex: '#dc2626' },
    { val: Color.PINK, hex: '#ec4899' },
    { val: Color.GREEN, hex: '#16a34a' },
    { val: Color.TRANSPARENT, hex: '#dbeafe' },
];

const colorMap = new Map<string, string>(
    colorOptions.map(c => [c.val.toString(), c.hex])
);

export function getHexColor(name: string): string | undefined {
    return colorMap.get(name.toUpperCase());
}