import { PropsWithChildren, ReactNode, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({
  children,
  title,
  headerContent,
  titleStyle,
  headerStyle,
  contentStyle,
}: PropsWithChildren & {
  title: string;
  headerContent?: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView lightColor="transparent" darkColor="transparent">
      <TouchableOpacity
        style={[styles.heading, headerStyle]}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        {headerContent ?? (
          <ThemedText type="defaultSemiBold" style={titleStyle}>
            {title}
          </ThemedText>
        )}
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={[styles.chevron, { transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }]}
        />
      </TouchableOpacity>
      {isOpen && (
        <ThemedView lightColor="transparent" darkColor="transparent" style={[styles.content, contentStyle]}>
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    marginLeft: 'auto',
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
