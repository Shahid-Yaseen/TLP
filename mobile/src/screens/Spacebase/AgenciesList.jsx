import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';

const AgenciesList = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await api.get('/spacebase/agencies');
      const data = response.data?.data || response.data || [];
      setAgencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgencies();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="AGENCIES" showBack />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.content}>
          {agencies.length > 0 ? (
            agencies.map((agency) => (
              <View key={agency.id} style={styles.card}>
                <Text style={styles.name}>{agency.name || 'Unknown Agency'}</Text>
                {agency.abbreviation && (
                  <Text style={styles.abbreviation}>{agency.abbreviation}</Text>
                )}
                {agency.country && (
                  <Text style={styles.country}>{agency.country}</Text>
                )}
                {agency.description && (
                  <Text style={styles.description} numberOfLines={3}>
                    {agency.description}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <EmptyState message="No agencies found" />
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  abbreviation: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  country: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

export default AgenciesList;

