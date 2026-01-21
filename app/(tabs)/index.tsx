/**
 * Home Page - Library
 * MODEL component for Membooks
 * Displays the user's book collection in a unified list
 */

import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { BookCard } from '@/components/book-card';
import { SeriesCard } from '@/components/series-card';
import { mockBooks, mockSeries } from '@/data/mock-books';
import { spacing, typography, borders, shadows } from '@/constants';
import type { Book, Series } from '@/types/book';

type TabKey = 'myBooks' | 'wishlist' | 'releases';

type LibraryItem =
  | { type: 'book'; data: Book }
  | { type: 'series'; data: Series; ownedCount: number; readCount: number };

const TABS: TabKey[] = ['myBooks', 'wishlist', 'releases'];

export default function Home() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('myBooks');

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
      {/* Tabs - subtle, above title */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.text : colors.textSecondary },
                ]}
              >
                {t(`home.tabs.${tab}`)}
              </Text>
              {isActive && (
                <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>
        {t('home.title')}
      </Text>

      {/* Content based on active tab */}
      {activeTab === 'myBooks' && (
        <>
          {/* Book count badge */}
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

          {/* Books list */}
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
        </>
      )}

      {/* Placeholder for Wishlist and Releases */}
      {(activeTab === 'wishlist' || activeTab === 'releases') && (
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
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              {t('home.comingSoon')}
            </Text>
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
  title: {
    ...typography.titleLarge,
    marginBottom: spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    marginHorizontal: -spacing.screenPadding,
    paddingHorizontal: spacing.screenPadding,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabText: {
    ...typography.labelSmall,
  },
  tabUnderline: {
    height: 2,
    marginTop: 4,
    borderRadius: 1,
    width: '60%',
  },
  countBadge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
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
  placeholderContainer: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  placeholderCard: {
    padding: spacing['2xl'],
    alignItems: 'center',
    ...borders.card,
    ...shadows.md,
  },
  placeholderText: {
    ...typography.body,
  },
});
