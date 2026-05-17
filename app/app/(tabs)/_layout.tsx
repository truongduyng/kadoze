import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        tintColor={Colors.light.tint}
        iconColor={{
          default: isDark ? Colors.dark.icon : Colors.light.icon,
          selected: Colors.light.tint,
        }}
        backgroundColor={isDark ? "rgba(30, 30, 30, 0.5)" : "rgba(240, 240, 240, 0.8)"}
        blurEffect={
          isDark ? "systemChromeMaterialDark" : "systemChromeMaterial"
        }
      >
        <NativeTabs.Trigger name="index" disableScrollToTop>
          <NativeTabs.Trigger.Icon
            sf={{ default: "target", selected: "target" }}
            md="filter_center_focus"
          />
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="notes">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "note.text",
              selected: "note.text",
            }}
            md="edit_note"
          />
          <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="routines">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "checklist",
              selected: "checklist",
            }}
            md="checklist"
          />
          <NativeTabs.Trigger.Label>Routines</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "person",
              selected: "person.fill",
            }}
            md="person"
          />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
