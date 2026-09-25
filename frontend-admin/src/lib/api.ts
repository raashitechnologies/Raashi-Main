import axios from "axios";
import { setupApiClient } from "@shared/lib/apiClient";

// Configurable API base URL: defaults to "/api/v1" for local dev proxy,
// or uses VITE_API_BASE_URL / VITE_API_URL in production.
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "/api/v1"
).replace(/\/+$/, "");

// Backend root URL (without /api/v1) for serving static files like uploads/resumes
export const BACKEND_URL = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  API_BASE_URL.replace(/\/api\/v1\/?$/, "")
).replace(/\/+$/, "");

/**
 * Resolves a resume/upload file URL to an absolute URL if needed.
 */
export function getResumeUrl(url?: string | null): string {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Apply timeouts and automatic retry logic for GET requests
setupApiClient(api);

// ── Flag to prevent parallel refresh attempts ───────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — attempt token refresh before redirecting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the failing request IS the refresh or login
      const url = originalRequest.url || "";
      if (url.includes("/auth/refresh") || url.includes("/auth/login")) {
        clearAuthData();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        clearAuthData();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token: newRefresh } = res.data;

        localStorage.setItem("auth_token", access_token);
        localStorage.setItem("refresh_token", newRefresh);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthData();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function clearAuthData() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");
}

function redirectToLogin() {
  if (
    window.location.pathname.startsWith("/admin") ||
    window.location.pathname.startsWith("/coordinator")
  ) {
    window.location.href = "/login";
  }
}

export default api;

// ── Auth API calls ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coordinator";
  is_active: boolean;
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),

  getMe: () => api.get<User>("/auth/me"),

  refreshToken: (refresh_token: string) =>
    api.post<LoginResponse>("/auth/refresh", { refresh_token }),

  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),

  verifyEmail: (token: string) =>
    api.post(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),
};

// ── Admin API calls ─────────────────────────────────────────────────────────

export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get("/admin/reports/dashboard"),

  // Website Content
  listContent: () => api.get("/admin/content"),
  getContent: (key: string) => api.get(`/admin/content/${key}`),
  updateContent: (key: string, data: { title?: string; content: Record<string, unknown>; is_published?: boolean }) =>
    api.put(`/admin/content/${key}`, data),
  togglePublish: (key: string, publish: boolean) =>
    api.patch(`/admin/content/${key}/publish?publish=${publish}`),

  // Domains
  listDomains: () => api.get("/admin/domains"),
  getDomain: (id: string) => api.get(`/admin/domains/${id}`),
  createDomain: (data: Record<string, unknown>) => api.post("/admin/domains", data),
  updateDomain: (id: string, data: Record<string, unknown>) => api.put(`/admin/domains/${id}`, data),
  deleteDomain: (id: string) => api.delete(`/admin/domains/${id}`),
  uploadDomainImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/admin/domains/${id}/image`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteDomainImage: (id: string) => api.delete(`/admin/domains/${id}/image`),

  // Internship Listings
  listInternships: () => api.get("/admin/internships"),
  createInternship: (data: Record<string, unknown>) => api.post("/admin/internships", data),
  updateInternship: (id: string, data: Record<string, unknown>) => api.put(`/admin/internships/${id}`, data),
  deleteInternship: (id: string) => api.delete(`/admin/internships/${id}`),

  // Internship Applications
  listInternshipApps: (params?: Record<string, string | number>) =>
    api.get("/admin/internship-applications", { params }),
  getInternshipApp: (id: string) => api.get(`/admin/internship-applications/${id}`),
  getInternshipResumeUrl: (id: string) => api.get<{ url: string; legacy?: boolean }>(`/admin/internship-applications/${id}/resume`),
  updateInternshipAppStatus: (id: string, status: string) =>
    api.patch(`/admin/internship-applications/${id}/status`, { status }),
  addInternshipRemark: (id: string, remark: string) =>
    api.post(`/admin/internship-applications/${id}/remarks`, { remark }),
  deleteInternshipApp: (id: string) => api.delete(`/admin/internship-applications/${id}`),

  // Jobs
  listJobs: () => api.get("/admin/jobs"),
  createJob: (data: Record<string, unknown>) => api.post("/admin/jobs", data),
  updateJob: (id: string, data: Record<string, unknown>) => api.put(`/admin/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),

  // Career Applications
  listCareerApps: (params?: Record<string, string | number>) =>
    api.get("/admin/career-applications", { params }),
  getCareerApp: (id: string) => api.get(`/admin/career-applications/${id}`),
  getCareerResumeUrl: (id: string) => api.get<{ url: string; legacy?: boolean }>(`/admin/career-applications/${id}/resume`),
  updateCareerAppStatus: (id: string, status: string) =>
    api.patch(`/admin/career-applications/${id}/status`, { status }),
  addCareerRemark: (id: string, remark: string) =>
    api.post(`/admin/career-applications/${id}/remarks`, { remark }),
  deleteCareerApp: (id: string) => api.delete(`/admin/career-applications/${id}`),

  // Contacts
  listContacts: (params?: Record<string, string | number>) =>
    api.get("/admin/contacts", { params }),
  getContact: (id: string) => api.get(`/admin/contacts/${id}`),
  updateContactStatus: (id: string, status: string, note?: string) =>
    api.patch(`/admin/contacts/${id}/status`, { status, note }),

  // Users
  listUsers: (params?: Record<string, string>) => api.get("/admin/users", { params }),
  createUser: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post("/admin/users", data),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  toggleUserActive: (id: string, active: boolean) =>
    api.patch(`/admin/users/${id}/activate?active=${active}`),

  // Audit Logs
  listAuditLogs: (params?: Record<string, number>) => api.get("/admin/audit-logs", { params }),

  // Brochure
  uploadBrochure: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/admin/brochure", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getBrochureStatus: () => api.get("/admin/brochure"),
};

