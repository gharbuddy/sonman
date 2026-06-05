import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Share, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent, useWindowDimensions } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { CompactProduct, discount, money, palette, ScreenScroll, SectionHeader, styles } from "../shared";
import { PageHeader } from "../components/Header";

export function ProductDetailScreen({ product, products, inCart, saved, onBack, onCart, onWishlist, onBuy, onProduct }: { product: Product; products: Product[]; inCart: boolean; saved: boolean; onBack: () => void; onCart: () => void; onWishlist: () => void; onBuy: () => void; onProduct: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const carouselWidth = width - 28;
  const images = product.images.length ? product.images : [product.image];
  const [imageIndex, setImageIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [variant, setVariant] = useState(product.variants[0] ?? "");
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const similar = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 8);
  const onImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setImageIndex(Math.round(event.nativeEvent.contentOffset.x / carouselWidth));
  return (
    <ScreenScroll>
      <PageHeader title="Product details" onBack={onBack} action="SHARE" onAction={() => void Share.share({ message: `${product.name} - ${money(product.price)} on Sonman` })} />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onImageScroll}>
        {images.map((image, index) => <Pressable key={`${image}-${index}`} onPress={() => setViewerOpen(true)}><Image source={{ uri: image }} style={[styles.detailImage, { width: carouselWidth }]} /></Pressable>)}
      </ScrollView>
      <Text style={styles.imageCounter}>{imageIndex + 1} / {images.length} · Tap image to expand</Text>
      <Text style={styles.eyebrow}>{product.category.toUpperCase()}</Text>
      <Text style={styles.detailTitle}>{product.name}</Text>
      <View style={styles.ratingLine}><Text style={styles.rating}>★ {product.rating}</Text><Text style={styles.smallMuted}>{product.reviews} verified reviews</Text></View>
      <View style={styles.priceLine}><Text style={styles.detailPrice}>{money(product.price)}</Text><Text style={styles.oldPrice}>{money(product.oldPrice)}</Text><Text style={styles.discount}>{discount(product)}% off</Text></View>
      <View style={styles.deliveryCard}><Text style={styles.deliveryIcon}>DEL</Text><View><Text style={styles.deliveryTitle}>{product.deliverySize === "large" || product.deliverySize === "heavy" ? "Delivery charge will be confirmed by Sonman before dispatch." : "Standard delivery available"}</Text><Text style={styles.smallMuted}>No same-day delivery</Text></View></View>
      <Text style={styles.sectionTitle}>About this product</Text>
      <Text style={styles.body}>{product.description}</Text>
      {!!product.variants.length && <><Text style={[styles.sectionTitle, styles.sectionSpacing]}>Choose an option</Text><View style={styles.sizeRow}>{product.variants.map((option) => <Pressable key={option} style={[styles.size, variant === option && styles.sizeActive]} onPress={() => setVariant(option)}><Text style={[styles.sizeText, variant === option && styles.sizeTextActive]}>{option}</Text></Pressable>)}</View></>}
      <View style={styles.infoCard}><Text style={styles.rowTitle}>Delivery availability</Text><Text style={styles.smallMuted}>Enter your pincode to confirm delivery options.</Text><View style={styles.pincodeRow}><TextInput style={styles.pincodeInput} value={pincode} onChangeText={(value) => setPincode(value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" placeholderTextColor={palette.muted} keyboardType="number-pad" /><Text style={styles.link} onPress={() => setDeliveryMessage(pincode.length === 6 ? "Delivery is available. Final estimate is shown at checkout." : "Enter a valid 6-digit pincode.")}>Check</Text></View>{!!deliveryMessage && <Text style={styles.green}>{deliveryMessage}</Text>}</View>
      <View style={styles.infoCard}><Text style={styles.rowTitle}>Seller information</Text><Text style={styles.smallMuted}>Verified local Sonman seller · Seller ID {product.vendorId.slice(0, 8).toUpperCase()}</Text></View>
      <View style={styles.infoCard}><Text style={styles.rowTitle}>Specifications</Text><Text style={styles.smallMuted}>Category: {product.category || "General"}</Text><Text style={styles.smallMuted}>Shipping class: {product.deliverySize}</Text><Text style={styles.smallMuted}>Fulfilment: Sonman local delivery</Text></View>
      <View style={styles.infoCard}><Text style={styles.rowTitle}>Ratings and reviews</Text><Text style={styles.detailPrice}>{product.rating || "New"}</Text><Text style={styles.smallMuted}>{product.reviews ? `${product.reviews} verified customer reviews` : "Be the first customer to review this product."}</Text></View>
      {!!similar.length && <><SectionHeader title="Similar products" action="Explore" onPress={() => onProduct(similar[0])} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactRail}>{similar.map((item) => <CompactProduct key={item.id} product={item} onPress={() => onProduct(item)} />)}</ScrollView></>}
      <View style={styles.actionRow}><Pressable style={styles.outlineButton} onPress={onCart}><Text style={styles.outlineText}>{inCart ? "Remove" : "Add to cart"}</Text></Pressable><Pressable style={styles.darkButton} onPress={onBuy}><Text style={styles.darkButtonText}>Buy now</Text></Pressable></View>
      <Text style={styles.saveDetail} onPress={onWishlist}>{saved ? "♥ Saved to wishlist" : "♡ Save to wishlist"}</Text>
      <FullscreenImageViewer images={images} initialIndex={imageIndex} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </ScreenScroll>
  );
}

export function FullscreenImageViewer({ images, initialIndex, visible, onClose }: { images: string[]; initialIndex: number; visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const distance = useRef(0);
  useEffect(() => { if (visible) { setIndex(initialIndex); setScale(1); } }, [initialIndex, visible]);
  const touchDistance = (touches: readonly { pageX: number; pageY: number }[]) => touches.length < 2 ? 0 : Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
  return <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}><View style={styles.viewer}><View style={styles.viewerHeader}><Text style={styles.viewerCounter}>{index + 1} / {images.length}</Text><Text style={styles.viewerClose} onPress={onClose}>Close</Text></View><ScrollView horizontal pagingEnabled={scale === 1} scrollEnabled={scale === 1} showsHorizontalScrollIndicator={false} contentOffset={{ x: initialIndex * width, y: 0 }} onMomentumScrollEnd={(event) => { setIndex(Math.round(event.nativeEvent.contentOffset.x / width)); setScale(1); }}>{images.map((image, imageIndex) => <View key={`${image}-${imageIndex}`} style={[styles.viewerSlide, { width }]} onTouchStart={(event) => { distance.current = touchDistance(event.nativeEvent.touches); }} onTouchMove={(event) => { const nextDistance = touchDistance(event.nativeEvent.touches); if (distance.current && nextDistance) setScale(Math.max(1, Math.min(4, scale * nextDistance / distance.current))); distance.current = nextDistance; }} onTouchEnd={() => { distance.current = 0; }}><Image source={{ uri: image }} resizeMode="contain" style={[styles.viewerImage, { transform: [{ scale: imageIndex === index ? scale : 1 }] }]} /></View>)}</ScrollView><Text style={styles.viewerHint}>Swipe for more images · Pinch to zoom</Text></View></Modal>;
}
