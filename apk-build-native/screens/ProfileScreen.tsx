import { useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { UserProfile } from "@sonman/auth-service";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { authService } from "../auth";
import {
  dateOfBirthParts,
  Dropdown,
  Field,
  formatDateOfBirth,
  normalizeDateOfBirth,
  palette,
  PrimaryButton,
  ScreenScroll,
  styles,
} from "../shared";
import { initials } from "../profile";
import { PageHeader } from "../components/Header";
import { iconColors, profileIcons, SonmanIcon } from "../src/theme/icons";

type SonmanIconName = ComponentProps<typeof SonmanIcon>["name"];

type ProfileMenuRowProps = {
  icon: SonmanIconName;
  title: string;
  subtitle: string;
  onPress?: () => void;
  last?: boolean;
};

function VisibleProfileDetail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[visible.detailRow, last && visible.noBorder]}>
      <Text style={visible.detailLabel}>{label}</Text>
      <Text style={visible.detailValue}>{value}</Text>
    </View>
  );
}

function VisibleProfileRow({ icon, title, subtitle, onPress, last }: ProfileMenuRowProps) {
  return (
    <Pressable style={[visible.menuRow, last && visible.noBorder]} onPress={onPress} disabled={!onPress}>
      <View style={visible.iconBubble}>
        <SonmanIcon name={icon} size={24} color={visibleColors.ink} weight="regular" />
      </View>
      <View style={visible.rowTextWrap}>
        <Text style={visible.rowTitle}>{title}</Text>
        <Text style={visible.rowSubtitle}>{subtitle}</Text>
      </View>
      <SonmanIcon name="chevronRight" size={18} color={visibleColors.muted} weight="regular" />
    </Pressable>
  );
}