// ── Coordinator API calls ───────────────────────────────────────────────────

export const coordinatorApi = {
  getDashboard: () => api.get("/coordinator/dashboard"),

  listInternshipApps: (params?: Record<string, string | number>) =>
    api.get("/coordinator/internship-applications", { params }),
  getInternshipApp: (id: string) => api.get(`/coordinator/internship-applications/${id}`),
  getInternshipResumeUrl: (id: string) => api.get<{ url: string; legacy?: boolean }>(`/coordinator/internship-applications/${id}/resume`),
  updateInternshipAppStatus: (id: string, status: string) =>
    api.patch(`/coordinator/internship-applications/${id}/status`, { status }),
  addInternshipRemark: (id: string, remark: string) =>
    api.post(`/coordinator/internship-applications/${id}/remarks`, { remark }),

  listCareerApps: (params?: Record<string, string | number>) =>
    api.get("/coordinator/career-applications", { params }),
  getCareerApp: (id: string) => api.get(`/coordinator/career-applications/${id}`),
  getCareerResumeUrl: (id: string) => api.get<{ url: string; legacy?: boolean }>(`/coordinator/career-applications/${id}/resume`),
  updateCareerAppStatus: (id: string, status: string) =>
    api.patch(`/coordinator/career-applications/${id}/status`, { status }),
  addCareerRemark: (id: string, remark: string) =>
    api.post(`/coordinator/career-applications/${id}/remarks`, { remark }),

  listInternships: () => api.get("/coordinator/internships"),
  getInternship: (id: string) => api.get(`/coordinator/internships/${id}`),

  listContacts: (params?: Record<string, string | number>) =>
    api.get("/coordinator/contacts", { params }),
  updateContactStatus: (id: string, status: string, note?: string) =>
    api.patch(`/coordinator/contacts/${id}/status`, { status, note }),

  getReports: () => api.get("/coordinator/reports"),
};

// ── Public API calls (no auth required) ─────────────────────────────────────

export const publicApi = {
  // Domains
  getDomains: () => api.get("/domains/"),
  getDomain: (slug: string) => api.get(`/domains/${slug}`),
  getDomainImageUrl: (slug: string) => `${API_BASE_URL}/domains/${slug}/image`,

  // Active job openings
  getActiveJobs: () => api.get("/careers/"),

  // Active internship listings
  getActiveInternshipListings: () => api.get("/content/internship-listings/active"),

  // CMS content
  getPublishedContent: () => api.get("/content/"),
  getContentSection: (key: string) => api.get(`/content/${key}`),

  // Active policies (for applicant forms)
  getActivePolicies: (audience: "INTERNSHIP" | "CAREER") =>
    api.get("/policies/active", { params: { audience } }),

  // Brochure
  getBrochureStatus: () => api.get("/content/brochure/status"),
};

// ── Policy Admin API calls ──────────────────────────────────────────────────

export const policyApi = {
  getAll: (audience?: "INTERNSHIP" | "CAREER") =>
    api.get("/policies/admin", { params: audience ? { audience } : undefined }),
  getById: (id: string) => api.get(`/policies/admin/${id}`),
  getHistory: (document_type: "TERMS" | "RULES", audience: "INTERNSHIP" | "CAREER") =>
    api.get("/policies/admin/history", { params: { document_type, audience } }),
  create: (data: {
    document_type: "TERMS" | "RULES";
    audience: "INTERNSHIP" | "CAREER";
    title: string;
    content: string;
    effective_from?: string;
  }) => api.post("/policies/admin", data),
  update: (id: string, data: { title?: string; content?: string; effective_from?: string }) =>
    api.put(`/policies/admin/${id}`, data),
  publish: (id: string) => api.post(`/policies/admin/${id}/publish`),
};
