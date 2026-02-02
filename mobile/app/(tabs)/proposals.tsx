/**
 * Proposals Screen
 * Placeholder for book suggestions
 */

import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { spacing, typography, borders, shadows } from '@/constants';

export default function ProposalsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {t('nav.proposals')}
      </Text>

      <View style={styles.placeholderContainer}>
        <View
          style={[
            styles.placeholderCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Ionicons name="bulb-outline" size={64} color={colors.accent1} />
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>
            {t('home.comingSoon')}
          </Text>
          <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>
            {t('proposals.subtitle')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  title: {
    ...typography.titleLarge,
    marginBottom: spacing.xl,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCard: {
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
    ...borders.card,
    ...shadows.md,
  },
  placeholderTitle: {
    ...typography.subtitle,
  },
  placeholderSubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
});
