const API_URL = "/api";

export interface User {
  id: string;
  email: string;
  username: string;
  language: string;
  isPremium: boolean;
  createdAt: string;
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Login failed" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Registration failed" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore errors, redirect anyway
  }
  window.location.href = "/login";
}

export async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to get profile" };
    }

    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateProfile(
  updates: { username?: string; language?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to update profile" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to change password" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to delete account" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const result = await getProfile();
  return result.success;
}
