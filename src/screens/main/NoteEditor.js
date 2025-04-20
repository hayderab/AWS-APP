import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Appbar, 
  useTheme, 
  Chip,
  IconButton,
  Menu,
  Divider,
  Text
} from 'react-native-paper';
import MongoDatabase from '../../services/MongoDatabase';

const NoteEditor = ({ route, navigation }) => {
  const { note, onSave, topicId, topicTitle, category } = route.params || {};
  const theme = useTheme();
  
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.text || note?.content || '');
  const [tags, setTags] = useState(note?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [tagMenuVisible, setTagMenuVisible] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setSaving] = useState(false);
  
  // Set up the header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Track if content has been edited
  useEffect(() => {
    if (note) {
      const hasChanged = 
        title !== (note.title || '') || 
        content !== (note.text || note.content || '') ||
        JSON.stringify(tags) !== JSON.stringify(note.tags || []);
      
      setIsEdited(hasChanged);
    } else {
      setIsEdited(title.trim() !== '' || content.trim() !== '');
    }
  }, [title, content, tags, note]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Cannot Save', 'Please add some content to your note.');
      return;
    }

    setSaving(true);
    
    try {
      let savedNote;
      
      if (note && note._id) {
        // Update existing note
        savedNote = await MongoDatabase.note.updateNote(note._id, {
          title: title.trim() || 'Untitled Note',
          content: content.trim(),
          text: content.trim(),
          tags,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new note
        savedNote = await MongoDatabase.note.addNote({
          title: title.trim() || 'Untitled Note',
          content: content.trim(),
          text: content.trim(),
          topicId: topicId || null,
          subtopicId: null,
          subtopicTitle: topicTitle || '',
          category: category || 'general',
          tags,
          timestamp: new Date().toISOString()
        });
      }
      
      if (savedNote) {
        if (onSave) {
          onSave(savedNote);
        }
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to save note. Please try again.');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'An error occurred while saving the note.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isEdited) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { text: 'Discard', onPress: () => navigation.goBack() },
          { text: 'Save', onPress: handleSave }
        ],
        { cancelable: true }
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title={note ? 'Edit Note' : 'New Note'} />
        <Appbar.Action 
          icon="tag-plus" 
          onPress={() => setTagMenuVisible(true)} 
        />
        <Menu
          visible={tagMenuVisible}
          onDismiss={() => setTagMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          style={styles.tagMenu}
        >
          <TextInput
            label="Add Tag"
            value={newTag}
            onChangeText={setNewTag}
            style={styles.tagInput}
            right={<TextInput.Icon icon="plus" onPress={handleAddTag} />}
            onSubmitEditing={handleAddTag}
            cursorColor={theme.colors.primary}
            selectionColor={theme.colors.primary}
            caretHidden={false}
          />
        </Menu>
        <Appbar.Action 
          icon="content-save" 
          onPress={handleSave} 
          disabled={!isEdited || isSaving}
        />
      </Appbar.Header>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView}>
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="flat"
            style={styles.titleInput}
            placeholder="Note Title"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={theme.colors.primary}
            selectionColor={theme.colors.primary}
            caretHidden={false}
          />
          
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <Chip 
                key={index} 
                style={styles.tag}
                onClose={() => handleRemoveTag(tag)}
                mode="outlined"
              >
                {tag}
              </Chip>
            ))}
          </View>
          
          <Divider style={styles.divider} />
          
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            mode="flat"
            style={styles.contentInput}
            placeholder="Start writing your note here..."
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={theme.colors.primary}
            selectionColor={theme.colors.primary}
            caretHidden={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.formatBar}>
        <IconButton icon="format-bold" onPress={() => {
          // Insert markdown bold syntax around selected text or at cursor
          const selection = content.slice(0, 10); // This is a placeholder - in a real app you'd get the actual selection
          setContent(content.replace(selection, `**${selection}**`));
        }} />
        <IconButton icon="format-italic" onPress={() => {
          // Insert markdown italic syntax
          const selection = content.slice(0, 10);
          setContent(content.replace(selection, `*${selection}*`));
        }} />
        <IconButton icon="format-list-bulleted" onPress={() => {
          // Insert bullet point
          setContent(content + '\n- ');
        }} />
        <IconButton icon="format-list-numbered" onPress={() => {
          // Insert numbered list
          setContent(content + '\n1. ');
        }} />
        <IconButton icon="code-tags" onPress={() => {
          // Insert code block
          setContent(content + '\n```\n// code here\n```');
        }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    backgroundColor: 'transparent',
    marginBottom: 8,
    underlineColor: 'transparent',
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    backgroundColor: 'transparent',
    minHeight: 300,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  formatBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tagMenu: {
    width: 250,
    marginTop: 50,
  },
  tagInput: {
    margin: 8,
  },
});

export default NoteEditor;
