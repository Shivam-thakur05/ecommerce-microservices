import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "react-hot-toast";
import { AuthTokens } from "../types";



// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshAccessToken(refreshToken);
              const { accessToken } = response.data.data;
              this.setAccessToken(accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any) {
    const message =
      error.response?.data?.message || error.message || "An error occurred";

    if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (error.response?.status === 401) {
      toast.error("Please log in to continue.");
    } else if (error.response?.status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (error.response?.status === 404) {
      toast.error("Resource not found.");
    } else if (error.response?.status === 422) {
      toast.error(message);
    } else {
      toast.error(message);
    }
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  private setAccessToken(token: string): void {
    localStorage.setItem("accessToken", token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem("refreshToken", token);
  }

  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private async refreshAccessToken(refreshToken: string) {
    return this.api.post("/api/auth/refresh", { refreshToken });
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  // Auth API methods
  async login(email: string, password: string, rememberMe?: boolean) {
    const response = await this.post("/api/auth/login", {
      email,
      password,
      rememberMe,
    });
    const { data } = response as any;
    this.setAccessToken(data.tokens.accessToken);
    this.setRefreshToken(data.tokens.refreshToken);
    return response;
  }

  async register(userData: any) {
    const response = await this.post("/api/auth/register", userData);
    const { data } = response as any;
    this.setAccessToken(data.tokens.accessToken);
    this.setRefreshToken(data.tokens.refreshToken);
    return response;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.post("/api/auth/logout", { refreshToken });
    }
    this.clearTokens();
  }

  async getCurrentUser() {
    return this.get("/api/auth/me");
  }

  async updateProfile(userData: any) {
    return this.put("/api/auth/profile", userData);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }

  // User API methods
  async getUsers(params?: any) {
    return this.get("/api/users", { params });
  }

  async getUserById(id: string) {
    return this.get(`/api/users/${id}`);
  }

  async updateUser(id: string, userData: any) {
    return this.put(`/api/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/api/users/${id}`);
  }

  // Product API methods
  async getProducts(params?: any, p0?: number, p1?: { category: string | undefined; brand: string | undefined; priceRange: { min: number; max: number; } | undefined; rating: number | undefined; inStock?: boolean; isFeatured?: boolean; tags?: string[]; attributes?: Record<string, string>; }) {
    return this.get("/api/products", { params });
  }

  async getProductById(id: string) {
    return this.get(`/api/products/${id}`);
  }

  async searchProducts(query: string, params?: any) {
    return this.get("/api/products/search", {
      params: { q: query, ...params },
    });
  }

  async getFeaturedProducts(limit?: number) {
    return this.get("/api/products/featured", { params: { limit } });
  }

  async getProductsByCategory(categoryId: string, params?: any) {
    return this.get(`/api/products/category/${categoryId}`, { params });
  }

  async addProductRating(productId: string, rating: number, review?: string) {
    return this.post(`/api/products/${productId}/ratings`, { rating, review });
  }

  // Category API methods
  async getCategories() {
    return this.get("/api/categories");
  }

  async getCategoryById(id: string) {
    return this.get(`/api/categories/${id}`);
  }

  // Brand API methods
  async getBrands() {
    return this.get("/api/brands");
  }

  async getBrandById(id: string) {
    return this.get(`/api/brands/${id}`);
  }

  // Order API methods
  async createOrder(orderData: any) {
    return this.post("/api/orders", orderData);
  }

  async getOrders(params?: any) {
    return this.get("/api/orders", { params });
  }

  async getOrderById(id: string) {
    return this.get(`/api/orders/${id}`);
  }

  async updateOrder(id: string, orderData: any) {
    return this.put(`/api/orders/${id}`, orderData);
  }

  async cancelOrder(id: string) {
    return this.post(`/api/orders/${id}/cancel`);
  }

  // Payment API methods
  async createPaymentIntent(amount: number, currency: string) {
    return this.post("/api/payments/create-intent", { amount, currency });
  }

  async processPayment(paymentData: any) {
    return this.post("/api/payments/process", paymentData);
  }

  async getPaymentMethods() {
    return this.get("/api/payments/methods");
  }

  async addPaymentMethod(paymentMethodData: any) {
    return this.post("/api/payments/methods", paymentMethodData);
  }

  async deletePaymentMethod(id: string) {
    return this.delete(`/api/payments/methods/${id}`);
  }

  // Notification API methods
  async getNotifications(params?: any) {
    return this.get("/api/notifications", { params });
  }

  async markNotificationAsRead(id: string) {
    return this.patch(`/api/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.patch("/api/notifications/read-all");
  }

  async updateNotificationPreferences(preferences: any) {
    return this.put("/api/notifications/preferences", preferences);
  }

  // Analytics API methods
  async getAnalytics(params?: any) {
    return this.get("/api/analytics", { params });
  }

  async getDashboardStats() {
    return this.get("/api/analytics/dashboard");
  }

  async getRevenueStats(params?: any) {
    return this.get("/api/analytics/revenue", { params });
  }

  async getProductStats(params?: any) {
    return this.get("/api/analytics/products", { params });
  }

  // Health check
  async healthCheck() {
    return this.get("/health");
  }
}

export const apiService = new ApiService();
export default apiService;
