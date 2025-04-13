import { Platform } from 'react-native';
import { isIOS, isAndroid, isWeb } from '../utils/platformUtils';

// Platform-specific configuration settings
const platformConfig = {
  // Animation durations (iOS animations are typically longer)
  animationDuration: isIOS ? 400 : 300,
  
  // Touch feedback type
  feedbackType: isAndroid ? 'android' : 'ios',
  
  // Default font family
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }),
  },
  
  // Platform-specific UI adjustments
  ui: {
    // Padding and margin adjustments
    basePadding: isWeb ? 16 : 12,
    baseMargin: isWeb ? 16 : 12,
    
    // Border radius adjustments
    borderRadius: isIOS ? 8 : 4,
    
    // Input field height
    inputHeight: isIOS ? 44 : 48,
    
    // Button sizes
    buttonHeight: isIOS ? 44 : 48,
    
    // Card elevation/shadow
    cardElevation: isIOS ? 2 : 4,
  },
  
  // Platform-specific behavior flags
  behavior: {
    // Whether to use native modals or custom modals
    useNativeModals: !isWeb,
    
    // Whether to use native date pickers
    useNativeDatePickers: !isWeb,
    
    // Whether to use hardware back button (Android)
    useHardwareBackButton: isAndroid,
    
    // Whether to use native pull-to-refresh
    useNativePullToRefresh: !isWeb,
  },
  
  // Web-specific settings
  web: {
    // Whether to use hover effects
    useHoverEffects: true,
    
    // Whether to use CSS transitions
    useCssTransitions: true,
    
    // Max content width for responsive design
    maxContentWidth: 1200,
  }
};

export default platformConfig;
