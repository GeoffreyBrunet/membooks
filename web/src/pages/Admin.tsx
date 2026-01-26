import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminStats,
  getAdminUsers,
  getAdminUser,
  toggleUserPremium,
  getAdminSubscriptions,
  type AdminUser,
  type AdminSubscription,
} from "../services/admin";

export function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"users" | "subscriptions">("users");
  const [usersPage, setUsersPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<{
    user: AdminUser;
    subscription?: AdminSubscription;
  } | null>(null);

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", usersPage],
    queryFn: () => getAdminUsers(usersPage),
  });

  // Subscriptions
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["admin", "subscriptions", subsPage],
    queryFn: () => getAdminSubscriptions(subsPage),
    enabled: activeTab === "subscriptions",
  });

  // User details
  const userDetailsMutation = useMutation({
    mutationFn: (userId: string) => getAdminUser(userId),
    onSuccess: (data) => setSelectedUser(data),
  });

  // Toggle premium
  const togglePremiumMutation = useMutation({
    mutationFn: ({ userId, isPremium }: { userId: string; isPremium: boolean }) =>
      toggleUserPremium(userId, isPremium),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setSelectedUser(null);
    },
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link to="/library" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <h1 className="title">Admin Dashboard</h1>
        <div style={{ width: "80px" }} />
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "var(--space-xl)" }}>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalUsers ?? "-"}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{stats?.premiumUsers ?? "-"}</div>
          <div className="stat-label">Premium Users</div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            {stats?.conversionRate}% conversion
          </div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-value">{stats?.activeSubscriptions ?? "-"}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "var(--space-lg)" }}>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === "subscriptions" ? "active" : ""}`}
          onClick={() => setActiveTab("subscriptions")}
        >
          Subscriptions
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="card">
          {usersLoading ? (
            <div className="loading">
              <div className="spinner" />
              Loading users...
            </div>
          ) : usersData?.users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Language</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData?.users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 600 }}>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.isPremium ? "badge-purple" : "badge-outline"}`}>
                            {user.isPremium ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td>{user.language?.toUpperCase() || "-"}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => userDetailsMutation.mutate(user.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {usersData?.pagination && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "2px solid var(--border-color)" }}>
                  <div style={{ color: "var(--text-secondary)" }}>
                    Page {usersData.pagination.page} of {usersData.pagination.totalPages} ({usersData.pagination.total} users)
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={usersData.pagination.page <= 1}
                      onClick={() => setUsersPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={usersData.pagination.page >= usersData.pagination.totalPages}
                      onClick={() => setUsersPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="card">
          {subsLoading ? (
            <div className="loading">
              <div className="spinner" />
              Loading subscriptions...
            </div>
          ) : subsData?.subscriptions.length === 0 ? (
            <div className="empty-state">
              <p>No subscriptions found</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Period End</th>
                      <th>Cancel at End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsData?.subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.username || "-"}</td>
                        <td>{sub.userEmail || "-"}</td>
                        <td>
                          <span className={`badge ${sub.status === "active" ? "badge-cyan" : sub.status === "canceled" ? "badge-coral" : "badge-yellow"}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>{formatDate(sub.currentPeriodEnd)}</td>
                        <td>{sub.cancelAtPeriodEnd ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {subsData?.pagination && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "2px solid var(--border-color)" }}>
                  <div style={{ color: "var(--text-secondary)" }}>
                    Page {subsData.pagination.page} of {subsData.pagination.totalPages} ({subsData.pagination.total} subscriptions)
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={subsData.pagination.page <= 1}
                      onClick={() => setSubsPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={subsData.pagination.page >= subsData.pagination.totalPages}
                      onClick={() => setSubsPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* User Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="subtitle" style={{ marginBottom: "var(--space-lg)" }}>User Details</h2>

            <div style={{ marginBottom: "var(--space-lg)" }}>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>Username:</strong> {selectedUser.user.username}
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>Email:</strong> {selectedUser.user.email}
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>Status:</strong>{" "}
                <span className={`badge ${selectedUser.user.isPremium ? "badge-purple" : "badge-outline"}`}>
                  {selectedUser.user.isPremium ? "Premium" : "Free"}
                </span>
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>Language:</strong> {selectedUser.user.language?.toUpperCase() || "-"}
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>Stripe Customer:</strong> {selectedUser.user.stripeCustomerId || "None"}
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <strong>Joined:</strong> {formatDate(selectedUser.user.createdAt)}
              </div>

              {selectedUser.subscription && (
                <>
                  <div style={{ margin: "var(--space-lg) 0", borderTop: "2px solid var(--border-color)" }} />
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <strong>Subscription Status:</strong>{" "}
                    <span className={`badge ${selectedUser.subscription.status === "active" ? "badge-cyan" : "badge-coral"}`}>
                      {selectedUser.subscription.status}
                    </span>
                  </div>
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <strong>Period End:</strong> {formatDate(selectedUser.subscription.currentPeriodEnd)}
                  </div>
                  <div>
                    <strong>Cancel at End:</strong> {selectedUser.subscription.cancelAtPeriodEnd ? "Yes" : "No"}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              <button className="btn btn-outline" onClick={() => setSelectedUser(null)}>
                Close
              </button>
              <button
                className={`btn ${selectedUser.user.isPremium ? "btn-danger" : "btn-secondary"}`}
                onClick={() =>
                  togglePremiumMutation.mutate({
                    userId: selectedUser.user.id,
                    isPremium: !selectedUser.user.isPremium,
                  })
                }
                disabled={togglePremiumMutation.isPending}
              >
                {selectedUser.user.isPremium ? "Remove Premium" : "Grant Premium"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
