import { Text, View } from "react-native";
import { PrimaryButton, ScreenShell, styles } from "../shared";

export function SonmanAIScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <ScreenShell contentContainerStyle={styles.onboarding}>
        <View style={styles.between}><Text style={styles.logo}>sonman</Text><Text style={styles.link} onPress={onContinue}>Skip</Text></View>
        <View style={styles.onboardingVisual}>
          <View style={styles.floatingNote}><Text style={styles.gold}>AI</Text><Text style={styles.noteText}>Picks tailored to your taste</Text></View>
        </View>
        <View>
          <Text style={styles.onboardingTitle}>Better finds.{"\n"}Less searching.</Text>
          <Text style={styles.body}>Discover standout products, useful deals, and personal picks in one clean marketplace.</Text>
        </View>
        <PrimaryButton label="Start shopping" onPress={onContinue} />
        <Text style={styles.dots}>●  ○  ○</Text>
    </ScreenShell>
  );
}

export const OnboardingScreen = SonmanAIScreen;
