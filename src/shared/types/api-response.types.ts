export interface ApiErrorBody {
  statusCode: number;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
