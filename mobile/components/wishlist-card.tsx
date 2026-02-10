/**
 * WishlistCard Component
 * Displays a book from the wishlist with action to move to owned
 */

import { useState } from 'react';
import { Pressable, Text, View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import { getCoverUrl } from '@/services/book-search';
import {
  spacing,
  borders,
  shadows,
  typography,
  borderRadius,
} from '@/constants';
import type { Book } from '@/types/book';

interface WishlistCardProps {
  book: Book;
}

export function WishlistCard({ book }: WishlistCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { moveToOwned, removeBook } = useBooks();
  const [isMoving, setIsMoving] = useState(false);
  const coverUrl = getCoverUrl(book.coverId, 'S');

  const handleMoveToOwned = async () => {
    setIsMoving(true);
    try {
      await moveToOwned(book.id);
    } finally {
      setIsMoving(false);
    }
  };

  const handleRemove = async () => {
    await removeBook(book.id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          borderLeftColor: colors.accent3,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.row}>
        {coverUrl && (
          <Image
            source={{ uri: coverUrl }}
            style={[styles.cover, { backgroundColor: colors.border }]}
            resizeMode="cover"
          />
        )}
        <View style={styles.infoColumn}>
          <View style={styles.info}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={2}
            >
              {book.title}
            </Text>
            <Text
              style={[styles.author, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {book.author}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleMoveToOwned}
              disabled={isMoving}
              style={({ pressed }) => [
                styles.actionButton,
                styles.ownedButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              {isMoving ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>
                  {t('wishlist.moveToOwned')}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleRemove}
              disabled={isMoving}
              style={({ pressed }) => [
                styles.actionButton,
                styles.removeButton,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                {t('wishlist.remove')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.cardPadding,
    borderLeftWidth: 3,
    ...borders.card,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cover: {
    width: 45,
    height: 65,
    borderRadius: borderRadius.sm,
  },
  infoColumn: {
    flex: 1,
  },
  info: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.body,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownedButton: {},
  removeButton: {},
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    ...typography.button,
    fontSize: 12,
  },
});
