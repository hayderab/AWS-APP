import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const theme = useTheme();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../src/assets/aws-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Reset Password</Text>
        </View>

        <View style={styles.formContainer}>
          {!success ? (
            <>
              <Text style={styles.instructions}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Send Reset Link
              </Button>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Password reset email sent! Check your inbox and follow the instructions to reset your password.
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login')}
                style={[styles.button, { marginTop: 24 }]}
              >
                Back to Login
              </Button>
            </View>
          )}

          {!success && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.backToLoginContainer}
            >
              <Text style={[styles.backToLoginText, { color: theme.colors.primary }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backToLoginText: {
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    textAlign: 'center',
    color: 'green',
    fontSize: 16,
    marginBottom: 16,
  },
});

export default ForgotPasswordScreen;
