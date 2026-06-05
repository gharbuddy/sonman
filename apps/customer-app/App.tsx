import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UserProfile } from "@sonman/auth-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationHistoryScreen, NotificationSettingsScreen, usePushNotifications } from "@sonman/notifications-service";
import { Animated } from "react-native";
import { authService } from "./auth";
import { createCustomerOrdersService, type CustomerOrder } from "./orders";
import { loadActiveProducts, type CustomerProduct as Product } from "./products";
import { quoteDelivery } from "./delivery";
import { addressText, createCustomerProfileService, type CustomerAddress } from "./profile";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
import { BottomNav } from "./components/BottomNav";
import { SafeLayout, type Screen } from "./shared";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/SonmanAIScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen, CategoriesScreen, ListingScreen } from "./screens/HomeScreen";
import { ProductDetailScreen } from "./screens/ProductDetailScreen";
import { CartScreen } from "./screens/CartScreen";
import { CheckoutScreen, PaymentConfirmationScreen } from "./screens/CheckoutScreen";
import { OrdersScreen } from "./screens/OrdersScreen";
import { WishlistScreen } from "./screens/WishlistScreen";
import { ProfileScreen, EditProfileScreen } from "./screens/ProfileScreen";
import { AddressScreen, AddressFormScreen } from "./screens/AddressScreen";
import { HelpCenterScreen } from "./screens/HelpCenterScreen";

