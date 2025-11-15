import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Header from '../../components/common/Header';

const AstronautProfile = () => {
  const route = useRoute();
  const { id } = route.params;
  const [astronaut, setAstronaut] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAstronaut();
  }, [id]);

  const fetchAstronaut = async () => {
    try {
      const response = await api.get(`/spacebase/astronauts/${id}`);
      setAstronaut(response.data);
    } catch (error) {
      console.error('Error fetching astronaut:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!astronaut) {
    return (
      <View style={commonStyles.container}>
        <Header title="Astronaut Not Found" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Astronaut not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <Header title="SPACEBASE" showBack />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {astronaut.profile_image_url && (
            <Image
              source={{ uri: astronaut.profile_image_url }}
              style={styles.profileImage}
            />
          )}
          
          <Text style={styles.name}>
            {astronaut.full_name || `${astronaut.first_name} ${astronaut.last_name}`}
          </Text>

          <View style={styles.infoSection}>
            {astronaut.nationality && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nationality:</Text>
                <Text style={styles.infoValue}>{astronaut.nationality}</Text>
              </View>
            )}
            {astronaut.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{astronaut.status}</Text>
              </View>
            )}
            {astronaut.days_in_space && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Days in Space:</Text>
                <Text style={styles.infoValue}>{astronaut.days_in_space}</Text>
              </View>
            )}
            {astronaut.missions_count && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Missions:</Text>
                <Text style={styles.infoValue}>{astronaut.missions_count}</Text>
              </View>
            )}
            {astronaut.spacewalks_count && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Spacewalks:</Text>
                <Text style={styles.infoValue}>{astronaut.spacewalks_count}</Text>
              </View>
            )}
          </View>

          {astronaut.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>Biography</Text>
              <Text style={styles.bioText}>{astronaut.bio}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  profileImage: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  infoSection: {
    marginBottom: theme.spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  bioSection: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  bioText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSizes.xl,
    color: theme.colors.text,
  },
});

export default AstronautProfile;

