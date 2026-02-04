const API_URL = "/api";

export interface SubscriptionStatus {
  isPremium: boolean;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export async function getSubscriptionStatus(): Promise<{
  success: boolean;
  data?: SubscriptionStatus;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/subscription/status`, {
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return { success: false, error: "Invalid response" };
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: "Not authenticated" };
      }
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function createCheckoutSession(): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/subscription/checkout`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: "Not authenticated" };
      }
      return { success: false, error: data.error };
    }

    return { success: true, url: data.url };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function cancelSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/subscription/cancel`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: "Not authenticated" };
      }
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function reactivateSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/subscription/reactivate`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: "Not authenticated" };
      }
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
