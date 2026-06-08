import { Image, Pressable, Text, View } from "react-native";
import type { CustomerProduct as Product } from "../products";
import { discount, money, styles } from "../shared";
import { iconColors, iconSizes, SonmanIcon } from "../src/theme/icons";

export function ProductCard({
  product,
  onPress,
  onWishlist,
  saved,
  width,
}: {
  product: Product;
  onPress: () => void;
  onWishlist?: () => void;
  saved?: boolean;
  width?: number;
}) {
  const markdown = discount(product);

  return (
    <Pressable style={[styles.productCard, width ? { width } : undefined]} onPress={onPress}>
      <View style={styles.productImageFrame}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        <Pressable
          style={styles.heartButton}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onWishlist?.();
          }}
        >
          <SonmanIcon
            name="wishlist"
            size={iconSizes.action}
            color={saved ? iconColors.danger : iconColors.action}
            weight={saved ? "fill" : "regular"}
          />
        </Pressable>
        {!!product.badge && <Text style={styles.badge}>{product.badge}</Text>}
      </View>

      <View style={styles.productCopy}>
        <Text style={styles.productCategory}>{product.category}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingLine}>
          <Text style={styles.ratingSmall}>{product.rating.toFixed(1)} rating</Text>
          <Text style={styles.reviewCount}>{product.reviews} reviews</Text>
        </View>
        <View style={styles.priceLine}>
          <Text style={styles.productPrice}>{money(product.price)}</Text>
          {product.oldPrice > product.price && <Text style={styles.oldPriceSmall}>{money(product.oldPrice)}</Text>}
        </View>
        {markdown > 0 && <Text style={styles.discount}>{markdown}% private offer</Text>}
        <Text style={styles.delivery}>
          {product.deliverySize === "large" || product.deliverySize === "heavy"
            ? "Delivery quote required"
            : "Standard delivery"}
        </Text>
      </View>
    </Pressable>
  );
}
