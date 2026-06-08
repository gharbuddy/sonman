import { useRef, type ComponentProps, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import {
  Armchair,
  Basket as ShoppingBasket,
  Bell,
  Camera,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  CreditCard,
  DeviceMobile,
  DeviceTabletSpeaker,
  Gear,
  Heart,
  House,
  MagnifyingGlass,
  MapPin,
  Microphone,
  Minus,
  Package,
  Plus,
  Question,
  ShareNetwork,
  ShieldCheck,
  ShoppingBag,
  SignOut,
  Sneaker,
  Sparkle,
  SquaresFour,
  Tag,
  Truck,
  TShirt,
  UserCircle,
  WashingMachine,
  type Icon,
  type IconWeight,
} from "phosphor-react-native";

export const iconColors = {
  active: "#111827",
  inactive: "#9CA3AF",
  header: "#111827",
  action: "#111827",
  danger: "#E11D48",
  surface: "#F3F4F6",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

export const iconSizes = {
  bottomTab: 27,
  header: 23,
  category: 38,
  action: 21,
  badge: 14,
};

const icons = {
  account: UserCircle,
  appliances: WashingMachine,
  back: CaretLeft,
  bell: Bell,
  camera: Camera,
  cart: ShoppingBag,
  categories: SquaresFour,
  check: Check,
  chevronDown: CaretDown,
  chevronRight: CaretRight,
  delivery: Truck,
  electronics: DeviceTabletSpeaker,
  fashion: TShirt,
  footwear: Sneaker,
  grocery: ShoppingBasket,
  headerProfile: UserCircle,
  heart: Heart,
  help: Question,
  home: House,
  homeLiving: Armchair,
  location: MapPin,
  mic: Microphone,
  mobile: DeviceMobile,
  offer: Tag,
  orders: Package,
  payment: CreditCard,
  plus: Plus,
  minus: Minus,
  search: MagnifyingGlass,
  secureCheckout: ShieldCheck,
  settings: Gear,
  share: ShareNetwork,
  signOut: SignOut,
  sparkle: Sparkle,
  wishlist: Heart,
} satisfies Record<string, Icon>;

export type SonmanIconName = keyof typeof icons;
export type SonmanIconProps = {
  name: SonmanIconName;
  size?: number;
  color?: string;
  weight?: IconWeight;
  style?: ComponentProps<Icon>["style"];
};

export function SonmanIcon({
  name,
  size = iconSizes.action,
  color = iconColors.action,
  weight = "regular",
  style,
}: SonmanIconProps) {
  const IconComponent = icons[name];
  return <IconComponent size={size} color={color} weight={weight} style={style} />;
}

export type IconButtonProps = SonmanIconProps & {
  onPress?: () => void;
  badge?: number;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function IconButton({
  name,
  size = iconSizes.action,
  color = iconColors.action,
  weight = "regular",
  onPress,
  badge,
  label,
  disabled,
  style,
  children,
}: IconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, friction: 5, tension: 180 }).start();
  };

  return (
    <Pressable
      accessibilityLabel={label}
      hitSlop={10}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => press(0.92)}
      onPressOut={() => press(1)}
    >
      <Animated.View style={[iconStyles.iconButton, style, { transform: [{ scale }] }]}>
        {children ?? <SonmanIcon name={name} size={size} color={color} weight={weight} />}
        {!!badge && (
          <View style={iconStyles.badge}>
            <Text style={iconStyles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function CartIconBadge({ count, active }: { count: number; active?: boolean }) {
  return (
    <View>
      <SonmanIcon
        name="cart"
        size={iconSizes.bottomTab}
        color={active ? iconColors.active : iconColors.inactive}
        weight={active ? "fill" : "regular"}
      />
      {!!count && (
        <View style={iconStyles.cartBadge}>
          <Text style={iconStyles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </View>
  );
}

export const bottomNavIcons = {
  home: "home",
  categories: "categories",
  cart: "cart",
  wishlist: "wishlist",
  profile: "account",
} satisfies Record<string, SonmanIconName>;

export const categoryIcons: Record<string, SonmanIconName> = {
  Fashion: "fashion",
  Mobiles: "mobile",
  Electronics: "electronics",
  Grocery: "grocery",
  Beauty: "sparkle",
  Home: "homeLiving",
  Appliances: "appliances",
  Footwear: "footwear",
  "Dry Fruits": "grocery",
  Handicrafts: "sparkle",
  Books: "orders",
  More: "categories",
};

export const checkoutIcons = {
  address: "location",
  delivery: "delivery",
  coupon: "offer",
  payment: "payment",
  notes: "orders",
  secure: "secureCheckout",
} satisfies Record<string, SonmanIconName>;

export const profileIcons = {
  orders: "orders",
  wishlist: "wishlist",
  addresses: "location",
  payments: "payment",
  coupons: "offer",
  notifications: "bell",
  help: "help",
  settings: "settings",
  about: "sparkle",
} satisfies Record<string, SonmanIconName>;

const iconStyles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: iconColors.white,
    borderWidth: 1,
    borderColor: iconColors.border,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: iconColors.danger,
    borderWidth: 1,
    borderColor: iconColors.white,
  },
  cartBadge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: iconColors.danger,
    borderWidth: 1,
    borderColor: iconColors.white,
  },
  badgeText: {
    color: iconColors.white,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
  },
});
