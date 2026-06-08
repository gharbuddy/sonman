import { Text, View } from "react-native";
import { styles } from "../shared";
import { IconButton, iconColors, iconSizes, type SonmanIconName } from "../src/theme/icons";

export function Header({
  title,
  onBack,
  action,
  onAction,
  actionIcon,
}: {
  title: string;
  onBack: () => void;
  action?: string;
  onAction?: () => void;
  actionIcon?: SonmanIconName;
}) {
  return (
    <View style={styles.pageHeader}>
      <IconButton name="back" size={iconSizes.header} color={iconColors.header} weight="regular" onPress={onBack} style={styles.roundButton} label="Back" />
      <Text style={styles.headerTitle}>{title}</Text>
      {actionIcon ? (
        <IconButton name={actionIcon} size={iconSizes.header} color={iconColors.header} weight="regular" onPress={onAction} style={styles.roundButton} label={action} />
      ) : action ? (
        <Text style={styles.headerAction} onPress={onAction}>{action}</Text>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

export const PageHeader = Header;
