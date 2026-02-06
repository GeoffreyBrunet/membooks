/**
 * SeriesCard Component
 * Displays a series with progress bar and read status
 * Minimalist style with subtle borders and soft shadows
 */

import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  spacing,
  borders,
  shadows,
  typography,
  borderRadius,
} from '@/constants';
import type { Series } from '@/types/book';

interface SeriesCardProps {
  series: Series;
  ownedCount: number;
  readCount: number;
}

export function SeriesCard({ series, ownedCount, readCount }: SeriesCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const progressPercent = (ownedCount / series.totalVolumes) * 100;
  const allRead = readCount === ownedCount && ownedCount > 0;

  return (
    <Link href={{ pathname: '/book/[id]', params: { id: series.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            borderLeftColor: colors.accent2,
            shadowColor: colors.shadow,
          },
          pressed && styles.pressed,
        ]}
      >
        {/* Header with name and read status */}
        <View style={styles.header}>
          <Text style={[styles.seriesName, { color: colors.text }]}>
            {series.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: allRead ? colors.secondary : colors.accent1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.text }]}>
              {t('detail.readProgress', { read: readCount })}
            </Text>
          </View>
        </View>

        {/* Author */}
        <Text
          style={[styles.author, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {series.author}
        </Text>

        {/* Progress section */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('detail.progress', { owned: ownedCount, total: series.totalVolumes })}
          </Text>

          {/* Progress bar */}
          <View
            style={[
              styles.progressBarContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.cardPadding,
    borderLeftWidth: 3,
    ...borders.card,
    ...shadows.md,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  seriesName: {
    ...typography.title,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.labelSmall,
  },
  author: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressText: {
    ...typography.label,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
