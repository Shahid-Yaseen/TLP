import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const CrewCard = ({ crewMember }) => {
  return (
    <View style={styles.card}>
      {crewMember.profile_image_url && (
        <Image
          source={{ uri: crewMember.profile_image_url }}
          style={styles.image}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>
          {crewMember.full_name || `${crewMember.first_name} ${crewMember.last_name}`}
        </Text>
        {crewMember.role && (
          <Text style={styles.role}>{crewMember.role}</Text>
        )}
        {crewMember.bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {crewMember.bio}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.background,
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
  role: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.xs,
  },
  bio: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
});

export default CrewCard;

