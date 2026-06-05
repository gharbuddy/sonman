import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { authService } from "../auth";
import { Field, PrimaryButton, ScreenShell, styles } from "../shared";

export function LoginScreen({ mode, onAuthenticated, onSwitch }: { mode: "login" | "signup"; onAuthenticated: () => void; onSwitch: () => void }) {
  const signup = mode === "signup";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (signup) {
        const result = await authService.register({ email, password, fullName, role: "customer", emailRedirectTo: Linking.createURL("auth/callback") });
        if (!result.session) {
          setError("Check your email to confirm your account, then sign in.");
          return;
        }
        await authService.restoreSession("customer");
      } else {
        await authService.login(email, password, "customer");
      }
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };
  const google = async () => {
    setBusy(true);
    setError("");
    try {
      const redirectTo = Linking.createURL("auth/callback");
      const url = await authService.beginGoogleLogin(redirectTo);
      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      if (result.type !== "success") {
        if (result.type !== "cancel") setError("Google sign in was not completed.");
        return;
      }
      await authService.completeOAuthLogin(result.url, "customer");
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign in failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScreenShell contentContainerStyle={styles.auth}>
        <Text style={styles.logo}>sonman</Text>
        <View style={styles.authIntro}>
          <Text style={styles.authTitle}>{signup ? "Create your account" : "Welcome back"}</Text>
          <Text style={styles.body}>{signup ? "Save picks, track orders, and checkout faster." : "Sign in to continue your shopping journey."}</Text>
        </View>
        <PrimaryButton label={busy ? "Please wait..." : "Continue with Google"} onPress={google} disabled={busy} />
        <Text style={styles.authDivider}>OR CONTINUE WITH EMAIL</Text>
        {signup && <Field label="Full name" placeholder="Your name" value={fullName} onChange={setFullName} />}
        <Field label="Email address" placeholder="name@example.com" value={email} onChange={setEmail} />
        <Field label="Password" placeholder="Enter password" secure value={password} onChange={setPassword} />
        {!!error && <Text style={styles.authError}>{error}</Text>}
        {!signup && <Text style={[styles.link, styles.alignRight]}>Forgot password?</Text>}
        <PrimaryButton label={busy ? "Please wait..." : signup ? "Create account" : "Sign in"} onPress={submit} disabled={busy} />
        <Pressable onPress={onSwitch}><Text style={styles.switchText}>{signup ? "Already have an account? " : "New to Sonman? "}<Text style={styles.link}>{signup ? "Sign in" : "Create account"}</Text></Text></Pressable>
    </ScreenShell>
  );
}
