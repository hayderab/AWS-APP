/**
 * Database Migration Screen
 * Allows users to migrate data from AsyncStorage to MongoDB
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Card, TextInput, Divider, ActivityIndicator, ProgressBar, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../utils/theme';
import MigrationUtility from '../../utils/MigrationUtility';

const DatabaseMigrationScreen = () => {
  const [dbPassword, setDbPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationReport, setMigrationReport] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const theme = useTheme();

  // Connect to MongoDB
  const connectToMongoDB = async () => {
    if (!dbPassword) {
      showSnackbar('Please enter your MongoDB password');
      return;
    }

    setIsConnecting(true);
    try {
      const connected = await MigrationUtility.initialize(dbPassword);
      
      if (connected) {
        setIsConnected(true);
        showSnackbar('Connected to MongoDB successfully');
      } else {
        showSnackbar('Failed to connect to MongoDB. Please check your password.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      showSnackbar('Connection error: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Start migration process
  const startMigration = async () => {
    if (!isConnected) {
      showSnackbar('Please connect to MongoDB first');
      return;
    }

    setIsMigrating(true);
    setMigrationProgress(0.1);
    
    try {
      // Perform migration
      const results = await MigrationUtility.migrateAllData();
      
      // Update progress during migration
      const steps = ['users', 'certifications', 'topics', 'subtopics', 'notes', 'quizzes', 'quizResults'];
      let currentStep = 0;
      
      for (const step of steps) {
        currentStep++;
        setMigrationProgress(currentStep / steps.length);
        await new Promise(resolve => setTimeout(resolve, 500)); // Add small delay for UI feedback
      }
      
      // Generate and display migration report
      const report = MigrationUtility.createMigrationReport(results);
      setMigrationReport(report);
      
      if (results.success) {
        showSnackbar('Migration completed successfully');
      } else {
        showSnackbar('Migration completed with errors. See report for details.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationReport(`Migration failed: ${error.message}`);
      showSnackbar('Migration failed: ' + error.message);
    } finally {
      setIsMigrating(false);
      setMigrationProgress(1);
      
      // Close MongoDB connection
      await MigrationUtility.close();
    }
  };

  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Hide snackbar
  const onDismissSnackbar = () => {
    setSnackbarVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Database Migration" subtitle="Migrate from AsyncStorage to MongoDB" />
        <Card.Content>
          <Text style={styles.description}>
            This utility will help you migrate your data from the local AsyncStorage database to MongoDB.
            Your data will be preserved in both locations.
          </Text>
          
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium" style={styles.sectionTitle}>Step 1: Connect to MongoDB</Text>
          <TextInput
            label="MongoDB Password"
            value={dbPassword}
            onChangeText={setDbPassword}
            secureTextEntry
            disabled={isConnecting || isConnected || isMigrating}
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={connectToMongoDB}
            loading={isConnecting}
            disabled={isConnecting || isConnected || isMigrating || !dbPassword}
            style={styles.button}
          >
            {isConnected ? 'Connected' : 'Connect to MongoDB'}
          </Button>
          
          {isConnected && (
            <>
              <Divider style={styles.divider} />
              
              <Text variant="titleMedium" style={styles.sectionTitle}>Step 2: Migrate Data</Text>
              <Text style={styles.description}>
                This will migrate all your data from AsyncStorage to MongoDB. This process may take a few minutes
                depending on the amount of data you have.
              </Text>
              
              <Button
                mode="contained"
                onPress={startMigration}
                loading={isMigrating}
                disabled={!isConnected || isMigrating}
                style={[styles.button, { backgroundColor: theme.colors.secondary }]}
              >
                Start Migration
              </Button>
              
              {(isMigrating || migrationProgress > 0) && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    {isMigrating ? 'Migration in progress...' : 'Migration complete'}
                  </Text>
                  <ProgressBar
                    progress={migrationProgress}
                    color={theme.colors.secondary}
                    style={styles.progressBar}
                  />
                </View>
              )}
            </>
          )}
          
          {migrationReport && (
            <>
              <Divider style={styles.divider} />
              
              <Text variant="titleMedium" style={styles.sectionTitle}>Migration Report</Text>
              <Card style={styles.reportCard}>
                <Card.Content>
                  <Text style={styles.reportText}>{migrationReport}</Text>
                </Card.Content>
              </Card>
            </>
          )}
        </Card.Content>
      </Card>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={onDismissSnackbar}
        duration={3000}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      >
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{snackbarMessage}</Text>
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  reportCard: {
    backgroundColor: '#f0f0f0',
  },
  reportText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'courier',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default DatabaseMigrationScreen;
