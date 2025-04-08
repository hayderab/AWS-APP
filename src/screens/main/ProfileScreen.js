import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Avatar, Button, Divider, List, Switch, useTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [quizResults, setQuizResults] = useState([]);
  const [certificationCount, setCertificationCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load quiz results
      const storedResults = await AsyncStorage.getItem('quizResults');
      if (storedResults) {
        const results = JSON.parse(storedResults);
        setQuizResults(results.slice(0, 5)); // Show only the 5 most recent
      }

      // Load certification count
      const storedCerts = await AsyncStorage.getItem('recentCertifications');
      if (storedCerts) {
        setCertificationCount(JSON.parse(storedCerts).length);
      }

      // Load user preferences
      const notificationsPref = await AsyncStorage.getItem('notificationsEnabled');
      if (notificationsPref !== null) {
        setNotificationsEnabled(JSON.parse(notificationsPref));
      }

      const darkModePref = await AsyncStorage.getItem('darkModeEnabled');
      if (darkModePref !== null) {
        setDarkModeEnabled(JSON.parse(darkModePref));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const toggleDarkMode = async (value) => {
    setDarkModeEnabled(value);
    try {
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(value));
      // In a real app, you would apply the theme change here
      Alert.alert('Theme Change', 'Dark mode setting will apply on next app restart.');
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your certifications, notes, and quiz results. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              // Filter out auth-related keys
              const dataKeys = keys.filter(key => 
                !key.includes('user') && 
                !key.includes('auth') && 
                !key.includes('token')
              );
              await AsyncStorage.multiRemove(dataKeys);
              
              // Reset state
              setQuizResults([]);
              setCertificationCount(0);
              
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const calculateAverageScore = () => {
    if (quizResults.length === 0) return 0;
    
    const totalPercentage = quizResults.reduce((sum, result) => {
      return sum + (result.score / result.totalQuestions) * 100;
    }, 0);
    
    return Math.round(totalPercentage / quizResults.length);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={(user?.displayName || user?.email || 'A').substring(0, 1).toUpperCase()} 
            color="white"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.profileInfo}>
            <Text variant="headlineSmall" style={styles.profileName}>
              {user?.displayName || 'AWS Learner'}
            </Text>
            <Text variant="bodyMedium" style={styles.profileEmail}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                {certificationCount}
              </Text>
              <Text variant="bodyMedium">Certifications</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                {quizResults.length}
              </Text>
              <Text variant="bodyMedium">Quizzes Taken</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                {calculateAverageScore()}%
              </Text>
              <Text variant="bodyMedium">Avg. Score</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {quizResults.length > 0 && (
        <Card style={styles.recentCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Quiz Results</Text>
            {quizResults.map((result, index) => (
              <View key={result.id || index} style={styles.quizResultItem}>
                <View style={styles.quizResultInfo}>
                  <Text variant="bodyMedium" style={styles.quizResultTitle}>
                    {result.subtopicTitle || result.topicTitle}
                  </Text>
                  <Text variant="bodySmall" style={styles.quizResultDate}>
                    {new Date(result.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.quizResultScore}>
                  <Text 
                    style={[
                      styles.scoreText, 
                      { 
                        color: (result.score / result.totalQuestions) >= 0.7 
                          ? theme.colors.success 
                          : theme.colors.error 
                      }
                    ]}
                  >
                    {result.score}/{result.totalQuestions}
                  </Text>
                  <Text variant="bodySmall" style={styles.scorePercentage}>
                    {Math.round((result.score / result.totalQuestions) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Settings</Text>
          
          <List.Item
            title="Notifications"
            description="Receive updates and reminders"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => (
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                color={theme.colors.primary}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={props => (
              <Switch
                value={darkModeEnabled}
                onValueChange={toggleDarkMode}
                color={theme.colors.primary}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Clear All Data"
            description="Remove all certifications, notes and quiz results"
            left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
            onPress={clearAllData}
          />
        </Card.Content>
      </Card>

      <Button 
        mode="outlined" 
        icon="logout" 
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </Button>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  profileCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#666',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  recentCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  quizResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quizResultInfo: {
    flex: 1,
  },
  quizResultTitle: {
    marginBottom: 4,
  },
  quizResultDate: {
    color: '#666',
  },
  quizResultScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  scorePercentage: {
    color: '#666',
  },
  settingsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 16,
  },
  versionText: {
    color: '#999',
  },
});

export default ProfileScreen;
