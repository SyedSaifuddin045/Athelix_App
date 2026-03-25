export interface ApiErrorResponse {
  detail: string;
  message: string;
  status_code: number;
  path: string;
  field_errors?: Array<{
    scope: string;
    field: string;
    message: string;
    type: string;
  }>;
}

export interface FieldError {
  scope: string;
  field: string;
  message: string;
  type: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
