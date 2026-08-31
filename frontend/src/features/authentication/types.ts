export type UserRole = "superadmin" | "project_admin" | "user";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpCredentials {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}
