/**
 * Subscription Page
 * Premium subscription management
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuth } from "@/contexts/auth-context";
import {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
} from "@/services/subscription";
import { spacing, typography, borders, shadows } from "@/constants";

const PREMIUM_PRICE = "5";
const PREMIUM_CURRENCY = "€";

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const loadSubscriptionStatus = useCallback(async () => {
    const result = await getSubscriptionStatus();
    if (result.success && result.data) {
      setSubscription(result.data.subscription);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const handleSubscribe = async () => {
    setIsActionLoading(true);

    const result = await createCheckoutSession();

    if (result.success && result.url) {
      // Open Stripe Checkout in browser
      const browserResult = await WebBrowser.openBrowserAsync(result.url);

      // Refresh status when browser closes
      if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
        await loadSubscriptionStatus();
        await refreshProfile();
      }
    } else {
      Alert.alert(t("common.error"), t(`subscription.errors.${result.error}`) || t("common.error"));
    }

    setIsActionLoading(false);
  };

  const handleCancel = async () => {
    Alert.alert(
      t("subscription.cancelTitle"),
      t("subscription.cancelMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("subscription.confirmCancel"),
          style: "destructive",
          onPress: async () => {
            setIsActionLoading(true);
            const result = await cancelSubscription();

            if (result.success) {
              await loadSubscriptionStatus();
              await refreshProfile();
            } else {
              Alert.alert(t("common.error"), t("common.error"));
            }
            setIsActionLoading(false);
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    setIsActionLoading(true);

    const result = await reactivateSubscription();

    if (result.success) {
      await loadSubscriptionStatus();
      await refreshProfile();
    } else {
      Alert.alert(t("common.error"), t("common.error"));
    }

    setIsActionLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isPremium = user?.isPremium;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("subscription.title")}
        </Text>
      </View>

      {/* Premium Badge */}
      <View
        style={[
          styles.badgeContainer,
          {
            backgroundColor: isPremium ? colors.accent1 : colors.backgroundSecondary,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Ionicons
          name={isPremium ? "star" : "star-outline"}
          size={48}
          color={isPremium ? colors.text : colors.primary}
        />
        <Text style={[styles.badgeTitle, { color: colors.text }]}>
          {isPremium ? t("subscription.premiumActive") : t("subscription.premiumInactive")}
        </Text>
        {isPremium && subscription && (
          <Text style={[styles.badgeSubtitle, { color: colors.textSecondary }]}>
            {subscription.cancelAtPeriodEnd
              ? t("subscription.expiresOn", { date: formatDate(subscription.currentPeriodEnd) })
              : t("subscription.renewsOn", { date: formatDate(subscription.currentPeriodEnd) })}
          </Text>
        )}
      </View>

      {/* Price Card (for non-premium users) */}
      {!isPremium && (
        <View
          style={[
            styles.priceCard,
            {
              backgroundColor: colors.primary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.priceAmount, { color: colors.primaryText }]}>
            {PREMIUM_PRICE}{PREMIUM_CURRENCY}
          </Text>
          <Text style={[styles.pricePeriod, { color: colors.primaryText }]}>
            {t("subscription.perMonth")}
          </Text>
        </View>
      )}

      {/* Features */}
      <View
        style={[
          styles.featuresCard,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.featuresTitle, { color: colors.text }]}>
          {t("subscription.features")}
        </Text>

        {[
          "subscription.feature1",
          "subscription.feature2",
          "subscription.feature3",
          "subscription.feature4",
        ].map((featureKey, index) => (
          <View key={index} style={styles.featureRow}>
            <View
              style={[styles.featureIcon, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="checkmark" size={16} color={colors.secondaryText} />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>
              {t(featureKey)}
            </Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      {!isPremium ? (
        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.primary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
            isActionLoading && styles.buttonDisabled,
          ]}
          onPress={handleSubscribe}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>
              {t("subscription.subscribe")}
            </Text>
          )}
        </Pressable>
      ) : subscription?.cancelAtPeriodEnd ? (
        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
            isActionLoading && styles.buttonDisabled,
          ]}
          onPress={handleReactivate}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <ActivityIndicator color={colors.secondaryText} />
          ) : (
            <Text style={[styles.actionButtonText, { color: colors.secondaryText }]}>
              {t("subscription.reactivate")}
            </Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          style={[
            styles.cancelButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
            isActionLoading && styles.buttonDisabled,
          ]}
          onPress={handleCancel}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={[styles.cancelButtonText, { color: colors.error }]}>
              {t("subscription.cancel")}
            </Text>
          )}
        </Pressable>
      )}

      {/* Info text */}
      <Text style={[styles.infoText, { color: colors.textMuted }]}>
        {t("subscription.termsInfo")}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.titleLarge,
    flex: 1,
  },
  badgeContainer: {
    alignItems: "center",
    padding: spacing.xl,
    ...borders.card,
    ...shadows.md,
    gap: spacing.sm,
  },
  badgeTitle: {
    ...typography.title,
    textAlign: "center",
  },
  badgeSubtitle: {
    ...typography.body,
    textAlign: "center",
  },
  priceCard: {
    alignItems: "center",
    padding: spacing.xl,
    ...borders.card,
    ...shadows.md,
  },
  priceAmount: {
    ...typography.titleLarge,
    fontSize: 56,
    lineHeight: 64,
  },
  pricePeriod: {
    ...typography.body,
  },
  featuresCard: {
    padding: spacing.lg,
    ...borders.card,
    ...shadows.md,
    gap: spacing.md,
  },
  featuresTitle: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  actionButton: {
    padding: spacing.lg,
    alignItems: "center",
    ...borders.button,
    ...shadows.md,
  },
  actionButtonText: {
    ...typography.button,
    fontSize: 18,
  },
  cancelButton: {
    padding: spacing.lg,
    alignItems: "center",
    ...borders.button,
  },
  cancelButtonText: {
    ...typography.button,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoText: {
    ...typography.caption,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
