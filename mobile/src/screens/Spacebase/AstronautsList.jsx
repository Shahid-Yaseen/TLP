import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import AstronautCard from '../../components/cards/AstronautCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';

const AstronautsList = () => {
  const [astronauts, setAstronauts] = useState([]);
  const [filteredAstronauts, setFilteredAstronauts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const navigation = useNavigation();

  const statuses = ['ALL', 'ACTIVE', 'RETIRED', 'DECEASED'];

  useEffect(() => {
    fetchAstronauts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedStatus, astronauts]);

  const fetchAstronauts = async () => {
    try {
      const response = await api.get('/spacebase/astronauts');
      const data = response.data?.data || response.data || [];
      setAstronauts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching astronauts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...astronauts];
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(a => 
        (a.status || '').toUpperCase() === selectedStatus
      );
    }
    setFilteredAstronauts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAstronauts();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="SPACEBASE" />
      
      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, selectedStatus === status && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[styles.filterText, selectedStatus === status && styles.filterTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.content}>
          {filteredAstronauts.length > 0 ? (
            filteredAstronauts.map((astronaut) => (
              <AstronautCard key={astronaut.id} astronaut={astronaut} />
            ))
          ) : (
            <EmptyState message="No astronauts found" />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterScroll: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
});

export default AstronautsList;

