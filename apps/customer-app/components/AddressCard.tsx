import { Text, View } from "react-native";
import type { CustomerAddress } from "../profile";
import { addressText } from "../profile";
import { styles } from "../shared";

export function AddressCard({ address, onEdit, onDelete, onDefault }: { address: CustomerAddress; onEdit: (address: CustomerAddress) => void; onDelete: (id: string) => void; onDefault: (id: string) => void }) {
  return (
    <View style={styles.addressCard}>
      <Text style={styles.rowTitle}>{address.label}{address.isDefault ? " · Default" : ""}</Text>
      <Text style={styles.smallMuted}>{address.recipientName}</Text>
      <Text style={styles.smallMuted}>{addressText(address)}</Text>
      <View style={styles.addressActions}>
        <Text style={styles.link} onPress={() => onEdit(address)}>Edit</Text>
        <Text style={styles.link} onPress={() => onDefault(address.id)}>Set default</Text>
        <Text style={styles.remove} onPress={() => onDelete(address.id)}>Delete</Text>
      </View>
    </View>
  );
}
