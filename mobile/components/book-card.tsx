/**
 * BookCard Component
 * Displays a standalone book in Neo-Memphis style
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
  borderWidths,
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
                borderColor: colors.border,
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
    ...borders.card,
    ...shadows.md,
  },
  pressed: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
    shadowOffset: { width: 0, height: 1 },
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
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderWidth: borderWidths.thin,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.labelSmall,
  },
  author: {
    ...typography.body,
  },
});
