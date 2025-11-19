import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { theme, commonStyles } from '../../styles/theme';
import ErrorMessage from '../../components/common/ErrorMessage';
import Header from '../../components/common/Header';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation();

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    // Split full_name into first_name and last_name
    const nameParts = formData.full_name.trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const result = await register(formData.email, formData.password, first_name, last_name);

    if (result.success) {
      navigation.replace('MainTabs');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>REGISTER</Text>
          <Text style={styles.subtitle}>Create your TLP Network account</Text>

          <ErrorMessage message={error} />

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.full_name}
                onChangeText={(value) => handleChange('full_name', value)}
                placeholder="John Doe"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
              />
              <Text style={styles.hint}>Must be at least 8 characters</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
              />
            </View>

            <TouchableOpacity
              style={[commonStyles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={commonStyles.buttonText}>
                {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text 
                style={styles.link}
                onPress={() => navigation.navigate('Login')}
              >
                Sign in here
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
  hint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    marginTop: theme.spacing.xl,
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

export default Register;

