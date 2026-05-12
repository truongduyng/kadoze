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
            sf={{ default: "doc.text", selected: "doc.text" }}
            md="menu_book"
          />
          <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="chat">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "bubble.left.and.bubble.right",
              selected: "bubble.left.and.bubble.right",
            }}
            md="chat"
          />
          <NativeTabs.Trigger.Label>Note</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="todo">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "checkmark.circle",
              selected: "checkmark.circle",
            }}
            md="check_circle"
          />
          <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon
            sf={{
              default: "person.crop.circle",
              selected: "person.crop.circle",
            }}
            md="account_circle"
          />
          <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
