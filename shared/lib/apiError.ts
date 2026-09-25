export type ErrorKind =
  | "network"
  | "timeout"
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media"
  | "rate_limited"
  | "server"
  | "service_unavailable"
  | "unknown"
  | "aborted";

export interface NormalizedApiError {
  kind: ErrorKind;
  status?: number;
  message: string;
  retryable: boolean;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  retryAfterSeconds?: number;
}

export function normalizeApiError(error: any): NormalizedApiError {
  // If it's explicitly aborted via our cancellation, handle it silently
  if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
    // Distinguish between intentional abort and timeout
    // Usually Axios puts code="ECONNABORTED" or "ETIMEDOUT" for timeout
    if (error?.message?.toLowerCase().includes("timeout") || error?.code === "ECONNABORTED") {
      return {
        kind: "timeout",
        message: "The request took too long. Please try again.",
        retryable: true,
      };
    }
    return {
      kind: "aborted",
      message: "Request cancelled.",
      retryable: false,
    };
  }

  // Handle generic network error (e.g. CORS, offline)
  if (error?.message === "Network Error" || error?.code === "ERR_NETWORK") {
    return {
      kind: "network",
      message: "We couldn't reach the server. Check your connection and try again.",
      retryable: true,
    };
  }

  // Try to parse standard Axios error responses
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data || {};
    
    // Check if the backend returned our standardized format
    const backendMessage = data.message || data.detail || "Something went wrong.";
    const requestId = data.request_id || undefined;
    const retryAfter = data.retry_after ? parseInt(data.retry_after, 10) : undefined;

    switch (status) {
      case 400:
        return { kind: "unknown", status, message: "Some of the information is invalid. Please review your input.", retryable: false, requestId };
      case 401:
        return { kind: "unauthorized", status, message: "Your session has expired. Please sign in again.", retryable: false, requestId };
      case 403:
        return { kind: "forbidden", status, message: "You don't have permission to perform this action.", retryable: false, requestId };
      case 404:
        return { kind: "not_found", status, message: "The requested item could not be found.", retryable: false, requestId };
      case 409:
        return { kind: "conflict", status, message: "This item was changed elsewhere. Refresh the page and try again.", retryable: false, requestId };
      case 413:
        return { kind: "payload_too_large", status, message: "The selected file is too large.", retryable: false, requestId };
      case 415:
        return { kind: "unsupported_media", status, message: "This file type is not supported.", retryable: false, requestId };
      case 422:
        return { 
          kind: "validation", 
          status, 
          message: "Please correct the highlighted fields.", 
          retryable: false, 
          fieldErrors: data.fields || undefined,
          requestId 
        };
      case 429:
        return { 
          kind: "rate_limited", 
          status, 
          message: "You're making requests too quickly. Please wait a moment and try again.", 
          retryable: false,
          retryAfterSeconds: retryAfter,
          requestId 
        };
      case 500:
        return { kind: "server", status, message: "Something went wrong on our server. Please try again.", retryable: true, requestId };
      case 502:
      case 503:
      case 504:
        return { kind: "service_unavailable", status, message: "The service is temporarily unavailable. Please try again in a moment.", retryable: true, requestId };
      default:
        return { kind: "unknown", status, message: backendMessage, retryable: true, requestId };
    }
  }

  // Fallback for completely unknown errors
  return {
    kind: "unknown",
    message: "Something went wrong. Please try again.",
    retryable: true,
  };
}
