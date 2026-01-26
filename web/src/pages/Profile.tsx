import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, changePassword, deleteAccount, logout } from "../services/auth";

export function ProfilePage() {
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
      <div className="screen">
        <div className="loading">
          <div className="spinner" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link to="/library" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <h1 className="title">Profile Settings</h1>
        <div style={{ width: "80px" }} />
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: "var(--space-lg)" }}>
          {message.text}
        </div>
      )}

      {/* Account Information */}
      <div className="card" style={{ maxWidth: "600px", marginBottom: "var(--space-xl)" }}>
        <h2 className="subtitle" style={{ marginBottom: "var(--space-lg)" }}>Account Information</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="input"
              value={profileData?.email || ""}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              className="input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fr">Francais</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card" style={{ maxWidth: "600px", marginBottom: "var(--space-xl)" }}>
        <h2 className="subtitle" style={{ marginBottom: "var(--space-lg)" }}>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={passwordMutation.isPending}
          >
            {passwordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ maxWidth: "600px", marginBottom: "var(--space-xl)", borderColor: "var(--coral)" }}>
        <h2 className="subtitle" style={{ marginBottom: "var(--space-md)", color: "var(--coral)" }}>Danger Zone</h2>
        <p style={{ marginBottom: "var(--space-lg)", color: "var(--text-secondary)" }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDeleteAccount}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
        </button>
      </div>

      {/* Logout */}
      <div style={{ maxWidth: "600px" }}>
        <button type="button" className="btn btn-outline btn-block" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
