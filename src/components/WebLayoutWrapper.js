import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { isWeb } from '../utils/platformUtils';

/**
 * A wrapper component that provides different layouts for web vs mobile
 * On web: Uses a centered container with max width
 * On mobile: Uses full width
 */
const WebLayoutWrapper = ({ children, style }) => {
  // Only apply special layout on web
  if (!isWeb) {
    return (
      <View style={[styles.mobileContainer, style]}>
        {children}
      </View>
    );
  }

  // Get current window dimensions
  const windowWidth = Dimensions.get('window').width;
  
  // Determine if we should use sidebar layout (for larger screens)
  const useSidebarLayout = windowWidth >= 1024;

  return (
    <View style={styles.webOuterContainer}>
      {useSidebarLayout ? (
        <View style={styles.webSidebarLayout}>
          <View style={styles.webSidebar}>
            {/* Web-specific sidebar navigation could go here */}
            <View style={styles.sidebarContent}>
              <View style={styles.logoContainer}>
                <View style={styles.logo} />
                <View style={styles.appTitle}>
                  <View style={styles.titleBar} />
                  <View style={styles.subtitleBar} />
                </View>
              </View>
              
              {/* Navigation menu items */}
              {[1, 2, 3, 4, 5].map((_, index) => (
                <View key={index} style={styles.navItem}>
                  <View style={styles.navIcon} />
                  <View style={styles.navText} />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.webMainContent}>
            <View style={[styles.webContainer, style]}>
              {children}
            </View>
          </View>
        </View>
      ) : (
        // For medium sized screens, just center the content
        <View style={[styles.webContainer, style]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    width: '100%',
  },
  webOuterContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    marginVertical: 0,
    marginHorizontal: 'auto',
    paddingHorizontal: 0,
    paddingVertical: 0,
    height: '100%',
    overflow: 'auto',
  },
  webSidebarLayout: {
    flexDirection: 'row',
    flex: 1,
    height: '100vh',
  },
  webSidebar: {
    width: 250,
    backgroundColor: '#232F3E', // AWS dark blue
    height: '100%',
    padding: 20,
  },
  webMainContent: {
    flex: 1,
    height: '100%',
    overflow: 'auto',
  },
  sidebarContent: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FF9900', // AWS orange
    marginRight: 12,
  },
  appTitle: {
    flex: 1,
  },
  titleBar: {
    height: 16,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  subtitleBar: {
    height: 12,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    borderRadius: 4,
    width: '60%',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  navIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    marginRight: 12,
  },
  navText: {
    height: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    borderRadius: 4,
    width: '70%',
  },
});

export default WebLayoutWrapper;
