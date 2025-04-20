import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { isWeb } from '../utils/platformUtils';
import WebNavigation from '../components/WebNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import UploadScreen from '../screens/main/UploadScreen';
import TopicListScreen from '../screens/main/TopicListScreen';
import TopicDetailScreen from '../screens/main/TopicDetailScreen';
import SubtopicScreen from '../screens/main/SubtopicScreen';
import QuizScreenNew from '../screens/quiz/QuizScreenNew';
import NotesScreen from '../screens/main/NotesScreen';
import NoteEditor from '../screens/main/NoteEditor';
import QuizHistoryScreen from '../screens/quiz/QuizHistoryScreen';

// Create stacks for each tab
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: isWeb ? styles.webHeader : {},
        contentStyle: isWeb ? styles.webContent : {},
      }}
    >
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          headerTitle: 'Dashboard',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        }} 
      />
      <HomeStack.Screen 
        name="TopicList" 
        component={TopicListScreen} 
        options={{ 
          headerTitle: 'Topics',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        }} 
      />
      <HomeStack.Screen 
        name="TopicDetail" 
        component={TopicDetailScreen} 
        options={({ route }) => ({ 
          headerTitle: route.params?.title || 'Topic',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        })} 
      />
      <HomeStack.Screen 
        name="Subtopic" 
        component={SubtopicScreen} 
        options={({ route }) => ({ 
          headerTitle: route.params?.title || 'Subtopic',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        })} 
      />
      <HomeStack.Screen 
        name="Quiz" 
        component={QuizScreenNew} 
        options={{ 
          headerTitle: 'Practice Quiz',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        }} 
      />
      <HomeStack.Screen 
        name="QuizHistory" 
        component={QuizHistoryScreen} 
        options={{ 
          headerTitle: 'Quiz History',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        }} 
      />
      <HomeStack.Screen 
        name="Notes" 
        component={NotesScreen} 
        options={{ 
          headerTitle: 'My Notes',
          headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
        }} 
      />
      <HomeStack.Screen 
        name="NoteEditor" 
        component={NoteEditor} 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }} 
      />
    </HomeStack.Navigator>
  );
}

const UploadStack = createNativeStackNavigator();
const UploadStackScreen = () => (
  <UploadStack.Navigator
    screenOptions={{
      headerStyle: isWeb ? styles.webHeader : {},
      contentStyle: isWeb ? styles.webContent : {},
    }}
  >
    <UploadStack.Screen 
      name="UploadMain" 
      component={UploadScreen} 
      options={{ 
        headerTitle: 'Upload Certification PDF',
        headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
      }} 
    />
  </UploadStack.Navigator>
);

const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: isWeb ? styles.webHeader : {},
      contentStyle: isWeb ? styles.webContent : {},
    }}
  >
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ 
        headerTitle: 'My Profile',
        headerTitleStyle: isWeb ? styles.webHeaderTitle : {}
      }} 
    />
  </ProfileStack.Navigator>
);

// Bottom tab navigator
const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const theme = useTheme();
  const [topics, setTopics] = useState([]);
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get('window')
  );
  
  // Load topics for the sidebar
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const storedCerts = await AsyncStorage.getItem('recentCertifications');
        if (storedCerts) {
          setTopics(JSON.parse(storedCerts));
        }
      } catch (error) {
        console.error('Error loading topics:', error);
      }
    };
    
    loadTopics();
  }, []);
  
  // Listen for dimension changes on web
  useEffect(() => {
    if (isWeb && Platform.OS === 'web') {
      const handleResize = () => {
        setWindowDimensions(Dimensions.get('window'));
      };
      
      Dimensions.addEventListener('change', handleResize);
      return () => {
        // Check if the remove method exists (for newer React Native versions)
        if (Dimensions.removeEventListener) {
          Dimensions.removeEventListener('change', handleResize);
        }
      };
    }
  }, []);
  
  // For web platform, use a different layout with sidebar navigation
  if (isWeb && Platform.OS === 'web') {
    // Get window width to determine if we should show the sidebar
    const windowWidth = windowDimensions.width;
    const showSidebar = windowWidth >= 1024;
    
    if (showSidebar) {
      return (
        <View style={styles.webContainer}>
          <View style={styles.webSidebar}>
            <WebNavigation topics={topics} />
          </View>
          <View style={styles.webContent}>
            <HomeStackScreen />
          </View>
        </View>
      );
    }
  }
  
  // For mobile platforms or smaller web screens, use the tab navigator
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          ...(isWeb && { display: 'none' }) // Hide tab bar on web
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="upload-file" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-alt" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh',
  },
  webSidebar: {
    width: 250,
    height: '100%',
  },
  webContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  webHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 64,
    elevation: 0,
    shadowOpacity: 0,
  },
  webHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MainNavigator;
