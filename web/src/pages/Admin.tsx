import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
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
  usePageTitle("Admin");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"users" | "subscriptions">("users");
  const [usersPage, setUsersPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<{
    user: AdminUser;
    subscription?: AdminSubscription;
  } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", usersPage],
    queryFn: () => getAdminUsers(usersPage),
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["admin", "subscriptions", subsPage],
    queryFn: () => getAdminSubscriptions(subsPage),
    enabled: activeTab === "subscriptions",
  });

  const userDetailsMutation = useMutation({
    mutationFn: (userId: string) => getAdminUser(userId),
    onSuccess: (data) => setSelectedUser(data),
  });

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/library" className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors">
          ← Back
        </Link>
        <h1 className="font-title text-3xl">Admin Dashboard</h1>
        <div className="w-20" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border-2 border-gray-900 rounded-xl p-6 text-center neo-shadow-md">
          <div className="font-title text-4xl mb-2">{stats?.totalUsers ?? "-"}</div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="bg-purple text-white border-2 border-gray-900 rounded-xl p-6 text-center neo-shadow-md">
          <div className="font-title text-4xl mb-2">{stats?.premiumUsers ?? "-"}</div>
          <div>Premium Users</div>
          <div className="text-sm opacity-80 mt-1">{stats?.conversionRate}% conversion</div>
        </div>
        <div className="bg-cyan border-2 border-gray-900 rounded-xl p-6 text-center neo-shadow-md">
          <div className="font-title text-4xl mb-2">{stats?.activeSubscriptions ?? "-"}</div>
          <div className="text-gray-800">Active Subscriptions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 font-title text-sm border-b-2 -mb-0.5 transition-colors ${
            activeTab === "users" ? "border-coral text-coral" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-6 py-3 font-title text-sm border-b-2 -mb-0.5 transition-colors ${
            activeTab === "subscriptions" ? "border-coral text-coral" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Subscriptions
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white border-2 border-gray-900 rounded-xl neo-shadow-md overflow-hidden">
          {usersLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <div className="w-6 h-6 border-3 border-gray-300 border-t-coral rounded-full animate-spin mr-3" />
              Loading users...
            </div>
          ) : usersData?.users.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Username</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Email</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Status</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Language</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Joined</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData?.users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{user.username}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${user.isPremium ? "bg-purple text-white" : "border border-gray-300"}`}>
                            {user.isPremium ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{user.language?.toUpperCase() || "-"}</td>
                        <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => userDetailsMutation.mutate(user.id)}
                            className="px-3 py-1.5 bg-coral text-gray-900 font-title text-xs border-2 border-gray-900 rounded-lg hover:translate-y-0.5 transition-all"
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
                <div className="flex justify-between items-center p-4 border-t-2 border-gray-200">
                  <span className="text-sm text-gray-600">
                    Page {usersData.pagination.page} of {usersData.pagination.totalPages} ({usersData.pagination.total} users)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={usersData.pagination.page <= 1}
                      onClick={() => setUsersPage((p) => p - 1)}
                      className="px-3 py-1.5 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      disabled={usersData.pagination.page >= usersData.pagination.totalPages}
                      onClick={() => setUsersPage((p) => p + 1)}
                      className="px-3 py-1.5 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white border-2 border-gray-900 rounded-xl neo-shadow-md overflow-hidden">
          {subsLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <div className="w-6 h-6 border-3 border-gray-300 border-t-coral rounded-full animate-spin mr-3" />
              Loading subscriptions...
            </div>
          ) : subsData?.subscriptions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No subscriptions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">User</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Email</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Status</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Period End</th>
                      <th className="px-4 py-3 text-left font-title text-gray-600 uppercase text-xs">Cancel at End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsData?.subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{sub.username || "-"}</td>
                        <td className="px-4 py-3">{sub.userEmail || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            sub.status === "active" ? "bg-cyan" : sub.status === "canceled" ? "bg-coral" : "bg-yellow"
                          } text-gray-900`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDate(sub.currentPeriodEnd)}</td>
                        <td className="px-4 py-3">{sub.cancelAtPeriodEnd ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {subsData?.pagination && (
                <div className="flex justify-between items-center p-4 border-t-2 border-gray-200">
                  <span className="text-sm text-gray-600">
                    Page {subsData.pagination.page} of {subsData.pagination.totalPages} ({subsData.pagination.total} subscriptions)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={subsData.pagination.page <= 1}
                      onClick={() => setSubsPage((p) => p - 1)}
                      className="px-3 py-1.5 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      disabled={subsData.pagination.page >= subsData.pagination.totalPages}
                      onClick={() => setSubsPage((p) => p + 1)}
                      className="px-3 py-1.5 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" onClick={() => setSelectedUser(null)}>
          <div className="bg-white border-2 border-gray-900 rounded-xl p-6 max-w-md w-full neo-shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-title text-xl mb-6">User Details</h2>

            <div className="space-y-3 mb-6">
              <div><strong>Username:</strong> {selectedUser.user.username}</div>
              <div><strong>Email:</strong> {selectedUser.user.email}</div>
              <div>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-1 text-xs rounded-full ${selectedUser.user.isPremium ? "bg-purple text-white" : "border border-gray-300"}`}>
                  {selectedUser.user.isPremium ? "Premium" : "Free"}
                </span>
              </div>
              <div><strong>Language:</strong> {selectedUser.user.language?.toUpperCase() || "-"}</div>
              <div><strong>Stripe Customer:</strong> {selectedUser.user.stripeCustomerId || "None"}</div>
              <div><strong>Joined:</strong> {formatDate(selectedUser.user.createdAt)}</div>

              {selectedUser.subscription && (
                <>
                  <div className="border-t-2 border-gray-200 my-4" />
                  <div>
                    <strong>Subscription Status:</strong>{" "}
                    <span className={`px-2 py-1 text-xs rounded-full ${selectedUser.subscription.status === "active" ? "bg-cyan" : "bg-coral"} text-gray-900`}>
                      {selectedUser.subscription.status}
                    </span>
                  </div>
                  <div><strong>Period End:</strong> {formatDate(selectedUser.subscription.currentPeriodEnd)}</div>
                  <div><strong>Cancel at End:</strong> {selectedUser.subscription.cancelAtPeriodEnd ? "Yes" : "No"}</div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() =>
                  togglePremiumMutation.mutate({
                    userId: selectedUser.user.id,
                    isPremium: !selectedUser.user.isPremium,
                  })
                }
                disabled={togglePremiumMutation.isPending}
                className={`px-4 py-2 font-title text-sm border-2 border-gray-900 rounded-lg transition-all disabled:opacity-50 ${
                  selectedUser.user.isPremium ? "bg-red-500 text-white hover:bg-red-600" : "bg-cyan hover:translate-y-0.5"
                }`}
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
