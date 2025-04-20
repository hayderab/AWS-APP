import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Text, Card, Searchbar, useTheme, Divider, IconButton, FAB, Portal, Dialog, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import MongoDatabase from '../../services/MongoDatabase';

const NotesScreen = ({ route, navigation }) => {
  const { topicId, topicTitle, category } = route.params || {};
  const theme = useTheme();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const isTablet = Dimensions.get('window').width >= 768;
  const isCareerHub = category === 'career';
  const useSplitView = isTablet || isCareerHub;

  useEffect(() => {
    // Set the header title if a specific topic was provided
    if (topicTitle) {
      navigation.setOptions({ 
        headerTitle: `Notes: ${topicTitle}`,
        headerRight: () => (
          <IconButton
            icon="information-outline"
            onPress={() => alert('Notes are saved locally. You can create, edit, and delete notes for your AWS certification study.')}
          />
        )
      });
    } else if (category) {
      navigation.setOptions({ 
        headerTitle: `${category.charAt(0).toUpperCase() + category.slice(1)} Notes`,
        headerRight: () => (
          <IconButton
            icon="information-outline"
            onPress={() => alert('Notes are saved locally. You can create, edit, and delete notes for your AWS certification study.')}
          />
        )
      });
    }

    loadNotes();
    
    // Set up navigation listener to refresh notes when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotes();
    });
    
    return unsubscribe;
  }, [topicId, category, navigation]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      let allNotes = [];
      
      if (topicId) {
        // Load notes for a specific topic
        allNotes = await MongoDatabase.note.getNotesByTopic(topicId);
      } else if (category) {
        // Load notes for a specific category
        const notes = await MongoDatabase.note.getAllNotes();
        allNotes = notes.filter(note => note.category === category);
      } else {
        // Load all notes across all topics
        allNotes = await MongoDatabase.note.getAllNotes();
      }
      
      // Sort notes by most recent first
      allNotes.sort((a, b) => new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp));
      
      setNotes(allNotes);
      setFilteredNotes(allNotes);
      
      // Auto-select the first note if available and on tablet or in Career Hub
      if (allNotes.length > 0 && (isTablet || isCareerHub)) {
        setSelectedNote(allNotes[0]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredNotes(notes);
      return;
    }
    
    const filtered = notes.filter(note => 
      (note.title?.toLowerCase().includes(query.toLowerCase()) || false) ||
      note.text?.toLowerCase().includes(query.toLowerCase()) ||
      note.content?.toLowerCase().includes(query.toLowerCase()) ||
      note.subtopicTitle?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredNotes(filtered);
  };

  const selectNote = (note) => {
    if (isTablet || isCareerHub) {
      // On tablet or career hub, just select the note for split view
      setSelectedNote(note);
    } else {
      // On phone, open directly in the editor
      navigation.navigate('NoteEditor', {
        note: note,
        onSave: handleNoteSaved,
        topicId,
        topicTitle,
        category: category || 'general'
      });
    }
  };

  const addNewNote = () => {
    navigation.navigate('NoteEditor', {
      onSave: handleNoteSaved,
      topicId,
      topicTitle,
      category: category || 'general'
    });
    console.log('Opening note editor');
  };

  const editNote = (note) => {
    const noteToEdit = note || selectedNote;
    if (!noteToEdit) return;
    
    navigation.navigate('NoteEditor', {
      note: noteToEdit,
      onSave: handleNoteSaved,
      topicId,
      topicTitle,
      category: category || 'general'
    });
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
            (note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            note.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.subtopicTitle?.toLowerCase().includes(searchQuery.toLowerCase())
          ) : 
          updatedNotes
      );
      
      // Clear selected note if it was deleted
      setSelectedNote(null);
      setDeleteDialogVisible(false);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleNoteSaved = async (savedNote) => {
    console.log('Note saved:', savedNote);
    
    try {
      // Refresh notes list
      await loadNotes();
      
      // Select the saved note
      if (savedNote && savedNote._id) {
        const noteInList = notes.find(note => note._id === savedNote._id);
        if (noteInList) {
          setSelectedNote(noteInList);
        }
      }
    } catch (error) {
      console.error('Error refreshing notes after save:', error);
    }
  };

  const renderNoteItem = ({ item }) => {
    const isSelected = selectedNote && selectedNote._id === item._id;
    
    return (
      <TouchableOpacity onPress={() => selectNote(item)}>
        <Card style={[styles.noteItem, isSelected && { backgroundColor: theme.colors.background }]}>
          <View style={styles.noteItemContent}>
            <Text style={styles.noteTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title || item.subtopicTitle || 'Untitled Note'}
            </Text>
            <Text style={styles.noteText} numberOfLines={2} ellipsizeMode="tail">
              {item.text || item.content || ''}
            </Text>
            <View style={styles.noteItemFooter}>
              <Text style={styles.noteSubtopic} numberOfLines={1} ellipsizeMode="tail">
                {item.subtopicTitle || ''}
              </Text>
              <Text style={styles.noteDate}>
                {new Date(item.updatedAt || item.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="note-add" size={64} color={theme.colors.primary} />
        <Text style={styles.emptyText}>No Notes Found</Text>
        <Text style={styles.emptySubtext}>
          {topicId 
            ? "You haven't created any notes for this topic yet." 
            : "You haven't created any notes yet."}
        </Text>
        <Text style={styles.emptySubtext}>
          Tap the + button to create your first note.
        </Text>
      </View>
    );
  };

  const renderNoteDetail = () => {
    if (!selectedNote) {
      return (
        <View style={styles.emptyDetailContainer}>
          <Text style={styles.emptyDetailText}>
            Select a note to view its contents
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.noteDetailContainer}>
        <View style={styles.noteDetailHeader}>
          <Text style={styles.noteDetailTitle}>
            {selectedNote.title || selectedNote.subtopicTitle || 'Untitled Note'}
          </Text>
          <View style={styles.noteDetailActions}>
            <IconButton 
              icon="pencil" 
              onPress={() => editNote(selectedNote)} 
              size={20}
            />
            <IconButton 
              icon="delete" 
              onPress={confirmDeleteNote} 
              size={20}
            />
          </View>
        </View>
        <Text style={styles.noteDetailDate}>
          {new Date(selectedNote.updatedAt || selectedNote.timestamp).toLocaleString()}
        </Text>
        <Divider style={styles.divider} />
        <ScrollView style={styles.noteDetailContent}>
          <Text style={styles.noteDetailText}>
            {selectedNote.text || selectedNote.content || ''}
          </Text>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {useSplitView ? (
        <View style={styles.splitContainer}>
          <View style={styles.listContainer}>
            <Searchbar
              placeholder="Search notes"
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={styles.searchBar}
            />
            <FlatList
              data={filteredNotes}
              keyExtractor={(item) => item._id}
              renderItem={renderNoteItem}
              contentContainerStyle={styles.notesList}
              ItemSeparatorComponent={null}
              ListEmptyComponent={renderEmptyList}
            />
            <FAB
              style={styles.fab}
              small
              icon="plus"
              onPress={addNewNote}
            />
          </View>
          <View style={styles.detailContainer}>
            {renderNoteDetail()}
          </View>
        </View>
      ) : (
        <View style={styles.phoneContainer}>
          <Searchbar
            placeholder="Search notes"
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectNote(item)}>
                {renderNoteItem({ item })}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.notesList}
            ItemSeparatorComponent={null}
            ListEmptyComponent={renderEmptyList}
          />
          <FAB
            style={styles.fab}
            icon="plus"
            onPress={addNewNote}
          />
        </View>
      )}
      
      <Portal>
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
    paddingVertical: 8,
  },
  noteItem: {
    padding: 16,
    backgroundColor: 'white',
    margin: 8,
    marginHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
  },
  noteItemContent: {
    flex: 1,
  },
  noteTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
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
  noteDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteDetailSubtopic: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    flex: 1,
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
});

export default NotesScreen;