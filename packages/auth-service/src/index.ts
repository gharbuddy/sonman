import {
  createClient,
  type AuthChangeEvent,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

export type UserRole = "customer" | "vendor" | "delivery_partner" | "admin";
export type RegisterableRole = Exclude<UserRole, "admin">;

export type UserProfile = {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  full_name: string;
  is_active: boolean;
};

type StorageAdapter = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

type AuthServiceOptions = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage?: StorageAdapter;
};

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  role: RegisterableRole;
};

export class AuthAccessError extends Error {}

export function createAuthService(options: AuthServiceOptions) {
  const requireConfiguration = () => {
    if (!options.supabaseUrl) throw new Error("Supabase URL is not configured");
    if (!options.supabaseAnonKey) throw new Error("Supabase anon key is not configured");
  };
  const supabase = createClient(
    options.supabaseUrl || "http://localhost:54321",
    options.supabaseAnonKey || "missing-anon-key",
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: !options.storage,
        persistSession: true,
        storage: options.storage,
      },
    },
  );

  const getProfile = async (userId: string): Promise<UserProfile> => {
    requireConfiguration();
    const { data, error } = await supabase
      .from("users")
      .select("id, role, email, phone, full_name, is_active")
      .eq("id", userId)
      .single();
    if (error || !data) throw new AuthAccessError("Your Sonman profile is unavailable.");
    return data as UserProfile;
  };

  const requireRole = async (session: Session, expectedRole: UserRole) => {
    const profile = await getProfile(session.user.id);
    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new AuthAccessError("This Sonman account is inactive.");
    }
    if (profile.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new AuthAccessError(`This account cannot access the ${expectedRole.replace("_", " ")} app.`);
    }
    return { session, profile };
  };

  return {
    supabase,
    async restoreSession(expectedRole: UserRole) {
      requireConfiguration();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session ? requireRole(data.session, expectedRole) : null;
    },
    async login(email: string, password: string, expectedRole: UserRole) {
      requireConfiguration();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new AuthAccessError("Supabase did not create a session.");
      return requireRole(data.session, expectedRole);
    },
    async register(input: RegisterInput) {
      requireConfiguration();
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { full_name: input.fullName, role: input.role } },
      });
      if (error) throw error;
      return data;
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onAuthStateChange(
      callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) {
      return supabase.auth.onAuthStateChange(callback).data.subscription;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
export type { Session, SupabaseClient, User };
