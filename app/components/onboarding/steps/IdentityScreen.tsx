import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Keyboard, Pressable, Text, TextInput, View } from "react-native";

import { palette } from "@/constants/theme";
import { GAME_AVATARS, type GameAvatarId } from "@/lib/avatarCatalog";
import { useTheme } from "@/hooks/useTheme";
import { ScreenShell } from "./shared";
import { ORANGE, makeStyles } from "./theme";

export function IdentityScreen({
  name,
  avatar,
  onNameChange,
  onAvatarChange,
  onNext,
}: {
  name: string;
  avatar: GameAvatarId;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: GameAvatarId) => void;
  onNext: () => void;
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const canContinue = name.trim().length > 0 && Boolean(avatar);
  return (
    <ScreenShell
      onNext={onNext}
      disabled={!canContinue}
      scroll
      stickyFooter
      dismissesKeyboard
    >
      <View style={s.copyBlock}>
        <Text style={s.headline}>Make 1Per yours</Text>
        <Text style={s.body}>Choose the character that will show up with you each day</Text>
      </View>

      <View style={s.nameFieldWrap}>
        <Text style={s.fieldLabel}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="What should we call you?"
          placeholderTextColor={palette.white35}
          style={s.nameInput}
          selectionColor={ORANGE}
          maxLength={32}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>

      <View style={s.avatarGrid}>
        {GAME_AVATARS.map((item) => {
          const active = avatar === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onAvatarChange(item.id)}
              style={[s.avatarChoice, active && s.avatarChoiceActive]}
            >
              <View style={s.characterAvatarFrame}>
                <Image source={item.source} style={s.characterAvatarImage} />
                {active ? (
                  <View style={s.avatarCheckBadge}>
                    <Ionicons name="checkmark" size={13} color="#050505" />
                  </View>
                ) : null}
              </View>
              <Text style={[s.avatarChoiceText, active && s.avatarChoiceTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenShell>
  );
}
