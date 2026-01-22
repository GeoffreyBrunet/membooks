/**
 * Search Result Detail Page
 * Shows book details and allows adding to library or wishlist
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import {
  getBookDetails,
  searchByAuthor,
  searchResultToBook,
  getCoverUrl,
  type SearchResult,
} from '@/services/book-search';
import { spacing, typography, borders, shadows, borderWidths, borderRadius } from '@/constants';

export default function SearchResultDetail() {
  const { id, title, author, coverId, year } = useLocalSearchParams<{
    id: string;
    title: string;
    author: string;
    coverId?: string;
    year?: string;
  }>();

  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addBook, books } = useBooks();

  const [description, setDescription] = useState<string>('');
  const [otherBooks, setOtherBooks] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState<'owned' | 'wishlist' | null>(null);

  const coverUrl = coverId ? getCoverUrl(parseInt(coverId, 10), 'L') : null;
  const bookId = `search-${id?.replace('/works/', '')}`;
  const isAlreadyInLibrary = books.some((b) => b.id === bookId);

  useEffect(() => {
    async function loadDetails() {
      if (!id || !author) {
        setIsLoading(false);
        return;
      }

      try {
        // Load book details and other books by author in parallel
        const [details, authorBooks] = await Promise.all([
          getBookDetails(id),
          searchByAuthor(author, 8),
        ]);

        if (details?.description) {
          setDescription(details.description);
        }

        // Filter out the current book from other books
        const filtered = authorBooks.filter((b) => b.id !== id);
        setOtherBooks(filtered);
      } catch (error) {
        console.error('Error loading details:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDetails();
  }, [id, author]);

  const handleAddBook = useCallback(
    async (toWishlist: boolean) => {
      if (!id || !title || !author) return;

      setIsAdding(true);
      try {
        const searchResult: SearchResult = {
          id,
          title,
          author,
          year: year ? parseInt(year, 10) : undefined,
          bookType: 'novel',
          categories: ['sliceOfLife'],
          coverId: coverId ? parseInt(coverId, 10) : undefined,
        };

        const book = searchResultToBook(searchResult, toWishlist);
        await addBook(book);
        setAddSuccess(toWishlist ? 'wishlist' : 'owned');

        setTimeout(() => {
          router.back();
        }, 1500);
      } catch (error) {
        console.error('Failed to add book:', error);
      } finally {
        setIsAdding(false);
      }
    },
    [id, title, author, year, coverId, addBook, router]
  );

  const handleOtherBookPress = useCallback(
    (book: SearchResult) => {
      router.push({
        pathname: '/search-result/[id]' as const,
        params: {
          id: book.id,
          title: book.title,
          author: book.author,
          coverId: book.coverId?.toString() ?? '',
          year: book.year?.toString() ?? '',
        },
      } as any);
    },
    [router]
  );

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
          },
          pressed && styles.backButtonPressed,
        ]}
      >
        <Text style={[styles.backButtonText, { color: colors.text }]}>
          {t('common.back')}
        </Text>
      </Pressable>

      {/* Book cover */}
      <View style={styles.coverContainer}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={[styles.coverImage, { borderColor: colors.border }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.coverPlaceholder,
              { backgroundColor: colors.accent1, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.coverPlaceholderText, { color: colors.text }]}>
              ?
            </Text>
          </View>
        )}
      </View>

      {/* Book info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.author, { color: colors.textSecondary }]}>
          {author}
        </Text>
        {year && (
          <Text style={[styles.year, { color: colors.textSecondary }]}>
            {year}
          </Text>
        )}
      </View>

      {/* Description */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : description ? (
        <View
          style={[
            styles.descriptionCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {description}
          </Text>
        </View>
      ) : null}

      {/* Action buttons */}
      {addSuccess ? (
        <View
          style={[
            styles.successBadge,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.successText, { color: colors.text }]}>
            {addSuccess === 'wishlist'
              ? t('search.addedToWishlist')
              : t('search.addedToLibrary')}
          </Text>
        </View>
      ) : isAlreadyInLibrary ? (
        <View
          style={[
            styles.alreadyOwnedBadge,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.alreadyOwnedText, { color: colors.text }]}>
            {t('search.alreadyInLibrary')}
          </Text>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => handleAddBook(false)}
            disabled={isAdding}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
              pressed && styles.actionButtonPressed,
            ]}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>
                {t('search.addToLibrary')}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => handleAddBook(true)}
            disabled={isAdding}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.accent1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
              pressed && styles.actionButtonPressed,
            ]}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                {t('search.addToWishlist')}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Other books by author */}
      {otherBooks.length > 0 && (
        <View style={styles.otherBooksSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('search.otherByAuthor', { author })}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.otherBooksScroll}
          >
            {otherBooks.map((book) => {
              const bookCoverUrl = getCoverUrl(book.coverId, 'M');
              const isInLibrary = books.some(
                (b) => b.id === `search-${book.id.replace('/works/', '')}`
              );

              return (
                <Pressable
                  key={book.id}
                  onPress={() => handleOtherBookPress(book)}
                  style={({ pressed }) => [
                    styles.otherBookCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      opacity: isInLibrary ? 0.6 : 1,
                    },
                    pressed && styles.otherBookCardPressed,
                  ]}
                >
                  {bookCoverUrl ? (
                    <Image
                      source={{ uri: bookCoverUrl }}
                      style={[styles.otherBookCover, { borderColor: colors.border }]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.otherBookCoverPlaceholder,
                        { backgroundColor: colors.accent1, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.otherBookCoverText, { color: colors.text }]}>
                        ?
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[styles.otherBookTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {book.title}
                  </Text>
                  {isInLibrary && (
                    <View
                      style={[
                        styles.inLibraryBadge,
                        { backgroundColor: colors.secondary, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.inLibraryText, { color: colors.text }]}>
                        {t('search.inLibrary')}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
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
    paddingHorizontal: spacing.md,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  backButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  backButtonText: {
    ...typography.button,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  coverImage: {
    width: 180,
    height: 270,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
  },
  coverPlaceholder: {
    width: 180,
    height: 270,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    ...typography.titleLarge,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleLarge,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.body,
    textAlign: 'center',
  },
  year: {
    ...typography.labelSmall,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  descriptionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
    marginBottom: spacing.lg,
  },
  descriptionText: {
    ...typography.body,
    lineHeight: 22,
  },
  actionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    ...typography.button,
  },
  successBadge: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successText: {
    ...typography.button,
  },
  alreadyOwnedBadge: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  alreadyOwnedText: {
    ...typography.button,
  },
  otherBooksSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  otherBooksScroll: {
    gap: spacing.md,
    paddingRight: spacing.screenPadding,
  },
  otherBookCard: {
    width: 100,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: borderWidths.medium,
  },
  otherBookCardPressed: {
    transform: [{ scale: 0.96 }],
  },
  otherBookCover: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidths.thin,
    marginBottom: spacing.xs,
  },
  otherBookCoverPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidths.thin,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  otherBookCoverText: {
    ...typography.title,
  },
  otherBookTitle: {
    ...typography.labelSmall,
  },
  inLibraryBadge: {
    marginTop: spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidths.thin,
  },
  inLibraryText: {
    fontSize: 10,
    fontFamily: 'Roboto',
  },
});
