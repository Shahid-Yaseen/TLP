import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import ErrorMessage from '../../components/common/ErrorMessage';
import Header from '../../components/common/Header';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // TODO: Implement forgot password API endpoint
      // For now, show success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMessage('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>RESET PASSWORD</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          <ErrorMessage message={error} />

          {message && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{message}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={commonStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              style={[commonStyles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={commonStyles.buttonText}>
                {loading ? 'Sending...' : 'SEND RESET LINK'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Remember your password?{' '}
              <Text 
                style={styles.link}
                onPress={() => navigation.navigate('Login')}
              >
                Sign in
              </Text>
            </Text>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text 
                style={styles.link}
                onPress={() => navigation.navigate('Register')}
              >
                Create one here
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSizes['4xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  successContainer: {
    backgroundColor: '#064E3B',
    borderColor: '#047857',
    borderWidth: 1,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: '#86EFAC',
    fontSize: theme.fontSizes.sm,
  },
  footer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  footerText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    color: theme.colors.primary,
  },
});

export default ForgotPassword;

