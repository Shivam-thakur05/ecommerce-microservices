import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthTokens, AuthState } from "../types";
import apiService from "../services/api.ts";

interface AuthStore extends AuthState {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string, rememberMe?: boolean) => {
        set({ isLoading: true });
        try {
          const response = await apiService.login(email, password, rememberMe);
          const { data } = response as any;
          set({
            user: data.user,
            tokens: data.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await apiService.register(userData);
          const { data } = response as any;
          set({
            user: data.user,
            tokens: data.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiService.logout();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          // Even if logout fails, clear local state
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await apiService.getCurrentUser();
          const { data } = response as any;
          set({
            user: data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          // If getting current user fails, user might not be authenticated
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      updateProfile: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await apiService.updateProfile(userData);
          const { data } = response as any;
          set({
            user: data,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          await apiService.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
      },

      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
