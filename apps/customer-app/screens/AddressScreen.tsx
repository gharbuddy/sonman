import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { addressText, createCustomerProfileService, type AddressInput, type CustomerAddress } from "../profile";
import { authService } from "../auth";
import { Dropdown, Empty, Field, palette, PrimaryButton, ScreenScroll, SERVICE_DISTRICTS, SERVICE_STATES, styles } from "../shared";
import { PageHeader } from "../components/Header";
import { AddressCard } from "../components/AddressCard";

export function AddressScreen({ addresses, onBack, onAdd, onEdit, onDelete, onDefault }: { addresses: CustomerAddress[]; onBack: () => void; onAdd: () => void; onEdit: (address: CustomerAddress) => void; onDelete: (id: string) => Promise<void>; onDefault: (id: string) => Promise<void> }) {
  const [error, setError] = useState("");
  const run = async (action: () => Promise<void>) => {
    try { setError(""); await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Address could not be updated."); }
  };
  return <ScreenScroll><PageHeader title="Saved addresses" onBack={onBack} /><PrimaryButton label="Add address" onPress={onAdd} />{!!error && <Text style={styles.authError}>{error}</Text>}{addresses.map((address) => <AddressCard key={address.id} address={address} onEdit={onEdit} onDelete={(id) => void run(() => onDelete(id))} onDefault={(id) => void run(() => onDefault(id))} />)}{!addresses.length && <Empty title="No saved addresses" subtitle="Add an address to use it automatically at checkout." />}</ScreenScroll>;
}

export function AddressFormScreen({ address, onBack, onSaved }: { address?: CustomerAddress; onBack: () => void; onSaved: () => Promise<void> }) {
  const [input, setInput] = useState<AddressInput>({ label: address?.label ?? "", recipientName: address?.recipientName ?? "", line1: address?.line1 ?? "", line2: address?.line2 ?? "", city: address?.city ?? SERVICE_DISTRICTS[0], state: address?.state ?? SERVICE_STATES[0], postalCode: address?.postalCode ?? "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: keyof AddressInput) => (value: string) => setInput((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (!input.label.trim() || !input.recipientName.trim() || !input.line1.trim() || !input.city.trim() || !input.state.trim() || !input.postalCode.trim()) return setError("Complete all required address fields.");
    setBusy(true);
    setError("");
    try {
      await createCustomerProfileService(authService.supabase).saveAddress(input, address?.id);
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Address could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return <ScreenScroll><PageHeader title={address ? "Edit address" : "Add address"} onBack={onBack} /><Text style={styles.formIntro}>Sonman MVP deliveries are currently available in Kulgam, Jammu and Kashmir.</Text><Field label="Label" placeholder="Home or Work" value={input.label} onChange={set("label")} /><Field label="Recipient name" placeholder="Full name" value={input.recipientName} onChange={set("recipientName")} /><Field label="Address line 1" placeholder="House, building, street" value={input.line1} onChange={set("line1")} /><Field label="Address line 2" placeholder="Area or landmark (optional)" value={input.line2} onChange={set("line2")} /><Dropdown label="State" value={input.state} placeholder="Choose state" options={SERVICE_STATES} onChange={set("state")} /><Dropdown label="District" value={input.city} placeholder="Choose district" options={SERVICE_DISTRICTS} onChange={set("city")} /><Field label="Postal code" placeholder="Postal code" value={input.postalCode} onChange={set("postalCode")} />{!!error && <Text style={styles.authError}>{error}</Text>}<PrimaryButton label={busy ? "Saving..." : "Save address"} onPress={save} disabled={busy} /></ScreenScroll>;
}
