/**
 * Book/Series Detail Page
 * Displays detailed information about a book or series
 */

import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { mockBooks, mockSeries } from '@/data/mock-books';
import {
  spacing,
  typography,
  borders,
  shadows,
  borderWidths,
  borderRadius,
} from '@/constants';
import type { Book, Series, BookType, BookCategory } from '@/types/book';

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Find if it's a series or a standalone book
  const series = mockSeries.find((s) => s.id === id);
  const book = !series ? mockBooks.find((b) => b.id === id) : null;

  // Get books in series if applicable
  const seriesBooks = series
    ? mockBooks
        .filter((b) => b.seriesId === series.id)
        .sort((a, b) => (a.volumeNumber ?? 0) - (b.volumeNumber ?? 0))
    : [];

  if (!series && !book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  const title = series ? series.name : book!.title;
  const author = book?.author ?? seriesBooks[0]?.author;
  const bookType: BookType = series ? series.bookType : book!.bookType;
  const categories: BookCategory[] = series
    ? series.categories
    : book!.categories;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
          pressed && styles.backButtonPressed,
        ]}
      >
        <Text style={[styles.backButtonText, { color: colors.text }]}>
          {t('common.back')}
        </Text>
      </Pressable>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {/* Author */}
      {author && (
        <Text style={[styles.author, { color: colors.textSecondary }]}>
          {author}
        </Text>
      )}

      {/* Book type badge */}
      <View
        style={[
          styles.typeBadge,
          {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.typeBadgeText, { color: colors.secondaryText }]}>
          {t(`bookType.${bookType}`)}
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <View
            key={category}
            style={[
              styles.categoryBadge,
              {
                backgroundColor: colors.accent1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.text }]}>
              {t(`category.${category}`)}
            </Text>
          </View>
        ))}
      </View>

      {/* Series progress and books list */}
      {series && (
        <View style={styles.seriesSection}>
          {/* Progress */}
          <View style={styles.progressHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('detail.ownedVolumes')}
            </Text>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {t('detail.progress', {
                owned: seriesBooks.length,
                total: series.totalVolumes,
              })}
            </Text>
          </View>

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
                  width: `${(seriesBooks.length / series.totalVolumes) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          {/* Books list */}
          <View style={styles.booksList}>
            {seriesBooks.map((seriesBook) => (
              <View
                key={seriesBook.id}
                style={[
                  styles.bookItem,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <View
                  style={[
                    styles.volumeBadge,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.volumeNumber, { color: colors.primaryText }]}
                  >
                    {seriesBook.volumeNumber}
                  </Text>
                </View>
                <Text
                  style={[styles.bookTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {seriesBook.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    ...borders.button,
    ...shadows.sm,
  },
  backButtonPressed: {
    transform: [{ scale: 0.94 }, { translateY: 1 }],
    shadowOffset: { width: 0, height: 0 },
  },
  backButtonText: {
    ...typography.button,
  },
  title: {
    ...typography.titleLarge,
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.bodyLarge,
    marginBottom: spacing.lg,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    ...typography.label,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: borderWidths.thin,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    ...typography.labelSmall,
  },
  seriesSection: {
    marginTop: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
  },
  progressText: {
    ...typography.body,
  },
  progressBarContainer: {
    height: 16,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
  },
  booksList: {
    gap: spacing.sm,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    ...borders.card,
    ...shadows.sm,
  },
  volumeBadge: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.sm,
  },
  volumeNumber: {
    ...typography.button,
  },
  bookTitle: {
    ...typography.body,
    flex: 1,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
