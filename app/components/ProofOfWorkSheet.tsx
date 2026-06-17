import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { verifyProofOfWork } from "@/lib/backend";

const SCAN_DURATION_MS = 1800;
const IMAGE_HEIGHT = 280;

interface Props {
  visible: boolean;
  habitTitle: string;
  onConfirmed: () => void;
  onSkip: () => void;
  onDismiss: () => void;
}

type State =
  | { kind: "idle" }
  | { kind: "scanning"; imageUri: string }
  | { kind: "verified"; imageUri: string; message: string }
  | { kind: "rejected"; imageUri: string; message: string };

export default function ProofOfWorkSheet({
  visible,
  habitTitle,
  onConfirmed,
  onSkip,
  onDismiss,
}: Props) {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  const s = makeStyles(C, insets);
  const [state, setState] = useState<State>({ kind: "idle" });
  const scanY = useSharedValue(0);
  const scanOpacity = useSharedValue(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setState({ kind: "idle" });
      cancelAnimation(scanY);
      scanOpacity.value = 0;
    }
  }, [visible, scanOpacity, scanY]);

  const startScanAnimation = useCallback(() => {
    scanY.value = 0;
    scanOpacity.value = withTiming(1, { duration: 200 });
    scanY.value = withRepeat(
      withTiming(IMAGE_HEIGHT, {
        duration: SCAN_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [scanOpacity, scanY]);

  const stopScanAnimation = useCallback(() => {
    cancelAnimation(scanY);
    scanOpacity.value = withTiming(0, { duration: 300 });
  }, [scanOpacity, scanY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: scanOpacity.value,
  }));

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const imageUri = asset.uri;
    const imageBase64 = asset.base64 ?? "";

    if (!isMounted.current) return;
    setState({ kind: "scanning", imageUri });
    startScanAnimation();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const verification = await verifyProofOfWork(imageBase64, habitTitle);
      if (!isMounted.current) return;
      stopScanAnimation();

      if (verification.verified) {
        setState({ kind: "verified", imageUri, message: verification.message });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setState({ kind: "rejected", imageUri, message: verification.message });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      if (!isMounted.current) return;
      stopScanAnimation();
      setState({ kind: "verified", imageUri, message: "Marked done." });
    }
  }, [habitTitle, startScanAnimation, stopScanAnimation]);

  const handleRetry = useCallback(() => {
    setState({ kind: "idle" });
  }, []);

  const renderContent = () => {
    if (state.kind === "idle") {
      return (
        <>
          <View style={s.placeholder}>
            <View style={s.cameraIconWrap}>
              <Ionicons name="camera-outline" size={52} color={palette.orange} />
            </View>
            <Text style={s.placeholderText}>Take a photo to prove{"\n"}you did it</Text>
            <Text style={s.placeholderSub}>
              A quick snap is all it takes — AI will verify it for you.
            </Text>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
            <Ionicons name="camera" size={20} color="#fff" style={s.btnIcon} />
            <Text style={s.primaryBtnText}>Open camera</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} activeOpacity={0.7} hitSlop={12} style={s.skipBtn}>
            <Text style={s.skipText}>Skip — mark done anyway</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (state.kind === "scanning") {
      return (
        <>
          <View style={s.imageContainer}>
            <Image source={{ uri: state.imageUri }} style={s.photo} resizeMode="cover" />
            {/* Scan overlay grid */}
            <View style={s.scanOverlay} pointerEvents="none">
              <Animated.View style={[s.scanLine, scanLineStyle]}>
                <View style={s.scanLineGlow} />
              </Animated.View>
            </View>
            {/* Corner brackets */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>

          <View style={s.scanStatus}>
            <ActivityIndicator color={palette.orange} size="small" />
            <Text style={s.scanStatusText}>Analyzing with AI…</Text>
          </View>
        </>
      );
    }

    if (state.kind === "verified") {
      return (
        <>
          <View style={s.imageContainer}>
            <Image source={{ uri: state.imageUri }} style={s.photo} resizeMode="cover" />
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              <Text style={s.verifiedBadgeText}>Verified</Text>
            </View>
          </View>

          <Text style={s.resultMessage}>{state.message}</Text>

          <TouchableOpacity style={s.primaryBtn} onPress={onConfirmed} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Nice work — mark done</Text>
          </TouchableOpacity>
        </>
      );
    }

    // rejected
    return (
      <>
        <View style={s.imageContainer}>
          <Image source={{ uri: state.imageUri }} style={s.photo} resizeMode="cover" />
          <View style={[s.verifiedBadge, s.rejectedBadge]}>
            <Ionicons name="close-circle" size={32} color="#ef4444" />
            <Text style={[s.verifiedBadgeText, s.rejectedBadgeText]}>Not verified</Text>
          </View>
        </View>

        <Text style={s.resultMessage}>{state.message}</Text>

        <TouchableOpacity style={s.primaryBtn} onPress={handleRetry} activeOpacity={0.85}>
          <Ionicons name="camera" size={20} color="#fff" style={s.btnIcon} />
          <Text style={s.primaryBtnText}>Try again</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} activeOpacity={0.7} hitSlop={12} style={s.skipBtn}>
          <Text style={s.skipText}>Mark done anyway</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={s.backdrop} onPress={state.kind === "idle" ? onDismiss : undefined}>
        <Pressable style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={s.handle} />

          <Text style={s.title}>Proof of work</Text>
          <Text style={s.subtitle}>
            <Text style={s.habitName}>{habitTitle}</Text>
          </Text>

          <View style={s.body}>{renderContent()}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CORNER_SIZE = 18;
const CORNER_WIDTH = 2.5;

function makeStyles(
  C: ReturnType<typeof import("@/hooks/useTheme").useTheme>,
  insets: { bottom: number },
) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: C.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.cardBorder,
      alignSelf: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: C.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: C.textSecondary,
      marginBottom: 20,
    },
    habitName: {
      color: palette.orange,
      fontWeight: "700",
    },
    body: {
      gap: 16,
    },
    // Idle
    placeholder: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 12,
    },
    cameraIconWrap: {
      width: 96,
      height: 96,
      borderRadius: 28,
      borderCurve: "continuous",
      backgroundColor: C.accentBg,
      borderWidth: 1.5,
      borderColor: C.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    placeholderText: {
      fontSize: 18,
      fontWeight: "700",
      color: C.textPrimary,
      textAlign: "center",
      lineHeight: 26,
    },
    placeholderSub: {
      fontSize: 14,
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    // Photo & scan
    imageContainer: {
      width: "100%",
      height: IMAGE_HEIGHT,
      borderRadius: 16,
      borderCurve: "continuous",
      overflow: "hidden",
      backgroundColor: C.accentBg,
    },
    photo: {
      width: "100%",
      height: "100%",
    },
    scanOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    scanLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
    },
    scanLineGlow: {
      flex: 1,
      backgroundColor: palette.orange,
      shadowColor: palette.orange,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 6,
    },
    // Corner brackets
    corner: {
      position: "absolute",
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      borderColor: palette.orange,
    },
    cornerTL: {
      top: 10,
      left: 10,
      borderTopWidth: CORNER_WIDTH,
      borderLeftWidth: CORNER_WIDTH,
      borderTopLeftRadius: 4,
    },
    cornerTR: {
      top: 10,
      right: 10,
      borderTopWidth: CORNER_WIDTH,
      borderRightWidth: CORNER_WIDTH,
      borderTopRightRadius: 4,
    },
    cornerBL: {
      bottom: 10,
      left: 10,
      borderBottomWidth: CORNER_WIDTH,
      borderLeftWidth: CORNER_WIDTH,
      borderBottomLeftRadius: 4,
    },
    cornerBR: {
      bottom: 10,
      right: 10,
      borderBottomWidth: CORNER_WIDTH,
      borderRightWidth: CORNER_WIDTH,
      borderBottomRightRadius: 4,
    },
    scanStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      alignSelf: "center",
    },
    scanStatusText: {
      fontSize: 15,
      color: C.textSecondary,
      fontWeight: "600",
    },
    // Result
    verifiedBadge: {
      position: "absolute",
      bottom: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    verifiedBadgeText: {
      color: "#22c55e",
      fontWeight: "700",
      fontSize: 13,
    },
    rejectedBadge: {
      borderWidth: 0,
    },
    rejectedBadgeText: {
      color: "#ef4444",
    },
    resultMessage: {
      fontSize: 14,
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    // Buttons
    primaryBtn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 17,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    btnIcon: {},
    skipBtn: {
      alignItems: "center",
      paddingVertical: 4,
    },
    skipText: {
      color: C.textTertiary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
