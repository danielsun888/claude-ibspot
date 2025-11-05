import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { AnnotationManager } from '../utils/bookmarkManager';

// 可用的高亮颜色
const HIGHLIGHT_COLORS = [
  { color: '#FFEB3B', name: 'Yellow' },
  { color: '#4CAF50', name: 'Green' },
  { color: '#2196F3', name: 'Blue' },
  { color: '#FF9800', name: 'Orange' },
  { color: '#E91E63', name: 'Pink' },
  { color: '#9C27B0', name: 'Purple' },
];

const AnnotationList = ({ visible, onClose, bookId, onAnnotationSelect }) => {
  const [annotations, setAnnotations] = useState([]);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');

  useEffect(() => {
    if (visible) {
      loadAnnotations();
    }
  }, [visible]);

  const loadAnnotations = async () => {
    const data = await AnnotationManager.getAnnotations(bookId);
    // 按创建时间倒序排列
    setAnnotations(data.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
  };

  const handleDeleteAnnotation = (annotationId) => {
    Alert.alert(
      'Delete Annotation',
      'Are you sure you want to delete this annotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AnnotationManager.deleteAnnotation(bookId, annotationId);
            loadAnnotations();
          },
        },
      ]
    );
  };

  const handleEditAnnotation = (annotation) => {
    setEditingAnnotation(annotation);
    setEditNote(annotation.note || '');
    setSelectedColor(annotation.color || '#FFEB3B');
  };

  const handleSaveEdit = async () => {
    if (editingAnnotation) {
      await AnnotationManager.updateAnnotation(bookId, editingAnnotation.id, {
        note: editNote,
        color: selectedColor,
      });
      setEditingAnnotation(null);
      setEditNote('');
      loadAnnotations();
    }
  };

  const handleSelectAnnotation = (annotation) => {
    onAnnotationSelect(annotation);
    onClose();
  };

  const renderAnnotationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.annotationItem}
      onPress={() => handleSelectAnnotation(item)}
    >
      <View style={styles.annotationHeader}>
        <View
          style={[
            styles.colorIndicator,
            { backgroundColor: item.color || '#FFEB3B' },
          ]}
        />
        <View style={styles.annotationInfo}>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            Chapter {item.chapterIndex + 1}
          </Text>
          <Text style={styles.annotationDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={[styles.highlightedTextContainer, { backgroundColor: item.color + '40' }]}>
        <Text style={styles.highlightedText} numberOfLines={3}>
          "{item.selectedText}"
        </Text>
      </View>

      {item.note && (
        <Text style={styles.annotationNote} numberOfLines={2}>
          💭 {item.note}
        </Text>
      )}

      <View style={styles.annotationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAnnotation(item)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAnnotation(item.id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            🗑️ Delete
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Annotations ({annotations.length})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {annotations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyText}>No annotations yet</Text>
            <Text style={styles.emptySubtext}>
              Select text while reading to create highlights and notes
            </Text>
          </View>
        ) : (
          <FlatList
            data={annotations}
            renderItem={renderAnnotationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Edit Modal */}
        <Modal
          visible={editingAnnotation !== null}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModal}>
              <Text style={styles.editModalTitle}>Edit Annotation</Text>

              {/* Color Picker */}
              <Text style={styles.colorPickerLabel}>Highlight Color:</Text>
              <View style={styles.colorPicker}>
                {HIGHLIGHT_COLORS.map((item) => (
                  <TouchableOpacity
                    key={item.color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: item.color },
                      selectedColor === item.color && styles.selectedColor,
                    ]}
                    onPress={() => setSelectedColor(item.color)}
                  >
                    {selectedColor === item.color && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Note Input */}
              <Text style={styles.noteLabel}>Note:</Text>
              <TextInput
                style={styles.editInput}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingAnnotation(null);
                    setEditNote('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.saveButton]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  listContainer: {
    padding: 12,
  },
  annotationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  annotationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  annotationInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  annotationDate: {
    fontSize: 12,
    color: '#999',
  },
  highlightedTextContainer: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#666',
    marginBottom: 8,
  },
  highlightedText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  annotationNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  annotationActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#ffe0e0',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#333',
  },
  checkMark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AnnotationList;
