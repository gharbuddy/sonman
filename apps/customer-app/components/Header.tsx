import { Pressable, Text, View } from "react-native";
import { styles } from "../shared";

export function Header({ title, onBack, action, onAction }: { title: string; onBack: () => void; action?: string; onAction?: () => void }) {
  return <View style={styles.pageHeader}><Pressable style={styles.roundButton} onPress={onBack}><Text style={styles.roundButtonText}>‹</Text></Pressable><Text style={styles.headerTitle}>{title}</Text>{action ? <Text style={styles.headerAction} onPress={onAction}>{action}</Text> : <View style={styles.headerSpacer} />}</View>;
}

export const PageHeader = Header;
