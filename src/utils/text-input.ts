type SanitizeTextOptions = {
  maxLength?: number;
  allowExtendedPunctuation?: boolean;
};

const ZERO_WIDTH_AND_CONTROL_CHARS = /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g;
const DEFAULT_ALLOWED_TEXT = /[^\p{L}\p{N}\s]/gu;
const EXTENDED_ALLOWED_TEXT = /[^\p{L}\p{N}\s.,\-/']/gu;

export const sanitizeTextInput = (value: string, options: SanitizeTextOptions = {}): string => {
  const { maxLength, allowExtendedPunctuation = true } = options;
  const sanitized = value
    .replace(ZERO_WIDTH_AND_CONTROL_CHARS, '')
    .replace(allowExtendedPunctuation ? EXTENDED_ALLOWED_TEXT : DEFAULT_ALLOWED_TEXT, '');

  if (typeof maxLength === 'number') {
    return sanitized.slice(0, maxLength);
  }

  return sanitized;
};

export const sanitizeSearchInput = (value: string): string => sanitizeTextInput(value, {
  allowExtendedPunctuation: true,
});