/**
 * Search Screen
 * Placeholder with search bar
 */

import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { spacing, typography, borderWidths, borderRadius } from '@/constants';

export default function SearchScreen() {
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
        {t('nav.search')}
      </Text>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('nav.search')}
          placeholderTextColor={colors.textSecondary}
          editable={false}
        />
      </View>

      <View style={styles.placeholderContainer}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          {t('home.comingSoon')}
        </Text>
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
    marginBottom: spacing.lg,
  },
  searchBar: {
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  searchInput: {
    ...typography.body,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
  },
});
