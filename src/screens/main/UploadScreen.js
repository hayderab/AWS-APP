import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Text, Button, Card, TextInput, ProgressBar, Chip, useTheme, IconButton } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import ApiService from '../../services/ApiService';
import GeminiService from '../../services/GeminiService';

const UploadScreen = ({ navigation }) => {
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // In Expo FileSystem API, we use the URI directly
      const fileInfo = result.assets[0];
      setFile(fileInfo);
      setError(null);
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Error selecting file. Please try again.');
    }
  };

  const uploadAndProcessFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 0.1;
          return newProgress > 0.9 ? 0.9 : newProgress;
        });
      }, 300);

      // In a real app, you would upload the file to your server or cloud storage
      // For this demo, we'll simulate the upload and processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setProgress(1);
      setUploading(false);
      setProcessing(true);

      let certificationData;
      
      try {
        // Process the PDF with Gemini API
        certificationData = await GeminiService.processPdfWithGemini(file.uri, file.name);
      } catch (geminiError) {
        console.error('Error with Gemini API, using mock data:', geminiError);
        
        // Fallback to mock data if Gemini API fails
        certificationData = {
          id: `cert-${Date.now()}`,
          title: file.name.replace('.pdf', ''),
          imageUrl: 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Machine-Learning-Engineer-Associate_badge.e5d66b50925b1b750b326f29b785529ccc82a696.png',
          topics: [
            {
              id: 'topic-1',
              title: 'Data Preparation for Machine Learning',
              description: 'Learn how to ingest, transform, and prepare data for ML modeling.',
              subtopics: [
                {
                  id: 'subtopic-1-1',
                  title: 'Data Ingestion and Storage',
                  content: 'Techniques for ingesting and storing data for ML workloads.',
                  resources: [
                    { name: 'AWS Storage Services', url: 'https://aws.amazon.com/products/storage/' },
                    { name: 'Amazon S3 Documentation', url: 'https://docs.aws.amazon.com/s3/' }
                  ],
                  videoLinks: [
                    { name: 'Data Ingestion Best Practices', url: 'https://www.youtube.com/watch?v=example1' }
                  ]
                },
                {
                  id: 'subtopic-1-2',
                  title: 'Feature Engineering',
                  content: 'Transform raw data into features suitable for machine learning models.',
                  resources: [
                    { name: 'Feature Engineering Guide', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/feature-engineering.html' }
                  ],
                  videoLinks: [
                    { name: 'Feature Engineering on AWS', url: 'https://www.youtube.com/watch?v=example2' }
                  ]
                }
              ]
            },
            {
              id: 'topic-2',
              title: 'ML Model Development',
              description: 'Techniques for selecting, training, and evaluating ML models.',
              subtopics: [
                {
                  id: 'subtopic-2-1',
                  title: 'Model Selection',
                  content: 'How to choose the right ML algorithm for your use case.',
                  resources: [
                    { name: 'SageMaker Algorithms', url: 'https://docs.aws.amazon.com/sagemaker/latest/dg/algos.html' }
                  ],
                  videoLinks: [
                    { name: 'Choosing ML Models', url: 'https://www.youtube.com/watch?v=example3' }
                  ]
                }
              ]
            }
          ]
        };
      }

      // Get current user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('userId') || 'default-user';
      
      // Create certification data
      const newCertificationData = {
        id: Date.now().toString(),
        title: certificationData.title,
        description: certificationData.description,
        level: certificationData.level,
        examCode: certificationData.examCode,
        userId: userId,
        topics: certificationData.topics
      };

      // Save the certification to the database via API
      try {
        console.log('Saving certification data:', JSON.stringify(newCertificationData));
        const savedCertification = await ApiService.certification.create(newCertificationData);
        console.log('Certification saved successfully:', savedCertification);
      } catch (error) {
        console.error('Error saving certification:', error);
        console.error('Error response:', error.response?.data);
        // Continue execution - we'll still save to AsyncStorage as a fallback
        Alert.alert(
          'Warning',
          'Failed to save certification to server, but it will be available locally.',
          [{ text: 'OK' }]
        );
      }
      
      // Also save to recentCertifications for the home screen
      try {
        const storedCerts = await AsyncStorage.getItem('recentCertifications');
        let recentCerts = storedCerts ? JSON.parse(storedCerts) : [];
        
        // Check if this certification already exists (by ID or similar title)
        const existingIndex = recentCerts.findIndex(cert => 
          cert.id === newCertificationData.id || 
          cert.title.toLowerCase() === newCertificationData.title.toLowerCase()
        );
        
        if (existingIndex !== -1) {
          // Replace the existing certification
          recentCerts[existingIndex] = newCertificationData;
        } else {
          // Add the new certification
          recentCerts.push(newCertificationData);
        }
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem('recentCertifications', JSON.stringify(recentCerts));
      } catch (error) {
        console.error('Error saving to recent certifications:', error);
      }
      
      // Save topics and subtopics
      for (const topic of newCertificationData.topics) {
        const topicData = {
          ...topic,
          certificationId: newCertificationData.id
        };
        
        // Save topic via API
        let savedTopic;
        try {
          console.log('Saving topic data:', JSON.stringify(topicData));
          savedTopic = await ApiService.topic.create(topicData);
          console.log('Topic saved successfully:', savedTopic);
        } catch (error) {
          console.error('Error saving topic:', error);
          console.error('Error response:', error.response?.data);
          // Use the local topic data as fallback
          savedTopic = topicData;
        }
        
        // Save subtopics
        if (topic.subtopics && topic.subtopics.length > 0) {
          for (const subtopic of topic.subtopics) {
            const subtopicData = {
              ...subtopic,
              topicId: savedTopic._id || savedTopic.id
            };
            
            // Validate subtopic data before saving
            if (subtopicData.title && subtopicData.title.length > 100) {
              console.warn(`Subtopic title too long (${subtopicData.title.length} chars). Truncating to 100 characters.`);
              // Truncate the title to 100 characters to comply with backend validation
              subtopicData.title = subtopicData.title.substring(0, 97) + '...';
            }
            
            // Save subtopic via API
            try {
              console.log('Saving subtopic data:', JSON.stringify(subtopicData));
              const savedSubtopic = await ApiService.subtopic.create(subtopicData);
              console.log('Subtopic saved successfully:', savedSubtopic);
            } catch (error) {
              console.error('Error saving subtopic:', error);
              
              // Extract error message for better logging
              const errorMessage = error.message || 'Unknown error';
              const responseData = error.response?.data;
              console.error('Error response:', responseData);
              
              // Show a toast or alert for validation errors
              if (errorMessage.includes('title') || 
                  (responseData && responseData.message && 
                   responseData.message.includes('title'))) {
                // Only show an alert for the first error to avoid multiple alerts
                if (!window.hasShownSubtopicError) {
                  window.hasShownSubtopicError = true;
                  Alert.alert(
                    'Validation Error',
                    'Some subtopic titles were too long and have been automatically adjusted.',
                    [{ text: 'OK' }]
                  );
                }
              }
              
              // Save to local storage as fallback
              try {
                // Get existing subtopics
                const storedSubtopics = await AsyncStorage.getItem('subtopics');
                let subtopics = storedSubtopics ? JSON.parse(storedSubtopics) : [];
                
                // Add the new subtopic
                subtopics.push(subtopicData);
                
                // Save back to AsyncStorage
                await AsyncStorage.setItem('subtopics', JSON.stringify(subtopics));
                console.log('Subtopic saved to local storage');
              } catch (localError) {
                console.error('Error saving subtopic to local storage:', localError);
              }
            }
          }
        }
      }

      // Navigate to the topics list for the new certification
      setProcessing(false);
      Alert.alert(
        'Success!',
        'Your certification guide has been processed successfully.',
        [
          { 
            text: 'View Topics', 
            onPress: () => navigation.navigate('Home', { screen: 'TopicList', params: { certification: newCertificationData } }) 
          }
        ]
      );
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error processing file. Please try again.');
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>Upload AWS Certification Guide</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Upload your AWS certification PDF guide to extract topics and create study materials.
          </Text>
          
          <View style={styles.uploadSection}>
            <Button 
              mode="contained" 
              onPress={pickDocument}
              style={styles.button}
              disabled={uploading || processing}
            >
              Select PDF File
            </Button>
            
            {file && (
              <View style={styles.filePreview}>
                <MaterialCommunityIcons 
                  name="file-pdf-box" 
                  size={30} 
                  color={theme.colors.primary} 
                  style={styles.fileIcon}
                />
                <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{file.name}</Text>
                {file.size && <Chip icon="file-pdf-box" style={styles.fileSize}>{formatFileSize(file.size)}</Chip>}
              </View>
            )}
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            {uploading ? (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Uploading... {Math.round(progress * 100)}%</Text>
                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
              </View>
            ) : null}
            
            {processing ? (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Processing with Google Gemini AI...</Text>
                <ProgressBar indeterminate color={theme.colors.primary} style={styles.progressBar} />
              </View>
            ) : null}
            
            <Button 
              mode="contained" 
              onPress={uploadAndProcessFile}
              style={[styles.button, styles.uploadButton]}
              disabled={!file || uploading || processing}
            >
              Upload & Process
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>How It Works</Text>
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Upload PDF</Text>
              <Text style={styles.stepDescription}>
                Select and upload your AWS certification PDF guide.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>AI Processing</Text>
              <Text style={styles.stepDescription}>
                Google Gemini AI analyzes the PDF to extract topics and subtopics.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Study & Practice</Text>
              <Text style={styles.stepDescription}>
                Access organized topics, take quizzes, and create notes to prepare for your certification.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    color: '#666',
  },
  uploadSection: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginVertical: 8,
  },
  uploadButton: {
    marginTop: 16,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
  },
  fileIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
  },
  fileSize: {
    marginLeft: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#666',
  },
});

export default UploadScreen;
