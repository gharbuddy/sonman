import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import type { CustomerProduct as Product } from "../products";
import { CompactProduct, discount, money, ScreenShell } from "../shared";
import { PageHeader } from "../components/Header";
import { iconColors, iconSizes, SonmanIcon, type SonmanIconName } from "../src/theme/icons";

const INK = "#111827";
const TEXT = "#374151";
const MUTED = "#6B7280";
const BG = "#F6F7FB";
const CARD = "#FFFFFF";
const LINE = "#E5E7EB";
const BLUE = "#0B74FF";
const GREEN = "#059669";
const YELLOW = "#FFD814";
const ORANGE = "#FFA41C";
const STAR = "#F59E0B";
const RED = "#DC2626";

const rupee = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export function ProductDetailScreen({
  product,
  products,
  inCart,
  saved,
  onBack,
  onCart,
  onWishlist,
  onBuy,
  onProduct,
}: {
  product: Product;
  products: Product[];
  inCart: boolean;
  saved: boolean;
  onBack: () => void;
  onCart: () => void;
  onWishlist: () => void;
  onBuy: () => void;
  onProduct: (product: Product) => void;
}) {
  const { width } = useWindowDimensions();
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const gallery = images.length ? images : [""];
  const [imageIndex, setImageIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [variant, setVariant] = useState(product.variants?.[0] ?? "");
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [sellerOpen, setSellerOpen] = useState(false);

  const rating = product.rating || 0;
  const reviews = product.reviews || 0;
  const sold = Math.max(50, Math.round((reviews || 32) * 1.6));
  const off = discount(product);
  const sellerName = `Seller ${product.vendorId.slice(0, 8).toUpperCase()}`;
  const hasOldPrice = product.oldPrice > product.price;
  const heroWidth = width;
  const heroHeight = Math.min(360, Math.max(280, Math.round(width * 0.78)));

  const sellerProducts = useMemo(
    () => products.filter((item) => item.vendorId === product.vendorId && item.id !== product.id).slice(0, 10),
    [products, product.vendorId, product.id],
  );

  const similar = useMemo(
    () => products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 10),
    [products, product.id, product.category],
  );

  useEffect(() => {
    setImageIndex(0);
    setViewerOpen(false);
  }, [product.id]);

  const checkDelivery = () => {
    setDeliveryMessage(pincode.length === 6 ? "Delivery available. Exact date and charge will show at checkout." : "Enter a valid 6 digit pincode.");
  };

  const shareProduct = () => void Share.share({ message: `${product.name} - ${money(product.price)} on Sonman` });

  return (
    <ScreenShell contentContainerStyle={s.screen}>
      <PageHeader title="Product details" onBack={onBack} />

      <View style={s.topBlock}>
        <View style={s.sellerRatingRow}>
          <Pressable onPress={() => setSellerOpen((current) => !current)} style={s.sellerWrap}>
            <Text style={s.sellerLabel}>Seller: </Text>
            <Text style={s.sellerLink}>{sellerName}</Text>
          </Pressable>
          <View style={s.ratingWrap}>
            <Text style={s.stars}>{rating ? "★★★★★" : "☆☆☆☆☆"}</Text>
            <Text style={s.ratingText}>{reviews ? `${rating.toFixed(1)} (${reviews})` : "New"}</Text>
          </View>
        </View>

        <Text style={s.title}>{product.name}</Text>
        <Text style={s.bought}>{sold}+ bought in past month</Text>
      </View>

      {sellerOpen && (
        <View style={s.sellerPanel}>
          <View style={s.sellerPanelTop}>
            <View>
              <Text style={s.sellerPanelTitle}>{sellerName}</Text>
              <Text style={s.sellerPanelSub}>Verified local Sonman seller</Text>
            </View>
            <Text style={s.sellerPanelBadge}>Verified</Text>
          </View>
          {sellerProducts.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalGap}>
              {sellerProducts.map((item) => <CompactProduct key={item.id} product={item} onPress={() => onProduct(item)} />)}
            </ScrollView>
          ) : (
            <Text style={s.emptySeller}>More products from this seller will appear here.</Text>
          )}
        </View>
      )}

      <View style={[s.imageStage, { height: heroHeight }]}>
        <ProductImageCarousel
          images={gallery}
          width={heroWidth}
          height={heroHeight}
          index={imageIndex}
          onIndexChange={setImageIndex}
          onOpen={() => setViewerOpen(true)}
        />
        {off > 0 && <View style={s.discountCircle}><Text style={s.discountCircleText}>{off}%{`\n`}off</Text></View>}
      </View>

      <View style={s.galleryActionRow}>
        <Text style={s.imageCount}>{imageIndex + 1} / {gallery.length}</Text>
        <View style={s.galleryButtons}>
          <Pressable style={s.textActionButton} onPress={onWishlist}>
            <SonmanIcon name="wishlist" size={iconSizes.action} color={saved ? iconColors.danger : iconColors.action} weight={saved ? "fill" : "regular"} />
            <Text style={s.textActionLabel}>{saved ? "Wishlisted" : "Add to wishlist"}</Text>
          </Pressable>
          <Pressable style={s.textActionButton} onPress={shareProduct}>
            <SonmanIcon name="share" size={iconSizes.action} color={iconColors.action} weight="regular" />
            <Text style={s.textActionLabel}>Share</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.priceBlock}>
        <View style={s.priceLine}>
          <Text style={s.rupeeSymbol}>₹</Text>
          <Text style={s.price}>{Number(product.price || 0).toLocaleString("en-IN")}</Text>
          {off > 0 && <View style={s.priceOffPill}><Text style={s.priceOffText}>{off}% OFF</Text></View>}
        </View>
        {hasOldPrice && (
          <View style={s.mrpRow}>
            <Text style={s.mrpLabel}>M.R.P.</Text>
            <Text style={s.oldPrice}>{rupee(product.oldPrice)}</Text>
          </View>
        )}
        <Text style={s.taxText}>Inclusive of all taxes</Text>
        <Text style={s.payText}>Secure prepaid checkout. UPI and online payment supported.</Text>
      </View>

      <View style={s.actionBlock}>
        <Pressable style={[s.mainButton, s.cartButton]} onPress={onCart}>
          <SonmanIcon name="cart" size={iconSizes.action} color={iconColors.action} weight="fill" />
          <Text style={s.mainButtonText}>{inCart ? "Remove from Cart" : "Add to Cart"}</Text>
        </Pressable>
        <Pressable style={[s.mainButton, s.buyButton]} onPress={onBuy}>
          <Text style={s.mainButtonText}>Buy Now</Text>
        </Pressable>
      </View>

      <Section title="Shop with confidence">
        <View style={s.confidenceGrid}>
          <TrustItem icon="secureCheckout" title="Secure payment" />
          <TrustItem icon="share" title="Easy replacement" />
          <TrustItem icon="delivery" title="Local delivery" />
          <TrustItem icon="check" title="Verified seller" />
        </View>
      </Section>

      <Section title="Delivery">
        <View style={s.deliveryCard}>
          <View style={s.deliveryTop}>
            <View style={s.deliveryIcon}><SonmanIcon name="location" size={iconSizes.category} color={BLUE} weight="duotone" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.deliveryTitle}>Standard delivery available</Text>
              <Text style={s.deliverySub}>No same day delivery. Exact delivery date appears at checkout.</Text>
            </View>
          </View>
          <View style={s.pinRow}>
            <TextInput
              value={pincode}
              onChangeText={(value) => setPincode(value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 digit pincode"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              style={s.pinInput}
            />
            <Pressable style={s.checkButton} onPress={checkDelivery}><Text style={s.checkText}>Check</Text></Pressable>
          </View>
          {!!deliveryMessage && <Text style={[s.deliveryMessage, pincode.length === 6 ? s.green : s.red]}>{deliveryMessage}</Text>}
        </View>
      </Section>

      <Section title="Offers for you">
        <View style={s.offerGrid}>
          <OfferRow title="Launch price" subtitle="Best available Sonman price for this product" tag="SAVE" value={off > 0 ? `${off}% off` : "Active"} />
          <OfferRow title="Pay online" subtitle="UPI and online payment supported" tag="FAST" value="Prepaid" />
          <OfferRow title="Replacement" subtitle="Support for damaged or wrong item" tag="SAFE" value="Covered" />
        </View>
      </Section>

      {!!product.variants?.length && (
        <Section title="Choose option">
          <View style={s.variantWrap}>
            {product.variants.map((option) => (
              <Pressable key={option} style={[s.variant, variant === option && s.variantActive]} onPress={() => setVariant(option)}>
                <Text style={[s.variantText, variant === option && s.variantTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Section>
      )}

      <Section title="Product details">
        <View style={s.detailCard}>
          <Bullet text={product.description || "Product selected for Sonman customers."} />
          <Bullet text={`Category: ${product.category || "General"}`} />
          <Bullet text={`Shipping class: ${product.deliverySize}`} />
          <Bullet text="Replacement allowed for damaged, defective, or incorrect products reported at delivery." />
        </View>
      </Section>

      <Section title="Customer pulse">
        <View style={s.pulseCard}>
          <View style={s.pulseLeft}>
            <Text style={s.pulseScore}>{rating ? rating.toFixed(1) : "New"}</Text>
            <Text style={s.pulseLabel}>{reviews ? `${reviews} verified reviews` : "First reviews coming soon"}</Text>
          </View>
          <View style={s.pulseRight}>
            <PulseBar label="Quality" value={reviews ? 86 : 64} />
            <PulseBar label="Value" value={reviews ? 78 : 58} />
            <PulseBar label="Delivery" value={reviews ? 82 : 61} />
          </View>
        </View>
      </Section>

      {!!images.length && (
        <Section title="Customer photos">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalGap}>
            {images.slice(0, 6).map((image, index) => <Image key={`${image}-${index}`} source={{ uri: image }} style={s.customerPhoto} />)}
          </ScrollView>
        </Section>
      )}

      {!!similar.length && (
        <Section title="People also bought">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalGap}>
            {similar.map((item) => <CompactProduct key={item.id} product={item} onPress={() => onProduct(item)} />)}
          </ScrollView>
        </Section>
      )}

      <FullscreenImageViewer images={gallery} initialIndex={imageIndex} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </ScreenShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>;
}

function TrustItem({ icon, title }: { icon: SonmanIconName; title: string }) {
  return <View style={s.trustItem}><SonmanIcon name={icon} size={iconSizes.action} color={BLUE} weight="duotone" /><Text style={s.trustTitle}>{title}</Text></View>;
}

function OfferRow({ title, subtitle, tag, value }: { title: string; subtitle: string; tag: string; value: string }) {
  return (
    <View style={s.offerCard}>
      <View style={s.offerTopLine}>
        <View style={s.offerTag}><Text style={s.offerTagText}>{tag}</Text></View>
        <Text style={s.offerValue}>{value}</Text>
      </View>
      <Text style={s.offerTitle}>{title}</Text>
      <Text style={s.offerSub}>{subtitle}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return <View style={s.bulletRow}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{text}</Text></View>;
}

function PulseBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.pulseBarRow}>
      <View style={s.pulseBarTop}><Text style={s.pulseBarLabel}>{label}</Text><Text style={s.pulseBarValue}>{value}%</Text></View>
      <View style={s.pulseTrack}><View style={[s.pulseFill, { width: `${value}%` }]} /></View>
    </View>
  );
}

const loopImages = (images: string[]) => images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images;
const loopStart = (images: string[]) => images.length > 1 ? 1 : 0;
const loopToImageIndex = (loopIndex: number, imageCount: number) => {
  if (imageCount <= 1) return 0;
  if (loopIndex === 0) return imageCount - 1;
  if (loopIndex === imageCount + 1) return 0;
  return loopIndex - 1;
};
const imageToLoopIndex = (imageIndex: number, imageCount: number) => imageCount > 1 ? imageIndex + 1 : 0;

function PaginationDots({ count, index, light }: { count: number; index: number; light?: boolean }) {
  if (count <= 1) return null;
  return (
    <View style={s.dots}>
      {Array.from({ length: count }).map((_, dotIndex) => (
        <View
          key={dotIndex}
          style={[
            s.dot,
            light && s.dotLight,
            dotIndex === index && s.dotActive,
            light && dotIndex === index && s.dotActiveLight,
          ]}
        />
      ))}
    </View>
  );
}

function ProductImageCarousel({
  images,
  width,
  height,
  index,
  onIndexChange,
  onOpen,
}: {
  images: string[];
  width: number;
  height: number;
  index: number;
  onIndexChange: (index: number) => void;
  onOpen: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const loopedImages = useMemo(() => loopImages(images), [images]);
  const hasLoop = images.length > 1;

  useEffect(() => {
    const handle = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: imageToLoopIndex(index, images.length) * width, animated: false });
    }, 0);
    return () => clearTimeout(handle);
  }, [images.length, index, width]);

  const finishScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const loopIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    const nextIndex = loopToImageIndex(loopIndex, images.length);
    onIndexChange(nextIndex);

    if (!hasLoop) return;
    if (loopIndex === 0 || loopIndex === images.length + 1) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: imageToLoopIndex(nextIndex, images.length) * width, animated: false });
      });
    }
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={finishScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: loopStart(images) * width, y: 0 }}
      >
        {loopedImages.map((image, loopIndex) => (
          <Pressable
            key={`${image}-${loopIndex}`}
            onPress={onOpen}
            style={[s.imageSlide, { width, height }]}
          >
            {image ? <Image source={{ uri: image }} style={s.productImage} resizeMode="contain" /> : <Text style={s.noImage}>No image</Text>}
          </Pressable>
        ))}
      </ScrollView>
      <PaginationDots count={images.length} index={index} />
    </>
  );
}

