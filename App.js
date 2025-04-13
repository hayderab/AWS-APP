import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet, LogBox } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/utils/theme';
import * as SplashScreen from 'expo-splash-screen';
import { isWeb, isIOS, isAndroid } from './src/utils/platformUtils';

// Ignore specific warnings that are not relevant
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Artificial delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  // Apply platform-specific status bar styling
  const statusBarStyle = Platform.select({
    ios: 'dark',
    android: 'light',
    web: 'auto',
  });

  // Web-specific linking configuration
  const linking = isWeb ? {
    prefixes: ['https://awscerttutor.com', 'awscerttutor://'],
    config: {
      screens: {
        Home: '',
        TopicList: 'topics',
        TopicDetail: 'topic/:id',
        Quiz: 'quiz/:id',
        Notes: 'notes',
        Profile: 'profile',
        Login: 'login',
        Register: 'register',
      }
    }
  } : undefined;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer
            linking={linking}
            theme={isWeb ? {
              colors: {
                ...theme.colors,
                background: '#f8f9fa'
              }
            } : undefined}
          >
            <StatusBar style={statusBarStyle} />
            <View style={styles.container}>
              <RootNavigator />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Apply platform-specific styles
    ...Platform.select({
      web: {
        maxWidth: '100%',
        height: '100%',
        overflow: 'hidden',
      },
      default: {
        width: '100%',
        height: '100%',
      }
    })
  }
});
