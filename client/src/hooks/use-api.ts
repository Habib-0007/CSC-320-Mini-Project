import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authAPI,
  userAPI,
  projectAPI,
  llmAPI,
  paymentAPI,
} from "../services/api";
import { useToast } from "../components/ui/use-toast";

// Auth hooks
export const useLogin = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.login(email, password).then((res) => res.data),
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Failed to login",
        variant: "destructive",
      });
    },
  });
};

export const useRegister = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      username: string;
      password: string;
    }) => authAPI.register(data).then((res) => res.data),
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Failed to register",
        variant: "destructive",
      });
    },
  });
};

// User hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userAPI.getCurrentUser().then((res) => res.data.user),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      username?: string;
      bio?: string;
      avatar?: string;
    }) => userAPI.updateProfile(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description:
          error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
};

// Project hooks
export const useProjects = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectAPI.getAllProjects(params).then((res) => res.data),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () =>
      projectAPI.getProjectById(id).then((res) => res.data.project),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!id,
  });
};

export const useProjectSnippets = (
  projectId: string,
  params?: { page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: ["projectSnippets", projectId, params],
    queryFn: () =>
      projectAPI.getProjectSnippets(projectId, params).then((res) => res.data),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!projectId,
  });
};

export const useCreateSnippet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: {
        title: string;
        code: string;
        language: string;
        description?: string;
      };
    }) => projectAPI.createSnippet(projectId, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projectSnippets", variables.projectId],
      });
      toast({
        title: "Snippet Created",
        description: "Your code snippet has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description:
          error.response?.data?.message || "Failed to create snippet",
        variant: "destructive",
      });
    },
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      language?: string;
      framework?: string;
    }) => projectAPI.createProject(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project Created",
        description: "Your project has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description:
          error.response?.data?.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });
};

// LLM hooks
export const useGenerateCode = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      prompt: string;
      provider: string;
      language?: string;
      framework?: string;
      parameters?: Record<string, any>;
    }) => llmAPI.generateCode(data).then((res) => res.data),
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.response?.data?.message || "Failed to generate code",
        variant: "destructive",
      });
    },
  });
};

// Payment hooks
export const useSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => paymentAPI.getSubscriptionStatus().then((res) => res.data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (plan: string) =>
      paymentAPI.createSubscription(plan).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Redirect to the payment URL
      window.open(data.paymentUrl, "_blank");

      toast({
        title: "Subscription Initiated",
        description: "Please complete the payment process",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description:
          error.response?.data?.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });
};

// User usage hooks
export const useUserUsage = () => {
  return useQuery({
    queryKey: ["userUsage"],
    queryFn: () => userAPI.getUserUsage().then((res) => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// API Keys hooks
export const useApiKeys = () => {
  return useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => userAPI.getApiKeys().then((res) => res.data.apiKeys),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (name: string) =>
      userAPI.createApiKey(name).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast({
        title: "API Key Created",
        description: "Your API key has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description:
          error.response?.data?.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      userAPI.deleteApiKey(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast({
        title: "API Key Deleted",
        description: "Your API key has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description:
          error.response?.data?.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });
};
