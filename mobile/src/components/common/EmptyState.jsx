import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const EmptyState = ({ message = 'No data available', style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
  },
});

export default EmptyState;

