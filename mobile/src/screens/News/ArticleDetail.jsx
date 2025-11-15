import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Header from '../../components/common/Header';
import ArticleCard from '../../components/cards/ArticleCard';

const ArticleDetail = () => {
  const route = useRoute();
  const { id, slug } = route.params;
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id, slug]);

  const fetchArticle = async () => {
    try {
      const identifier = slug || id;
      const [articleRes, relatedRes] = await Promise.all([
        api.get(`/news/${identifier}`),
        api.get('/news?limit=4&status=published'),
      ]);

      setArticle(articleRes.data);
      
      const relatedData = relatedRes.data?.data || relatedRes.data || [];
      setRelatedArticles(Array.isArray(relatedData) ? relatedData.slice(0, 4) : []);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!article) {
    return (
      <View style={commonStyles.container}>
        <Header title="Article Not Found" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <Header title="NEWS" showBack />
      <ScrollView style={styles.scrollView}>
        {/* Hero Image */}
        {(article.hero_image_url || article.featured_image_url) && (
          <Image
            source={{ uri: article.hero_image_url || article.featured_image_url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>
          {article.subtitle && (
            <Text style={styles.subtitle}>{article.subtitle}</Text>
          )}

          <View style={styles.meta}>
            {article.author && (
              <Text style={styles.metaText}>By {article.author.full_name || article.author.name || 'Unknown'}</Text>
            )}
            {article.published_at && (
              <Text style={styles.metaText}>
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}
          </View>

          {article.content && (
            <Text style={styles.body}>{article.content}</Text>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>Related Articles</Text>
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.xl,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metaText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  body: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  relatedSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSizes.xl,
    color: theme.colors.text,
  },
});

export default ArticleDetail;

