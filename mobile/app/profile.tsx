/**
 * Profile Screen
 * View and edit user profile, change language, logout
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { LanguageContext } from "@/contexts/language-context";
import { useContext } from "react";
import { updateProfile } from "@/services/auth";
import {
  lightColors,
  darkColors,
  spacing,
  typography,
  borderRadius,
  borders,
  shadows,
} from "@/constants";
import type { Language } from "@/locales";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user, logout, refreshProfile } = useAuth();
  const languageContext = useContext(LanguageContext);

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <View style={styles.languageOptions}>
            {LANGUAGES.map((lang) => {
              const isActive = languageContext?.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    isActive && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      isActive && styles.languageTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t("settings.logout")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: typeof lightColors) {
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
    sectionTitle: {
      ...typography.titleSmall,
      color: colors.text,
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
    languageOptions: {
      flexDirection: "row",
      gap: spacing.md,
    },
    languageOption: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    languageOptionActive: {
      backgroundColor: colors.accent1,
      borderColor: colors.border,
    },
    languageText: {
      ...typography.button,
      color: colors.textSecondary,
    },
    languageTextActive: {
      color: colors.text,
      fontWeight: "bold",
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
