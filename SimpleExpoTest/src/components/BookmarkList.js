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
import { BookmarkManager } from '../utils/bookmarkManager';

const BookmarkList = ({ visible, onClose, bookId, onBookmarkSelect }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    if (visible) {
      loadBookmarks();
    }
  }, [visible]);

  const loadBookmarks = async () => {
    const data = await BookmarkManager.getBookmarks(bookId);
    // 按创建时间倒序排列
    setBookmarks(data.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
  };

  const handleDeleteBookmark = (bookmarkId) => {
    Alert.alert(
      'Delete Bookmark',
      'Are you sure you want to delete this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await BookmarkManager.deleteBookmark(bookId, bookmarkId);
            loadBookmarks();
          },
        },
      ]
    );
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setEditNote(bookmark.note || '');
  };

  const handleSaveEdit = async () => {
    if (editingBookmark) {
      await BookmarkManager.updateBookmark(bookId, editingBookmark.id, {
        note: editNote,
      });
      setEditingBookmark(null);
      setEditNote('');
      loadBookmarks();
    }
  };

  const handleSelectBookmark = (bookmark) => {
    onBookmarkSelect(bookmark);
    onClose();
  };

  const renderBookmarkItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookmarkItem}
      onPress={() => handleSelectBookmark(item)}
    >
      <View style={styles.bookmarkHeader}>
        <Text style={styles.bookmarkIcon}>🔖</Text>
        <View style={styles.bookmarkInfo}>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {item.chapterTitle || `Chapter ${item.chapterIndex + 1}`}
          </Text>
          <Text style={styles.bookmarkDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {item.note && (
        <Text style={styles.bookmarkNote} numberOfLines={2}>
          {item.note}
        </Text>
      )}

      <View style={styles.bookmarkActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditBookmark(item)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteBookmark(item.id)}
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
          <Text style={styles.headerTitle}>Bookmarks ({bookmarks.length})</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyText}>No bookmarks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the bookmark button while reading to add one
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Edit Modal */}
        <Modal
          visible={editingBookmark !== null}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModal}>
              <Text style={styles.editModalTitle}>Edit Bookmark Note</Text>
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
                    setEditingBookmark(null);
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
  bookmarkItem: {
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
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookmarkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bookmarkInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#999',
  },
  bookmarkNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 36,
  },
  bookmarkActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingLeft: 36,
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

export default BookmarkList;
