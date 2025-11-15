import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { theme, commonStyles } from '../../styles/theme';
import CrewCard from '../../components/cards/CrewCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Header from '../../components/common/Header';

const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

const AboutUs = () => {
  const [crewMembers, setCrewMembers] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const categories = ['ALL', 'ADVISORS', 'PRODUCTION', 'JOURNALISTS', 'SPACE HISTORY WRITERS', 'ROCKETCHASERS', 'MODERATORS'];

  useEffect(() => {
    fetchCrew();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilteredCrew(crewMembers);
    } else {
      setFilteredCrew(crewMembers.filter(member => member.category === selectedCategory));
    }
  }, [selectedCategory, crewMembers]);

  const fetchCrew = async () => {
    try {
      const response = await api.get('/crew');
      const crewData = response.data || [];
      setCrewMembers(crewData);
      setFilteredCrew(crewData);
    } catch (error) {
      console.error('Error fetching crew:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={commonStyles.container}>
      <Header title="ABOUT US" showBack />
      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroTitle}>ABOUT US</Text>
          <Text style={styles.heroText}>
            The Launch Pad Network's mission is to inform and inspire the explorers of tomorrow because we believe that space is better together. We strive to breakdown the complexity of space exploration and make it easy to understand and easy to access for everyone.
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>OUR CREW</Text>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Crew Grid */}
          {filteredCrew.length > 0 ? (
            <View style={styles.crewGrid}>
              {filteredCrew.map((member) => (
                <CrewCard key={member.id} crewMember={member} />
              ))}
            </View>
          ) : (
            <EmptyState message="No crew members found in this category." />
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
  heroContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: theme.fontSizes['4xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  heroText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  categoryScroll: {
    marginBottom: theme.spacing.lg,
  },
  categoryContainer: {
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    borderRadius: 4,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.text,
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  crewGrid: {
    gap: theme.spacing.md,
  },
});

export default AboutUs;

