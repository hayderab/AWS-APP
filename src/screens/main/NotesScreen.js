import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Text, Card, Searchbar, useTheme, Divider, IconButton, FAB, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import MongoDatabase from '../../services/MongoDatabase';

const NotesScreen = ({ route, navigation }) => {
  const { topicId, topicTitle } = route.params || {};
  const theme = useTheme();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedNoteText, setEditedNoteText] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  const isTablet = Dimensions.get('window').width >= 768;

  useEffect(() => {
    // Set the header title if a specific topic was provided
    if (topicTitle) {
      navigation.setOptions({ headerTitle: `Notes: ${topicTitle}` });
    }

    loadNotes();
  }, [topicId, navigation]);

  const loadNotes = async () => {
    try {
      let allNotes = [];
      
      if (topicId) {
        // Load notes for a specific topic
        allNotes = await MongoDatabase.note.getNotesByTopic(topicId);
      } else {
        // Load all notes across all topics
        allNotes = await MongoDatabase.note.getAllNotes();
      }
      
      // Sort notes by most recent first
      allNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setNotes(allNotes);
      setFilteredNotes(allNotes);
      
      // Auto-select the first note if available and on tablet
      if (allNotes.length > 0 && isTablet) {
        setSelectedNote(allNotes[0]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredNotes(notes);
      return;
    }
    
    const filtered = notes.filter(note => 
      note.text.toLowerCase().includes(query.toLowerCase()) ||
      note.subtopicTitle.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredNotes(filtered);
  };

  const selectNote = (note) => {
    setSelectedNote(note);
  };

  const addNewNote = () => {
    if (!topicId) {
      // Can't add a new note without a topic
      return;
    }
    
    setEditMode(false);
    setEditedNoteText('');
    setDialogVisible(true);
  };

  const editNote = () => {
    if (!selectedNote) return;
    
    setEditMode(true);
    setEditedNoteText(selectedNote.text);
    setDialogVisible(true);
  };

  const confirmDeleteNote = () => {
    if (!selectedNote) return;
    setDeleteDialogVisible(true);
  };

  const deleteNote = async () => {
    if (!selectedNote) return;
    
    try {
      await MongoDatabase.note.deleteNote(selectedNote._id);
      
      // Update the notes list
      const updatedNotes = notes.filter(note => note._id !== selectedNote._id);
      setNotes(updatedNotes);
      setFilteredNotes(
        searchQuery ? 
          updatedNotes.filter(note => 
            note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.subtopicTitle.toLowerCase().includes(searchQuery.toLowerCase())
          ) : 
          updatedNotes
      );
      
      // Select another note if available
      if (updatedNotes.length > 0) {
        setSelectedNote(updatedNotes[0]);
      } else {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
    
    setDeleteDialogVisible(false);
  };

  const saveNote = async () => {
    if (!editedNoteText.trim()) {
      setDialogVisible(false);
      return;
    }
    
    try {
      if (editMode && selectedNote) {
        // Update existing note
        const updatedNote = await MongoDatabase.note.updateNote(
          selectedNote._id, 
          { ...selectedNote, text: editedNoteText, timestamp: new Date().toISOString() }
        );
        
        // Update the notes list
        const updatedNotes = notes.map(note => 
          note._id === selectedNote._id ? updatedNote : note
        );
        
        setNotes(updatedNotes);
        setFilteredNotes(
          searchQuery ? 
            updatedNotes.filter(note => 
              note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
              note.subtopicTitle.toLowerCase().includes(searchQuery.toLowerCase())
            ) : 
            updatedNotes
        );
        
        setSelectedNote(updatedNote);
      } else {
        // Create new note
        const newNote = {
          topicId: topicId,
          subtopicId: null, 
          subtopicTitle: topicTitle || 'General',
          text: editedNoteText,
          timestamp: new Date().toISOString()
        };
        
        const savedNote = await MongoDatabase.note.addNote(newNote);
        
        // Update the notes list
        const updatedNotes = [savedNote, ...notes];
        setNotes(updatedNotes);
        setFilteredNotes(
          searchQuery ? 
            updatedNotes.filter(note => 
              note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
              note.subtopicTitle.toLowerCase().includes(searchQuery.toLowerCase())
            ) : 
            updatedNotes
        );
        
        // Select the new note
        setSelectedNote(savedNote);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
    
    setDialogVisible(false);
  };

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => selectNote(item)}
      style={[
        styles.noteItem,
        selectedNote && selectedNote._id === item._id ? 
          { backgroundColor: `${theme.colors.primary}10` } : 
          null
      ]}
    >
      <View style={styles.noteItemContent}>
        <Text 
          numberOfLines={2} 
          style={styles.noteText}
        >
          {item.text}
        </Text>
        <View style={styles.noteItemFooter}>
          <Text style={styles.noteSubtopic}>{item.subtopicTitle}</Text>
          <Text style={styles.noteDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="note" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No notes match your search' : 'No notes yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 
          'Try a different search term' : 
          topicId ? 
            'Add your first note using the + button below' : 
            'Select a topic to add notes'
        }
      </Text>
    </View>
  );

  const renderNoteDetail = () => {
    if (!selectedNote) {
      return (
        <View style={styles.emptyDetailContainer}>
          <MaterialIcons name="description" size={64} color="#ccc" />
          <Text style={styles.emptyDetailText}>
            Select a note to view its contents
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.noteDetailContainer}>
        <View style={styles.noteDetailHeader}>
          <View>
            <Text style={styles.noteDetailSubtopic}>{selectedNote.subtopicTitle}</Text>
            <Text style={styles.noteDetailDate}>
              {new Date(selectedNote.timestamp).toLocaleString()}
            </Text>
          </View>
          <View style={styles.noteDetailActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={editNote}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={confirmDeleteNote}
            />
          </View>
        </View>
        <Divider style={styles.divider} />
        <ScrollView style={styles.noteDetailContent}>
          <Text style={styles.noteDetailText}>{selectedNote.text}</Text>
        </ScrollView>
      </View>
    );
  };

  // Use split view layout for tablets, single view with modal for phones
  return (
    <View style={styles.container}>
      {isTablet ? (
        // Tablet layout with split view
        <View style={styles.splitContainer}>
          <View style={styles.listContainer}>
            <Searchbar
              placeholder="Search notes..."
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <FlatList
              data={filteredNotes}
              renderItem={renderNoteItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.notesList}
              ListEmptyComponent={renderEmptyList}
              ItemSeparatorComponent={() => <Divider />}
            />
            
            {topicId && (
              <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                onPress={addNewNote}
              />
            )}
          </View>
          
          <View style={styles.detailContainer}>
            {renderNoteDetail()}
          </View>
        </View>
      ) : (
        // Phone layout with list view and modal for details
        <View style={styles.phoneContainer}>
          <Searchbar
            placeholder="Search notes..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <FlatList
            data={filteredNotes}
            renderItem={renderNoteItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.notesList}
            ListEmptyComponent={renderEmptyList}
            ItemSeparatorComponent={() => <Divider />}
          />
          
          {topicId && (
            <FAB
              style={[styles.fab, { backgroundColor: theme.colors.primary }]}
              icon="plus"
              onPress={addNewNote}
            />
          )}
          
          <Portal>
            <Dialog
              visible={selectedNote !== null && !dialogVisible && !deleteDialogVisible}
              onDismiss={() => setSelectedNote(null)}
              style={styles.noteDialog}
            >
              <Dialog.Title>{selectedNote?.subtopicTitle}</Dialog.Title>
              <Dialog.Content>
                <Text style={styles.noteDetailDate}>
                  {selectedNote ? new Date(selectedNote.timestamp).toLocaleString() : ''}
                </Text>
                <Text style={styles.noteDialogContent}>
                  {selectedNote?.text}
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setSelectedNote(null)}>Close</Button>
                <Button onPress={editNote}>Edit</Button>
                <Button onPress={confirmDeleteNote}>Delete</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      )}
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editMode ? 'Edit Note' : 'New Note'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Note"
              value={editedNoteText}
              onChangeText={setEditedNoteText}
              multiline
              numberOfLines={8}
              mode="outlined"
              style={styles.noteInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveNote}>Save</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Note</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this note? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={deleteNote}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  phoneContainer: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  notesList: {
    flexGrow: 1,
  },
  noteItem: {
    padding: 16,
    backgroundColor: 'white',
  },
  noteItemContent: {
    flex: 1,
  },
  noteText: {
    marginBottom: 8,
  },
  noteItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteSubtopic: {
    fontSize: 12,
    color: '#666',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    textAlign: 'center',
  },
  emptyDetailContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyDetailText: {
    fontSize: 18,
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
  noteDetailContainer: {
    flex: 1,
    padding: 16,
  },
  noteDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteDetailSubtopic: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteDetailDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  noteDetailActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 16,
  },
  noteDetailContent: {
    flex: 1,
  },
  noteDetailText: {
    fontSize: 16,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  noteDialog: {
    maxHeight: '80%',
  },
  noteDialogContent: {
    marginTop: 8,
  },
  noteInput: {
    marginTop: 8,
  },
});

export default NotesScreen;
