import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import UploadScreen from '../screens/main/UploadScreen';
import TopicListScreen from '../screens/main/TopicListScreen';
import TopicDetailScreen from '../screens/main/TopicDetailScreen';
import SubtopicScreen from '../screens/main/SubtopicScreen';
import QuizScreenNew from '../screens/quiz/QuizScreenNew';
import NotesScreen from '../screens/main/NotesScreen';
import QuizHistoryScreen from '../screens/quiz/QuizHistoryScreen';

// Create stacks for each tab
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerTitle: 'Dashboard' }} />
      <HomeStack.Screen name="TopicList" component={TopicListScreen} options={{ headerTitle: 'Topics' }} />
      <HomeStack.Screen name="TopicDetail" component={TopicDetailScreen} options={({ route }) => ({ headerTitle: route.params?.title || 'Topic' })} />
      <HomeStack.Screen name="Subtopic" component={SubtopicScreen} options={({ route }) => ({ headerTitle: route.params?.title || 'Subtopic' })} />
      <HomeStack.Screen name="Quiz" component={QuizScreenNew} options={{ headerTitle: 'Practice Quiz' }} />
      <HomeStack.Screen name="QuizHistory" component={QuizHistoryScreen} options={{ headerTitle: 'Quiz History' }} />
      <HomeStack.Screen name="Notes" component={NotesScreen} options={{ headerTitle: 'My Notes' }} />
    </HomeStack.Navigator>
  );
}

const UploadStack = createNativeStackNavigator();
const UploadStackScreen = () => (
  <UploadStack.Navigator>
    <UploadStack.Screen name="UploadMain" component={UploadScreen} options={{ headerTitle: 'Upload Certification PDF' }} />
  </UploadStack.Navigator>
);

const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerTitle: 'My Profile' }} />
  </ProfileStack.Navigator>
);

// Bottom tab navigator
const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
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

export default MainNavigator;
