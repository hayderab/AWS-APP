import React from 'react';
import { 
  KeyboardAvoidingView, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform,
  StyleSheet,
  View
} from 'react-native';
import { isIOS, isAndroid, isWeb } from '../utils/platformUtils';

/**
 * A wrapper component that handles keyboard behavior differently based on platform
 * - On iOS: Uses KeyboardAvoidingView with padding behavior
 * - On Android: Uses simple ScrollView as Android handles this natively
 * - On Web: Uses a regular View as web handles keyboard differently
 */
const KeyboardAvoidingWrapper = ({ 
  children, 
  style, 
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  behavior = isIOS ? 'padding' : undefined,
  enabled = !isWeb,
  dismissKeyboardOnTap = true
}) => {
  // On web, we don't need special keyboard handling
  if (isWeb) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </View>
      </View>
    );
  }

  // For mobile platforms
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={behavior}
      enabled={enabled}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {dismissKeyboardOnTap ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <View style={styles.innerContainer}>
            {children}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
  }
});

export default KeyboardAvoidingWrapper;