export function FullscreenImageViewer({ images, initialIndex, visible, onClose }: { images: string[]; initialIndex: number; visible: boolean; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const loopedImages = useMemo(() => loopImages(images), [images]);
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const baseScale = useRef(1);
  const distance = useRef(0);
  const hasLoop = images.length > 1;

  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    setScale(1);
    scaleRef.current = 1;
    baseScale.current = 1;
    const handle = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: imageToLoopIndex(initialIndex, images.length) * width, animated: false });
    }, 0);
    return () => clearTimeout(handle);
  }, [images.length, initialIndex, visible, width]);

  const touchDistance = (touches: readonly { pageX: number; pageY: number }[]) =>
    touches.length < 2 ? 0 : Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

  const setZoom = (nextScale: number) => {
    const bounded = Math.max(1, Math.min(4, nextScale));
    scaleRef.current = bounded;
    setScale(bounded);
  };

  const finishScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const loopIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    const nextIndex = loopToImageIndex(loopIndex, images.length);
    setIndex(nextIndex);
    setZoom(1);
    baseScale.current = 1;

    if (!hasLoop) return;
    if (loopIndex === 0 || loopIndex === images.length + 1) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: imageToLoopIndex(nextIndex, images.length) * width, animated: false });
      });
    }
  };

  const startTouch = (event: NativeSyntheticEvent<{ touches: readonly { pageX: number; pageY: number }[] }>) => {
    distance.current = touchDistance(event.nativeEvent.touches);
    baseScale.current = scaleRef.current;
  };

  const moveTouch = (event: NativeSyntheticEvent<{ touches: readonly { pageX: number; pageY: number }[] }>) => {
    const nextDistance = touchDistance(event.nativeEvent.touches);
    if (!distance.current || !nextDistance) return;
    setZoom(baseScale.current * (nextDistance / distance.current));
  };

  const endTouch = () => {
    distance.current = 0;
    baseScale.current = scaleRef.current;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={s.viewer}>
        <View style={s.viewerHeader}>
          <Text style={s.viewerCounter}>{index + 1} / {images.length}</Text>
          <Text style={s.viewerClose} onPress={onClose}>Close</Text>
        </View>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={scale === 1}
          scrollEnabled={scale === 1}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: loopStart(images) * width, y: 0 }}
          onMomentumScrollEnd={finishScroll}
          scrollEventThrottle={16}
        >
          {loopedImages.map((image, loopIndex) => {
            const imageIndex = loopToImageIndex(loopIndex, images.length);
            return (
            <View
              key={`${image}-${loopIndex}`}
              style={[s.viewerSlide, { width, height }]}
              onTouchStart={startTouch}
              onTouchMove={moveTouch}
              onTouchEnd={endTouch}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  resizeMode="contain"
                  style={[s.viewerImage, { transform: [{ scale: imageIndex === index ? scale : 1 }] }]}
                />
              ) : (
                <Text style={s.viewerEmpty}>No image</Text>
              )}
            </View>
            );
          })}
        </ScrollView>
        <PaginationDots count={images.length} index={index} light />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { backgroundColor: BG, paddingHorizontal: 0, paddingTop: 14, paddingBottom: 34 },
  topBlock: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  sellerRatingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 },
  sellerWrap: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  sellerLabel: { color: MUTED, fontSize: 14, fontWeight: "700" },
  sellerLink: { color: BLUE, fontSize: 14, fontWeight: "900" },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  stars: { color: STAR, fontSize: 15, fontWeight: "900" },
  ratingText: { color: INK, fontSize: 13, fontWeight: "800" },
  title: { color: INK, fontSize: 23, lineHeight: 30, fontWeight: "900" },
  bought: { color: INK, fontSize: 15, fontWeight: "900", marginTop: 14 },
  sellerPanel: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  sellerPanelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sellerPanelTitle: { color: INK, fontSize: 15, fontWeight: "900" },
  sellerPanelSub: { color: MUTED, fontSize: 12, fontWeight: "700", marginTop: 2 },
  sellerPanelBadge: { color: GREEN, fontSize: 11, fontWeight: "900", backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  emptySeller: { color: MUTED, fontSize: 12, fontWeight: "700" },
  imageStage: { width: "100%", backgroundColor: CARD, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE },
  imageSlide: { alignItems: "center", justifyContent: "center", backgroundColor: CARD },
  productImage: { width: "100%", height: "100%" },
  noImage: { color: MUTED, fontSize: 16, fontWeight: "800" },
  discountCircle: { position: "absolute", left: 16, top: 18, width: 58, height: 58, borderRadius: 29, backgroundColor: "#C2410C", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  discountCircleText: { color: CARD, fontSize: 13, fontWeight: "900", textAlign: "center", lineHeight: 15 },
  dots: { position: "absolute", left: 0, right: 0, bottom: 12, flexDirection: "row", justifyContent: "center", gap: 9 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#9CA3AF" },
  dotLight: { backgroundColor: "rgba(255,255,255,0.42)" },
  dotActive: { backgroundColor: "#000000", width: 10, height: 10 },
  dotActiveLight: { backgroundColor: CARD },
  galleryActionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: CARD, borderBottomWidth: 1, borderColor: LINE },
  imageCount: { overflow: "hidden", color: MUTED, fontSize: 13, fontWeight: "900", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, backgroundColor: "#F3F4F6" },
  galleryButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  textActionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: LINE },
  textActionIcon: { color: INK, fontSize: 18, fontWeight: "900" },
  savedHeart: { color: RED },
  textActionLabel: { color: INK, fontSize: 12, fontWeight: "800" },
  priceBlock: { paddingHorizontal: 16, paddingVertical: 18, backgroundColor: CARD, borderBottomWidth: 1, borderColor: LINE },
  priceLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 4 },
  rupeeSymbol: { color: INK, fontSize: 24, lineHeight: 34, fontWeight: "900", marginTop: 2 },
  price: { color: INK, fontSize: 38, lineHeight: 44, fontWeight: "900", letterSpacing: -1.2 },
  priceOffPill: { alignSelf: "center", marginLeft: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: "#EAFBF2" },
  priceOffText: { color: GREEN, fontSize: 12, fontWeight: "900" },
  mrpRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  mrpLabel: { color: MUTED, fontSize: 12, fontWeight: "800" },
  oldPrice: { color: MUTED, fontSize: 14, fontWeight: "800", textDecorationLine: "line-through" },
  offText: { color: GREEN, fontSize: 13, fontWeight: "900" },
  taxText: { color: MUTED, fontSize: 13, fontWeight: "800", marginTop: 6 },
  payText: { color: INK, fontSize: 14, lineHeight: 20, fontWeight: "800", marginTop: 12 },
  actionBlock: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: CARD, borderBottomWidth: 1, borderColor: LINE },
  mainButton: { flex: 1, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  cartButton: { backgroundColor: YELLOW },
  buyButton: { backgroundColor: ORANGE },
  mainButtonText: { color: INK, fontSize: 15, fontWeight: "900" },
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionTitle: { color: INK, fontSize: 22, lineHeight: 28, fontWeight: "900", marginBottom: 12 },
  confidenceGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  trustItem: { width: "48.5%", minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  trustIcon: { color: BLUE, fontSize: 18, fontWeight: "900" },
  trustTitle: { flex: 1, color: INK, fontSize: 14, fontWeight: "900" },
  deliveryCard: { padding: 16, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  deliveryTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  deliveryIcon: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF3FF" },
  deliveryIconText: { color: BLUE, fontSize: 24, fontWeight: "900" },
  deliveryTitle: { color: INK, fontSize: 17, fontWeight: "900" },
  deliverySub: { color: MUTED, fontSize: 13, lineHeight: 19, fontWeight: "800", marginTop: 4 },
  pinRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  pinInput: { flex: 1, height: 52, borderRadius: 18, backgroundColor: "#F3F5F9", borderWidth: 1, borderColor: LINE, paddingHorizontal: 14, color: INK, fontSize: 15, fontWeight: "800" },
  checkButton: { width: 112, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: INK },
  checkText: { color: CARD, fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  deliveryMessage: { fontSize: 13, fontWeight: "900", marginTop: 12 },
  green: { color: GREEN },
  red: { color: RED },
  offerGrid: { gap: 10 },
  offerCard: { padding: 15, minHeight: 104, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: "#D6E4FF", shadowColor: "#0B74FF", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  offerTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  offerTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#EAF3FF" },
  offerTagText: { color: BLUE, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  offerValue: { color: GREEN, fontSize: 12, fontWeight: "900" },
  offerTitle: { color: INK, fontSize: 16, fontWeight: "900" },
  offerSub: { color: MUTED, fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: 5 },
  variantWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  variant: { minHeight: 42, paddingHorizontal: 14, borderRadius: 14, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center" },
  variantActive: { borderColor: BLUE, backgroundColor: "#EAF3FF" },
  variantText: { color: TEXT, fontSize: 13, fontWeight: "800" },
  variantTextActive: { color: BLUE },
  detailCard: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { color: BLUE, fontSize: 22, lineHeight: 22, fontWeight: "900" },
  bulletText: { flex: 1, color: TEXT, fontSize: 14, lineHeight: 21, fontWeight: "800" },
  pulseCard: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 20, backgroundColor: "#071120", borderWidth: 1, borderColor: "#12233D" },
  pulseLeft: { width: 104, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 18, backgroundColor: "#0E1A2E" },
  pulseScore: { color: CARD, fontSize: 28, fontWeight: "900" },
  pulseLabel: { color: "#A7B4C8", fontSize: 10, lineHeight: 14, fontWeight: "800", textAlign: "center", marginTop: 6 },
  pulseRight: { flex: 1, gap: 12, justifyContent: "center" },
  pulseBarRow: { gap: 5 },
  pulseBarTop: { flexDirection: "row", justifyContent: "space-between" },
  pulseBarLabel: { color: CARD, fontSize: 12, fontWeight: "900" },
  pulseBarValue: { color: "#93C5FD", fontSize: 12, fontWeight: "900" },
  pulseTrack: { height: 7, borderRadius: 7, backgroundColor: "#1E2D46", overflow: "hidden" },
  pulseFill: { height: 7, borderRadius: 7, backgroundColor: "#38BDF8" },
  horizontalGap: { gap: 10, paddingBottom: 2 },
  customerPhoto: { width: 96, height: 112, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  viewer: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  viewerHeader: { position: "absolute", top: 48, left: 20, right: 20, zIndex: 2, flexDirection: "row", justifyContent: "space-between" },
  viewerCounter: { color: CARD, fontSize: 13, fontWeight: "800" },
  viewerClose: { color: YELLOW, fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  viewerSlide: { alignItems: "center", justifyContent: "center" },
  viewerImage: { width: "100%", height: "78%" },
  viewerEmpty: { color: CARD, fontSize: 18, fontWeight: "900" },
});
