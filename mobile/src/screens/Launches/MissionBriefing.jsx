import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Header from '../../components/common/Header';

const { width } = Dimensions.get('window');

const MissionBriefing = () => {
  const route = useRoute();
  const { id } = route.params;
  const [launch, setLaunch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeHazardTab, setActiveHazardTab] = useState('LAUNCH');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const hazardTabs = ['LAUNCH', 'BOOSTER RETURN', '2nd STAGE'];

  useEffect(() => {
    fetchLaunch();
  }, [id]);

  useEffect(() => {
    if (launch?.launch_date) {
      startCountdown(launch.launch_date);
    }
  }, [launch]);

  const fetchLaunch = async () => {
    try {
      const response = await api.get(`/launches/${id}`);
      setLaunch(response.data);
    } catch (error) {
      console.error('Error fetching launch:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (targetDate) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const utcTime = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
    return `${day} ${month}, ${year}, ${time} (${utcTime} UTC)`;
  };

  const formatWindowTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!launch) {
    return (
      <View style={commonStyles.container}>
        <Header title="Mission Briefing" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Launch not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <Header title="MISSION BRIEFING" showBack />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Title and Buttons */}
        <View style={styles.heroSection}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>3D VIEW</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>WATCH</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.missionTitle}>{launch.name || 'MISSION NAME'}</Text>
          
          {/* Countdown Timer */}
          <View style={styles.countdownContainer}>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownValue}>{String(countdown.days).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>DAYS</Text>
            </View>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownValue}>{String(countdown.hours).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>HOURS</Text>
            </View>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownValue}>{String(countdown.minutes).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>MINUTES</Text>
            </View>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownValue}>{String(countdown.seconds).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>SECONDS</Text>
            </View>
          </View>
        </View>

        {/* Launch Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LAUNCH OVERVIEW</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LIFT OFF TIME:</Text>
            <Text style={styles.infoValue}>{formatDateTime(launch.launch_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Window Open:</Text>
            <Text style={styles.infoValue}>
              {launch.launch_window_open 
                ? formatWindowTime(launch.launch_window_open) 
                : formatWindowTime(launch.launch_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Window Close:</Text>
            <Text style={styles.infoValue}>
              {launch.launch_window_close 
                ? formatWindowTime(launch.launch_window_close) 
                : formatWindowTime(launch.launch_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Launch Site:</Text>
            <Text style={styles.infoValue}>
              {launch.launch_site?.name || launch.site || 'TBD'} {launch.launch_pad?.name || launch.pad_name || ''}
            </Text>
          </View>

          {/* Map placeholder */}
          <View style={styles.mapContainer}>
            <Text style={styles.mapPlaceholder}>Flight Path Map</Text>
            <Text style={styles.mapNote}>Map visualization would go here</Text>
          </View>
        </View>

        {/* Mission Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MISSION DETAILS</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>
              {launch.mission_description || launch.details || 'No description available'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue}>{launch.provider || 'TBD'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payload:</Text>
            <Text style={styles.infoValue}>
              {launch.payloads?.length > 0 
                ? `${launch.payloads.length} ${launch.payloads[0].name || 'Satellites'}`
                : 'TBD'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payload Mass:</Text>
            <Text style={styles.infoValue}>
              {launch.payloads?.reduce((sum, p) => sum + (p.mass_kg || 0), 0) || 'TBD'} kg
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destination:</Text>
            <Text style={styles.infoValue}>{launch.orbit || launch.orbit_code || 'LEO'}</Text>
          </View>
        </View>

        {/* Rocket Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ROCKET DETAILS</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Launch Provider:</Text>
            <Text style={styles.infoValue}>{launch.provider || 'TBD'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rocket:</Text>
            <Text style={styles.infoValue}>{launch.rocket || 'TBD'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reusable:</Text>
            <Text style={styles.infoValue}>
              {launch.rocket_config?.reusable !== undefined 
                ? launch.rocket_config.reusable ? 'Yes' : 'No'
                : 'TBD'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Type:</Text>
            <Text style={styles.infoValue}>
              {launch.rocket_config?.fuel_type || 'Liquid (LOX + RP-1)'}
            </Text>
          </View>
        </View>

        {/* Booster Section */}
        {launch.booster && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BOOSTER</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Booster #:</Text>
              <Text style={styles.infoValue}>{launch.booster.serial_number || launch.booster.name || 'TBD'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Flights:</Text>
              <Text style={styles.infoValue}>{launch.booster.flights || launch.booster.flight_count || '0'}</Text>
            </View>
          </View>
        )}

        {/* Hazard Maps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HAZARD MAPS</Text>
          
          {/* Hazard Tabs */}
          <View style={styles.hazardTabsContainer}>
            {hazardTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.hazardTab,
                  activeHazardTab === tab && styles.hazardTabActive
                ]}
                onPress={() => setActiveHazardTab(tab)}
              >
                <Text style={[
                  styles.hazardTabText,
                  activeHazardTab === tab && styles.hazardTabTextActive
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hazard Map Content */}
          <View style={styles.mapContainer}>
            <Text style={styles.mapPlaceholder}>
              {activeHazardTab} Hazard Map
            </Text>
            <Text style={styles.mapNote}>
              {activeHazardTab === 'LAUNCH' && 'Initial flight path and exclusion zones'}
              {activeHazardTab === 'BOOSTER RETURN' && 'Booster landing zone and recovery area'}
              {activeHazardTab === '2nd STAGE' && 'Second stage trajectory and disposal zone'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  heroSection: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: '#FF0000',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.md,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  missionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  countdownLabel: {
    fontSize: theme.fontSizes.xs,
    color: '#888888',
    letterSpacing: 1,
  },
  section: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
    letterSpacing: 1,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSizes.sm,
    color: '#888888',
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#111111',
    borderRadius: 8,
    marginTop: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  mapPlaceholder: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
  },
  mapNote: {
    color: '#666666',
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.xs,
  },
  hazardTabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  hazardTab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 4,
    backgroundColor: '#111111',
  },
  hazardTabActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#222222',
  },
  hazardTabText: {
    color: '#666666',
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  hazardTabTextActive: {
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSizes.xl,
    color: '#FFFFFF',
  },
});

export default MissionBriefing;

