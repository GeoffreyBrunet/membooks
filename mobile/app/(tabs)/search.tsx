/**
 * Search Screen
 * Search for books with autocomplete and navigate to detail page
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import { searchBooks, quickSearch, getCoverUrl, type SearchResult } from '@/services/book-search';
import { spacing, typography, borderWidths, borderRadius, borders, shadows } from '@/constants';

export default function SearchScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { books } = useBooks();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplete effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    setShowSuggestions(true);

    debounceRef.current = setTimeout(async () => {
      const results = await quickSearch(query, 5);
      setSuggestions(results);
      setIsLoadingSuggestions(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setShowSuggestions(false);
    setIsSearching(true);
    setHasSearched(true);
    try {
      const searchResults = await searchBooks(query, 20);
      setResults(searchResults);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      Keyboard.dismiss();
      setShowSuggestions(false);
      router.push({
        pathname: '/search-result/[id]' as const,
        params: {
          id: result.id,
          title: result.title,
          author: result.author,
          coverId: result.coverId?.toString() ?? '',
          year: result.year?.toString() ?? '',
        },
      } as any);
    },
    [router]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: SearchResult) => {
      setQuery(suggestion.title);
      setShowSuggestions(false);
      handleSelectResult(suggestion);
    },
    [handleSelectResult]
  );

  const isBookInLibrary = useCallback(
    (resultId: string) => {
      const bookId = `search-${resultId.replace('/works/', '')}`;
      return books.some((book) => book.id === bookId);
    },
    [books]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.lg,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {t('nav.search')}
      </Text>

      {/* Search bar */}
      <View style={styles.searchContainer}>
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
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          />
          <Pressable
            onPress={handleSearch}
            style={[
              styles.searchButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
              },
            ]}
            disabled={isSearching || !query.trim()}
          >
            <Text style={[styles.searchButtonText, { color: colors.primaryText }]}>
              {t('search.search')}
            </Text>
          </Pressable>
        </View>

        {/* Autocomplete suggestions */}
        {showSuggestions && (
          <View
            style={[
              styles.suggestionsContainer,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {isLoadingSuggestions ? (
              <View style={styles.suggestionsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : suggestions.length === 0 ? (
              <Text style={[styles.noSuggestionsText, { color: colors.textSecondary }]}>
                {t('search.noSuggestions')}
              </Text>
            ) : (
              suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  onPress={() => handleSelectSuggestion(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    { borderBottomColor: colors.border },
                    pressed && { backgroundColor: colors.background },
                  ]}
                >
                  <Text
                    style={[styles.suggestionTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {suggestion.title}
                  </Text>
                  <Text
                    style={[styles.suggestionAuthor, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {suggestion.author}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {t('search.searching')}
          </Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {t('search.noResults')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.resultsList}
          contentContainerStyle={[
            styles.resultsContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setShowSuggestions(false)}
        >
          {results.map((result) => {
            const alreadyOwned = isBookInLibrary(result.id);
            const coverUrl = getCoverUrl(result.coverId, 'M');

            return (
              <Pressable
                key={result.id}
                onPress={() => handleSelectResult(result)}
                style={({ pressed }) => [
                  styles.resultCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  },
                  pressed && styles.resultCardPressed,
                ]}
              >
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
                <View style={styles.resultInfo}>
                  <Text
                    style={[styles.resultTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {result.title}
                  </Text>
                  <Text
                    style={[styles.resultAuthor, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {result.author}
                  </Text>
                  {result.year && (
                    <Text style={[styles.resultYear, { color: colors.textSecondary }]}>
                      {result.year}
                    </Text>
                  )}
                  {alreadyOwned && (
                    <View
                      style={[
                        styles.ownedBadge,
                        { backgroundColor: colors.secondary, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.ownedBadgeText, { color: colors.text }]}>
                        {t('search.alreadyInLibrary')}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
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
  searchContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: borderWidths.medium,
  },
  searchButtonText: {
    ...typography.button,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  suggestionsLoading: {
    padding: spacing.md,
    alignItems: 'center',
  },
  noSuggestionsText: {
    ...typography.body,
    padding: spacing.md,
    textAlign: 'center',
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: borderWidths.thin,
  },
  suggestionTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  suggestionAuthor: {
    ...typography.labelSmall,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusText: {
    ...typography.body,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    gap: spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    padding: spacing.md,
    ...borders.card,
    ...shadows.sm,
    gap: spacing.md,
  },
  resultCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  coverImage: {
    width: 60,
    height: 90,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidths.thin,
  },
  coverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidths.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    ...typography.title,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  resultTitle: {
    ...typography.title,
  },
  resultAuthor: {
    ...typography.body,
  },
  resultYear: {
    ...typography.labelSmall,
  },
  ownedBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: borderWidths.thin,
    marginTop: spacing.xs,
  },
  ownedBadgeText: {
    ...typography.labelSmall,
  },
});
