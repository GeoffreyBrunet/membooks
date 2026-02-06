import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { resetPassword } from "@/services/auth";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { spacing, typography, borders, shadows } from "@/constants";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check if token is valid
  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.invalidContent}>
          <View
            style={[
              styles.invalidIcon,
              { backgroundColor: colors.error + "20" },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          </View>
          <Text style={[styles.invalidTitle, { color: colors.text }]}>
            {t("auth.resetPassword.invalidToken")}
          </Text>
          <Text
            style={[styles.invalidMessage, { color: colors.textSecondary }]}
          >
            {t("auth.resetPassword.invalidTokenMessage")}
          </Text>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                {t("auth.forgotPassword.button")}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setError(t("auth.errors.fillAllFields"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await resetPassword(token, password);

    setIsLoading(false);

    if (response.success) {
      setSuccess(true);
    } else {
      const errorKey = `auth.errors.${response.error}` as const;
      setError(t(errorKey as "auth.errors.generic") || t("auth.errors.generic"));
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            {t("auth.resetPassword.success")}
          </Text>
          <Text
            style={[styles.successMessage, { color: colors.textSecondary }]}
          >
            {t("auth.resetPassword.successMessage")}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                {t("auth.resetPassword.goToLogin")}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>Membooks</Text>
        </View>

        <View
          style={[
            styles.form,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t("auth.resetPassword.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("auth.resetPassword.subtitle")}
          </Text>

          {error && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: colors.error + "20",
                  borderColor: colors.error,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("auth.resetPassword.newPassword")}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.background,
                    borderColor:
                      focusedField === "password" ? colors.primary : colors.border,
                    color: colors.text,
                    shadowColor: colors.shadow,
                  },
                  focusedField === "password" && styles.inputFocused,
                ]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("auth.resetPassword.confirmPassword")}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.background,
                    borderColor:
                      focusedField === "confirmPassword" ? colors.primary : colors.border,
                    color: colors.text,
                    shadowColor: colors.shadow,
                  },
                  focusedField === "confirmPassword" && styles.inputFocused,
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
              },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                {t("auth.resetPassword.button")}
              </Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.link, { color: colors.primary }]}>
                  {t("auth.forgotPassword.backToLogin")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  logo: {
    ...typography.titleLarge,
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  form: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.xl,
  },
  title: {
    ...typography.titleSmall,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  input: {
    ...borders.input,
    padding: spacing.md,
    ...typography.body,
    ...shadows.sm,
  },
  inputFocused: {
    ...shadows.md,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  button: {
    ...borders.button,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  link: {
    ...typography.label,
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  successMessage: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing["2xl"],
    paddingHorizontal: spacing.lg,
  },
  invalidContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  invalidIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  invalidTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  invalidMessage: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing["2xl"],
    paddingHorizontal: spacing.lg,
  },
});
