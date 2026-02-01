import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, changePassword, deleteAccount, logout } from "../services/auth";
import { usePageTitle } from "../hooks/usePageTitle";

export function ProfilePage() {
  usePageTitle("Profile");
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const result = await getProfile();
      if (!result.success) throw new Error(result.error);
      return result.user!;
    },
  });

  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState("en");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profileData) {
      setUsername(profileData.username);
      setLanguage(profileData.language);
    }
  }, [profileData]);

  const updateMutation = useMutation({
    mutationFn: (updates: { username?: string; language?: string }) => updateProfile(updates),
    onSuccess: (result) => {
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else {
        setMessage({ type: "error", text: result.error || "Update failed" });
      }
    },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ current, newPwd }: { current: string; newPwd: string }) =>
      changePassword(current, newPwd),
    onSuccess: (result) => {
      if (result.success) {
        setMessage({ type: "success", text: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: result.error || "Password change failed" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: (result) => {
      if (result.success) {
        logout();
      } else {
        setMessage({ type: "error", text: result.error || "Delete failed" });
      }
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    updateMutation.mutate({ username, language });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    passwordMutation.mutate({ current: currentPassword, newPwd: newPassword });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="w-6 h-6 border-3 border-gray-300 border-t-coral rounded-full animate-spin mr-3" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/library" className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors">
          ← Back
        </Link>
        <h1 className="font-title text-3xl">Profile Settings</h1>
        <div className="w-20" />
      </div>

      {message && (
        <div className={`mb-6 p-4 border-2 rounded-lg ${
          message.type === "success"
            ? "bg-green-50 border-green-500 text-green-700"
            : "bg-red-50 border-red-500 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mb-6">
        <h2 className="font-title text-xl mb-6">Account Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={profileData?.email || ""}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-2">Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
            >
              <option value="en">English</option>
              <option value="fr">Francais</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 bg-coral text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mb-6">
        <h2 className="font-title text-xl mb-6">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              required
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="px-6 py-3 bg-cyan text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
          >
            {passwordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border-2 border-coral rounded-xl p-6 neo-shadow-md mb-6">
        <h2 className="font-title text-xl mb-4 text-coral">Danger Zone</h2>
        <p className="text-gray-600 mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteMutation.isPending}
          className="px-6 py-3 bg-red-500 text-white font-title border-2 border-gray-900 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
        </button>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        className="w-full px-6 py-3 border-2 border-gray-900 rounded-lg font-title hover:bg-gray-100 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
