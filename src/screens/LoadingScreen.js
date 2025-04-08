import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.primary }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default LoadingScreen;
