import GradientBackground from "@/components/GradientBackground";
import { useChatHistory } from "@/hooks/chat/useChatHistory";
import DaySummaryCard from "@/components/chat/DaySummaryCard";
import { router } from "expo-router";
import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InboxHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { days } = useChatHistory();

  const openDay = (dateKey: string) =>
    router.push({ pathname: "/chat" as any, params: { date: dateKey } });

  return (
    <View style={styles.container}>
      <GradientBackground />
      <FlatList
        data={days}
        keyExtractor={(item) => item.dateKey}
        renderItem={({ item, index }) => (
          <DaySummaryCard
            day={item}
            onPress={() => openDay(item.dateKey)}
            isLast={index === days.length - 1}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {},
});
