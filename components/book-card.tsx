/**
 * BookCard Component
 * Displays a standalone book in Neo-Memphis style
 */

import { Pressable, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { spacing, borders, shadows, typography } from '@/constants';
import type { Book } from '@/types/book';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
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
  title: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.body,
  },
});
