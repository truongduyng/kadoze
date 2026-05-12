import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SystemHintProps {
  text: string;
}

export default function SystemHint({ text }: SystemHintProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
