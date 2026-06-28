import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/lib/auth";
import { useLanguage } from "../src/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, user, init } = useAuth();
  const languageLoading = useLanguage((state) => state.isLoading);
  const initLanguage = useLanguage((state) => state.init);

  useEffect(() => {
    init();
    initLanguage();
  }, [init, initLanguage]);

  if (isLoading || languageLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const t = useLanguage((state) => state.t);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0f172a" },
            headerTintColor: "#e2e8f0",
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: "#020617" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
          <Stack.Screen name="play" options={{ title: t("play.title") }} />
          <Stack.Screen name="daily" options={{ title: t("daily.title") }} />
          <Stack.Screen name="upload" options={{ title: t("upload.title") }} />
          <Stack.Screen name="leaderboard" options={{ title: "Me" }} />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
