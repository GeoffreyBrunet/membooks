import { getSession } from "./auth";

const API_URL = "/api";

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  activeSubscriptions: number;
  conversionRate: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  language: string;
  isPremium: boolean;
  stripeCustomerId: string | null;
  createdAt: string;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const session = getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }

  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  return adminFetch<AdminStats>("/admin/stats");
}

export async function getAdminUsers(
  page: number = 1,
  limit: number = 10
): Promise<{ users: AdminUser[]; pagination: PaginatedResponse<AdminUser>["pagination"] }> {
  return adminFetch(`/admin/users?page=${page}&limit=${limit}`);
}

export async function getAdminUser(
  userId: string
): Promise<{ user: AdminUser; subscription?: AdminSubscription }> {
  return adminFetch(`/admin/users/${userId}`);
}

export async function toggleUserPremium(
  userId: string,
  isPremium: boolean
): Promise<{ success: boolean }> {
  return adminFetch(`/admin/users/${userId}/premium`, {
    method: "POST",
    body: JSON.stringify({ isPremium }),
  });
}

export async function getAdminSubscriptions(
  page: number = 1,
  limit: number = 10
): Promise<{ subscriptions: AdminSubscription[]; pagination: PaginatedResponse<AdminSubscription>["pagination"] }> {
  return adminFetch(`/admin/subscriptions?page=${page}&limit=${limit}`);
}
