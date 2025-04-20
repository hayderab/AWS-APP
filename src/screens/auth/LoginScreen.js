import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Dimensions } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, Divider } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(null); // 'email', 'password', or 'general'
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    // Reset previous errors
    setError('');
    setErrorType(null);
    
    // Input validation
    if (!email && !password) {
      setError('Please enter both email and password');
      setErrorType('general');
      return;
    } else if (!email) {
      setError('Please enter your email');
      setErrorType('email');
      return;
    } else if (!password) {
      setError('Please enter your password');
      setErrorType('password');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setErrorType('email');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // Navigation will be handled by the AuthContext
    } catch (err) {
      // Determine error type based on error message
      if (err.message.includes('Invalid credentials')) {
        // For credential errors, highlight both fields
        setErrorType('credentials');
      } else if (err.message.includes('Network error')) {
        setErrorType('network');
      } else if (err.message.includes('Too many login attempts')) {
        setErrorType('rate_limit');
      } else if (err.message.includes('Server error')) {
        setErrorType('server');
      } else {
        setErrorType('general');
      }
      
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <View style={styles.backgroundPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../src/assets/aws-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>AWS Certification Tutor</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <Surface style={styles.formSurface}>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputContainer, 
                errorType === 'email' || errorType === 'credentials' ? styles.inputError : null]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={errorType === 'email' || errorType === 'credentials' ? '#D32F2F' : '#9E9E9E'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorType === 'email' || errorType === 'credentials') {
                      setErrorType(null);
                      setError('');
                    }
                  }}
                  mode="flat"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  placeholder="Enter your email"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  theme={{ colors: { text: '#424242' } }}
                  error={errorType === 'email' || errorType === 'credentials'}
                />
              </View>
              
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, 
                errorType === 'password' || errorType === 'credentials' ? styles.inputError : null]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={errorType === 'password' || errorType === 'credentials' ? '#D32F2F' : '#9E9E9E'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorType === 'password' || errorType === 'credentials') {
                      setErrorType(null);
                      setError('');
                    }
                  }}
                  mode="flat"
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  placeholder="Enter your password"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  theme={{ colors: { text: '#424242' } }}
                  error={errorType === 'password' || errorType === 'credentials'}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                      color="#9E9E9E"
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                    />
                  }
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign in
              </Button>

              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.dividerText}>or continue with</Text>
                <Divider style={styles.divider} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome5 name="facebook-f" size={18} color="#4267B2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome5 name="google" size={18} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome5 name="apple" size={18} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>
          </Surface>

          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerText, { color: theme.colors.primary }]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  backgroundPattern: {
    position: 'absolute',
    width: width,
    height: height,
  },
  patternCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(0, 115, 187, 0.05)',
    top: -width * 0.4,
    right: -width * 0.2,
  },
  patternCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 153, 0, 0.05)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#232F3E',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  formSurface: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 52,
    fontSize: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    height: 52,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#0073BB',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9E9E9E',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputError: {
    borderColor: '#D32F2F',
    borderWidth: 1,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerPrompt: {
    color: '#666666',
    fontSize: 15,
  },
  registerText: {
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 4,
  },
});

export default LoginScreen;
