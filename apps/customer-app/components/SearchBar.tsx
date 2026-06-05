import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { palette, styles } from "../shared";

export function SearchBar({ placeholder = "Search products, categories, and more", value = "", onChange, suggestions = [] }: { placeholder?: string; value?: string; onChange?: (value: string) => void; suggestions?: string[] }) {
  const [focused, setFocused] = useState(false);
  const recent = ["dry fruits", "handicrafts"];
  const popular = ["local deals", "top sellers", "new arrivals"];
  const matches = value.trim() ? suggestions.filter((item) => item.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 5) : [];
  const options = matches.length ? matches : focused ? (value ? popular : [...recent, ...popular]) : [];
  return <View style={styles.searchShell}><View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.searchInput} placeholder={placeholder} placeholderTextColor={palette.muted} value={value} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} onChangeText={onChange} /><Text style={styles.searchAction}>MIC</Text><Text style={styles.searchAction}>CAM</Text></View>{!!options.length && <View style={styles.searchSuggestions}><Text style={styles.suggestionLabel}>{matches.length ? "SUGGESTIONS" : value ? "POPULAR SEARCHES" : "RECENT AND POPULAR"}</Text>{options.map((option) => <Text key={option} style={styles.suggestion} onPress={() => onChange?.(option)}>⌕  {option}</Text>)}</View>}</View>;
}
