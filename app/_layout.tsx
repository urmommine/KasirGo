import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initDatabase } from "../src/database/db";
import { checkOnboardingComplete, OnboardingScreen } from "../src/screens/OnboardingScreen";
import { ThemeProvider, useTheme } from "../src/theme";

// Inner layout that uses theme
function RootLayoutInner() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const dbInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      // Initialize database ONLY ONCE
      if (!dbInitialized.current) {
        dbInitialized.current = true;
        initDatabase();
      }

      // Check if onboarding is complete
      const onboardingComplete = await checkOnboardingComplete();
      setNeedsOnboarding(!onboardingComplete);
      setIsLoading(false);
    };

    init();
  }, []);

  // Show loading while checking
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show onboarding directly (not as a route redirect)
  if (needsOnboarding) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <OnboardingScreen onComplete={() => setNeedsOnboarding(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
