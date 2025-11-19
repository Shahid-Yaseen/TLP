import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LaunchCard from '../../components/cards/LaunchCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';
import LaunchFilters from '../../components/LaunchFilters';
import { buildLaunchFilters } from '../../utils/filters';
import { scale, getResponsiveFontSize, getResponsivePadding, isSmallDevice } from '../../utils/responsive';

const LaunchCenter = () => {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, has_more: false });

  const fetchLaunchesWithPagination = async (paginationToUse = pagination, append = false) => {
    try {
      setLoading(true);
      
      // Build filter params - use provided pagination
      const currentOffset = paginationToUse.offset || 0;
      const filterParams = buildLaunchFilters({
        ...filters,
        limit: paginationToUse.limit || 50,
        offset: currentOffset,
      });

      // Add tab-based date filter - ensure proper filtering
      const now = new Date().toISOString();
      if (selectedTab === 'UPCOMING') {
        // Only show launches with launch_date >= now
        filterParams.net__gte = now;
        // Remove any previous filter if it exists
        delete filterParams.net__lt;
      } else if (selectedTab === 'PREVIOUS') {
        // Only show launches with launch_date < now
        filterParams.net__lt = now;
        // Remove any upcoming filter if it exists
        delete filterParams.net__gte;
      }

      // Add search query if exists
      if (searchQuery) {
        filterParams.name = searchQuery;
      }

      console.log('Fetching launches with params:', filterParams);
      console.log('API base URL:', api.defaults.baseURL);
      
      const response = await api.get('/launches', { params: filterParams });
      
      console.log('API Response status:', response.status);
      console.log('API Response data keys:', Object.keys(response.data || {}));
      console.log('Has data array:', !!response.data?.data);
      console.log('Data length:', response.data?.data?.length || 0);
      
      // Handle response format: { data: [...], pagination: {...} }
      const launchesData = response.data?.data || response.data || [];
      
      if (Array.isArray(launchesData)) {
        console.log(`✅ Successfully loaded ${launchesData.length} launches`);
        if (append) {
          // Append new launches to existing ones
          setLaunches(prevLaunches => [...prevLaunches, ...launchesData]);
        } else {
          // Replace launches
          setLaunches(launchesData);
        }
      } else {
        console.warn('⚠️ Unexpected launches data format:', typeof launchesData, launchesData);
        if (!append) {
          setLaunches([]);
        }
      }
      
      if (response.data?.pagination) {
        setPagination({
          ...response.data.pagination,
          has_more: response.data.pagination.has_more !== undefined 
            ? response.data.pagination.has_more 
            : (launchesData.length === (paginationToUse.limit || 50))
        });
      } else {
        // Reset pagination if not provided
        setPagination({ 
          total: launchesData.length, 
          limit: paginationToUse.limit || 50, 
          offset: currentOffset, 
          has_more: launchesData.length === (paginationToUse.limit || 50)
        });
      }
    } catch (error) {
      console.error('❌ Error fetching launches:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      console.error('Request URL:', error.config?.url);
      console.error('Request baseURL:', error.config?.baseURL);
      if (!append) {
        setLaunches([]); // Set empty array on error only if not appending
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLaunches = async () => {
    return fetchLaunchesWithPagination(pagination);
  };

  useEffect(() => {
    // Reset pagination and clear launches when tab changes
    const resetPagination = { total: 0, limit: 50, offset: 0, has_more: false };
    setPagination(resetPagination);
    setLaunches([]);
    // Fetch with reset pagination
    fetchLaunchesWithPagination(resetPagination);
  }, [selectedTab, filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, offset: 0 }); // Reset to first page
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPagination({ ...pagination, offset: 0 });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLaunches();
  };

  const loadMore = () => {
    if (pagination.has_more && !loading) {
      const newOffset = pagination.offset + pagination.limit;
      const newPagination = { ...pagination, offset: newOffset };
      // Fetch more launches with new offset and append them
      fetchLaunchesWithPagination(newPagination, true);
    }
  };

  if (loading && launches.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="LAUNCH CENTER" />
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'UPCOMING' && styles.tabActive]}
          onPress={() => setSelectedTab('UPCOMING')}
        >
          <Text style={[styles.tabText, selectedTab === 'UPCOMING' && styles.tabTextActive]}>
            UPCOMING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'PREVIOUS' && styles.tabActive]}
          onPress={() => setSelectedTab('PREVIOUS')}
        >
          <Text style={[styles.tabText, selectedTab === 'PREVIOUS' && styles.tabTextActive]}>
            PREVIOUS
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search launches..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchLaunches}
          selectionColor={theme.colors.focus}
          underlineColorAndroid={theme.colors.focus}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>FILTERS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View style={styles.content}>
          {loading && launches.length === 0 ? (
            <LoadingSpinner />
          ) : launches.length > 0 ? (
            <>
              {launches.map((launch, index) => {
                if (!launch) {
                  console.warn(`Launch at index ${index} is null/undefined`);
                  return null;
                }
                return (
                  <LaunchCard 
                    key={launch.id || launch.external_id || `launch-${index}`} 
                    launch={launch} 
                    isUpcoming={selectedTab === 'UPCOMING'}
                  />
                );
              })}
              {pagination.has_more && (
                <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <EmptyState message={`No ${selectedTab.toLowerCase()} launches found`} />
          )}
        </View>
      </ScrollView>

      <LaunchFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </View>
  );
};

const isSmall = isSmallDevice();

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: getResponsivePadding(theme.spacing.md),
    alignItems: 'center',
    borderBottomWidth: scale(3),
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  searchContainer: {
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    gap: getResponsivePadding(theme.spacing.xs),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scale(12),
    padding: getResponsivePadding(theme.spacing.sm),
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: scale(2),
    elevation: 2,
    minWidth: 0, // Allow flex to work properly
  },
  filterButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    borderRadius: scale(12),
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 4,
    minWidth: scale(70), // Ensure button doesn't get too small
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
  },
  loadMoreButton: {
    padding: getResponsivePadding(theme.spacing.md),
    alignItems: 'center',
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  loadMoreText: {
    color: theme.colors.primary,
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    width: '100%',
    flexGrow: 1,
  },
});

export default LaunchCenter;

