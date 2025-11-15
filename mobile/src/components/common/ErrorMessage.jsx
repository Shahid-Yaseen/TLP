import { View, Text, StyleSheet } from 'react-native';
import { theme, commonStyles } from '../../styles/theme';

const ErrorMessage = ({ message, style }) => {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7F1D1D',
    borderColor: '#991B1B',
    borderWidth: 1,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  text: {
    color: '#FCA5A5',
    fontSize: theme.fontSizes.sm,
  },
});

export default ErrorMessage;

