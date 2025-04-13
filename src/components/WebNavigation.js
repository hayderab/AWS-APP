import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Web-specific navigation sidebar component
 */
const WebNavigation = ({ topics = [] }) => {
  const navigation = useNavigation();
  const route = useRoute();

  // Navigate to a specific screen with proper reset to avoid navigation issues
  const navigateTo = (screenName, params) => {
    // Use CommonActions.reset to ensure clean navigation state
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'Home',
            state: {
              routes: [
                { 
                  name: screenName,
                  params
                }
              ]
            }
          }
        ]
      })
    );
  };

  // Check if a route is active
  const isActiveRoute = (routeName) => {
    if (!route.name) return false;
    
    // Handle nested routes
    if (route.state && route.state.routes) {
      const currentRoute = route.state.routes[route.state.routes.length - 1];
      return currentRoute.name === routeName;
    }
    
    return route.name === routeName;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
          <Text style={styles.title}>AWS Certification Tutor</Text>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.navSection}>
          <Text style={styles.sectionTitle}>MAIN</Text>
          
          <TouchableOpacity 
            style={[styles.navItem, isActiveRoute('HomeMain') && styles.activeNavItem]} 
            onPress={() => navigateTo('HomeMain')}
          >
            <MaterialCommunityIcons name="home-outline" size={24} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, isActiveRoute('TopicList') && styles.activeNavItem]} 
            onPress={() => navigateTo('TopicList')}
          >
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.navText}>Topics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, isActiveRoute('Notes') && styles.activeNavItem]} 
            onPress={() => navigateTo('Notes')}
          >
            <MaterialCommunityIcons name="note-text-outline" size={24} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.navText}>Notes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, isActiveRoute('ProfileMain') && styles.activeNavItem]} 
            onPress={() => navigateTo('ProfileMain')}
          >
            <MaterialCommunityIcons name="account-outline" size={24} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.navSection}>
          <Text style={styles.sectionTitle}>TOPICS</Text>
          
          {topics.map((topic, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.navItem} 
              onPress={() => navigateTo('TopicDetail', { topic })}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" style={styles.smallIcon} />
              <Text style={styles.navText} numberOfLines={1} ellipsizeMode="tail">
                {topic.title || `Topic ${index + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Divider style={styles.divider} />
        <TouchableOpacity style={styles.footerItem}>
          <MaterialCommunityIcons name="cog-outline" size={24} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232F3E', // AWS dark blue
    width: 250,
    height: '100%',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FF9900', // AWS orange
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 1,
    marginVertical: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  navSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    marginRight: 12,
    width: 24,
  },
  smallIcon: {
    marginRight: 8,
    width: 20,
  },
  navText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    padding: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});

export default WebNavigation;
