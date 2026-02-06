/**
 * BookCard Component
 * Displays a standalone book with minimalist style
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
import type { Book } from '@/types/book';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Link href={{ pathname: '/book/[id]', params: { id: book.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            borderLeftColor: book.isRead ? colors.secondary : colors.primary,
            shadowColor: colors.shadow,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: book.isRead ? colors.secondary : colors.accent1,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.text }]}>
              {book.isRead ? t('status.read') : t('status.unread')}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.author, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>
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
  title: {
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
  },
});
