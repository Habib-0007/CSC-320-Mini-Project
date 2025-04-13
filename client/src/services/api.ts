import axios from "axios"

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // Use environment variable or default
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),

  register: (data: { name: string; email: string; username: string; password: string }) =>
    api.post("/auth/register", data),

  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) => api.post("/auth/reset-password", { token, password }),

  refreshToken: (refreshToken: string) => api.post("/auth/refresh-token", { refreshToken }),

  logout: () => api.post("/auth/logout"),

  // Ensure this function is properly implemented
  getCurrentUser: () => api.get("/users/me"),
}

// User API
export const userAPI = {
  getCurrentUser: () => api.get("/users/me"),

  updateProfile: (data: { name?: string; username?: string; bio?: string; avatar?: string }) =>
    api.put("/users/me", data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/users/change-password", { currentPassword, newPassword }),

  getUserUsage: () => api.get("/users/usage"),

  getApiKeys: () => api.get("/users/api-keys"),

  createApiKey: (name: string) => api.post("/users/api-keys", { name }),

  deleteApiKey: (id: string) => api.delete(`/users/api-keys/${id}`),
}

// LLM API
export const llmAPI = {
  generateCode: (data: {
    prompt: string
    provider: string
    language?: string
    framework?: string
    parameters?: Record<string, any>
  }) => api.post("/llm/generate", data),

  generateWithOpenAI: (data: {
    prompt: string
    language?: string
    framework?: string
    parameters?: Record<string, any>
  }) => api.post("/llm/generate/openai", data),

  generateWithClaude: (data: {
    prompt: string
    language?: string
    framework?: string
    parameters?: Record<string, any>
  }) => api.post("/llm/generate/claude", data),

  processImageWithPrompt: (formData: FormData) =>
    api.post("/llm/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
}

// Project API
export const projectAPI = {
  getAllProjects: (params?: { page?: number; limit?: number; search?: string }) => api.get("/projects", { params }),

  createProject: (data: { name: string; description?: string; language?: string; framework?: string }) =>
    api.post("/projects", data),

  getProjectById: (id: string) => api.get(`/projects/${id}`),

  updateProject: (id: string, data: { name?: string; description?: string; language?: string; framework?: string }) =>
    api.put(`/projects/${id}`, data),

  deleteProject: (id: string) => api.delete(`/projects/${id}`),

  createSnippet: (projectId: string, data: { title: string; code: string; language: string; description?: string }) =>
    api.post(`/projects/${projectId}/snippets`, data),

  getProjectSnippets: (projectId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/projects/${projectId}/snippets`, { params }),

  getSnippetById: (projectId: string, snippetId: string) => api.get(`/projects/${projectId}/snippets/${snippetId}`),

  updateSnippet: (
    projectId: string,
    snippetId: string,
    data: { title?: string; code?: string; language?: string; description?: string },
  ) => api.put(`/projects/${projectId}/snippets/${snippetId}`, data),

  deleteSnippet: (projectId: string, snippetId: string) => api.delete(`/projects/${projectId}/snippets/${snippetId}`),

  shareProject: (projectId: string, data: { isPublic: boolean; expiresIn?: number }) =>
    api.post(`/projects/${projectId}/share`, data),

  removeProjectShare: (projectId: string) => api.delete(`/projects/${projectId}/share`),

  getSharedProject: (token: string) => api.get(`/projects/shared/${token}`),
}

// Payment API
export const paymentAPI = {
  createSubscription: (plan: string) => api.post("/payments/subscribe", { plan }),

  verifyPayment: (reference: string) => api.post("/payments/verify", { reference }),

  cancelSubscription: (subscriptionId: string) => api.post("/payments/cancel", { subscriptionId }),

  getSubscriptionStatus: () => api.get("/payments/subscription"),

  getPaymentHistory: (params?: { page?: number; limit?: number }) => api.get("/payments/history", { params }),
}

export default api
