import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Screen } from "../shared";
import { BOTTOM_NAV_HEIGHT, MIN_ANDROID_BOTTOM_INSET, styles } from "../shared";
import { bottomNavIcons, CartIconBadge, iconColors, iconSizes, SonmanIcon } from "../src/theme/icons";

export function BottomNav({ screen, count, onNavigate }: { screen: Screen; count: number; onNavigate: (screen: Screen) => void }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_ANDROID_BOTTOM_INSET);
  const nav = [["Home", "home"], ["Categories", "categories"], ["Cart", "cart"], ["Wishlist", "wishlist"], ["Profile", "profile"]] as const;

  return (
    <View style={[styles.bottomNav, { height: BOTTOM_NAV_HEIGHT + bottomInset, paddingBottom: bottomInset }]}>
      {nav.map(([label, target]) => {
        const active = screen === target;
        const icon = bottomNavIcons[target];
        return (
          <Pressable key={target} hitSlop={10} style={styles.navItem} onPress={() => onNavigate(target)}>
            <View style={[styles.navIconPill, active && styles.navIconPillActive]}>
              {target === "cart" ? (
                <CartIconBadge count={count} active={active} />
              ) : (
                <SonmanIcon
                  name={icon}
                  size={iconSizes.bottomTab}
                  color={active ? iconColors.active : iconColors.inactive}
                  weight={active ? "fill" : "regular"}
                />
              )}
            </View>
            <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
