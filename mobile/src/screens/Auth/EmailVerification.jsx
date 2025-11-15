import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import Header from '../../components/common/Header';

const EmailVerification = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = route.params || {};
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.post('/auth/verify-email', {
        token,
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.error || 'Verification failed. The link may have expired.'
      );
    }
  };

  const resendVerification = async () => {
    setMessage('Please log in to your account to resend the verification email from your profile page.');
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <View style={styles.card}>
          {status === 'verifying' && (
            <>
              <Text style={styles.emoji}>⏳</Text>
              <Text style={styles.title}>Verifying Email</Text>
              <Text style={styles.message}>{message}</Text>
            </>
          )}

          {status === 'success' && (
            <>
              <Text style={styles.emoji}>✅</Text>
              <Text style={[styles.title, styles.successTitle]}>Email Verified!</Text>
              <Text style={styles.message}>{message}</Text>
              <TouchableOpacity
                style={commonStyles.button}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={commonStyles.buttonText}>GO TO LOGIN</Text>
              </TouchableOpacity>
            </>
          )}

          {status === 'error' && (
            <>
              <Text style={styles.emoji}>❌</Text>
              <Text style={[styles.title, styles.errorTitle]}>Verification Failed</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={commonStyles.button}
                  onPress={resendVerification}
                >
                  <Text style={commonStyles.buttonText}>RESEND VERIFICATION EMAIL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.link}>Return to Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes['4xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successTitle: {
    color: theme.colors.success,
  },
  errorTitle: {
    color: theme.colors.error,
  },
  message: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  link: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
  },
});

export default EmailVerification;

