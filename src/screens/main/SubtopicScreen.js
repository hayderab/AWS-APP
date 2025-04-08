import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, Button, Divider, useTheme, TextInput, Snackbar } from 'react-native-paper';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubtopicScreen = ({ route, navigation }) => {
  const { subtopic, topicId, topicTitle } = route.params;
  const theme = useTheme();
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    // Load notes from storage
    const loadNotes = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem(`notes_${topicId}`);
        if (storedNotes) {
          const allNotes = JSON.parse(storedNotes);
          const subtopicNotes = allNotes.filter(note => note.subtopicId === subtopic.id);
          setNotes(subtopicNotes);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    loadNotes();
  }, [topicId, subtopic.id]);

  const openUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      topicId: topicId,
      subtopicId: subtopic.id,
      subtopicTitle: subtopic.title,
      text: noteText,
      timestamp: new Date().toISOString(),
    };

    try {
      // Get all existing notes for this topic
      const storedNotes = await AsyncStorage.getItem(`notes_${topicId}`);
      let allNotes = storedNotes ? JSON.parse(storedNotes) : [];
      
      // Add the new note
      allNotes.push(newNote);
      
      // Update storage
      await AsyncStorage.setItem(`notes_${topicId}`, JSON.stringify(allNotes));
      
      // Update local state
      setNotes([...notes, newNote]);
      setNoteText('');
      
      // Show success message
      setSnackbarMessage('Note saved successfully');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error saving note:', error);
      setSnackbarMessage('Failed to save note');
      setSnackbarVisible(true);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      // Get all existing notes for this topic
      const storedNotes = await AsyncStorage.getItem(`notes_${topicId}`);
      if (!storedNotes) return;
      
      let allNotes = JSON.parse(storedNotes);
      
      // Filter out the note to delete
      allNotes = allNotes.filter(note => note.id !== noteId);
      
      // Update storage
      await AsyncStorage.setItem(`notes_${topicId}`, JSON.stringify(allNotes));
      
      // Update local state
      setNotes(notes.filter(note => note.id !== noteId));
      
      // Show success message
      setSnackbarMessage('Note deleted');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting note:', error);
      setSnackbarMessage('Failed to delete note');
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.subtopicCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.subtopicTitle}>{subtopic.title}</Text>
            <Text variant="bodySmall" style={styles.topicReference}>
              From: {topicTitle}
            </Text>
            
            <Divider style={styles.divider} />
            
            <Text variant="bodyMedium" style={styles.contentText}>
              {subtopic.content || 'No content available for this subtopic.'}
            </Text>
          </Card.Content>
        </Card>

        {subtopic.resources && subtopic.resources.length > 0 && (
          <Card style={styles.resourcesCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Resources</Text>
              
              {subtopic.resources.map((resource, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.resourceItem}
                  onPress={() => openUrl(resource.url)}
                >
                  <MaterialIcons name="link" size={20} color={theme.colors.primary} />
                  <View style={styles.resourceTextContainer}>
                    <Text 
                      variant="bodyMedium" 
                      style={styles.resourceText}
                    >
                      {resource.name}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={styles.resourceUrl}
                      numberOfLines={1}
                    >
                      {resource.url}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        {subtopic.videoLinks && subtopic.videoLinks.length > 0 && (
          <Card style={styles.resourcesCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Video Tutorials</Text>
              
              {subtopic.videoLinks.map((video, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.resourceItem}
                  onPress={() => openUrl(video.url)}
                >
                  <FontAwesome5 name="youtube" size={20} color="#FF0000" />
                  <View style={styles.resourceTextContainer}>
                    <Text 
                      variant="bodyMedium" 
                      style={styles.resourceText}
                    >
                      {video.name}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={styles.resourceUrl}
                      numberOfLines={1}
                    >
                      {video.url}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.notesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>My Notes</Text>
            
            <View style={styles.notesInputContainer}>
              <TextInput
                label="Add a note"
                value={noteText}
                onChangeText={setNoteText}
                multiline
                numberOfLines={3}
                mode="outlined"
                style={styles.noteInput}
              />
              <Button 
                mode="contained" 
                onPress={saveNote}
                disabled={!noteText.trim()}
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>

            <Divider style={styles.divider} />

            {notes.length > 0 ? (
              notes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text variant="bodySmall" style={styles.noteTimestamp}>
                      {new Date(note.timestamp).toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => deleteNote(note.id)}>
                      <MaterialIcons name="delete" size={18} color="gray" />
                    </TouchableOpacity>
                  </View>
                  <Text variant="bodyMedium" style={styles.noteText}>{note.text}</Text>
                  <Divider style={styles.noteDivider} />
                </View>
              ))
            ) : (
              <Text style={styles.emptyNotesText}>
                No notes yet. Add your first note above.
              </Text>
            )}
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          icon="help-circle" 
          onPress={() => navigation.navigate('Quiz', { subtopic, topicId, topicTitle })}
          style={[styles.quizButton, { backgroundColor: theme.colors.primary }]}
        >
          Practice Quiz on This Subtopic
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  subtopicCard: {
    marginBottom: 16,
    elevation: 2,
  },
  subtopicTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topicReference: {
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  contentText: {
    lineHeight: 22,
  },
  resourcesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resourceTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resourceText: {
    marginBottom: 2,
  },
  resourceUrl: {
    color: '#666',
  },
  notesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  notesInputContainer: {
    marginBottom: 16,
  },
  noteInput: {
    marginBottom: 8,
  },
  saveButton: {
    alignSelf: 'flex-end',
  },
  noteItem: {
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTimestamp: {
    color: '#666',
    fontStyle: 'italic',
  },
  noteText: {
    marginBottom: 8,
  },
  noteDivider: {
    marginTop: 8,
  },
  emptyNotesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 16,
    marginBottom: 8,
  },
  quizButton: {
    marginTop: 8,
  },
});

export default SubtopicScreen;
