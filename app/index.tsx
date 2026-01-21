/**
 * Home Page - Library
 * MODEL component for Membooks
 * Displays the user's book collection in a unified list
 */

import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { BookCard } from '@/components/book-card';
import { SeriesCard } from '@/components/series-card';
import { mockBooks, mockSeries } from '@/data/mock-books';
import { spacing, typography, borders, shadows } from '@/constants';
import type { Book, Series } from '@/types/book';

type LibraryItem =
  | { type: 'book'; data: Book }
  | { type: 'series'; data: Series; ownedCount: number; readCount: number };

export default function Home() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // Build unified library list sorted alphabetically
  const { libraryItems, totalBookCount } = useMemo(() => {
    const items: LibraryItem[] = [];
    const seriesBookCounts = new Map<string, number>();
    const seriesReadCounts = new Map<string, number>();

    // Count books per series and read books per series
    for (const book of mockBooks) {
      if (book.seriesId) {
        const count = seriesBookCounts.get(book.seriesId) ?? 0;
        seriesBookCounts.set(book.seriesId, count + 1);
        if (book.isRead) {
          const readCount = seriesReadCounts.get(book.seriesId) ?? 0;
          seriesReadCounts.set(book.seriesId, readCount + 1);
        }
      }
    }

    // Add series
    for (const series of mockSeries) {
      const ownedCount = seriesBookCounts.get(series.id);
      if (ownedCount) {
        const readCount = seriesReadCounts.get(series.id) ?? 0;
        items.push({ type: 'series', data: series, ownedCount, readCount });
      }
    }

    // Add standalone books
    for (const book of mockBooks) {
      if (!book.seriesId) {
        items.push({ type: 'book', data: book });
      }
    }

    // Sort alphabetically
    items.sort((a, b) => {
      const nameA = a.type === 'series' ? a.data.name : a.data.title;
      const nameB = b.type === 'series' ? b.data.name : b.data.title;
      return nameA.localeCompare(nameB);
    });

    return {
      libraryItems: items,
      totalBookCount: mockBooks.length,
    };
  }, []);

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
      {/* Header with book count */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('home.title')}
        </Text>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: colors.primary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.countText, { color: colors.primaryText }]}>
            {t('home.bookCount', { count: totalBookCount })}
          </Text>
        </View>
      </View>

      {/* Unified list */}
      <View style={styles.list}>
        {libraryItems.map((item, index) => (
          <View key={item.data.id}>
            {item.type === 'series' ? (
              <SeriesCard series={item.data} ownedCount={item.ownedCount} readCount={item.readCount} />
            ) : (
              <BookCard book={item.data} />
            )}
            {/* Separator between items */}
            {index < libraryItems.length - 1 && (
              <View style={styles.separatorContainer}>
                <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                <View style={[styles.separatorDiamond, { backgroundColor: colors.accent1, borderColor: colors.border }]} />
                <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
              </View>
            )}
          </View>
        ))}
      </View>
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
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    ...typography.titleLarge,
    marginBottom: spacing.lg,
  },
  countBadge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...borders.pill,
    ...shadows.sm,
  },
  countText: {
    ...typography.button,
  },
  list: {
    flex: 1,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 2,
  },
  separatorDiamond: {
    width: 10,
    height: 10,
    marginHorizontal: spacing.md,
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
});
