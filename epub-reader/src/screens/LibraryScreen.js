import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKS_STORAGE_KEY = '@epub_reader_books';

const LibraryScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  /**
   * Load books from AsyncStorage
   */
  const loadBooks = async () => {
    try {
      const storedBooks = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
      if (storedBooks) {
        setBooks(JSON.parse(storedBooks));
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  /**
   * Save books to AsyncStorage
   */
  const saveBooks = async (booksToSave) => {
    try {
      await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(booksToSave));
    } catch (error) {
      console.error('Error saving books:', error);
    }
  };

  /**
   * Import EPUB file
   */
  const importBook = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const file = result[0];

      // Check if it's an EPUB file
      if (!file.name.endsWith('.epub')) {
        Alert.alert('Error', 'Please select a valid EPUB file');
        setLoading(false);
        return;
      }

      // Copy file to app's document directory
      const destPath = `${RNFS.DocumentDirectoryPath}/${file.name}`;
      await RNFS.copyFile(file.uri, destPath);

      // Create book object
      const newBook = {
        id: Date.now().toString(),
        title: file.name.replace('.epub', ''),
        author: 'Unknown',
        filePath: destPath,
        addedDate: new Date().toISOString(),
      };

      // Add to books list
      const updatedBooks = [...books, newBook];
      setBooks(updatedBooks);
      await saveBooks(updatedBooks);

      Alert.alert('Success', 'Book imported successfully!');
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled file picker');
      } else {
        console.error('Error importing book:', error);
        Alert.alert('Error', 'Failed to import book');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open book for reading
   */
  const openBook = (book) => {
    navigation.navigate('Reader', { book });
  };

  /**
   * Delete book
   */
  const deleteBook = async (bookId) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const book = books.find(b => b.id === bookId);
            if (book) {
              // Delete file
              try {
                await RNFS.unlink(book.filePath);
              } catch (error) {
                console.error('Error deleting file:', error);
              }

              // Remove from list
              const updatedBooks = books.filter(b => b.id !== bookId);
              setBooks(updatedBooks);
              await saveBooks(updatedBooks);
            }
          },
        },
      ]
    );
  };

  /**
   * Render book item
   */
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => openBook(item)}
      onLongPress={() => deleteBook(item.id)}
    >
      <View style={styles.bookCover}>
        <Text style={styles.bookCoverText}>📖</Text>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        <Text style={styles.bookDate}>
          Added: {new Date(item.addedDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <TouchableOpacity
          style={styles.importButton}
          onPress={importBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.importButtonText}>+ Import EPUB</Text>
          )}
        </TouchableOpacity>
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📚</Text>
          <Text style={styles.emptyTitle}>No books yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "Import EPUB" to add your first book
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 8,
  },
  bookItem: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookCover: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookCoverText: {
    fontSize: 48,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookDate: {
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
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LibraryScreen;
