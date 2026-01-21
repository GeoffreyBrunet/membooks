import { Stack } from "expo-router";
import { LanguageProvider } from "@/contexts/language-context";
import "@/lib/i18n";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="book/[id]" />
      </Stack>
    </LanguageProvider>
  );
}
