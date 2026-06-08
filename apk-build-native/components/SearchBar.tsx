import { useRef, useState } from "react";
import { CameraView, Camera, type BarcodeScanningResult } from "expo-camera";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette, styles } from "../shared";
import { iconColors, iconSizes, SonmanIcon } from "../src/theme/icons";

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: string[];
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function SearchBar({
  placeholder = "Search Kashmir collections",
  value,
  onChange,
  onSubmit,
  suggestions = [],
  style,
  inputStyle,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const cameraRef = useRef<CameraView>(null);
  const currentValue = value ?? internalValue;

  const recent = ["dry fruits", "handicrafts"];
  const popular = ["luxury picks", "top sellers", "new arrivals"];
  const term = currentValue.trim().toLowerCase();

  const matches = term
    ? suggestions.filter((item) => item.toLowerCase().includes(term)).slice(0, 5)
    : [];

  const options = matches.length
    ? matches
    : focused
      ? currentValue
        ? popular
        : [...recent, ...popular]
      : [];

  const commitSearch = (nextValue: string, submit = false) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    if (submit) onSubmit?.(nextValue);
  };

  const showError = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const startVoiceSearch = () => {
    showError(
      "Voice search",
      "Voice search is not available in this build. Search manually for now.",
    );
  };

  const openCameraSearch = async () => {
    setCameraError("");
    setCameraReady(false);

    try {
      const currentPermission = await Camera.getCameraPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await Camera.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showError(
          "Camera search",
          permission.canAskAgain
            ? "Camera permission is required for camera search."
            : "Camera permission was denied. Enable it in device settings to use camera search.",
        );
        return;
      }

      setCameraOpen(true);
    } catch (cause) {
      showError(
        "Camera search",
        cause instanceof Error ? cause.message : "Camera search could not be opened.",
      );
    }
  };

  const closeCameraSearch = () => {
    setCameraOpen(false);
    setCameraBusy(false);
    setCameraError("");
  };

  const useCameraQuery = (query: string) => {
    const nextQuery = query.trim();
    if (!nextQuery) return;

    commitSearch(nextQuery, true);
    closeCameraSearch();
  };

  const handleBarcode = (result: BarcodeScanningResult) => {
    if (cameraBusy) return;

    setCameraBusy(true);
    useCameraQuery(result.data);
  };

  const captureImage = async () => {
    if (!cameraReady || cameraBusy) return;

    setCameraBusy(true);
    setCameraError("");

    try {
      const picture = await cameraRef.current?.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (!picture?.uri) {
        throw new Error("No image was captured.");
      }

      setCameraError("Image captured. Point the camera at a barcode or QR code to search automatically.");
    } catch (cause) {
      setCameraError(cause instanceof Error ? cause.message : "The camera could not capture this image.");
    } finally {
      setCameraBusy(false);
    }
  };

  return (
    <View style={styles.searchShell}>
      <View style={[styles.search, style]}>
        <SonmanIcon
          name="search"
          size={iconSizes.action}
          color={iconColors.inactive}
          weight="regular"
        />

        <TextInput
          style={[styles.searchInput, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          value={currentValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChangeText={(nextValue) => commitSearch(nextValue)}
          onSubmitEditing={() => onSubmit?.(currentValue)}
          returnKeyType={onSubmit ? "search" : "default"}
          blurOnSubmit={!!onSubmit}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          hitSlop={8}
          onPress={startVoiceSearch}
        >
          <SonmanIcon
            name="mic"
            size={iconSizes.action}
            color={iconColors.action}
            weight="regular"
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Camera search"
          hitSlop={8}
          onPress={openCameraSearch}
        >
          <SonmanIcon
            name="camera"
            size={iconSizes.action}
            color={iconColors.action}
            weight="regular"
          />
        </Pressable>
      </View>

      {!!options.length && (
        <View style={styles.searchSuggestions}>
          <Text style={styles.suggestionLabel}>
            {matches.length ? "Suggestions" : currentValue ? "Popular Searches" : "Recent and Popular"}
          </Text>

          {options.map((option) => (
            <Text
              key={option}
              style={styles.suggestion}
              onPress={() => commitSearch(option, true)}
            >
              {option}
            </Text>
          ))}
        </View>
      )}

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={closeCameraSearch}>
        <View style={cameraStyles.shell}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
            onMountError={(event) => setCameraError(event.message)}
            onBarcodeScanned={cameraBusy ? undefined : handleBarcode}
          />

          <View style={cameraStyles.topBar}>
            <Pressable style={cameraStyles.closeButton} onPress={closeCameraSearch}>
              <Text style={cameraStyles.closeText}>Close</Text>
            </Pressable>

            <Text style={cameraStyles.title}>Camera search</Text>

            <View style={cameraStyles.closeButtonGhost} />
          </View>

          <View style={cameraStyles.scanFrame} />

          <View style={cameraStyles.bottomPanel}>
            <Text style={cameraStyles.helpText}>Scan a barcode or QR code.</Text>

            {!!cameraError && <Text style={cameraStyles.errorText}>{cameraError}</Text>}

            <Pressable
              style={[
                cameraStyles.captureButton,
                (!cameraReady || cameraBusy) && cameraStyles.disabledButton,
              ]}
              onPress={captureImage}
              disabled={!cameraReady || cameraBusy}
            >
              <SonmanIcon name="camera" size={24} color={palette.white} weight="fill" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const cameraStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    minWidth: 64,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  closeButtonGhost: {
    minWidth: 64,
    height: 40,
  },
  closeText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
  },
  scanFrame: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: palette.white,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  bottomPanel: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 34,
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.66)",
  },
  helpText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.gold,
    borderWidth: 3,
    borderColor: palette.white,
  },
  disabledButton: {
    opacity: 0.55,
  },
});