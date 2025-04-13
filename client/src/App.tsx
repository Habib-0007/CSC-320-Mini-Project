import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/theme-provider";
import ProtectedRoute from "./components/protected-route";
import { useToast } from "./components/ui/use-toast";
import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";

// Layouts
import MainLayout from "./layouts/main-layout";
import AuthLayout from "./layouts/auth-layout";

// Pages
import Dashboard from "./pages/dashboard";
import Editor from "./pages/editor";
import Projects from "./pages/projects";
import ProjectDetail from "./pages/project-detail";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import ForgotPassword from "./pages/auth/forgot-password";
import ResetPassword from "./pages/auth/reset-password";
import Settings from "./pages/settings";
import Pricing from "./pages/pricing";
import NotFound from "./pages/not-found";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route
                index
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="editor"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="pricing" element={<Pricing />} />
            </Route>
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="callback" element={<AuthCallback />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Component to handle OAuth callbacks
function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const accessToken = queryParams.get("accessToken");
  const refreshToken = queryParams.get("refreshToken");
  const auth = useAuth(); // Move the hook call outside the useEffect

  useEffect(() => {
    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Refresh user data
      auth
        .refreshUserData()
        .then(() => {
          toast({
            title: "Authentication Successful",
            description: "You have been successfully logged in.",
          });
          navigate("/");
        })
        .catch((error: any) => {
          console.error("Error refreshing user data:", error);
          toast({
            title: "Authentication Error",
            description:
              "There was a problem logging you in. Please try again.",
            variant: "destructive",
          });
          navigate("/auth/login");
        });
    } else {
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate with the provider.",
        variant: "destructive",
      });
      navigate("/auth/login");
    }
  }, [accessToken, refreshToken, navigate, toast, auth]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">
          Completing Authentication
        </h2>
        <p className="text-muted-foreground">
          Please wait while we log you in...
        </p>
      </div>
    </div>
  );
}

export default App;
