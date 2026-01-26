const API_URL = "/api";
const SESSION_KEY = "membooks_session";

export interface User {
  id: string;
  email: string;
  username: string;
  language: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  email: string;
  user?: User;
}

export function getSession(): Session | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Login failed" };
    }

    setSession({ token: data.token, email });
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
      body: JSON.stringify({ email, username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Registration failed" };
    }

    setSession({ token: data.token, email });
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export function logout(): void {
  clearSession();
  window.location.href = "/login";
}

export async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
  const session = getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }
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
  const session = getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
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
  const session = getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
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
  const session = getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_URL}/auth/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to delete account" };
    }

    clearSession();
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
