import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LaunchCard from '../../components/cards/LaunchCard';
import ArticleCard from '../../components/cards/ArticleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';

const Homepage = () => {
  const [launches, setLaunches] = useState([]);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [launchesRes, statsRes, articlesRes] = await Promise.all([
        api.get('/launches?limit=3&offset=0'),
        api.get('/statistics/launches'),
        api.get('/news?limit=6&offset=0&status=published'),
      ]);

      const launchesData = launchesRes.data?.data || launchesRes.data || [];
      setLaunches(Array.isArray(launchesData) ? launchesData : []);

      setStats(statsRes.data || null);

      const articlesData = articlesRes.data?.data || articlesRes.data || [];
      setArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="TLP NETWORK" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.content}>
          {/* Hero Stats Section */}
          {stats && (
            <View style={styles.heroStatsContainer}>
              <View style={styles.heroStatsHeader}>
                <Text style={styles.heroStatsTitle}>LAUNCH STATISTICS</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, styles.statBoxPrimary]}>
                  <Text style={styles.statValue}>{stats.total || 0}</Text>
                  <Text style={styles.statLabel}>Total Launches</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxSuccess]}>
                  <Text style={[styles.statValue, styles.statValueSuccess]}>{stats.successful || 0}</Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxFailure]}>
                  <Text style={[styles.statValue, styles.statValueFailure]}>{stats.failed || 0}</Text>
                  <Text style={styles.statLabel}>Failed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Upcoming Launches */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>UPCOMING LAUNCHES</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LaunchesTab')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {launches.length > 0 ? (
              launches.map((launch) => (
                <LaunchCard key={launch.id} launch={launch} />
              ))
            ) : (
              <EmptyState message="No upcoming launches" />
            )}
          </View>

          {/* Latest News */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>LATEST NEWS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('NewsTab')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {articles.length > 0 ? (
              articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <EmptyState message="No articles available" />
            )}
          </View>
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
  heroStatsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroStatsHeader: {
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  heroStatsTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statBoxPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  statBoxSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  statBoxFailure: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  statValue: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statValueSuccess: {
    color: theme.colors.success,
  },
  statValueFailure: {
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  seeAll: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default Homepage;

