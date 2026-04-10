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

export const parseNumber = (value: string) => {
  return Number(value.replace(/\D/g, ""));
};