import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';

const AstronautCard = ({ astronaut, featured = false }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[styles.card, featured && styles.featuredCard]}
      onPress={() => navigation.navigate('AstronautProfile', { id: astronaut.id })}
    >
      <Image
        source={{ 
          uri: astronaut.profile_image_url || 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Astronaut'
        }}
        style={[styles.image, featured && styles.featuredImage]}
      />
      <View style={styles.content}>
        <Text style={[styles.name, featured && styles.featuredName]}>
          {astronaut.full_name || `${astronaut.first_name} ${astronaut.last_name}`}
        </Text>
        {!featured && (
          <View style={styles.stats}>
            {astronaut.days_in_space && (
              <Text style={styles.stat}>Days In Space: {astronaut.days_in_space}</Text>
            )}
            {astronaut.missions_count && (
              <Text style={styles.stat}>Missions: {astronaut.missions_count}</Text>
            )}
            {astronaut.spacewalks_count && (
              <Text style={styles.stat}>Spacewalk: {astronaut.spacewalks_count}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  featuredCard: {
    padding: theme.spacing.lg,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.background,
  },
  featuredImage: {
    height: 250,
    marginBottom: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.md,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  featuredName: {
    fontSize: theme.fontSizes.xl,
  },
  stats: {
    gap: theme.spacing.xs,
  },
  stat: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
});

export default AstronautCard;

