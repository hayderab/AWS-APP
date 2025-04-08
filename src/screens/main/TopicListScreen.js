import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Text, Card, Searchbar, Chip, useTheme, Divider, ActivityIndicator, Surface, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TopicListScreen = ({ route, navigation }) => {
  const { certification } = route.params || {};
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  useEffect(() => {
    // Set the header title to the certification name if available
    if (certification?.title) {
      navigation.setOptions({ 
        headerTitle: certification.title,
        headerRight: () => (
          <IconButton
            icon="information-outline"
            onPress={() => alert(`${certification.title}\n\n${certification.topics?.length || 0} topics available for study.`)}
          />
        )
      });
    }

    const loadTopics = async () => {
      try {
        setLoading(true);
        
        if (certification?.topics) {
          // If topics were passed directly via route params
          setTopics(certification.topics);
          setFilteredTopics(certification.topics);
          if (certification.topics.length > 0) {
            setSelectedTopic(certification.topics[0]);
          }
        } else {
          // Otherwise load all topics from all certifications
          const storedCerts = await AsyncStorage.getItem('recentCertifications');
          if (storedCerts) {
            const certifications = JSON.parse(storedCerts);
            const allTopics = certifications.flatMap(cert => 
              (cert.topics || []).map(topic => ({
                ...topic,
                certificationTitle: cert.title,
                certificationId: cert.id
              }))
            );
            setTopics(allTopics);
            setFilteredTopics(allTopics);
            if (allTopics.length > 0) {
              setSelectedTopic(allTopics[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading topics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [certification, navigation]);

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    const filtered = topics.filter(topic => 
      topic.title.toLowerCase().includes(query.toLowerCase()) ||
      topic.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTopics(filtered);
  };

  const renderTopicItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        if (isTablet) {
          setSelectedTopic(item);
        } else {
          navigation.navigate('TopicDetail', { 
            topic: item,
            title: item.title
          });
        }
      }}
      style={[
        styles.topicCard, 
        selectedTopic?.id === item.id && isTablet && styles.selectedTopicCard
      ]}
    >
      <Surface 
        style={styles.topicCardSurface} 
        elevation={1}
      >
        <View style={styles.topicHeader}>
          <View style={styles.topicTitleContainer}>
            <Text 
              variant="titleMedium" 
              style={[
                styles.topicTitle,
                selectedTopic?.id === item.id && isTablet && { color: theme.colors.primary }
              ]}
            >
              {item.title}
            </Text>
            {item.certificationTitle && (
              <Text variant="bodySmall" style={styles.certificationTitle}>
                {item.certificationTitle}
              </Text>
            )}
          </View>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={24} 
            color={selectedTopic?.id === item.id && isTablet ? theme.colors.primary : theme.colors.onSurfaceVariant} 
          />
        </View>
        
        <Text variant="bodyMedium" style={styles.topicDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        
        {item.subtopics && (
          <View style={styles.subtopicsContainer}>
            <Text variant="bodySmall" style={styles.subtopicsLabel}>
              {item.subtopics.length} Subtopics:
            </Text>
            <View style={styles.chipsContainer}>
              {item.subtopics.slice(0, 3).map((subtopic, index) => (
                <Chip 
                  key={`${subtopic.id || 'subtopic'}-${index}`}
                  style={styles.subtopicChip}
                  textStyle={{ fontSize: 12 }}
                >
                  {subtopic.title}
                </Chip>
              ))}
              {item.subtopics.length > 3 && (
                <Chip 
                  style={styles.moreChip}
                  textStyle={{ fontSize: 12, color: theme.colors.primary }}
                >
                  +{item.subtopics.length - 3} more
                </Chip>
              )}
            </View>
          </View>
        )}
      </Surface>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../../src/assets/empty-topics.png')} 
        style={styles.emptyImage} 
      />
      <Text style={styles.emptyText}>No topics found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try a different search term' : 'Upload a certification guide to get started'}
      </Text>
    </View>
  );

  const renderTopicDetail = () => {
    if (!selectedTopic) return null;
    
    return (
      <View style={styles.detailContainer}>
        <Surface style={styles.detailCard} elevation={1}>
          <View style={styles.detailHeader}>
            <Text variant="headlineSmall" style={styles.detailTitle}>{selectedTopic.title}</Text>
            <IconButton
              icon="arrow-right"
              mode="contained"
              size={20}
              onPress={() => navigation.navigate('TopicDetail', { 
                topic: selectedTopic,
                title: selectedTopic.title
              })}
            />
          </View>
          
          <Text variant="bodyLarge" style={styles.detailDescription}>
            {selectedTopic.description || 'No description available for this topic.'}
          </Text>
          
          <Divider style={styles.detailDivider} />
          
          <Text variant="titleMedium" style={styles.subtopicsTitle}>
            Subtopics ({selectedTopic.subtopics?.length || 0})
          </Text>
          
          {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 ? (
            <FlatList
              data={selectedTopic.subtopics}
              keyExtractor={(item, index) => item.id || `subtopic-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.subtopicItem}
                  onPress={() => navigation.navigate('Subtopic', {
                    subtopic: item,
                    topicId: selectedTopic.id,
                    topicTitle: selectedTopic.title
                  })}
                >
                  <MaterialCommunityIcons name="book-open-variant" size={20} color={theme.colors.primary} />
                  <View style={styles.subtopicContent}>
                    <Text variant="titleSmall" style={styles.subtopicItemTitle}>{item.title}</Text>
                    <Text variant="bodySmall" numberOfLines={2} style={styles.subtopicItemDescription}>
                      {item.content || 'No content available'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <Divider style={styles.subtopicDivider} />}
              style={styles.subtopicsList}
            />
          ) : (
            <Text style={styles.noSubtopicsText}>
              No subtopics available for this topic.
            </Text>
          )}
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Quiz', { topic: selectedTopic })}
            >
              <MaterialCommunityIcons name="help-circle" size={20} color="white" />
              <Text style={styles.actionButtonText}>Practice Quiz</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => navigation.navigate('Notes', { 
                topicId: selectedTopic.id, 
                topicTitle: selectedTopic.title 
              })}
            >
              <MaterialCommunityIcons name="notebook" size={20} color="white" />
              <Text style={styles.actionButtonText}>View Notes</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search topics..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={[styles.listContainer, isTablet && { width: '40%' }]}>
            <FlatList
              data={filteredTopics}
              renderItem={renderTopicItem}
              keyExtractor={(item) => item.certificationId ? `${item.certificationId}-${item.id}` : `topic-${item.id}-${Date.now()}`}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
          
          {isTablet && (
            <View style={styles.detailWrapper}>
              {renderTopicDetail()}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topicCard: {
    marginBottom: 12,
  },
  selectedTopicCard: {
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  topicCardSurface: {
    borderRadius: 8,
    padding: 16,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  topicTitle: {
    fontWeight: 'bold',
  },
  certificationTitle: {
    color: '#666',
    marginTop: 2,
  },
  topicDescription: {
    color: '#555',
    marginBottom: 12,
  },
  subtopicsContainer: {
    marginTop: 8,
  },
  subtopicsLabel: {
    color: '#666',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subtopicChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  moreChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  detailWrapper: {
    width: '60%',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    flex: 1,
    padding: 24,
    borderRadius: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  detailDescription: {
    color: '#555',
    marginBottom: 24,
  },
  detailDivider: {
    marginBottom: 24,
  },
  subtopicsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtopicsList: {
    flex: 1,
    marginBottom: 24,
  },
  subtopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subtopicContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  subtopicItemTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtopicItemDescription: {
    color: '#666',
  },
  subtopicDivider: {
    height: 1,
  },
  noSubtopicsText: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default TopicListScreen;
