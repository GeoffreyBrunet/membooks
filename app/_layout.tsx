import { Stack } from "expo-router";
import { LanguageProvider } from "@/contexts/language-context";
import "@/lib/i18n";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack />
    </LanguageProvider>
  );
}
