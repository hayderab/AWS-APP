import { DefaultTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';
import { isIOS, isAndroid, isWeb } from './platformUtils';

// Define font configuration for different platforms
const fontConfig = {
  web: {
    regular: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '500',
    },
    light: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '300',
    },
    thin: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Roboto',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto',
      fontWeight: '100',
    },
  }
};

// Platform-specific adjustments
const platformAdjustments = {
  roundness: isIOS ? 8 : 4,
  animation: {
    scale: isWeb ? 0.8 : 1.0, // Slightly faster animations on web
  },
};

// Create the theme
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0073BB', // AWS blue
    accent: '#FF9900', // AWS orange
    background: isWeb ? '#F8F9FA' : '#F8F8F8', // Slightly different background for web
    surface: '#FFFFFF',
    text: '#232F3E', // AWS dark blue/gray
    error: '#D13212', // AWS red
    success: '#1D8102', // AWS green
    info: '#0073BB',
    warning: '#FF9900',
    // Additional colors for different states and components
    disabled: isWeb ? 'rgba(0, 0, 0, 0.26)' : 'rgba(0, 0, 0, 0.38)',
    placeholder: isWeb ? 'rgba(0, 0, 0, 0.54)' : 'rgba(0, 0, 0, 0.6)',
    backdrop: isWeb ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.4)',
    notification: '#FF9900',
    // Card and surface colors
    card: '#FFFFFF',
    border: isWeb ? '#E0E0E0' : '#DDDDDD',
  },
  // Use platform-specific font configuration
  fonts: configureFonts({
    config: Platform.select(fontConfig),
  }),
  ...platformAdjustments,
  // Additional theme properties
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  // Adjust shadows based on platform
  shadows: {
    small: isIOS 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 }
      : { elevation: 2 },
    medium: isIOS 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 }
      : { elevation: 4 },
    large: isIOS 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 }
      : { elevation: 8 },
  },
};

// Helper function to get responsive sizes based on platform
export const getResponsiveSize = (size, factor = 1) => {
  if (isWeb) {
    return size * 0.9 * factor; // Slightly smaller on web
  }
  return size * factor;
};

// Export additional theme utilities
export default {
  theme,
  getResponsiveSize,
};
