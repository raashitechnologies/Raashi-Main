import { AxiosError } from "axios";
import type { AxiosInstance } from "axios";

// 15 seconds for generic GETs, longer for uploads
export const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;
const RETRY_STATUS_CODES = [502, 503, 504];

export function setupApiClient(api: AxiosInstance) {
  // Default timeout for all requests if not overridden
  api.defaults.timeout = DEFAULT_TIMEOUT;

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as any;
      
      // If we don't have config, or it was intentionally aborted, don't retry
      if (!config || error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return Promise.reject(error);
      }

      // Automatically retry ONLY:
      // - GET requests
      // - transient network failure (no response)
      // - timeout (ECONNABORTED)
      // - 502, 503, 504
      // Never retry POST, PUT, DELETE, 4xx, etc.
      
      const status = error.response?.status;
      const isGet = config.method?.toLowerCase() === "get";
      
      // Timeout or purely network error (no response)
      const isTransient = !error.response || error.code === "ECONNABORTED";
      const isRetryableStatus = status ? RETRY_STATUS_CODES.includes(status) : false;

      if (isGet && (isTransient || isRetryableStatus)) {
        config._retryCount = config._retryCount || 0;
        if (config._retryCount < MAX_RETRIES) {
          config._retryCount += 1;
          // Exponential backoff: 500ms, 1000ms
          const backoff = Math.pow(2, config._retryCount - 1) * 500;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          return api(config);
        }
      }

      return Promise.reject(error);
    }
  );
}
