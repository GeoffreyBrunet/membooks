/**
 * ChangePasswordForm Component
 * Form for changing user password with validation
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { changePassword } from "@/services/auth";
import {
  spacing,
  typography,
  borderRadius,
  type Colors,
} from "@/constants";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function ChangePasswordForm({
  onSuccess,
  onCancel,
}: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("auth.errors.fillAllFields"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
      return;
    }

    setIsLoading(true);

    const response = await changePassword({
      currentPassword,
      newPassword,
    });

    setIsLoading(false);

    if (response.success) {
      Alert.alert(
        t("settings.passwordChangedTitle"),
        t("settings.passwordChangedMessage"),
        [
          {
            text: "OK",
            onPress: () => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              onSuccess?.();
            },
          },
        ]
      );
    } else {
      setError(
        t(`auth.errors.${response.error}`) || t("auth.errors.generic")
      );
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>{t("settings.currentPassword")}</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder={t("settings.currentPassword")}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("settings.newPassword")}</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t("settings.newPassword")}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("settings.confirmNewPassword")}</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t("settings.confirmNewPassword")}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: spacing.md,
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
    field: {
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.labelSmall,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
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
      marginTop: spacing.sm,
    },
    button: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      alignItems: "center",
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
  });
}
