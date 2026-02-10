import { getSession } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function registerPushToken(token: string, platform: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/notifications/register-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, platform }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Register push token error:", error);
    return { success: false, error: "network_error" };
  }
}

export async function removePushToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/notifications/token`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Remove push token error:", error);
    return { success: false, error: "network_error" };
  }
}
