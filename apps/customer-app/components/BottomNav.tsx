import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Screen } from "../shared";
import { BOTTOM_NAV_HEIGHT, MIN_ANDROID_BOTTOM_INSET, styles } from "../shared";

export function BottomNav({ screen, count, onNavigate }: { screen: Screen; count: number; onNavigate: (screen: Screen) => void }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_ANDROID_BOTTOM_INSET);
  const nav = [["⌂", "Home", "home"], ["▦", "Categories", "categories"], ["🛒", "Cart", "cart"], ["▤", "Orders", "orders"], ["☻", "Account", "profile"]] as const;

  return (
    <View style={[styles.bottomNav, { height: BOTTOM_NAV_HEIGHT + bottomInset, paddingBottom: bottomInset }]}>
      {nav.map(([icon, label, target]) => (
        <Pressable key={target} hitSlop={10} style={styles.navItem} onPress={() => onNavigate(target)}>
          <View>
            <Text style={[styles.navIcon, screen === target && styles.navActive]}>{icon}</Text>
            {target === "cart" && count > 0 && <Text style={styles.cartCount}>{count}</Text>}
          </View>
          <Text style={[styles.navLabel, screen === target && styles.navActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
