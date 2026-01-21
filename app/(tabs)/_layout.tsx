/**
 * Tab Layout - Bottom Navigation Bar
 * Neo-Memphis style with custom tab bar
 */

import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBar } from '@/components/tab-bar';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('nav.camera'),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav.search'),
        }}
      />
      <Tabs.Screen
        name="proposals"
        options={{
          title: t('nav.proposals'),
        }}
      />
    </Tabs>
  );
}
