import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { create } from "zustand";
import { authAPI } from "../services/api";
// import { useToast } from "../components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  plan: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
}

// Create a Zustand store for auth state
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { accessToken, refreshToken, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
  register: async (data) => {
    try {
      const response = await authAPI.register(data);
      const { accessToken, refreshToken, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  logout: async () => {
    try {
      await authAPI.logout();

      // Remove tokens from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Logout error:", error);

      // Even if the API call fails, we should still clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      set({ user: null, isAuthenticated: false });
    }
  },
  forgotPassword: async (email) => {
    try {
      await authAPI.forgotPassword(email);
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },
  resetPassword: async (token, password) => {
    try {
      await authAPI.resetPassword(token, password);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },
  refreshUserData: async () => {
    try {
      const response = await authAPI.getCurrentUser();
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.data.user;
    } catch (error) {
      console.error("Refresh user data error:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error; // Re-throw the error so it can be caught by the caller
    }
  },
}));

// Hook for components to use auth state
export const useAuth = () => {
  const authState = useAuthStore();
  // const navigate = useNavigate();
  // const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");

      if (token) {
        try {
          // Try to get current user with the token
          const response = await authAPI.getCurrentUser();
          useAuthStore.setState({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Auth check error:", error);
          // If token is invalid but we have a refresh token, try to refresh
          if (refreshToken) {
            try {
              const refreshResponse = await authAPI.refreshToken(refreshToken);
              localStorage.setItem("token", refreshResponse.data.accessToken);

              // Try again with the new token
              try {
                const userResponse = await authAPI.getCurrentUser();
                useAuthStore.setState({
                  user: userResponse.data.user,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } catch (secondError) {
                console.error("Second auth check error:", secondError);
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                useAuthStore.setState({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            } catch (refreshError) {
              console.error("Token refresh error:", refreshError);
              // If refresh fails, clear everything
              localStorage.removeItem("token");
              localStorage.removeItem("refreshToken");
              useAuthStore.setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
            // No refresh token, clear everything
            localStorage.removeItem("token");
            useAuthStore.setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } else {
        useAuthStore.setState({ isLoading: false });
      }
    };

    checkAuth();
  }, []);

  return authState;
};
