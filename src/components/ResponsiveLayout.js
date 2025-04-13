import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { isWeb, isTablet, isLandscape } from '../utils/platformUtils';

// Responsive layout component that adapts to different screen sizes and orientations
export const ResponsiveContainer = ({ 
  children, 
  style, 
  webMaxWidth = 1200,
  tabletMaxWidth = 768,
  mobileMaxWidth = '100%'
}) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const handleDimensionsChange = ({ window }) => {
      setDimensions(window);
    };

    // Only add the listener on web since mobile orientation changes are less frequent
    // and are usually handled by the OS
    if (isWeb) {
      Dimensions.addEventListener('change', handleDimensionsChange);
      
      // Clean up
      return () => {
        // Check if the remove method exists (for newer React Native versions)
        if (Dimensions.removeEventListener) {
          Dimensions.removeEventListener('change', handleDimensionsChange);
        }
      };
    }
  }, []);

  const { width, height } = dimensions;
  const isLandscapeView = width > height;
  const isTabletView = width >= 768;

  // Determine max width based on device type and orientation
  let maxWidth = mobileMaxWidth;
  if (isWeb) {
    maxWidth = webMaxWidth;
  } else if (isTabletView || isTablet) {
    maxWidth = isLandscapeView ? tabletMaxWidth : '100%';
  }

  return (
    <View style={[
      styles.container,
      { maxWidth },
      style
    ]}>
      {children}
    </View>
  );
};

// Row component for responsive grid layouts
export const Row = ({ children, style, spacing = 8 }) => {
  return (
    <View style={[
      styles.row,
      { margin: -spacing / 2 },
      style
    ]}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return null;
        
        return React.cloneElement(child, {
          style: [
            { margin: spacing / 2 },
            child.props.style
          ]
        });
      })}
    </View>
  );
};

// Column component for responsive grid layouts
export const Col = ({ 
  children, 
  style, 
  xs = 12, // 1-12 for mobile (extra small)
  sm, // 1-12 for small tablets
  md, // 1-12 for tablets (medium)
  lg, // 1-12 for desktops (large)
  flex 
}) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const handleDimensionsChange = ({ window }) => {
      setDimensions(window);
    };

    if (isWeb) {
      Dimensions.addEventListener('change', handleDimensionsChange);
      
      return () => {
        if (Dimensions.removeEventListener) {
          Dimensions.removeEventListener('change', handleDimensionsChange);
        }
      };
    }
  }, []);

  const { width } = dimensions;
  
  // Determine column width based on screen size
  let colWidth;
  
  if (width >= 1200 && lg !== undefined) {
    colWidth = `${(lg / 12) * 100}%`;
  } else if (width >= 992 && md !== undefined) {
    colWidth = `${(md / 12) * 100}%`;
  } else if (width >= 768 && sm !== undefined) {
    colWidth = `${(sm / 12) * 100}%`;
  } else {
    colWidth = `${(xs / 12) * 100}%`;
  }

  return (
    <View style={[
      styles.col,
      flex ? { flex } : { width: colWidth },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  col: {
    // Base styles for columns
  }
});

export default {
  ResponsiveContainer,
  Row,
  Col
};
