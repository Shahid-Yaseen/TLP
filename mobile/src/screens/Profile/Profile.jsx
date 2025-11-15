import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import { getResponsiveFontSize, getResponsivePadding, scale } from '../../utils/responsive';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProtectedRoute from '../../components/ProtectedRoute';
import Header from '../../components/common/Header';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.patch('/users/me', formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setFormData({
        full_name: response.data.full_name || `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || '',
        email: response.data.email || '',
        bio: response.data.bio || '',
        location: response.data.location || '',
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute>
      <View style={commonStyles.container}>
        <Header title="USER PROFILE" />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                <Text style={styles.backButtonText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={logout}
              >
                <Text style={styles.logoutButtonText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>

            <ErrorMessage message={error} />

            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#86EFAC" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.formTitle}>Personal Information</Text>
              </View>
              
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.label}>Full Name</Text>
                  </View>
                  <TextInput
                    style={[styles.modernInput, !editing && styles.inputDisabled]}
                    value={formData.full_name}
                    onChangeText={(value) => handleChange('full_name', value)}
                    editable={editing}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.label}>Email Address</Text>
                  </View>
                  <TextInput
                    style={[styles.modernInput, styles.inputDisabled]}
                    value={formData.email}
                    editable={false}
                  />
                  <View style={styles.hintContainer}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.hint}>Email cannot be changed</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.label}>Bio</Text>
                  </View>
                  <TextInput
                    style={[styles.modernInput, styles.textArea, !editing && styles.inputDisabled]}
                    value={formData.bio}
                    onChangeText={(value) => handleChange('bio', value)}
                    editable={editing}
                    multiline
                    numberOfLines={4}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.label}>Location</Text>
                  </View>
                  <TextInput
                    style={[styles.modernInput, !editing && styles.inputDisabled]}
                    value={formData.location}
                    onChangeText={(value) => handleChange('location', value)}
                    editable={editing}
                    placeholder="City, Country"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.buttonGroup}>
                {!editing ? (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditing(true)}
                  >
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>EDIT PROFILE</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.saveButton, loading && styles.buttonDisabled]}
                      onPress={handleSubmit}
                      disabled={loading}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>
                        {loading ? 'SAVING...' : 'SAVE CHANGES'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setEditing(false);
                        setFormData({
                          full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '',
                          email: user.email || '',
                          bio: user.bio || '',
                          location: user.location || '',
                        });
                        setError('');
                        setSuccess('');
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={theme.colors.text} />
                      <Text style={styles.cancelButtonText}>CANCEL</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View style={styles.accountInfoCard}>
              <View style={styles.accountInfoHeader}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Account Information</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.infoLabel}>Account Created</Text>
                </View>
                <Text style={styles.infoValue}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Ionicons 
                    name={(user.email_verified || user.email_verified === true) ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={(user.email_verified || user.email_verified === true) ? theme.colors.success : theme.colors.error} 
                  />
                  <Text style={styles.infoLabel}>Email Verified</Text>
                </View>
                <Text style={[
                  styles.infoValue,
                  (user.email_verified || user.email_verified === true) ? styles.verified : styles.notVerified
                ]}>
                  {(user.email_verified || user.email_verified === true) ? 'Yes' : 'No'}
                </Text>
              </View>
              {user.roles && user.roles.length > 0 && (
                <View style={styles.infoItem}>
                  <View style={styles.infoItemLeft}>
                    <Ionicons name="shield-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.infoLabel}>Roles</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {user.roles.map((r) => r.name).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: getResponsivePadding(theme.spacing.sm),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.xs) * 0.5,
    paddingVertical: getResponsivePadding(theme.spacing.xs) * 0.5,
  },
  backButtonText: {
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    borderRadius: scale(8),
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
  },
  successContainer: {
    backgroundColor: '#064E3B',
    borderColor: '#047857',
    borderWidth: 1,
    borderRadius: scale(12),
    padding: getResponsivePadding(theme.spacing.md),
    marginBottom: getResponsivePadding(theme.spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.sm),
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    color: '#86EFAC',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '500',
    flex: 1,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: scale(16),
    padding: getResponsivePadding(theme.spacing.md),
    marginBottom: getResponsivePadding(theme.spacing.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.sm),
    marginBottom: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  formTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  form: {
    gap: getResponsivePadding(theme.spacing.md),
  },
  inputGroup: {
    gap: getResponsivePadding(theme.spacing.xs),
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.xs) * 0.5,
    marginBottom: getResponsivePadding(theme.spacing.xs) * 0.5,
  },
  label: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    color: theme.colors.text,
  },
  modernInput: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    borderRadius: scale(12),
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: scale(100),
    textAlignVertical: 'top',
    paddingTop: getResponsivePadding(theme.spacing.md),
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#1a1a1a',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.xs) * 0.5,
    marginTop: getResponsivePadding(theme.spacing.xs) * 0.5,
  },
  hint: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs) * 0.9,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonGroup: {
    gap: getResponsivePadding(theme.spacing.sm),
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.lg),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: getResponsivePadding(theme.spacing.sm),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: theme.colors.success || '#10B981',
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.lg),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: getResponsivePadding(theme.spacing.sm),
    shadowColor: theme.colors.success || '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.lg),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: getResponsivePadding(theme.spacing.sm),
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  accountInfoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: scale(16),
    padding: getResponsivePadding(theme.spacing.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.sm),
    marginBottom: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    paddingHorizontal: getResponsivePadding(theme.spacing.sm),
    marginBottom: getResponsivePadding(theme.spacing.xs),
    backgroundColor: theme.colors.background,
    borderRadius: scale(8),
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.xs),
    flex: 1,
  },
  infoLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  verified: {
    color: theme.colors.success || '#10B981',
    fontWeight: '700',
  },
  notVerified: {
    color: theme.colors.error,
    fontWeight: '700',
  },
});

export default Profile;

