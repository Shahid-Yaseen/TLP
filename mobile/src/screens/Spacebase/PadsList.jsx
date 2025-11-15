import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';

const PadsList = () => {
  const [pads, setPads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPads();
  }, []);

  const fetchPads = async () => {
    try {
      // Note: This endpoint may need to be created in the API
      // For now, using launch-sites as a fallback
      const response = await api.get('/launch-sites');
      const data = response.data?.data || response.data || [];
      setPads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPads();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="LAUNCH PADS" showBack />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.content}>
          {pads.length > 0 ? (
            pads.map((pad) => (
              <View key={pad.id} style={styles.card}>
                <Text style={styles.name}>{pad.name || 'Unknown Pad'}</Text>
                {pad.location && (
                  <Text style={styles.location}>{pad.location}</Text>
                )}
                {pad.site_name && (
                  <Text style={styles.site}>Site: {pad.site_name}</Text>
                )}
              </View>
            ))
          ) : (
            <EmptyState message="No launch pads found" />
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
  location: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  site: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});

export default PadsList;

