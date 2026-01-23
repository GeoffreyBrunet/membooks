/**
 * Profile Screen
 * View and edit user profile, change language, theme, password, delete account
 */

import { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { LanguageContext } from "@/contexts/language-context";
import { useTheme } from "@/hooks/use-theme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { updateProfile } from "@/services/auth";
import { ChangePasswordForm } from "@/components/change-password-form";
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  type Colors,
} from "@/constants";
import type { Language } from "@/locales";
import type { ThemeMode } from "@/contexts/theme-context";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

const THEMES: {
  mode: ThemeMode;
  labelKey: "settings.themeSystem" | "settings.themeLight" | "settings.themeDark";
}[] = [
  { mode: "system", labelKey: "settings.themeSystem" },
  { mode: "light", labelKey: "settings.themeLight" },
  { mode: "dark", labelKey: "settings.themeDark" },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user, logout, deleteAccount, refreshProfile } = useAuth();
  const languageContext = useContext(LanguageContext);
  const { themeMode, setThemeMode } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 3) {
      setError(t("auth.errors.usernameTooShort"));
      return;
    }

    setIsSaving(true);
    setError(null);

    const response = await updateProfile({ username: username.trim() });

    setIsSaving(false);

    if (response.success) {
      await refreshProfile();
      setIsEditing(false);
    } else {
      setError(
        t(`auth.errors.${response.error}`) || t("auth.errors.generic")
      );
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || "");
    setError(null);
    setIsEditing(false);
  };

  const handleLanguageChange = async (lang: Language) => {
    if (languageContext) {
      await languageContext.setLanguage(lang);
      // Also update on backend
      await updateProfile({ language: lang });
      await refreshProfile();
    }
  };

  const handleLogout = () => {
    Alert.alert(t("settings.logoutTitle"), t("settings.logoutMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccountTitle"),
      t("settings.deleteAccountMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) {
              router.replace("/(auth)/login");
            } else {
              Alert.alert(t("common.error"), t("auth.errors.generic"));
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{t("common.back")}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Avatar placeholder */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          {user?.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
          {/* Subscription button */}
          <Pressable
            style={[
              styles.subscriptionButton,
              user?.isPremium ? styles.subscriptionButtonPremium : styles.subscriptionButtonFree,
            ]}
            onPress={() => router.push("/subscription")}
          >
            <Text
              style={[
                styles.subscriptionButtonText,
                user?.isPremium ? styles.subscriptionButtonTextPremium : styles.subscriptionButtonTextFree,
              ]}
            >
              {user?.isPremium
                ? t("subscription.manageSubscription")
                : t("subscription.premiumInactive")}
            </Text>
          </Pressable>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* User info card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("profile.personalInfo")}</Text>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>{t("auth.username")}</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={t("auth.usernamePlaceholder")}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : (
              <Text style={styles.value}>{user?.username}</Text>
            )}
          </View>

          {/* Email (read-only) */}
          <View style={styles.field}>
            <Text style={styles.label}>{t("auth.email")}</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          {/* Edit/Save buttons */}
          {isEditing ? (
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.primaryText} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t("common.save")}</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>{t("common.edit")}</Text>
            </Pressable>
          )}
        </View>

        {/* Language settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
          <View style={styles.optionRow}>
            {LANGUAGES.map((lang) => {
              const isActive = languageContext?.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.option,
                    isActive && styles.optionActive,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive && styles.optionTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Theme settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("settings.theme")}</Text>
          <View style={styles.optionRow}>
            {THEMES.map((theme) => {
              const isActive = themeMode === theme.mode;
              return (
                <Pressable
                  key={theme.mode}
                  style={[
                    styles.option,
                    isActive && styles.optionActive,
                  ]}
                  onPress={() => handleThemeChange(theme.mode)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive && styles.optionTextActive,
                    ]}
                  >
                    {t(theme.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Security settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("settings.security")}</Text>
          {showPasswordForm ? (
            <ChangePasswordForm
              onSuccess={() => setShowPasswordForm(false)}
              onCancel={() => setShowPasswordForm(false)}
            />
          ) : (
            <Pressable
              style={[styles.button, styles.editButton]}
              onPress={() => setShowPasswordForm(true)}
            >
              <Text style={styles.editButtonText}>
                {t("settings.changePassword")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Danger zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerSectionTitle}>
            {t("settings.dangerZone")}
          </Text>
          <Pressable
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteAccountText}>
              {t("settings.deleteAccount")}
            </Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t("settings.logout")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.sm,
    },
    backText: {
      ...typography.button,
      color: colors.primary,
    },
    headerTitle: {
      ...typography.titleSmall,
      color: colors.text,
    },
    headerSpacer: {
      width: 60,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: spacing.md,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.md,
    },
    avatarText: {
      fontSize: 42,
      fontWeight: "bold",
      color: colors.primaryText,
    },
    premiumBadge: {
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.accent1,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: colors.border,
    },
    premiumText: {
      ...typography.labelSmall,
      fontWeight: "bold",
      color: colors.text,
    },
    subscriptionButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
    },
    subscriptionButtonFree: {
      backgroundColor: colors.primary,
    },
    subscriptionButtonPremium: {
      backgroundColor: colors.backgroundSecondary,
    },
    subscriptionButtonText: {
      ...typography.button,
    },
    subscriptionButtonTextFree: {
      color: colors.primaryText,
    },
    subscriptionButtonTextPremium: {
      color: colors.text,
    },
    errorContainer: {
      backgroundColor: colors.error + "20",
      borderWidth: 2,
      borderColor: colors.error,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      padding: spacing.lg,
      ...shadows.sm,
    },
    dangerCard: {
      backgroundColor: colors.error + "10",
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.error,
      padding: spacing.lg,
      ...shadows.sm,
    },
    sectionTitle: {
      ...typography.titleSmall,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    dangerSectionTitle: {
      ...typography.titleSmall,
      color: colors.error,
      marginBottom: spacing.lg,
    },
    field: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.labelSmall,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    value: {
      ...typography.body,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    button: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      alignItems: "center",
    },
    editButton: {
      backgroundColor: colors.secondary,
      borderColor: colors.border,
    },
    editButtonText: {
      ...typography.button,
      color: colors.secondaryText,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderColor: colors.border,
    },
    saveButtonText: {
      ...typography.button,
      color: colors.primaryText,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    cancelButtonText: {
      ...typography.button,
      color: colors.text,
    },
    optionRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    option: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    optionActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.border,
    },
    optionText: {
      ...typography.button,
      color: colors.textSecondary,
    },
    optionTextActive: {
      color: colors.text,
      fontWeight: "bold",
    },
    deleteAccountButton: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.error,
      backgroundColor: colors.background,
      alignItems: "center",
    },
    deleteAccountText: {
      ...typography.button,
      color: colors.error,
    },
    logoutButton: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.error,
      alignItems: "center",
      marginTop: spacing.md,
    },
    logoutText: {
      ...typography.button,
      color: colors.textInverse,
    },
  });
}
