import { useRef, useState } from "react";
import type { UserProfile } from "@sonman/auth-service";
import { Pressable, Text, TextInput, View } from "react-native";
import { authService } from "../auth";
import { dateOfBirthParts, Dropdown, Field, formatDateOfBirth, normalizeDateOfBirth, palette, PrimaryButton, ProfileDetail, ProfileRow, ScreenScroll, styles } from "../shared";
import { initials } from "../profile";
import { PageHeader } from "../components/Header";

export function ProfileScreen({ profile, wishlistCount, onEdit, onOrders, onWishlist, onAddresses, onHelp, onNotifications, onNotificationSettings, onLogout }: { profile?: UserProfile; wishlistCount: number; onEdit: () => void; onOrders: () => void; onWishlist: () => void; onAddresses: () => void; onHelp: () => void; onNotifications: () => void; onNotificationSettings: () => void; onLogout: () => void }) {
  const [avatarColor, setAvatarColor] = useState(palette.black);
  const changeAvatar = () => setAvatarColor((current) => current === palette.black ? palette.blue : current === palette.blue ? palette.green : palette.black);
  return (
    <ScreenScroll>
      <Text style={styles.pageTitle}>Your profile</Text>
      <Pressable style={styles.profileCard} onPress={onEdit}><View style={[styles.avatar, { backgroundColor: avatarColor }]}><Text style={styles.avatarText}>{initials(profile?.full_name ?? "")}</Text></View><View style={styles.flex}><Text style={styles.profileName}>{profile?.full_name || "Customer"}</Text><Text style={styles.smallMuted}>{profile?.email ?? ""}</Text><Text style={styles.link}>Edit profile</Text></View><Text style={styles.arrow}>›</Text></Pressable>
      <Text style={styles.changeAvatar} onPress={changeAvatar}>Change avatar style</Text>
      <View style={styles.profileDetailsCard}>
        <ProfileDetail label="Mobile" value={profile?.phone || "Add number"} />
        <ProfileDetail label="Gender" value={profile?.gender || "Add gender"} />
        <ProfileDetail label="Date of birth" value={formatDateOfBirth(profile?.date_of_birth) || "Add date"} last />
      </View>
      <Text style={styles.profileLabel}>ACCOUNT</Text>
      <View style={styles.profileMenuCard}><ProfileRow icon="BOX" title="My orders" subtitle="Track, replace, or buy again" onPress={onOrders} /><ProfileRow icon="♥" title="Wishlist" subtitle={`${wishlistCount} saved ${wishlistCount === 1 ? "item" : "items"}`} onPress={onWishlist} /><ProfileRow icon="PIN" title="Addresses" subtitle="Add, edit, or choose your default" onPress={onAddresses} /><ProfileRow icon="PAY" title="Payments" subtitle="UPI apps and manual verification" /><ProfileRow icon="OFF" title="Coupons" subtitle="Your available offers" /><ProfileRow icon="NOT" title="Notifications" subtitle="View your notification history" onPress={onNotifications} last /></View>
      <Text style={styles.profileLabel}>SUPPORT</Text>
      <View style={styles.profileMenuCard}><ProfileRow icon="?" title="Help center" subtitle="Orders, refunds, and support" onPress={onHelp} /><ProfileRow icon="SET" title="Notification settings" subtitle="Choose which push alerts you receive" onPress={onNotificationSettings} /><ProfileRow icon="SON" title="About Sonman" subtitle="Local commerce, delivered with care" last /></View>
      <Text style={styles.signOut} onPress={onLogout}>Logout</Text>
    </ScreenScroll>
  );
}

export function EditProfileScreen({ profile, onBack, onSaved }: { profile: UserProfile; onBack: () => void; onSaved: (profile: UserProfile) => void }) {
  const initialDate = dateOfBirthParts(profile.date_of_birth);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [birthDay, setBirthDay] = useState(initialDate.day);
  const [birthMonth, setBirthMonth] = useState(initialDate.month);
  const [birthYear, setBirthYear] = useState(initialDate.year);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!fullName.trim()) return setError("Enter your full name.");
    setBusy(true);
    setError("");
    try {
      const dateOfBirth = normalizeDateOfBirth(birthDay, birthMonth, birthYear);
      onSaved(await authService.updateProfile({ fullName, phone, gender, dateOfBirth }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile could not be updated.");
    } finally {
      setBusy(false);
    }
  };
  const digits = (value: string, length: number) => value.replace(/\D/g, "").slice(0, length);
  return <ScreenScroll><PageHeader title="Edit profile" onBack={onBack} /><Text style={styles.formIntro}>Keep your account details up to date for smoother deliveries and support.</Text><View style={styles.editProfileCard}><Field label="Full name" placeholder="Your name" value={fullName} onChange={setFullName} /><Field label="Email address" placeholder="" value={profile.email ?? ""} /><Field label="Mobile number" placeholder="+91 00000 00000" value={phone} onChange={setPhone} /><Dropdown label="Gender" value={gender} placeholder="Choose gender" options={["Female", "Male", "Non-binary", "Prefer not to say"]} onChange={setGender} /><Text style={styles.fieldLabel}>Date of birth</Text><View style={styles.dobRow}><TextInput style={styles.dobField} placeholder="DD" placeholderTextColor={palette.muted} keyboardType="number-pad" maxLength={2} value={birthDay} onChangeText={(value) => { const next = digits(value, 2); setBirthDay(next); if (next.length === 2) monthRef.current?.focus(); }} /><TextInput ref={monthRef} style={styles.dobField} placeholder="MM" placeholderTextColor={palette.muted} keyboardType="number-pad" maxLength={2} value={birthMonth} onChangeText={(value) => { const next = digits(value, 2); setBirthMonth(next); if (next.length === 2) yearRef.current?.focus(); }} /><TextInput ref={yearRef} style={[styles.dobField, styles.dobYear]} placeholder="YYYY" placeholderTextColor={palette.muted} keyboardType="number-pad" maxLength={4} value={birthYear} onChangeText={(value) => setBirthYear(digits(value, 4))} /></View></View>{!!error && <Text style={styles.authError}>{error}</Text>}<PrimaryButton label={busy ? "Saving..." : "Save profile"} onPress={save} disabled={busy} /></ScreenScroll>;
}
