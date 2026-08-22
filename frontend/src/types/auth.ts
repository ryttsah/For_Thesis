export type UserRole = "officer" | "farmer" | "admin";

export type LoginTab = UserRole;

export interface DemoAccount {
  id: string;
  password: string;
  role: UserRole;
}

export interface LoginCredentials {
  id: string;
  password: string;
  role: UserRole;
}
