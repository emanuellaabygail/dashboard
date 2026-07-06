import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authenticationService } from "@/features/authentication/services/authentication-service";
import type {
  AuthUser,
  LoginCredentials,
  SignUpCredentials
} from "@/features/authentication/types";

export const authQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: () => authenticationService.getCurrentUser(),
    retry: false
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authenticationService.login(credentials),
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(authQueryKey, user);
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: authQueryKey });
    }
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: SignUpCredentials) => authenticationService.signUp(credentials),
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(authQueryKey, user);
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: authQueryKey });
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authenticationService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null);
      queryClient.removeQueries({ queryKey: authQueryKey });
    }
  });
}
