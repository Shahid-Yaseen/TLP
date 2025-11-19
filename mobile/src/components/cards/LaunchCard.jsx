import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useCountdown } from '../../hooks/useCountdown';
import { scale, getResponsiveFontSize, getResponsivePadding, isSmallDevice } from '../../utils/responsive';

const LaunchCard = ({ launch, isUpcoming = false }) => {
  const navigation = useNavigation();
  const launchDate = launch.launch_date || launch.net;
  const countdown = useCountdown(launchDate);

  const getStatusColor = (outcome) => {
    switch (outcome?.toLowerCase()) {
      case 'success':
        return theme.colors.success;
      case 'failure':
        return theme.colors.primary; // Use header red
      case 'partial':
        return theme.colors.primary; // Use header red
      default:
        return theme.colors.border;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getLaunchName = () => {
    const name = launch?.name || 'Launch Name TBD';
    if (name.includes('|')) {
      const parts = name.split('|').map(part => part.trim());
      return {
        firstLine: parts[0] || '',
        secondLine: parts.slice(1).join(' | ') || '',
      };
    }
    return {
      firstLine: name,
      secondLine: '',
    };
  };

  // Extract image URL from media field
  const getImageUrl = () => {
    if (launch.media?.image?.image_url) {
      return launch.media.image.image_url;
    }
    if (launch.mission_image_url) {
      return launch.mission_image_url;
    }
    if (launch.infographic_url) {
      return launch.infographic_url;
    }
    // Fallback to a default space image or null
    return null;
  };

  const imageUrl = getImageUrl();
  const defaultBgColor = theme.colors.surface;
  const launchName = getLaunchName();
  const [imageError, setImageError] = useState(false);

  // Ensure we have valid launch data
  if (!launch || (!launch.id && !launch.external_id && !launch.name)) {
    console.warn('Invalid launch data:', launch);
    return null;
  }

  // Use image only if URL exists and hasn't errored
  const shouldUseImage = imageUrl && !imageError;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getStatusColor(launch.outcome) }]}
      onPress={() => {
        if (launch.id) {
          navigation.navigate('LaunchDetail', { id: launch.id });
        }
      }}
      activeOpacity={0.7}
    >
      {shouldUseImage ? (
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
          onError={(error) => {
            console.log('Image failed to load:', imageUrl, error);
            setImageError(true);
          }}
        >
          <View style={styles.overlay} />
          <View style={[styles.content, { backgroundColor: 'transparent' }]}>
            <View style={styles.header}>
              <Text style={styles.provider}>
                {launch.provider || launch.provider_abbrev || launch.provider_id || 'Unknown Provider'}
              </Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.nameFirst} numberOfLines={1}>{launchName.firstLine}</Text>
              {launchName.secondLine ? (
                <Text style={[styles.name, styles.nameSecond]} numberOfLines={1}>{launchName.secondLine}</Text>
              ) : null}
            </View>
            <Text style={styles.location}>
              {launch.site || launch.site_name || launch.launch_site?.name || 'Location TBD'}
            </Text>
            {isUpcoming && launchDate && new Date(launchDate) > new Date() ? (
              <View style={styles.countdownContainer}>
                <View style={styles.countdownRow}>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownValue}>
                      {String(countdown.days).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownValue}>
                      {String(countdown.hours).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownValue}>
                      {String(countdown.minutes).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.countdownSeparator}>:</Text>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownValue}>
                      {String(countdown.seconds).padStart(2, '0')}
                    </Text>
                  </View>
                </View>
                <View style={styles.countdownLabelsRow}>
                  <Text style={styles.countdownLabel}>D</Text>
                  <View style={styles.countdownLabelSpacer} />
                  <Text style={styles.countdownLabel}>H</Text>
                  <View style={styles.countdownLabelSpacer} />
                  <Text style={styles.countdownLabel}>M</Text>
                  <View style={styles.countdownLabelSpacer} />
                  <Text style={styles.countdownLabel}>S</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.date}>{formatDate(launch.launch_date || launch.net)}</Text>
            )}
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.content, { backgroundColor: '#1A1A1A', width: '100%' }]}>
          <View style={styles.header}>
            <Text style={[styles.provider, { color: '#9CA3AF' }]}>
              {launch.provider || launch.provider_abbrev || launch.provider_id || 'Unknown Provider'}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.nameFirst, { color: '#FFFFFF', fontFamily: undefined, fontWeight: 'bold' }]} numberOfLines={2}>
              {launchName.firstLine}
            </Text>
            {launchName.secondLine ? (
              <Text style={[styles.name, styles.nameSecond, { color: '#FFFFFF', fontWeight: 'bold' }]} numberOfLines={2}>
                {launchName.secondLine}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.location, { color: '#9CA3AF' }]}>
            {launch.site || launch.site_name || launch.launch_site?.name || 'Location TBD'}
          </Text>
          {isUpcoming && launchDate && new Date(launchDate) > new Date() ? (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownRow}>
                <View style={styles.countdownItem}>
                  <Text style={[styles.countdownValue, { color: theme.colors.primary }]}>
                    {String(countdown.days).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={[styles.countdownSeparator, { color: theme.colors.text }]}>:</Text>
                <View style={styles.countdownItem}>
                  <Text style={[styles.countdownValue, { color: theme.colors.primary }]}>
                    {String(countdown.hours).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={[styles.countdownSeparator, { color: theme.colors.text }]}>:</Text>
                <View style={styles.countdownItem}>
                  <Text style={[styles.countdownValue, { color: theme.colors.primary }]}>
                    {String(countdown.minutes).padStart(2, '0')}
                  </Text>
                </View>
                <Text style={[styles.countdownSeparator, { color: theme.colors.text }]}>:</Text>
                <View style={styles.countdownItem}>
                  <Text style={[styles.countdownValue, { color: theme.colors.primary }]}>
                    {String(countdown.seconds).padStart(2, '0')}
                  </Text>
                </View>
              </View>
              <View style={styles.countdownLabelsRow}>
                <Text style={styles.countdownLabel}>D</Text>
                <View style={styles.countdownLabelSpacer} />
                <Text style={styles.countdownLabel}>H</Text>
                <View style={styles.countdownLabelSpacer} />
                <Text style={styles.countdownLabel}>M</Text>
                <View style={styles.countdownLabelSpacer} />
                <Text style={styles.countdownLabel}>S</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.date}>{formatDate(launch.launch_date || launch.net)}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = isSmallDevice();

// Calculate safe dimensions
const cardHeight = Math.max(scale(200), 200);
const cardMinHeight = Math.max(scale(180), 180);
const cardBorderRadius = Math.max(scale(8), 8);
const cardMarginBottom = Math.max(getResponsivePadding(theme.spacing.md), 12);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A', // Explicit dark gray - always visible
    borderLeftWidth: Math.max(scale(6), 4),
    marginBottom: cardMarginBottom,
    borderRadius: cardBorderRadius,
    overflow: 'hidden', // Keep hidden for rounded corners
    width: '100%',
    minHeight: cardMinHeight,
    height: cardHeight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Math.max(scale(4), 2) },
    shadowOpacity: 0.3,
    shadowRadius: Math.max(scale(8), 4),
    elevation: 5,
    borderWidth: 1,
    borderColor: '#374151', // Explicit border color
    opacity: 1, // Ensure card is fully opaque
  },
  backgroundImage: {
    width: '100%',
    height: cardHeight,
    minHeight: cardMinHeight,
    justifyContent: 'center',
    backgroundColor: theme.colors.surface || '#1A1A1A',
  },
  backgroundImageStyle: {
    opacity: 0.6,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    padding: Math.max(getResponsivePadding(theme.spacing.md), 12),
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: cardMinHeight,
    width: '100%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    width: '100%',
  },
  provider: {
    color: theme.colors.textSecondary,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  nameContainer: {
    flexDirection: 'column',
    marginBottom: getResponsivePadding(theme.spacing.sm),
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  nameFirst: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(isSmall ? theme.fontSizes.lg : theme.fontSizes.xl),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
    flexShrink: 1,
    fontFamily: 'Nasalization',
  },
  name: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(isSmall ? theme.fontSizes.lg : theme.fontSizes.xl),
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
    flexShrink: 1,
  },
  nameSecond: {
    marginBottom: 0,
  },
  location: {
    color: theme.colors.textSecondary,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    marginBottom: getResponsivePadding(theme.spacing.xs),
    textAlign: 'center',
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  date: {
    color: theme.colors.textSecondary,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    textAlign: 'center',
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsivePadding(theme.spacing.xs),
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownItem: {
    alignItems: 'center',
    minWidth: isSmall ? scale(35) : scale(40),
  },
  countdownValue: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(isSmall ? theme.fontSizes.lg : theme.fontSizes.xl),
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  countdownSeparator: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(isSmall ? theme.fontSizes.lg : theme.fontSizes.xl),
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginHorizontal: scale(2),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  countdownLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(4),
  },
  countdownLabel: {
    color: theme.colors.textSecondary,
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    fontWeight: '600',
    minWidth: isSmall ? scale(35) : scale(40),
    textAlign: 'center',
  },
  countdownLabelSpacer: {
    width: scale(4) + (scale(2) * 2), // Match separator width + margins
  },
});

export default LaunchCard;

