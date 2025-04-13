import { Platform, Dimensions } from 'react-native';

// Platform detection utilities
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// Device dimension utilities
const { width, height } = Dimensions.get('window');
export const isTablet = width >= 768;
export const isLandscape = width > height;

// Platform-specific styling helper
export const platformSpecific = (ios, android, web) => {
  if (isIOS) return ios;
  if (isAndroid) return android;
  if (isWeb) return web;
  return android; // Default fallback
};

// Platform-specific shadow styles
export const getPlatformShadow = (elevation = 4) => {
  if (isIOS) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.2,
      shadowRadius: elevation / 2,
    };
  }
  
  if (isAndroid) {
    return {
      elevation,
    };
  }
  
  if (isWeb) {
    return {
      boxShadow: `0px ${elevation / 2}px ${elevation}px rgba(0, 0, 0, 0.2)`,
    };
  }
  
  return {};
};

// Safe area insets for notched devices
export const getSafeAreaInsets = () => {
  // These would typically come from a hook like useSafeAreaInsets()
  // This is a simplified version
  return {
    top: isIOS ? 44 : 0,
    bottom: isIOS ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Platform-specific font scaling
export const getFontSize = (size) => {
  if (isWeb) {
    return size * 0.9; // Web often needs slightly smaller fonts
  }
  return size;
};
