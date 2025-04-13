/**
 * Notes Section for Career Hub
 * Implements a split-view layout with a list of notes on the left and content on the right
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, FAB, Card, Divider, IconButton, ActivityIndicator, Portal, Dialog, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NoteService from '../../services/NoteService';
import { useTheme } from '../../utils/theme';

const NotesSection = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('user_temp'); // Replace with actual user ID from auth
  const [dialogVisible, setDialogVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const theme = useTheme();

  // Initialize MongoDB connection
  useEffect(() => {
    const initDb = async () => {
      try {
        // Get password from AsyncStorage (for development)
        const password = await AsyncStorage.getItem('db_password');
        
        if (!password) {
          // If no password is stored, show dialog to enter it
          showPasswordDialog();
          return;
        }
        
        const connected = await NoteService.initialize(password);
        if (connected) {
          setDbInitialized(true);
          fetchNotes();
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDb();
    
    // Cleanup on unmount
    return () => {
      NoteService.close();
    };
  }, []);

  // Password dialog state and handlers
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [dbPassword, setDbPassword] = useState('');

  const showPasswordDialog = () => {
    setPasswordDialogVisible(true);
  };

  const hidePasswordDialog = () => {
    setPasswordDialogVisible(false);
  };

  const savePassword = async () => {
    if (!dbPassword) return;
    
    try {
      await AsyncStorage.setItem('db_password', dbPassword);
      const connected = await NoteService.initialize(dbPassword);
      
      if (connected) {
        setDbInitialized(true);
        hidePasswordDialog();
        fetchNotes();
      } else {
        // Show error message
        alert('Failed to connect to database. Please check your password.');
      }
    } catch (error) {
      console.error('Error saving password:', error);
      alert('An error occurred while saving the password.');
    }
  };

  // Fetch notes from the database
  const fetchNotes = async () => {
    if (!dbInitialized) return;
    
    setLoading(true);
    try {
      const result = await NoteService.getNotes(userId, 'career');
      
      if (result.success) {
        setNotes(result.data);
        // Select the first note if available and none is selected
        if (result.data.length > 0 && !selectedNote) {
          setSelectedNote(result.data[0]);
        }
      } else {
        console.error('Error fetching notes:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show dialog to create/edit note
  const showDialog = (note = null) => {
    if (note) {
      // Edit mode
      setEditMode(true);
      setEditId(note._id);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    } else {
      // Create mode
      setEditMode(false);
      setEditId(null);
      setNoteTitle('');
      setNoteContent('');
    }
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setNoteTitle('');
    setNoteContent('');
    setEditMode(false);
    setEditId(null);
  };

  // Save note to database
  const saveNote = async () => {
    if (!noteTitle || !noteContent) {
      alert('Please enter both title and content for the note.');
      return;
    }

    try {
      let result;
      
      if (editMode) {
        // Update existing note
        result = await NoteService.updateNote(
          editId,
          { title: noteTitle, content: noteContent },
          userId
        );
      } else {
        // Create new note
        result = await NoteService.createNote({
          title: noteTitle,
          content: noteContent,
          category: 'career',
          userId
        });
      }
      
      if (result.success) {
        hideDialog();
        fetchNotes();
        if (!editMode) {
          // Select the newly created note
          setSelectedNote(result.data);
        }
      } else {
        alert(`Failed to ${editMode ? 'update' : 'create'} note: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} note:`, error);
      alert(`An error occurred while ${editMode ? 'updating' : 'creating'} the note.`);
    }
  };

  // Delete note
  const deleteNote = async (noteId) => {
    if (!noteId) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const result = await NoteService.deleteNote(noteId, userId);
        
        if (result.success) {
          // If the deleted note was selected, clear selection
          if (selectedNote && selectedNote._id === noteId) {
            setSelectedNote(null);
          }
          
          fetchNotes();
        } else {
          alert(`Failed to delete note: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('An error occurred while deleting the note.');
      }
    }
  };

  // Toggle pin status
  const togglePin = async (noteId) => {
    try {
      const result = await NoteService.togglePinNote(noteId, userId);
      
      if (result.success) {
        fetchNotes();
      } else {
        alert(`Failed to update pin status: ${result.error}`);
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      alert('An error occurred while updating the pin status.');
    }
  };

  // Render note item for the list
  const renderNoteItem = (note) => {
    const isSelected = selectedNote && selectedNote._id === note._id;
    
    return (
      <Card
        key={note._id}
        style={[
          styles.noteCard,
          isSelected && styles.selectedNoteCard,
          { backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
        ]}
        onPress={() => setSelectedNote(note)}
      >
        <Card.Content>
          <View style={styles.noteHeader}>
            <Text
              variant="titleMedium"
              style={[
                styles.noteTitle,
                note.isPinned && styles.pinnedNoteTitle,
                { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
              ]}
              numberOfLines={1}
            >
              {note.isPinned && '📌 '}{note.title}
            </Text>
            <IconButton
              icon={note.isPinned ? 'pin' : 'pin-outline'}
              size={20}
              onPress={() => togglePin(note._id)}
            />
          </View>
          <Text
            variant="bodySmall"
            style={{ color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
            numberOfLines={2}
          >
            {note.content}
          </Text>
          <Text
            variant="labelSmall"
            style={[styles.noteDate, { color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }]}
          >
            {new Date(note.updatedAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Database password dialog */}
      <Portal>
        <Dialog visible={passwordDialogVisible} onDismiss={hidePasswordDialog}>
          <Dialog.Title>Database Connection</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Please enter your MongoDB password to connect to the database:
            </Text>
            <TextInput
              label="Database Password"
              value={dbPassword}
              onChangeText={setDbPassword}
              secureTextEntry
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={savePassword}>Connect</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Create/Edit Note Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>{editMode ? 'Edit Note' : 'Create Note'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={noteTitle}
              onChangeText={setNoteTitle}
              style={styles.input}
            />
            <TextInput
              label="Content"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={5}
              style={[styles.input, styles.contentInput]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={saveNote}>{editMode ? 'Update' : 'Save'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Split View Layout */}
      <View style={styles.splitContainer}>
        {/* Left Column - Notes List */}
        <View style={styles.leftColumn}>
          <View style={styles.listHeader}>
            <Text variant="titleLarge">Career Notes</Text>
            <Button
              mode="contained"
              onPress={() => showDialog()}
              icon="plus"
            >
              New Note
            </Button>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text>Loading notes...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text>No notes found. Create your first note!</Text>
            </View>
          ) : (
            <ScrollView style={styles.notesList}>
              {notes.map(renderNoteItem)}
            </ScrollView>
          )}
        </View>

        {/* Right Column - Note Content */}
        <View style={styles.rightColumn}>
          {selectedNote ? (
            <>
              <View style={styles.noteDetailHeader}>
                <Text variant="headlineMedium">{selectedNote.title}</Text>
                <View style={styles.noteActions}>
                  <IconButton
                    icon="pencil"
                    size={24}
                    onPress={() => showDialog(selectedNote)}
                    tooltip="Edit note"
                  />
                  <IconButton
                    icon="delete"
                    size={24}
                    onPress={() => deleteNote(selectedNote._id)}
                    tooltip="Delete note"
                  />
                </View>
              </View>
              <Divider />
              <ScrollView style={styles.noteContent}>
                <Text variant="bodyLarge" style={styles.contentText}>
                  {selectedNote.content}
                </Text>
              </ScrollView>
              <Text variant="labelSmall" style={styles.detailDate}>
                Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
              </Text>
            </>
          ) : (
            <View style={styles.noSelectionContainer}>
              <Text variant="titleMedium">Select a note to view its content</Text>
              {notes.length === 0 && (
                <Button
                  mode="contained"
                  onPress={() => showDialog()}
                  icon="plus"
                  style={styles.createButton}
                >
                  Create First Note
                </Button>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Mobile FAB for creating notes (visible only on small screens) */}
      {Platform.OS !== 'web' && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={() => showDialog()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  splitContainer: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  leftColumn: {
    flex: Platform.OS === 'web' ? 1 : 2,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  rightColumn: {
    flex: Platform.OS === 'web' ? 2 : 3,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  notesList: {
    padding: 8,
  },
  noteCard: {
    marginBottom: 8,
    elevation: 1,
  },
  selectedNoteCard: {
    borderWidth: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    flex: 1,
    fontWeight: '500',
  },
  pinnedNoteTitle: {
    fontWeight: 'bold',
  },
  noteDate: {
    marginTop: 8,
    textAlign: 'right',
  },
  noteDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteActions: {
    flexDirection: 'row',
  },
  noteContent: {
    flex: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  contentText: {
    lineHeight: 24,
  },
  detailDate: {
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  contentInput: {
    height: 120,
  },
  dialogText: {
    marginBottom: 16,
  },
});

export default NotesSection;
