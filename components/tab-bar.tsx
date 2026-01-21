/**
 * Custom Tab Bar Component
 * Neo-Memphis style with visible borders and offset shadows
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { spacing, borderWidths, borderRadius, typography } from '@/constants';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  camera: 'camera',
  search: 'search',
  proposals: 'bulb-outline',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.backgroundSecondary,
            borderTopColor: colors.border,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconName = TAB_ICONS[route.name] ?? 'ellipse';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFocused ? colors.primary : 'transparent',
                    borderColor: isFocused ? colors.border : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? colors.primaryText : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.text : colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: borderWidths.medium,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 44,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: borderWidths.thin,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  label: {
    ...typography.labelSmall,
    fontSize: 10,
  },
});
