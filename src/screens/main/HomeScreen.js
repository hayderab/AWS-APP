import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, Alert, Animated } from 'react-native';
import { Text, Card, Button, Divider, useTheme, Avatar, IconButton, Surface } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LocalDatabase from '../../services/LocalDatabase';

import MongoDatabase from '../../services/MongoDatabase';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [recentCertifications, setRecentCertifications] = useState([]);
  const [progress, setProgress] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Load recent certifications from storage
      const storedCerts = await AsyncStorage.getItem('recentCertifications');
      if (storedCerts) {
        setRecentCertifications(JSON.parse(storedCerts));
      }

      // Load user progress
      const storedProgress = await AsyncStorage.getItem('userProgress');
      if (storedProgress) {
        setProgress(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteCertification = async (certificationId) => {
    Alert.alert(
      "Delete Certification",
      "Are you sure you want to delete this certification? This will delete all related topics, subtopics, and notes.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete from LocalDatabase
              await MongoDatabase.certification.deleteCertification(certificationId);
              
              // Delete from recentCertifications in AsyncStorage
              const updatedCerts = recentCertifications.filter(cert => cert.id !== certificationId);
              await AsyncStorage.setItem('recentCertifications', JSON.stringify(updatedCerts));
              
              // Update state
              setRecentCertifications(updatedCerts);
              
              // Remove from progress
              if (progress[certificationId]) {
                const updatedProgress = { ...progress };
                delete updatedProgress[certificationId];
                await AsyncStorage.setItem('userProgress', JSON.stringify(updatedProgress));
                setProgress(updatedProgress);
              }
            } catch (error) {
              console.error('Error deleting certification:', error);
              Alert.alert("Error", "Failed to delete certification. Please try again.");
            }
          }
        }
      ]
    );
  };

  const CertificationItem = React.memo(({ item, navigation, progress, handleDeleteCertification }) => {
    // Create an animated value for the card scale
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    // Animation functions for press in and out
    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    // Generate a color based on the certification ID or title
    const getCardColor = () => {
      const colors = [
        '#4dabf7', // blue
        '#63e6be', // green
        '#ff8787', // red
        '#ffd43b', // yellow
        '#9775fa', // purple
        '#ff922b'  // orange
      ];
      
      if (item.title) {
        const index = item.title.length % colors.length;
        return colors[index];
      }
      return colors[0]; // Default to blue
    };
    
    const cardColor = getCardColor();
    
    // Generate deterministic pattern elements based on the certification title or ID
    const generatePatternElements = () => {
      // Create a seed value from the certification title or ID
      const seed = item.id || item.title || 'default';
      const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Generate 8 pattern elements with deterministic properties
      return Array(8).fill().map((_, i) => {
        // Use the seed and index to create deterministic random values
        const seedValue = (seedNum * (i + 1)) % 100;
        const size = 20 + (seedValue % 50);
        const shape = seedValue % 2 === 0 ? 'circle' : 'square';
        const top = `${(seedValue * 1.3) % 100}%`;
        const left = `${(seedValue * 0.7) % 100}%`;
        const opacity = 0.15 + ((seedValue % 25) / 100);
        const rotation = (seedValue * 3.6) % 360;
        
        return (
          <View 
            key={i} 
            style={[
              styles.patternElement, 
              { 
                top,
                left,
                width: size,
                height: size,
                borderRadius: shape === 'circle' ? size / 2 : 6,
                opacity,
                transform: [{ rotate: `${rotation}deg` }]
              }
            ]} 
          />
        );
      });
    };
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('TopicList', { certification: item })}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={styles.certCard}
      >
        <Animated.View style={{ 
          transform: [{ scale: scaleAnim }],
          shadowColor: cardColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
          borderRadius: 12,
          marginBottom: 16
        }}>
          <Card style={styles.certCardContainer}>
            <View style={[styles.certCardHeader, { backgroundColor: cardColor, height: 80 }]}>
              <View style={styles.patternContainer}>
                {generatePatternElements()}
              </View>
              <MaterialCommunityIcons name="certificate" size={28} color="white" />
              <Text style={styles.certHeaderTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <IconButton
                icon="delete"
                size={20}
                iconColor="white"
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteCertification(item.id);
                }}
              />
            </View>
            
            <Card.Content style={styles.certCardContent}>
              <Text style={styles.certTitle} numberOfLines={2}>
                {item.title}
              </Text>
              
              {progress[item.id] ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress[item.id]}%`, backgroundColor: cardColor }
                      ]} 
                    />
                  </View>
                  <Text style={styles.certProgress}>
                    {progress[item.id]}% complete
                  </Text>
                </View>
              ) : (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.certProgress}>
                    Not started
                  </Text>
                </View>
              )}
              
              <View style={styles.certCardFooter}>
                <Text style={styles.topicsCount}>
                  {item.topics?.length || 0} topics
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color={cardColor} 
                />
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    );
  });

  const renderCertificationItem = ({ item }) => {
    return (
      <CertificationItem 
        item={item} 
        navigation={navigation} 
        progress={progress} 
        handleDeleteCertification={handleDeleteCertification} 
      />
    );
  };

  const renderEmptyState = () => (
    <Surface style={styles.emptyStateContainer} elevation={1}>
      <MaterialCommunityIcons 
        name="book-open-page-variant" 
        size={64} 
        color={theme.colors.primary} 
      />
      <Text variant="titleMedium" style={styles.emptyStateTitle}>
        No certifications yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyStateText}>
        Upload an AWS certification guide to get started with your study journey
      </Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Upload')}
        style={styles.emptyStateButton}
      >
        Upload Guide
      </Button>
    </Surface>
  );

  // Reusable animated touchable component for consistent animations across the app
  const AnimatedTouchableCard = ({ onPress, style, backgroundColor, children }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={style}
      >
        <Animated.View style={{ 
          transform: [{ scale: scaleAnim }],
          backgroundColor,
          borderRadius: 12,
          flex: 1,
          shadowColor: backgroundColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 4,
        }}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.welcomeText}>
            Welcome back,
          </Text>
          <Text variant="headlineMedium" style={styles.nameText}>
            {user?.displayName || 'AWS Learner'}
          </Text>
        </View>
        <Avatar.Text 
          size={50} 
          label={(user?.displayName || 'A').substring(0, 1).toUpperCase()} 
          color="white"
          style={{ backgroundColor: theme.colors.primary }}
        />
      </View>

      <Surface style={styles.statsCard} elevation={1}>
        <Card.Content style={styles.statsCardContent}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {recentCertifications.length || 0}
            </Text>
            <Text variant="bodyMedium">Certifications</Text>
          </View>
          <Divider style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {Object.keys(progress).length || 0}
            </Text>
            <Text variant="bodyMedium">In Progress</Text>
          </View>
          <Divider style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {Object.values(progress).filter(p => p === 100).length || 0}
            </Text>
            <Text variant="bodyMedium">Completed</Text>
          </View>
        </Card.Content>
      </Surface>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Your Certifications</Text>
        <Button 
          mode="contained-tonal" 
          icon="plus" 
          onPress={() => navigation.navigate('Upload')}
          style={styles.addButton}
        >
          Add New
        </Button>
      </View>

      {recentCertifications.length > 0 ? (
        <FlatList
          data={recentCertifications}
          renderItem={renderCertificationItem}
          keyExtractor={(item) => item.id}
          horizontal={false}
          numColumns={1}
          scrollEnabled={false}
          contentContainerStyle={styles.certificationsList}
        />
      ) : (
        renderEmptyState()
      )}

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        <AnimatedTouchableCard
          onPress={() => navigation.navigate('Upload')}
          style={styles.quickActionCard}
          backgroundColor="#e6f2ff"
        >
          <View style={styles.quickActionContent}>
            <MaterialCommunityIcons name="upload" size={32} color="#0066cc" />
            <Text variant="titleSmall" style={styles.quickActionTitle}>Upload Guide</Text>
          </View>
        </AnimatedTouchableCard>
        
        <AnimatedTouchableCard
          onPress={() => navigation.navigate('Notes')}
          style={styles.quickActionCard}
          backgroundColor="#e6fff2"
        >
          <View style={styles.quickActionContent}>
            <MaterialCommunityIcons name="notebook" size={32} color="#00994d" />
            <Text variant="titleSmall" style={styles.quickActionTitle}>View Notes</Text>
          </View>
        </AnimatedTouchableCard>
        
        <AnimatedTouchableCard
          onPress={() => navigation.navigate('QuizHistory')}
          style={styles.quickActionCard}
          backgroundColor="#ffe6e6"
        >
          <View style={styles.quickActionContent}>
            <MaterialCommunityIcons name="history" size={32} color="#cc0000" />
            <Text variant="titleSmall" style={styles.quickActionTitle}>Quiz History</Text>
          </View>
        </AnimatedTouchableCard>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    color: '#666',
    fontWeight: '400',
  },
  nameText: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    height: '100%',
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: 20,
  },
  certificationsList: {
    paddingHorizontal: 16,
  },
  certCard: {
    marginBottom: 16,
    width: '100%',
  },
  certCardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  certCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    height: 80,
  },
  certHeaderTitle: {
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    marginHorizontal: 8,
  },
  certCardContent: {
    padding: 16,
  },
  certTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  progressContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  certProgress: {
    color: '#666',
  },
  certCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicsCount: {
    color: '#666',
  },
  emptyStateContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  emptyStateButton: {
    borderRadius: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    marginHorizontal: 4,
    height: 100,
  },
  quickActionContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternElement: {
    position: 'absolute',
    backgroundColor: 'white',
  },
});

export default HomeScreen;
