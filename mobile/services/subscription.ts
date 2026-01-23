/**
 * Subscription Service
 * Handles premium subscription management
 */

import { getSession } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface SubscriptionStatus {
  isPremium: boolean;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface CheckoutResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface ActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Create a checkout session for premium subscription
 */
export async function createCheckoutSession(): Promise<CheckoutResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/subscription/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, url: result.url };
  } catch (error) {
    console.error("Checkout session error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<{
  success: boolean;
  data?: SubscriptionStatus;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/subscription/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Get subscription status error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Cancel subscription (will remain active until end of billing period)
 */
export async function cancelSubscription(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/subscription/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error: "network_error" };
  }
}

/**
 * Reactivate a canceled subscription (if still within billing period)
 */
export async function reactivateSubscription(): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "not_authenticated" };
    }

    const response = await fetch(`${API_URL}/subscription/reactivate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Reactivate subscription error:", error);
    return { success: false, error: "network_error" };
  }
}
