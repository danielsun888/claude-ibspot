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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';

const BOOKS_STORAGE_KEY = '@epub_reader_books';
const PRELOADED_BOOKS_KEY = '@epub_reader_preloaded_imported';

// 预置书籍列表
const PRELOADED_BOOKS = [
  {
    fileName: 'bible.epub',
    title: 'Bible',
    author: 'Various Authors',
    asset: require('../data/bible.epub'),
  },
];

const LibraryScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeLibrary();
  }, []);

  /**
   * Initialize library with preloaded books
   */
  const initializeLibrary = async () => {
    try {
      // First load existing books
      await loadBooks();

      // Check if preloaded books have been imported
      const preloadedImported = await AsyncStorage.getItem(PRELOADED_BOOKS_KEY);

      if (!preloadedImported) {
        // Import preloaded books on first launch
        await importPreloadedBooks();
      }
    } catch (error) {
      console.error('Error initializing library:', error);
    }
  };

  /**
   * Import preloaded books from assets
   */
  const importPreloadedBooks = async () => {
    try {
      setLoading(true);
      const currentBooks = books.length > 0 ? books : await loadBooksData();
      const newBooks = [];

      for (const preloadedBook of PRELOADED_BOOKS) {
        try {
          // Load the asset
          const asset = Asset.fromModule(preloadedBook.asset);
          await asset.downloadAsync();

          // Copy to document directory
          const destPath = `${FileSystem.documentDirectory}${preloadedBook.fileName}`;

          // Check if file already exists
          const fileInfo = await FileSystem.getInfoAsync(destPath);
          if (!fileInfo.exists) {
            await FileSystem.copyAsync({
              from: asset.localUri,
              to: destPath,
            });
          }

          // Check if book already in library (by fileName)
          const existingBook = currentBooks.find(
            (b) => b.filePath === destPath
          );

          if (!existingBook) {
            const newBook = {
              id: Date.now().toString() + Math.random(),
              title: preloadedBook.title,
              author: preloadedBook.author,
              filePath: destPath,
              addedDate: new Date().toISOString(),
              isPreloaded: true,
            };
            newBooks.push(newBook);
          }
        } catch (error) {
          console.error(`Error importing ${preloadedBook.fileName}:`, error);
        }
      }

      if (newBooks.length > 0) {
        const updatedBooks = [...currentBooks, ...newBooks];
        setBooks(updatedBooks);
        await saveBooks(updatedBooks);
      }

      // Mark preloaded books as imported
      await AsyncStorage.setItem(PRELOADED_BOOKS_KEY, 'true');
      setLoading(false);
    } catch (error) {
      console.error('Error importing preloaded books:', error);
      setLoading(false);
    }
  };

  /**
   * Load books data (returns array)
   */
  const loadBooksData = async () => {
    try {
      const storedBooks = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
      return storedBooks ? JSON.parse(storedBooks) : [];
    } catch (error) {
      console.error('Error loading books data:', error);
      return [];
    }
  };

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
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      // Check if it's an EPUB file
      if (!file.name.endsWith('.epub')) {
        Alert.alert('Error', 'Please select a valid EPUB file');
        setLoading(false);
        return;
      }

      // Copy file to app's document directory
      const destPath = `${FileSystem.documentDirectory}${file.name}`;
      await FileSystem.copyAsync({
        from: file.uri,
        to: destPath,
      });

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
      console.error('Error importing book:', error);
      Alert.alert('Error', 'Failed to import book');
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
                await FileSystem.deleteAsync(book.filePath);
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
   * Reload preloaded books (for development/testing)
   */
  const reloadPreloadedBooks = () => {
    Alert.alert(
      '重新导入预置书籍',
      '这将重新导入 data 文件夹中的预置书籍。确定继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            await AsyncStorage.removeItem(PRELOADED_BOOKS_KEY);
            await importPreloadedBooks();
            Alert.alert('完成', '预置书籍已重新导入');
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
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
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
        <TouchableOpacity onLongPress={reloadPreloadedBooks}>
          <Text style={styles.headerTitle}>My Library</Text>
        </TouchableOpacity>
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
