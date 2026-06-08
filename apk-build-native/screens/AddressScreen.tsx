import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createCustomerProfileService,
  type AddressInput,
  type CustomerAddress,
} from "../profile";
import { authService } from "../auth";
import {
  Empty,
  ScreenScroll,
  SERVICE_DISTRICTS,
  SERVICE_STATES,
} from "../shared";

type AddressScreenProps = {
  addresses: CustomerAddress[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (address: CustomerAddress) => void;
  onDelete: (id: string) => Promise<void>;
  onDefault: (id: string) => Promise<void>;
};

type AddressFormScreenProps = {
  address?: CustomerAddress;
  onBack: () => void;
  onSaved: () => Promise<void>;
};

export function AddressScreen({
  addresses,
  onBack,
  onAdd,
  onEdit,
  onDelete,
  onDefault,
}: AddressScreenProps) {
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>) => {
    try {
      setError("");
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Address could not be updated."
      );
    }
  };

  return (
    <ScreenScroll>
      <Header title="Saved addresses" onBack={onBack} />

      <Pressable style={localStyles.addButton} onPress={onAdd}>
        <Text style={localStyles.addIcon}>＋</Text>
        <View style={localStyles.addTextWrap}>
          <Text style={localStyles.addTitle}>Add new address</Text>
          <Text style={localStyles.addSubtitle}>
            Add delivery location for faster checkout
          </Text>
        </View>
        <Text style={localStyles.chevron}>›</Text>
      </Pressable>

      {!!error && <Text style={localStyles.error}>{error}</Text>}

      <Text style={localStyles.sectionTitle}>YOUR ADDRESSES</Text>

      {addresses.map((address) => (
        <View key={address.id} style={localStyles.addressCard}>
          <View style={localStyles.cardTop}>
            <View style={localStyles.pinCircle}>
              <Text style={localStyles.pinIcon}>⌖</Text>
            </View>

            <View style={localStyles.addressContent}>
              <View style={localStyles.labelRow}>
                <Text style={localStyles.addressLabel}>{address.label}</Text>
                {address.isDefault ? (
                  <View style={localStyles.defaultBadge}>
                    <Text style={localStyles.defaultText}>Default</Text>
                  </View>
                ) : null}
              </View>

              <Text style={localStyles.name}>{address.recipientName}</Text>
              <Text style={localStyles.addressText}>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                {address.state}, {address.postalCode}
              </Text>
            </View>
          </View>

          <View style={localStyles.actionRow}>
            <Pressable
              style={localStyles.actionButton}
              onPress={() => onEdit(address)}
            >
              <Text style={localStyles.actionText}>Edit</Text>
            </Pressable>

            {!address.isDefault ? (
              <Pressable
                style={localStyles.actionButton}
                onPress={() => void run(() => onDefault(address.id))}
              >
                <Text style={localStyles.actionText}>Set default</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={localStyles.actionButton}
              onPress={() => void run(() => onDelete(address.id))}
            >
              <Text style={localStyles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {!addresses.length && (
        <View style={localStyles.emptyWrap}>
          <Empty
            title="No saved addresses"
            subtitle="Add an address to use it automatically at checkout."
          />
        </View>
      )}
    </ScreenScroll>
  );
}

export function AddressFormScreen({
  address,
  onBack,
  onSaved,
}: AddressFormScreenProps) {
  const [input, setInput] = useState<AddressInput>({
    label: address?.label ?? "",
    recipientName: address?.recipientName ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? SERVICE_DISTRICTS[0],
    state: address?.state ?? SERVICE_STATES[0],
    postalCode: address?.postalCode ?? "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openSelect, setOpenSelect] = useState<"state" | "city" | null>(null);

  const set = (key: keyof AddressInput) => (value: string) =>
    setInput((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (
      !input.label.trim() ||
      !input.recipientName.trim() ||
      !input.line1.trim() ||
      !input.city.trim() ||
      !input.state.trim() ||
      !input.postalCode.trim()
    ) {
      setError("Complete all required address fields.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createCustomerProfileService(authService.supabase).saveAddress(
        input,
        address?.id
      );
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Address could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <Header title={address ? "Edit address" : "Add address"} onBack={onBack} />

      <View style={localStyles.infoCard}>
        <Text style={localStyles.infoTitle}>Delivery availability</Text>
        <Text style={localStyles.infoText}>
          Sonman deliveries are currently available in Kulgam, Jammu and Kashmir.
        </Text>
      </View>

      <View style={localStyles.formCard}>
        <InputField
          label="Label"
          placeholder="Home or Work"
          value={input.label}
          onChangeText={set("label")}
        />

        <InputField
          label="Recipient name"
          placeholder="Full name"
          value={input.recipientName}
          onChangeText={set("recipientName")}
        />

        <InputField
          label="Address line 1"
          placeholder="House, building, street"
          value={input.line1}
          onChangeText={set("line1")}
        />

        <InputField
          label="Address line 2"
          placeholder="Area or landmark"
          value={input.line2}
          onChangeText={set("line2")}
        />

        <SelectField
          label="State"
          value={input.state}
          open={openSelect === "state"}
          options={SERVICE_STATES}
          onToggle={() => setOpenSelect(openSelect === "state" ? null : "state")}
          onSelect={(value) => {
            set("state")(value);
            setOpenSelect(null);
          }}
        />

        <SelectField
          label="District"
          value={input.city}
          open={openSelect === "city"}
          options={SERVICE_DISTRICTS}
          onToggle={() => setOpenSelect(openSelect === "city" ? null : "city")}
          onSelect={(value) => {
            set("city")(value);
            setOpenSelect(null);
          }}
        />

        <InputField
          label="Postal code"
          placeholder="Postal code"
          value={input.postalCode}
          keyboardType="number-pad"
          onChangeText={set("postalCode")}
        />
      </View>

      {!!error && <Text style={localStyles.error}>{error}</Text>}

      <Pressable
        style={[localStyles.saveButton, busy && localStyles.disabledButton]}
        onPress={save}
        disabled={busy}
      >
        <Text style={localStyles.saveText}>
          {busy ? "Saving..." : "Save address"}
        </Text>
      </Pressable>
    </ScreenScroll>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={localStyles.header}>
      <Pressable style={localStyles.backButton} onPress={onBack}>
        <Text style={localStyles.backText}>‹</Text>
      </Pressable>
      <Text style={localStyles.headerTitle}>{title}</Text>
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={localStyles.fieldWrap}>
      <Text style={localStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={localStyles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  open,
  options,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  open: boolean;
  options: string[];
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={localStyles.fieldWrap}>
      <Text style={localStyles.fieldLabel}>{label}</Text>

      <Pressable style={localStyles.selectBox} onPress={onToggle}>
        <Text style={localStyles.selectValue}>{value}</Text>
        <Text style={localStyles.chevron}>›</Text>
      </Pressable>

      {open ? (
        <View style={localStyles.optionBox}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={localStyles.optionRow}
              onPress={() => onSelect(option)}
            >
              <Text style={localStyles.optionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    marginTop: 8,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  backText: {
    fontSize: 38,
    lineHeight: 40,
    color: "#111827",
    marginTop: -3,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 48,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: "#111827",
  },
  addButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 28,
    color: "#111827",
    fontWeight: "800",
    marginRight: 14,
  },
  addTextWrap: {
    flex: 1,
  },
  addTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  addSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "600",
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 15,
    letterSpacing: 7,
    color: "#6B7280",
    fontWeight: "900",
  },
  addressCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: "row",
  },
  pinCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  pinIcon: {
    fontSize: 26,
    color: "#111827",
    fontWeight: "900",
  },
  addressContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textTransform: "capitalize",
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },
  defaultText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "900",
  },
  name: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 18,
    paddingTop: 16,
    gap: 14,
    flexWrap: "wrap",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#B7791F",
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#B91C1C",
  },
  infoCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    marginBottom: 18,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
    fontWeight: "600",
  },
  formCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    letterSpacing: 2.5,
    color: "#6B7280",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#111827",
    fontWeight: "800",
  },
  selectBox: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  selectValue: {
    flex: 1,
    fontSize: 17,
    color: "#111827",
    fontWeight: "800",
    textTransform: "capitalize",
  },
  chevron: {
    fontSize: 34,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  optionBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "800",
    textTransform: "capitalize",
  },
  saveButton: {
    marginTop: 24,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  error: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#B91C1C",
    fontWeight: "800",
  },
  emptyWrap: {
    marginTop: 12,
  },
});