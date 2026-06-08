import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

export function SplashScreen({ opacity }: { opacity: Animated.Value }) {
  const letters = ["S", "So", "Son", "Sonm", "Sonma", "Sonman"];
  const [word, setWord] = useState("S");

  const scale = useRef(new Animated.Value(0.88)).current;
  const slide = useRef(new Animated.Value(28)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(12)).current;
  const dotPulse = useRef(new Animated.Value(0.4)).current;
  const lineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers = letters.map((item, index) =>
      setTimeout(() => setWord(item), 110 * index)
    );

    // Staggered orchestrated entrance
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 60,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 750,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fades in after brand types out
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 700);

    // Divider line appears
    setTimeout(() => {
      Animated.timing(lineFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 500);

    // Dot pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Subtle geometric background elements */}
      <View style={styles.bgCircleLarge} />
      <View style={styles.bgCircleSmall} />
      <View style={styles.bgLineH} />
      <View style={styles.bgLineV} />

      {/* Main content */}
      <Animated.View
        style={[
          styles.hero,
          {
            transform: [{ scale }, { translateY: slide }],
          },
        ]}
      >
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <View style={styles.logoSquare}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Animated.View
            style={[styles.logoDot, { opacity: dotPulse }]}
          />
        </View>

        {/* Brand name - animated typewriter */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>{word}</Text>
          <View style={styles.brandCursor} />
        </View>

        {/* Animated divider line */}
        <Animated.View style={[styles.divider, { opacity: lineFade }]}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Taglines */}
        <Animated.View
          style={{
            opacity: taglineFade,
            transform: [{ translateY: taglineSlide }],
          }}
        >
          <Text style={styles.tagline}>Kashmir's Local Marketplace</Text>
          <Text style={styles.subTagline}>
            Shop local · Pay securely · Deliver smarter
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: taglineFade }]}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Powered by local sellers</Text>
        <View style={styles.footerDot} />
      </Animated.View>
    </Animated.View>
  );
}

const BRAND_CHARCOAL = "#1A1A1A";
const BRAND_GOLD = "#C9962E";
const BRAND_WARM = "#F5F0E8";
const BRAND_MUTED = "#8A8078";
const BRAND_ACCENT = "#2D5A3D"; // Kashmir pine green

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Background geometry
  bgCircleLarge: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: "rgba(201,150,46,0.08)",
    top: -140,
    right: -160,
  },
  bgCircleSmall: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "rgba(45,90,61,0.07)",
    bottom: 60,
    left: -100,
  },
  bgLineH: {
    position: "absolute",
    height: 1,
    width: "100%",
    backgroundColor: "rgba(201,150,46,0.06)",
    top: "38%",
  },
  bgLineV: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(201,150,46,0.06)",
    left: "20%",
  },

  // Hero block
  hero: {
    alignItems: "center",
    paddingHorizontal: 40,
  },

  // Logo mark
  logoMark: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logoSquare: {
    width: 52,
    height: 52,
    backgroundColor: BRAND_CHARCOAL,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontFamily: "Georgia",
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_GOLD,
    marginTop: 6,
    marginLeft: 4,
  },

  // Brand name
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  brandText: {
    fontFamily: "Georgia",
    fontSize: 58,
    fontWeight: "300",
    color: BRAND_CHARCOAL,
    letterSpacing: -2,
    lineHeight: 62,
  },
  brandCursor: {
    width: 3,
    height: 44,
    backgroundColor: BRAND_GOLD,
    marginLeft: 2,
    marginBottom: 6,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    width: 200,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(201,150,46,0.4)",
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND_GOLD,
    marginHorizontal: 8,
  },

  // Taglines
  tagline: {
    fontFamily: "Georgia",
    fontSize: 15,
    color: BRAND_ACCENT,
    letterSpacing: 3,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  subTagline: {
    fontFamily: "System",
    fontSize: 13,
    color: BRAND_MUTED,
    letterSpacing: 0.5,
    textAlign: "center",
    fontWeight: "300",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(201,150,46,0.5)",
  },
  footerText: {
    fontFamily: "System",
    fontSize: 12,
    color: BRAND_MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "400",
  },
});
