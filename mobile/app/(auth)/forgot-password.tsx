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
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { forgotPassword } from "@/services/auth";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { spacing, typography, borders, shadows } from "@/constants";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t("auth.errors.fillAllFields"));
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await forgotPassword(email.trim());

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
            <Ionicons name="mail-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            {t("auth.forgotPassword.success")}
          </Text>
          <Text
            style={[styles.successMessage, { color: colors.textSecondary }]}
          >
            {t("auth.forgotPassword.successMessage")}
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
                {t("auth.forgotPassword.backToLogin")}
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
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
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
            {t("auth.forgotPassword.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("auth.forgotPassword.subtitle")}
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
              {t("auth.email")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor:
                    focusedField === "email" ? colors.primary : colors.border,
                  color: colors.text,
                  shadowColor: colors.shadow,
                },
                focusedField === "email" && styles.inputFocused,
              ]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
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
                {t("auth.forgotPassword.button")}
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: spacing.sm,
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
});
