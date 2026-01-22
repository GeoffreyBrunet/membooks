/**
 * User Types
 */

export interface User {
  id: string;
  username: string;
  email: string;
  language: string;
  isPremium: boolean;
  createdAt: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  language?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  language?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}
