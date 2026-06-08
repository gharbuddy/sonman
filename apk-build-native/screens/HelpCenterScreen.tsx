import { Text, View } from "react-native";
import { Empty, ScreenScroll, styles } from "../shared";
import { PageHeader } from "../components/Header";

export function HelpCenterScreen({ onBack }: { onBack: () => void }) {
  return <ScreenScroll><PageHeader title="Help centre" onBack={onBack} /><Text style={styles.formIntro}>Answers for shopping, delivery, and order support.</Text>{[["Where do you deliver?", "For MVP, Sonman delivery is available in Kulgam district, Jammu and Kashmir."], ["How do I track an order?", "Open Orders and select the Active tab to view your latest order status."], ["Can I cancel an order?", "Orders are prepaid. Cancellation is not available after confirmation. Report damaged, defective, or incorrect products at delivery."], ["Need more help?", "Contact Sonman support and include your order number for faster help."]].map(([title, body]) => <View key={title} style={styles.helpCard}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.smallMuted}>{body}</Text></View>)}</ScreenScroll>;
}
