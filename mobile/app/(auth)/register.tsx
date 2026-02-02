import { useState, useContext } from "react";
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
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { LanguageContext } from "@/contexts/language-context";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { spacing, typography, borders, shadows } from "@/constants";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const languageContext = useContext(LanguageContext);
  const colors = useThemeColors();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError(t("auth.errors.fillAllFields"));
      return;
    }

    if (username.trim().length < 3) {
      setError(t("auth.errors.usernameTooShort"));
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

    const response = await register({
      username: username.trim(),
      email: email.trim(),
      password,
      language: languageContext?.language || "en",
    });

    setIsLoading(false);

    if (!response.success) {
      setError(t(`auth.errors.${response.error}`) || t("auth.errors.generic"));
    }
  };

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
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("auth.register.subtitle")}
          </Text>
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
              {t("auth.username")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: focusedField === "username" ? colors.primary : colors.border,
                  color: colors.text,
                  shadowColor: colors.shadow,
                },
                focusedField === "username" && styles.inputFocused,
              ]}
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              placeholder={t("auth.usernamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("auth.email")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: focusedField === "email" ? colors.primary : colors.border,
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("auth.password")}
            </Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: focusedField === "password" ? colors.primary : colors.border,
                  shadowColor: colors.shadow,
                },
                focusedField === "password" && styles.inputFocused,
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder={t("auth.passwordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                textContentType="oneTimeCode"
                autoComplete="off"
                editable={!isLoading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("auth.confirmPassword")}
            </Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: focusedField === "confirmPassword" ? colors.primary : colors.border,
                  shadowColor: colors.shadow,
                },
                focusedField === "confirmPassword" && styles.inputFocused,
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                textContentType="oneTimeCode"
                autoComplete="off"
                editable={!isLoading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
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
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                {t("auth.register.button")}
              </Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t("auth.register.hasAccount")}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.link, { color: colors.primary }]}>
                  {t("auth.register.loginLink")}
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
  subtitle: {
    ...typography.body,
  },
  form: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.xl,
  },
  errorContainer: {
    borderWidth: 2,
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
    flexDirection: "row",
    alignItems: "center",
    ...borders.input,
    ...shadows.sm,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    ...typography.body,
  },
  eyeButton: {
    padding: spacing.md,
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.bodySmall,
  },
  link: {
    ...typography.label,
  },
});
