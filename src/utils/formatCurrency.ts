/**
 * Format a number to Vietnamese currency format
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (value: number) => {
  if (!value) return "";
  return new Intl.NumberFormat("vi-VN").format(value);
};

export const parseNumber = (value: string): number => {
  if (!value) return 0;

  const cleaned = value.replace(/\D/g, ""); // 🔥 remove hết không phải số
  return Number(cleaned);
};