import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { ChartCard, ScreenShell } from "./shared";
import { makeStyles } from "./theme";

export function FutureScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext}>
      <View style={[s.copyBlock, s.futureCopy]}>
        <Text style={s.headline}>Imagine 30 days of small consistent progress.</Text>
        <Text style={s.body}>Not hustle.{"\n"}Not motivation.{"\n"}Just sustainable momentum.</Text>
      </View>
      <ChartCard />
    </ScreenShell>
  );
}