const CHECKOUT_DISTANCE_KM = 0;
const WISHLIST_STORAGE_KEY = "sonman.customer.wishlist";
const SONMAN_UPI_ID = process.env.EXPO_PUBLIC_SONMAN_UPI_ID ?? "yourupi@bank";
const PAYMENT_GATEWAY = process.env.EXPO_PUBLIC_PAYMENT_GATEWAY ?? "upi";
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [screen, setScreen] = useState<Screen>("splash");
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const [launchReady, setLaunchReady] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState("");
  const [selected, setSelected] = useState<Product>();
  const [category, setCategory] = useState("Trending");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [orderError, setOrderError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [profile, setProfile] = useState<UserProfile>();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress>();
  const ordersService = useMemo(() => createCustomerOrdersService(authService.supabase), []);
  const profileService = useMemo(() => createCustomerProfileService(authService.supabase), []);
  const defaultAddress = addresses.find((address) => address.isDefault);
  usePushNotifications(authService.supabase, authenticated, "customer");
  const loadProfile = async () => {
    const [nextProfile, nextAddresses] = await Promise.all([profileService.getProfile(), profileService.listAddresses()]);
    setProfile(nextProfile);
    setAddresses(nextAddresses);
  };

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashElapsed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minimumSplashElapsed || checkingSession) return;
    Animated.timing(splashOpacity, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => {
      setScreen((current) => current === "splash" ? "onboarding" : current);
      setLaunchReady(true);
    });
  }, [checkingSession, minimumSplashElapsed, splashOpacity]);

  useEffect(() => {
    const completeAuthCallback = (url: string) => {
      if (!url.includes("auth/callback")) return;
      void authService.completeOAuthLogin(url, "customer")
        .then(() => {
          setAuthenticated(true);
          setScreen("home");
        })
        .catch(() => setScreen("login"));
    };
    void Linking.getInitialURL().then((url) => url && completeAuthCallback(url));
    const subscription = Linking.addEventListener("url", ({ url }) => completeAuthCallback(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    loadActiveProducts(authService.supabase)
      .then(setProducts)
      .catch((cause) => setProductsError(cause instanceof Error ? cause.message : "Products could not be loaded."));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(WISHLIST_STORAGE_KEY)
      .then((value) => setWishlist(value ? JSON.parse(value) as string[] : []))
      .catch(() => setWishlist([]));
  }, []);

  useEffect(() => {
    authService.restoreSession("customer")
      .then((auth) => {
        if (auth) {
          setAuthenticated(true);
          setScreen("home");
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
    const subscription = authService.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setAuthenticated(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    Promise.all([ordersService.loadCart(), ordersService.listOrders(), loadProfile()])
      .then(([nextCart, nextOrders]) => {
        setCart(nextCart);
        setOrders(nextOrders);
      })
      .catch((cause) => setOrderError(cause instanceof Error ? cause.message : "Ordering data could not be loaded."));
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    const channel = authService.supabase.channel("customer-order-lifecycle")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void ordersService.listOrders()
          .then(setOrders)
          .catch((cause) => setOrderError(cause instanceof Error ? cause.message : "Orders could not be refreshed."));
      })
      .subscribe();
    return () => { void authService.supabase.removeChannel(channel); };
  }, [authenticated]);

  const openListing = (nextCategory = "Trending") => {
    setCategory(nextCategory);
    setScreen("listing");
  };
  const openProduct = (product: Product) => {
    setSelected(product);
    setScreen("details");
  };
  const setCartQuantity = async (id: string, quantity: number) => {
    const previous = cart;
    setOrderError("");
    setCart((current) => {
      const next = { ...current };
      if (quantity > 0) next[id] = quantity;
      else delete next[id];
      return next;
    });
    try {
      if (!authenticated) return;
      await ordersService.setCartItem(id, quantity);
    } catch (cause) {
      setCart(previous);
      setOrderError(cause instanceof Error ? cause.message : "Cart could not be updated.");
    }
  };
  const toggleCart = (id: string) => void setCartQuantity(id, cart[id] ? 0 : 1);
  const toggleWishlist = (id: string) => {
    setWishlist((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      void AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };
  const openUpiPayment = async () => {
    setPlacingOrder(true);
    setOrderError("");
    try {
      if (!authenticated) {
        setScreen("login");
        throw new Error("Sign in to place your order.");
      }
      if (!defaultAddress) throw new Error("Add a default delivery address before placing your order.");
      if (PAYMENT_GATEWAY !== "upi") throw new Error("UPI payment is not enabled for this build.");
      if (!SONMAN_UPI_ID || SONMAN_UPI_ID === "yourupi@bank") throw new Error("Sonman UPI ID is not configured.");
      const totalAmount = subtotal + (deliveryQuote.fee ?? 0);
      const params = new URLSearchParams({
        pa: SONMAN_UPI_ID,
        pn: "Sonman",
        am: totalAmount.toFixed(2),
        cu: "INR",
        tn: "Sonman Order",
      });
      await Linking.openURL(`upi://pay?${params.toString()}`);
      setScreen("payment-confirmation");
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : "Payment could not be opened. Your order was not created.");
    } finally {
      setPlacingOrder(false);
    }
  };
  const confirmUpiPayment = async (paymentReference?: string) => {
    setPlacingOrder(true);
    setOrderError("");
    try {
      if (!authenticated) {
        setScreen("login");
        throw new Error("Sign in to place your order.");
      }
      if (!defaultAddress) throw new Error("Add a default delivery address before placing your order.");
      await ordersService.placeOrder({
        id: defaultAddress.id,
        label: defaultAddress.label,
        recipient_name: defaultAddress.recipientName,
        address: addressText(defaultAddress),
      }, CHECKOUT_DISTANCE_KM, paymentReference);
      setCart({});
      setOrders(await ordersService.listOrders());
      setOrderError("Order placed. Payment is pending verification.");
      setScreen("orders");
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : "Order could not be created. Your cart is unchanged.");
    } finally {
      setPlacingOrder(false);
    }
  };
  const cancelUpiPayment = () => {
    setOrderError("Payment cancelled. Your cart is unchanged.");
    setScreen("checkout");
  };
  const cartProducts = products.filter((product) => cart[product.id]);
  const wishlistProducts = products.filter((product) => wishlist.includes(product.id));
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price * cart[product.id], 0);
  const deliveryQuote = quoteDelivery(cartProducts, CHECKOUT_DISTANCE_KM);

  if (!fontsLoaded || !launchReady) return <SafeLayout><SplashScreen opacity={splashOpacity} /></SafeLayout>;
  if (screen === "onboarding") return <SafeLayout><OnboardingScreen onContinue={() => setScreen("home")} /></SafeLayout>;
  if (screen === "login" || screen === "signup") {
    return (
      <SafeLayout>
        <LoginScreen
          mode={screen}
          onAuthenticated={() => {
            setAuthenticated(true);
            setScreen("home");
          }}
          onSwitch={() => setScreen(screen === "login" ? "signup" : "login")}
        />
      </SafeLayout>
    );
  }
  return (
    <SafeLayout>
      {screen === "home" && <HomeScreen profile={profile} address={defaultAddress} products={products} productsError={productsError} wishlist={wishlist} onWishlist={toggleWishlist} onProfile={() => setScreen("profile")} onAddresses={() => setScreen("addresses")} onCategories={() => setScreen("categories")} onListing={openListing} onProduct={openProduct} />}
      {screen === "categories" && <CategoriesScreen onBack={() => setScreen("home")} onCategory={openListing} />}
      {screen === "listing" && <ListingScreen products={products} category={category} wishlist={wishlist} onWishlist={toggleWishlist} onBack={() => setScreen("home")} onProduct={openProduct} />}
      {screen === "details" && selected && (
        <ProductDetailScreen
          product={selected}
          products={products}
          inCart={!!cart[selected.id]}
          saved={wishlist.includes(selected.id)}
          onProduct={openProduct}
          onBack={() => setScreen("listing")}
          onCart={() => toggleCart(selected.id)}
          onWishlist={() => toggleWishlist(selected.id)}
          onBuy={() => {
            if (!cart[selected.id]) toggleCart(selected.id);
            setScreen("cart");
          }}
        />
      )}
      {screen === "cart" && <CartScreen items={cartProducts} savedItems={wishlistProducts} products={products} quantities={cart} subtotal={subtotal} error={orderError} onQuantity={setCartQuantity} onSaveLater={(id) => { if (!wishlist.includes(id)) toggleWishlist(id); void setCartQuantity(id, 0); }} onProduct={openProduct} onCheckout={() => setScreen("checkout")} />}
      {screen === "checkout" && <CheckoutScreen address={defaultAddress} items={cartProducts} quantities={cart} subtotal={subtotal} quote={deliveryQuote} busy={placingOrder} error={orderError} onBack={() => setScreen("cart")} onAddresses={() => setScreen("addresses")} onPlaceOrder={openUpiPayment} />}
      {screen === "payment-confirmation" && <PaymentConfirmationScreen total={subtotal + (deliveryQuote.fee ?? 0)} busy={placingOrder} error={orderError} onPaid={confirmUpiPayment} onFailed={cancelUpiPayment} />}
      {screen === "orders" && <OrdersScreen orders={orders} error={orderError} />}
      {screen === "wishlist" && <WishlistScreen items={wishlistProducts} wishlist={wishlist} onBack={() => setScreen("profile")} onWishlist={toggleWishlist} onProduct={openProduct} />}
      {screen === "profile" && (authenticated ? <ProfileScreen profile={profile} wishlistCount={wishlist.length} onEdit={() => setScreen("edit-profile")} onOrders={() => setScreen("orders")} onWishlist={() => setScreen("wishlist")} onAddresses={() => setScreen("addresses")} onHelp={() => setScreen("help")} onNotifications={() => setScreen("notifications")} onNotificationSettings={() => setScreen("notification-settings")} onLogout={async () => { await authService.logout(); setScreen("login"); }} /> : <LoginScreen mode="login" onAuthenticated={() => { setAuthenticated(true); setScreen("home"); }} onSwitch={() => setScreen("signup")} />)}
      {screen === "edit-profile" && profile && <EditProfileScreen profile={profile} onBack={() => setScreen("profile")} onSaved={(next) => { setProfile(next); setScreen("profile"); }} />}
      {screen === "addresses" && <AddressScreen addresses={addresses} onBack={() => setScreen("profile")} onAdd={() => { setEditingAddress(undefined); setScreen("address-form"); }} onEdit={(address) => { setEditingAddress(address); setScreen("address-form"); }} onDelete={async (id) => { await profileService.deleteAddress(id); await loadProfile(); }} onDefault={async (id) => { await profileService.setDefaultAddress(id); await loadProfile(); }} />}
      {screen === "address-form" && <AddressFormScreen address={editingAddress} onBack={() => setScreen("addresses")} onSaved={async () => { await loadProfile(); setScreen("addresses"); }} />}
      {screen === "help" && <HelpCenterScreen onBack={() => setScreen("profile")} />}
      {screen === "notifications" && <NotificationHistoryScreen supabase={authService.supabase} onBack={() => setScreen("profile")} />}
      {screen === "notification-settings" && <NotificationSettingsScreen supabase={authService.supabase} app="customer" onBack={() => setScreen("profile")} />}
      <BottomNav screen={screen} count={cartCount} onNavigate={setScreen} />
    </SafeLayout>
  );
}
