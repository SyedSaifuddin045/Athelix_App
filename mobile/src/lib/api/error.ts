export interface ApiFieldError {
  scope: string;
  field: string;
  message: string;
  type: string;
}

interface ApiErrorOptions {
  message: string;
  statusCode?: number;
  path?: string;
  detail?: unknown;
  fieldErrors?: ApiFieldError[];
  isNetworkError?: boolean;
}

export class ApiError extends Error {
  statusCode?: number;
  path?: string;
  detail?: unknown;
  fieldErrors: ApiFieldError[];
  isNetworkError: boolean;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.statusCode = options.statusCode;
    this.path = options.path;
    this.detail = options.detail;
    this.fieldErrors = options.fieldErrors ?? [];
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getFieldErrorMessage(
  error: unknown,
  field: string,
): string | undefined {
  if (!isApiError(error)) {
    return undefined;
  }

  return error.fieldErrors.find((entry) => entry.field === field)?.message;
}
