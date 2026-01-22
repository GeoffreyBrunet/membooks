import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { LanguageProvider } from "@/contexts/language-context";
import { BooksProvider } from "@/contexts/books-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { lightColors, darkColors } from "@/constants";
import "@/lib/i18n";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book/[id]" />
      <Stack.Screen name="search-result/[id]" />
      <Stack.Screen
        name="profile"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BooksProvider>
          <RootLayoutNav />
        </BooksProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
