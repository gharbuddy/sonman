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

  const syncProfile = async (session: Session) => {
    const metadata = session.user.user_metadata;
    const fullName = String(metadata.full_name ?? metadata.name ?? "").trim();
    const { error } = await supabase.rpc("sync_authenticated_profile", {
      profile_email: session.user.email ?? null,
      profile_full_name: fullName,
    });
    if (error) throw error;
  };

  const requireRole = async (session: Session, expectedRole: UserRole) => {
    await syncProfile(session);
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
    async getCurrentProfile() {
      requireConfiguration();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new AuthAccessError("Sign in to view your profile.");
      return getProfile(user.id);
    },
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
    async beginGoogleLogin(redirectTo: string) {
      requireConfiguration();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      return data.url;
    },
    async completeOAuthLogin(callbackUrl: string, expectedRole: UserRole) {
      requireConfiguration();
      const url = new URL(callbackUrl);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = url.searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (!data.session) throw new AuthAccessError("Supabase did not create a Google session.");
        return requireRole(data.session, expectedRole);
      }
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (!accessToken || !refreshToken) {
        throw new AuthAccessError(hash.get("error_description") ?? "Google sign in was not completed.");
      }
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      if (!data.session) throw new AuthAccessError("Supabase did not create a Google session.");
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
    async updateProfile(fullName: string) {
      requireConfiguration();
      const normalizedName = fullName.trim();
      const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: normalizedName } });
      if (metadataError) throw metadataError;
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new AuthAccessError("Sign in to update your profile.");
      const { data, error } = await supabase
        .from("users")
        .update({ full_name: normalizedName })
        .eq("id", user.id)
        .select("id, role, email, phone, full_name, is_active")
        .single();
      if (error) throw error;
      return data as UserProfile;
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
