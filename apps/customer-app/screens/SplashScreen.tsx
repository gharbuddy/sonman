import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { styles } from "../shared";

export function SplashScreen({ opacity }: { opacity: Animated.Value }) {
  const letters = ["s", "so", "son", "sonm", "sonma", "sonman"];
  const [word, setWord] = useState("s");
  useEffect(() => {
    const timers = letters.map((item, index) => setTimeout(() => setWord(item), 170 * index));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <Animated.View style={[styles.splashFade, { opacity }]}> 
      <View style={styles.splashClean}>
        <View style={styles.splashGlowOne} />
        <View style={styles.splashGlowTwo} />
        <View style={styles.splashLogoBox}><Text style={styles.splashLogoS}>S</Text></View>
        <Text style={styles.splashWord}>{word}</Text>
        <Text style={styles.splashLine}>Kashmir's local marketplace</Text>
        <Text style={styles.splashSubLine}>Shop local. Deliver smarter.</Text>
      </View>
    </Animated.View>
  );
}
