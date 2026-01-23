/**
 * Authentication Service
 * Handles authentication with the backend API
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  User,
  RegisterData,
  LoginData,
  UpdateProfileData,
  ChangePasswordData,
  AuthResponse,
} from "@/types/user";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const SESSION_STORAGE_KEY = "@membooks_session";

interface ApiErrorResponse {
  error: string;
}

interface ApiAuthResponse {
  user: User;
  token: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorResponse = result as ApiErrorResponse;
      return { success: false, error: errorResponse.error };
    }

    const authResponse = result as ApiAuthResponse;
    await saveSession(authResponse.token, authResponse.user);

    return {
      success: true,
      user: authResponse.user,
      token: authResponse.token,
    };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorResponse = result as ApiErrorResponse;
      return { success: false, error: errorResponse.error };
    }

    const authResponse = result as ApiAuthResponse;
    await saveSession(authResponse.token, authResponse.user);

    return {
      success: true,
      user: authResponse.user,
      token: authResponse.token,
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

/**
 * Get current user profile from API
 */
export async function getProfile(): Promise<AuthResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await logout();
      }
      const errorResponse = result as ApiErrorResponse;
      return { success: false, error: errorResponse.error };
    }

    const profileResponse = result as { user: User };
    await saveSession(session.token, profileResponse.user);

    return { success: true, user: profileResponse.user };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: UpdateProfileData
): Promise<AuthResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorResponse = result as ApiErrorResponse;
      return { success: false, error: errorResponse.error };
    }

    const profileResponse = result as { user: User };
    await saveSession(session.token, profileResponse.user);

    return { success: true, user: profileResponse.user };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  data: ChangePasswordData
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorResponse = result as ApiErrorResponse;
      return { success: false, error: errorResponse.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      const errorResponse = result as ApiErrorResponse;
      return { success: false, error: errorResponse.error };
    }

    // Clear session after successful deletion
    await logout();

    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Save session to storage
 */
async function saveSession(token: string, user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token, user })
    );
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<{
  token: string;
  user: User;
} | null> {
  try {
    const data = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading session:", error);
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
