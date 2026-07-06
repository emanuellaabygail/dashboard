import { httpClient } from "@/api/http-client";
import type {
  AuthUser,
  LoginCredentials,
  SignUpCredentials
} from "@/features/authentication/types";

interface CsrfTokenResponse {
  csrfToken: string;
}

export class AuthenticationService {
  async initializeCsrf(): Promise<void> {
    await httpClient.get<CsrfTokenResponse>("/auth/csrf/");
  }

  async getCurrentUser(): Promise<AuthUser> {
    await this.initializeCsrf();
    const response = await httpClient.get<AuthUser>("/auth/me/");
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    await this.initializeCsrf();
    const response = await httpClient.post<AuthUser>("/auth/login/", credentials);
    return response.data;
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthUser> {
    await this.initializeCsrf();
    const response = await httpClient.post<AuthUser>("/auth/signup/", credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.initializeCsrf();
    await httpClient.post("/auth/logout/");
  }
}

export const authenticationService = new AuthenticationService();
