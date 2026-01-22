/**
 * Home Page - Library
 * MODEL component for Membooks
 * Displays the user's book collection in a unified list
 */

import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import { useAuth } from '@/contexts/auth-context';
import { BookCard } from '@/components/book-card';
import { SeriesCard } from '@/components/series-card';
import { WishlistCard } from '@/components/wishlist-card';
import { spacing, typography, borders, shadows, borderRadius } from '@/constants';
import type { Book, Series } from '@/types/book';

type TabKey = 'myBooks' | 'wishlist' | 'releases';

type LibraryItem =
  | { type: 'book'; data: Book }
  | { type: 'series'; data: Series; ownedCount: number; readCount: number };

const TABS: TabKey[] = ['myBooks', 'wishlist', 'releases'];

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { ownedBooks, wishlistBooks, series, isLoading } = useBooks();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('myBooks');

  // Build unified library list sorted alphabetically
  const { libraryItems, totalBookCount } = useMemo(() => {
    const items: LibraryItem[] = [];
    const seriesBookCounts = new Map<string, number>();
    const seriesReadCounts = new Map<string, number>();

    // Count books per series and read books per series (only owned books)
    for (const book of ownedBooks) {
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
    for (const s of series) {
      const ownedCount = seriesBookCounts.get(s.id);
      if (ownedCount) {
        const readCount = seriesReadCounts.get(s.id) ?? 0;
        items.push({ type: 'series', data: s, ownedCount, readCount });
      }
    }

    // Add standalone books (only owned, not in wishlist)
    for (const book of ownedBooks) {
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
      totalBookCount: ownedBooks.length,
    };
  }, [ownedBooks, series]);

  // Wishlist items sorted alphabetically
  const sortedWishlist = useMemo(() => {
    return [...wishlistBooks].sort((a, b) => a.title.localeCompare(b.title));
  }, [wishlistBooks]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
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
      {/* Header with tabs and profile button */}
      <View style={styles.headerRow}>
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

        {/* Profile button */}
        <Pressable
          style={[
            styles.profileButton,
            {
              backgroundColor: colors.primary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.push('/profile')}
        >
          <Text style={[styles.profileButtonText, { color: colors.primaryText }]}>
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </Pressable>
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

      {/* Wishlist tab */}
      {activeTab === 'wishlist' && (
        <>
          {/* Wishlist count badge */}
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: colors.accent1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Text style={[styles.countText, { color: colors.text }]}>
              {t('home.wishlistCount', { count: wishlistBooks.length })}
            </Text>
          </View>

          {sortedWishlist.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('home.emptyWishlist')}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {sortedWishlist.map((book, index) => (
                <View key={book.id}>
                  <WishlistCard book={book} />
                  {/* Separator between items */}
                  {index < sortedWishlist.length - 1 && (
                    <View style={styles.separatorContainer}>
                      <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                      <View style={[styles.separatorDiamond, { backgroundColor: colors.accent1, borderColor: colors.border }]} />
                      <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Placeholder for Releases */}
      {activeTab === 'releases' && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    ...typography.button,
    fontSize: 18,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
});
