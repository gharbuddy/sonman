import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAuthService } from "@sonman/auth-service";

export const authService = createAuthService({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  storage: AsyncStorage,
});
