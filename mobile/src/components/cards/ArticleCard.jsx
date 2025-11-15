import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';

const ArticleCard = ({ article, size = 'normal' }) => {
  const navigation = useNavigation();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  };

  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      style={[styles.card, isLarge && styles.largeCard]}
      onPress={() => navigation.navigate('ArticleDetail', { 
        id: article.id, 
        slug: article.slug 
      })}
    >
      {article.featured_image_url && (
        <Image
          source={{ uri: article.featured_image_url }}
          style={[styles.image, isLarge && styles.largeImage]}
        />
      )}
      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(article.published_at || article.created_at)}</Text>
          {article.category && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.category}>{article.category.name}</Text>
            </>
          )}
        </View>
        <Text style={[styles.title, isLarge && styles.largeTitle]} numberOfLines={2}>
          {article.title}
        </Text>
        {article.excerpt && (
          <Text style={styles.excerpt} numberOfLines={2}>
            {article.excerpt}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  largeCard: {
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.background,
  },
  largeImage: {
    height: 250,
  },
  content: {
    padding: theme.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  date: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
  },
  separator: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.xs,
  },
  category: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    lineHeight: 24,
  },
  largeTitle: {
    fontSize: theme.fontSizes['2xl'],
  },
  excerpt: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
});

export default ArticleCard;

