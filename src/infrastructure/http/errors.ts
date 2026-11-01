export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string };
  message?: string;
}

export function parseApiError(status: number, body: unknown): ApiError {
  const parsed = (body ?? {}) as ErrorBody;
  const code = parsed.error?.code ?? (status === 401 ? "unauthenticated" : "error");
  const fallback =
    status === 401 ? "Invalid credentials" : status === 502 ? "the server did not respond; try again" : "Request failed";
  const message = parsed.error?.message ?? parsed.message ?? fallback;
  return new ApiError(status, code, message);
}