export function ProfileScreen({
  profile,
  wishlistCount,
  onEdit,
  onOrders,
  onWishlist,
  onAddresses,
  onHelp,
  onNotifications,
  onNotificationSettings,
  onLogout,
}: {
  profile?: UserProfile;
  wishlistCount: number;
  onEdit: () => void;
  onOrders: () => void;
  onWishlist: () => void;
  onAddresses: () => void;
  onHelp: () => void;
  onNotifications: () => void;
  onNotificationSettings: () => void;
  onLogout: () => void;
}) {
  const [avatarColor, setAvatarColor] = useState(palette.black);
  const changeAvatar = () => setAvatarColor((current) => current === palette.black ? palette.blue : current === palette.blue ? palette.green : palette.black);

  return (
    <ScreenScroll>
      <View style={visible.screen}>
        <Text style={visible.pageTitle}>Your profile</Text>

        <Pressable style={visible.profileCard} onPress={onEdit}>
          <View style={[visible.avatar, { backgroundColor: avatarColor }]}>
            <Text style={visible.avatarText}>{initials(profile?.full_name ?? "")}</Text>
          </View>
          <View style={visible.flex}>
            <Text style={visible.profileName}>{profile?.full_name || "Customer"}</Text>
            <Text style={visible.email}>{profile?.email ?? ""}</Text>
            <Text style={visible.link}>Edit profile</Text>
          </View>
          <SonmanIcon name="chevronRight" size={18} color={iconColors.inactive} weight="regular" />
        </Pressable>

        <Text style={visible.changeAvatar} onPress={changeAvatar}>Change avatar style</Text>

        <View style={visible.detailsCard}>
          <VisibleProfileDetail label="Mobile" value={profile?.phone || "Add number"} />
          <VisibleProfileDetail label="Gender" value={profile?.gender || "Add gender"} />
          <VisibleProfileDetail label="Date of birth" value={formatDateOfBirth(profile?.date_of_birth) || "Add date"} last />
        </View>

        <Text style={visible.sectionLabel}>ACCOUNT</Text>
        <View style={visible.menuCard}>
          <VisibleProfileRow icon={profileIcons.orders} title="My orders" subtitle="Track, replace, or buy again" onPress={onOrders} />
          <VisibleProfileRow icon={profileIcons.wishlist} title="Wishlist" subtitle={`${wishlistCount} saved ${wishlistCount === 1 ? "item" : "items"}`} onPress={onWishlist} />
          <VisibleProfileRow icon={profileIcons.addresses} title="Addresses" subtitle="Add, edit, or choose your default" onPress={onAddresses} />
          <VisibleProfileRow icon={profileIcons.payments} title="Payments" subtitle="UPI apps and manual verification" />
          <VisibleProfileRow icon={profileIcons.coupons} title="Coupons" subtitle="Your available offers" />
          <VisibleProfileRow icon={profileIcons.notifications} title="Notifications" subtitle="View your notification history" onPress={onNotifications} last />
        </View>

        <Text style={visible.sectionLabel}>SUPPORT</Text>
        <View style={visible.menuCard}>
          <VisibleProfileRow icon={profileIcons.help} title="Help center" subtitle="Orders, refunds, and support" onPress={onHelp} />
          <VisibleProfileRow icon={profileIcons.settings} title="Notification settings" subtitle="Choose which push alerts you receive" onPress={onNotificationSettings} />
          <VisibleProfileRow icon={profileIcons.about} title="About Sonman" subtitle="Local commerce, delivered with care" last />
        </View>

        <Text style={visible.signOut} onPress={onLogout}>Logout</Text>
      </View>
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

  return (
    <ScreenScroll>
      <View style={visible.screen}>
        <PageHeader title="Edit profile" onBack={onBack} />
        <Text style={visible.formIntro}>Keep your account details up to date for smoother deliveries and support.</Text>
        <View style={visible.editProfileCard}>
          <Field label="Full name" placeholder="Your name" value={fullName} onChange={setFullName} />
          <Field label="Email address" placeholder="" value={profile.email ?? ""} />
          <Field label="Mobile number" placeholder="+91 00000 00000" value={phone} onChange={setPhone} />
          <Dropdown label="Gender" value={gender} placeholder="Choose gender" options={["Female", "Male", "Non-binary", "Prefer not to say"]} onChange={setGender} />
          <Text style={styles.fieldLabel}>Date of birth</Text>
          <View style={styles.dobRow}>
            <TextInput style={styles.dobField} placeholder="DD" placeholderTextColor={palette.muted} keyboardType="number-pad" maxLength={2} value={birthDay} onChangeText={(value) => { const next = digits(value, 2); setBirthDay(next); if (next.length === 2) monthRef.current?.focus(); }} />
            <TextInput ref={monthRef} style={styles.dobField} placeholder="MM" placeholderTextColor={palette.muted} keyboardType="number-pad" maxLength={2} value={birthMonth} onChangeText={(value) => { const next = digits(value, 2); setBirthMonth(next); if (next.length === 2) yearRef.current?.focus(); }} />
            <TextInput ref={yearRef} style={[styles.dobField, styles.dobYear]} placeholder="YYYY" placeholderTextColor={palette.muted} keyboardType="number-pad" maxLength={4} value={birthYear} onChangeText={(value) => setBirthYear(digits(value, 4))} />
          </View>
        </View>
        {!!error && <Text style={styles.authError}>{error}</Text>}
        <PrimaryButton label={busy ? "Saving..." : "Save profile"} onPress={save} disabled={busy} />
      </View>
    </ScreenScroll>
  );
}

const visibleColors = {
  background: "#FFFFFF",
  card: "#FFFFFF",
  ink: "#111827",
  text: "#374151",
  muted: "#6B7280",
  soft: "#F8FAFC",
  border: "#E5E7EB",
  accent: "#B8860B",
  blue: "#1683D8",
  danger: "#B91C1C",
};

const visible = StyleSheet.create({
  screen: {
    backgroundColor: visibleColors.background,
    minHeight: "100%",
    paddingBottom: 28,
  },
  pageTitle: {
    color: visibleColors.ink,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: visibleColors.card,
    borderWidth: 1,
    borderColor: visibleColors.border,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  flex: {
    flex: 1,
  },
  profileName: {
    color: visibleColors.ink,
    fontSize: 22,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  email: {
    color: visibleColors.text,
    fontSize: 15,
    marginTop: 3,
  },
  link: {
    color: visibleColors.accent,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  changeAvatar: {
    color: visibleColors.blue,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 16,
  },
  detailsCard: {
    backgroundColor: visibleColors.card,
    borderWidth: 1,
    borderColor: visibleColors.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  detailRow: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: visibleColors.border,
  },
  detailLabel: {
    color: visibleColors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  detailValue: {
    color: visibleColors.ink,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  sectionLabel: {
    color: visibleColors.muted,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 28,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: visibleColors.card,
    borderWidth: 1,
    borderColor: visibleColors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  menuRow: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: visibleColors.border,
    gap: 14,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: visibleColors.soft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: visibleColors.border,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: visibleColors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  rowSubtitle: {
    color: visibleColors.text,
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  signOut: {
    color: visibleColors.danger,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 22,
  },
  formIntro: {
    color: visibleColors.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 14,
  },
  editProfileCard: {
    backgroundColor: visibleColors.card,
    borderWidth: 1,
    borderColor: visibleColors.border,
    borderRadius: 18,
    padding: 16,
  },
});
