/**
 * Statistics Page
 * Displays book collection statistics with pie charts
 */

import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import { spacing, typography, borders, shadows } from '@/constants';
import type { BookType, BookCategory } from '@/types/book';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH * 0.5;

// Colors for the charts - Neo-Memphis palette
const TYPE_COLORS: Record<BookType, string> = {
  novel: '#FF6B6B',   // coral
  comic: '#4ECDC4',   // cyan
  manga: '#FFE66D',   // yellow
  artbook: '#9B5DE5', // purple
  essay: '#F15BB5',   // pink
};

const CATEGORY_COLORS: Record<BookCategory, string> = {
  sf: '#00BBF9',        // blue
  fantasy: '#9B5DE5',   // purple
  thriller: '#FF6B6B',  // coral
  romance: '#F15BB5',   // pink
  horror: '#333333',    // dark gray
  adventure: '#4ECDC4', // cyan
  sliceOfLife: '#FFE66D', // yellow
  historical: '#8B4513', // brown
  mystery: '#6B5B95',   // muted purple
  biography: '#00C851', // green
};

interface ChartDataItem {
  value: number;
  color: string;
  label: string;
  text: string;
}

export default function Statistics() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { ownedBooks } = useBooks();

  // Calculate stats by book type
  const { typeData, typeStats } = useMemo(() => {
    const counts: Record<BookType, number> = {
      novel: 0,
      comic: 0,
      manga: 0,
      artbook: 0,
      essay: 0,
    };

    for (const book of ownedBooks) {
      if (book.bookType && counts[book.bookType] !== undefined) {
        counts[book.bookType]++;
      }
    }

    const data: ChartDataItem[] = [];
    const stats: { type: BookType; count: number; color: string }[] = [];

    for (const [type, count] of Object.entries(counts)) {
      if (count > 0) {
        const bookType = type as BookType;
        data.push({
          value: count,
          color: TYPE_COLORS[bookType],
          label: t(`bookType.${bookType}`),
          text: `${count}`,
        });
        stats.push({ type: bookType, count, color: TYPE_COLORS[bookType] });
      }
    }

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    return { typeData: data, typeStats: stats };
  }, [ownedBooks, t]);

  // Calculate stats by category (genre)
  const { categoryData, categoryStats } = useMemo(() => {
    const counts: Record<BookCategory, number> = {
      sf: 0,
      fantasy: 0,
      thriller: 0,
      romance: 0,
      horror: 0,
      adventure: 0,
      sliceOfLife: 0,
      historical: 0,
      mystery: 0,
      biography: 0,
    };

    for (const book of ownedBooks) {
      if (book.categories) {
        for (const category of book.categories) {
          if (counts[category] !== undefined) {
            counts[category]++;
          }
        }
      }
    }

    const data: ChartDataItem[] = [];
    const stats: { category: BookCategory; count: number; color: string }[] = [];

    for (const [category, count] of Object.entries(counts)) {
      if (count > 0) {
        const bookCategory = category as BookCategory;
        data.push({
          value: count,
          color: CATEGORY_COLORS[bookCategory],
          label: t(`category.${bookCategory}`),
          text: `${count}`,
        });
        stats.push({ category: bookCategory, count, color: CATEGORY_COLORS[bookCategory] });
      }
    }

    // Sort by count descending
    stats.sort((a, b) => b.count - a.count);

    return { categoryData: data, categoryStats: stats };
  }, [ownedBooks, t]);

  // Calculate read vs unread stats
  const { readData, readCount, unreadCount } = useMemo(() => {
    let read = 0;
    let unread = 0;

    for (const book of ownedBooks) {
      if (book.isRead) {
        read++;
      } else {
        unread++;
      }
    }

    const data: ChartDataItem[] = [];
    if (read > 0) {
      data.push({
        value: read,
        color: '#00C851', // success green
        label: t('status.read'),
        text: `${read}`,
      });
    }
    if (unread > 0) {
      data.push({
        value: unread,
        color: '#FF4444', // error red
        label: t('status.unread'),
        text: `${unread}`,
      });
    }

    return { readData: data, readCount: read, unreadCount: unread };
  }, [ownedBooks, t]);

  const totalBooks = ownedBooks.length;
  const readPercentage = totalBooks > 0 ? Math.round((readCount / totalBooks) * 100) : 0;

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
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('statistics.title')}
        </Text>
      </View>

      {/* Overview Card */}
      <View
        style={[
          styles.overviewCard,
          {
            backgroundColor: colors.primary,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.overviewNumber, { color: colors.primaryText }]}>
          {totalBooks}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.primaryText }]}>
          {t('statistics.totalBooks')}
        </Text>
        <View style={styles.overviewStats}>
          <View style={styles.overviewStat}>
            <Text style={[styles.overviewStatNumber, { color: colors.primaryText }]}>
              {readCount}
            </Text>
            <Text style={[styles.overviewStatLabel, { color: colors.primaryText }]}>
              {t('status.read')}
            </Text>
          </View>
          <View style={[styles.overviewDivider, { backgroundColor: colors.primaryText }]} />
          <View style={styles.overviewStat}>
            <Text style={[styles.overviewStatNumber, { color: colors.primaryText }]}>
              {unreadCount}
            </Text>
            <Text style={[styles.overviewStatLabel, { color: colors.primaryText }]}>
              {t('status.unread')}
            </Text>
          </View>
        </View>
      </View>

      {/* Reading Progress Card */}
      {totalBooks > 0 && (
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t('statistics.readingProgress')}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.chartWrapper}>
              {readData.length > 0 && (
                <PieChart
                  data={readData}
                  donut
                  radius={CHART_SIZE / 2.5}
                  innerRadius={CHART_SIZE / 4}
                  centerLabelComponent={() => (
                    <View style={styles.centerLabel}>
                      <Text style={[styles.centerLabelText, { color: colors.text }]}>
                        {readPercentage}%
                      </Text>
                      <Text style={[styles.centerLabelSubtext, { color: colors.textSecondary }]}>
                        {t('status.read')}
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Book Types Chart */}
      {typeData.length > 0 && (
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t('statistics.byType')}
          </Text>
          <View style={styles.chartContent}>
            <View style={styles.chartWrapper}>
              <PieChart
                data={typeData}
                radius={CHART_SIZE / 2.5}
                focusOnPress
                showValuesAsLabels
                textColor={colors.text}
                textSize={12}
              />
            </View>
            <View style={styles.legend}>
              {typeStats.map((item) => (
                <View key={item.type} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>
                    {t(`bookType.${item.type}`)}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                    {item.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Categories Chart */}
      {categoryData.length > 0 && (
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {t('statistics.byGenre')}
          </Text>
          <View style={styles.chartContent}>
            <View style={styles.chartWrapper}>
              <PieChart
                data={categoryData}
                radius={CHART_SIZE / 2.5}
                focusOnPress
                showValuesAsLabels
                textColor={colors.text}
                textSize={12}
              />
            </View>
            <View style={styles.legend}>
              {categoryStats.map((item) => (
                <View key={item.category} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>
                    {t(`category.${item.category}`)}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                    {item.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Empty state */}
      {totalBooks === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('statistics.noBooks')}
          </Text>
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
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.titleLarge,
    flex: 1,
  },
  overviewCard: {
    padding: spacing.xl,
    alignItems: 'center',
    ...borders.card,
    ...shadows.md,
  },
  overviewNumber: {
    ...typography.titleLarge,
    fontSize: 64,
    lineHeight: 70,
  },
  overviewLabel: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },
  overviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatNumber: {
    ...typography.titleSmall,
  },
  overviewStatLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  overviewDivider: {
    width: 2,
    height: 40,
    opacity: 0.3,
  },
  chartCard: {
    padding: spacing.lg,
    ...borders.card,
    ...shadows.md,
  },
  chartTitle: {
    ...typography.subtitle,
    marginBottom: spacing.lg,
  },
  chartContent: {
    gap: spacing.lg,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelText: {
    ...typography.titleSmall,
  },
  centerLabelSubtext: {
    ...typography.caption,
  },
  legend: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.body,
    flex: 1,
  },
  legendValue: {
    ...typography.bodyBold,
    minWidth: 24,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
});
