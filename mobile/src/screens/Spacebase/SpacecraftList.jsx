import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';

const SpacecraftList = () => {
  const [spacecraft, setSpacecraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSpacecraft();
  }, []);

  const fetchSpacecraft = async () => {
    try {
      const response = await api.get('/spacebase/spacecraft');
      const data = response.data?.data || response.data || [];
      setSpacecraft(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching spacecraft:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSpacecraft();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="SPACECRAFT" showBack />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.content}>
          {spacecraft.length > 0 ? (
            spacecraft.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.name}>{item.name || 'Unknown Spacecraft'}</Text>
                {item.description && (
                  <Text style={styles.description} numberOfLines={3}>
                    {item.description}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <EmptyState message="No spacecraft found" />
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
  description: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

export default SpacecraftList;

