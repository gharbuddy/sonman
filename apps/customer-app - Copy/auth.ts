import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAuthService } from "@sonman/auth-service";

export const authService = createAuthService({
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    "https://cawfigkjtqxxgfrytmgg.supabase.co",

  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhd2ZpZ2tqdHF4eGdmcnl0bWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM4NzYsImV4cCI6MjA5NTcxOTg3Nn0.DD79sIWX8nPh1YyD7grR5D2hfJ0YNimYhoFrXeswwkI",

  storage: AsyncStorage,
});