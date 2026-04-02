type ApiErrorPayload = {
  message?: string;
  errors?: unknown;
};

const getFirstErrorFromErrors = (errors: unknown): string | undefined => {
  if (Array.isArray(errors)) {
    const firstArrayError = errors.find((item) => typeof item === 'string');
    return typeof firstArrayError === 'string' ? firstArrayError : undefined;
  }

  if (errors && typeof errors === 'object') {
    const firstValue = Object.values(errors as Record<string, unknown>)[0];

    if (typeof firstValue === 'string') {
      return firstValue;
    }

    if (Array.isArray(firstValue)) {
      const firstNestedValue = firstValue.find((item) => typeof item === 'string');
      return typeof firstNestedValue === 'string' ? firstNestedValue : undefined;
    }
  }

  return undefined;
};

const extractMessageFromPayload = (payload?: ApiErrorPayload): string | undefined => {
  if (!payload) {
    return undefined;
  }

  return getFirstErrorFromErrors(payload.errors) || payload.message;
};

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const err = error as {
    message?: string;
    errors?: unknown;
    response?: { data?: ApiErrorPayload };
    originalError?: { response?: { data?: ApiErrorPayload } };
  };

  return (
    extractMessageFromPayload(err.response?.data) ||
    extractMessageFromPayload(err.originalError?.response?.data) ||
    getFirstErrorFromErrors(err.errors) ||
    err.message ||
    fallbackMessage
  );
};
