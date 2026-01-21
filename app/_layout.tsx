import { Stack } from "expo-router";
import { LanguageProvider } from "@/contexts/language-context";
import { BooksProvider } from "@/contexts/books-context";
import "@/lib/i18n";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <BooksProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="book/[id]" />
        </Stack>
      </BooksProvider>
    </LanguageProvider>
  );
}
