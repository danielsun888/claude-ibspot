import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EpubParser from '../utils/epubParser';
import { BookmarkManager, AnnotationManager } from '../utils/bookmarkManager';
import BookmarkList from '../components/BookmarkList';
import AnnotationList from '../components/AnnotationList';

const READING_PROGRESS_KEY = '@epub_reader_progress_';

// 可用的高亮颜色
const HIGHLIGHT_COLORS = [
  { color: '#FFEB3B', name: 'Yellow' },
  { color: '#4CAF50', name: 'Green' },
  { color: '#2196F3', name: 'Blue' },
  { color: '#FF9800', name: 'Orange' },
  { color: '#E91E63', name: 'Pink' },
  { color: '#9C27B0', name: 'Purple' },
];

const ReaderScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [epubParser, setEpubParser] = useState(null);
  const [chapterContent, setChapterContent] = useState('');
  const [bookInfo, setBookInfo] = useState({ title: book.title, author: book.author });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [annotationNote, setAnnotationNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [annotations, setAnnotations] = useState([]);
  const webViewRef = useRef(null);

  useEffect(() => {
    loadBook();
  }, []);

  useEffect(() => {
    if (epubParser) {
      loadChapter(currentChapter);
    }
  }, [currentChapter, epubParser]);

  /**
   * Load EPUB book
   */
  const loadBook = async () => {
    try {
      setLoading(true);
      const parser = new EpubParser(book.filePath);
      await parser.load();

      setEpubParser(parser);

      // Get metadata
      const metadata = parser.getMetadata();
      setBookInfo({
        title: metadata.title || book.title,
        author: metadata.author || book.author,
      });

      // Load saved progress
      const savedProgress = await AsyncStorage.getItem(READING_PROGRESS_KEY + book.id);
      if (savedProgress) {
        setCurrentChapter(parseInt(savedProgress, 10));
      } else {
        setCurrentChapter(0);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book');
      navigation.goBack();
    }
  };

  /**
   * Load specific chapter
   */
  const loadChapter = async (chapterIndex) => {
    if (!epubParser) {
      console.log('epubParser is not ready');
      return;
    }

    try {
      console.log('Loading chapter:', chapterIndex);
      const chapter = epubParser.getChapter(chapterIndex);
      console.log('Chapter loaded:', chapter ? 'success' : 'null');

      if (chapter) {
        console.log('Chapter content length:', chapter.content?.length || 0);

        // Load annotations for this chapter
        const chapterAnnotations = await AnnotationManager.getAnnotations(
          book.id,
          chapterIndex
        );
        setAnnotations(chapterAnnotations);

        // Wrap content in HTML with styling
        const html = generateHtmlContent(chapter.content, chapterAnnotations);
        console.log('Generated HTML length:', html?.length || 0);
        setChapterContent(html);

        // Save progress
        await AsyncStorage.setItem(
          READING_PROGRESS_KEY + book.id,
          chapterIndex.toString()
        );
      } else {
        console.error('Chapter is null for index:', chapterIndex);
        Alert.alert('错误', '无法加载章节内容');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('错误', `加载章节失败: ${error.message}`);
      setLoading(false);
    }
  };

  /**
   * Generate HTML content with styling and text selection support
   */
  const generateHtmlContent = (content, annotations = []) => {
    // TODO: Apply annotations/highlights to content
    // This is a simplified version; actual implementation would need to
    // parse the HTML and apply highlights based on offsets

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 18px;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background-color: #fafafa;
          }
          p {
            margin-bottom: 1em;
            text-align: justify;
          }
          h1, h2, h3, h4, h5, h6 {
            margin: 1.5em 0 0.5em 0;
            font-weight: 600;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.3em; }
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
          }
          a {
            color: #007AFF;
            text-decoration: none;
          }
          .chapter-content {
            max-width: 800px;
            margin: 0 auto;
          }
          .highlight {
            background-color: #FFEB3B;
            padding: 2px 0;
          }
          ::selection {
            background-color: #B3D4FC;
          }
        </style>
        <script>
          // Handle text selection
          document.addEventListener('selectionchange', function() {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText.length > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'textSelected',
                text: selectedText
              }));
            }
          });
        </script>
      </head>
      <body>
        <div class="chapter-content">
          ${content}
        </div>
      </body>
      </html>
    `;
  };

  /**
   * Handle messages from WebView
   */
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'textSelected') {
        setSelectedText(message.text);
        setShowAnnotationModal(true);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  /**
   * Add bookmark
   */
  const handleAddBookmark = async () => {
    try {
      const chapter = epubParser?.getChapter(currentChapter);
      await BookmarkManager.addBookmark(book.id, {
        chapterIndex: currentChapter,
        chapterTitle: chapter?.path || `Chapter ${currentChapter + 1}`,
      });
      Alert.alert('Success', 'Bookmark added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add bookmark');
    }
  };

  /**
   * Save annotation
   */
  const handleSaveAnnotation = async () => {
    if (!selectedText) return;

    try {
      await AnnotationManager.addAnnotation(book.id, {
        chapterIndex: currentChapter,
        selectedText: selectedText,
        note: annotationNote,
        color: selectedColor,
        startOffset: 0, // Simplified - would need actual offset calculation
        endOffset: selectedText.length,
      });

      // Reload chapter to show new annotation
      loadChapter(currentChapter);

      // Reset and close modal
      setShowAnnotationModal(false);
      setSelectedText('');
      setAnnotationNote('');
      setSelectedColor('#FFEB3B');

      Alert.alert('Success', 'Annotation saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save annotation');
    }
  };

  /**
   * Navigate to previous chapter
   */
  const goToPreviousChapter = () => {
    if (currentChapter > 0) {
      setLoading(true);
      setCurrentChapter(currentChapter - 1);
    } else {
      Alert.alert('Info', 'This is the first chapter');
    }
  };

  /**
   * Navigate to next chapter
   */
  const goToNextChapter = () => {
    if (epubParser && currentChapter < epubParser.getChapterCount() - 1) {
      setLoading(true);
      setCurrentChapter(currentChapter + 1);
    } else {
      Alert.alert('Info', 'This is the last chapter');
    }
  };

  /**
   * Handle bookmark selection
   */
  const handleBookmarkSelect = (bookmark) => {
    setCurrentChapter(bookmark.chapterIndex);
    setShowBookmarks(false);
  };

  /**
   * Handle annotation selection
   */
  const handleAnnotationSelect = (annotation) => {
    setCurrentChapter(annotation.chapterIndex);
    setShowAnnotations(false);
  };

  /**
   * Handle WebView navigation
   */
  const handleWebViewNavigationStateChange = (navState) => {
    // Prevent external navigation
    if (navState.url !== 'about:blank' && !navState.url.startsWith('file://')) {
      webViewRef.current?.stopLoading();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {bookInfo.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            Chapter {currentChapter + 1} of {epubParser?.getChapterCount() || 0}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowToolbar(!showToolbar)}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      {showToolbar && (
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => {
              setShowTOC(true);
              setShowToolbar(false);
            }}
          >
            <Text style={styles.toolButtonIcon}>📑</Text>
            <Text style={styles.toolButtonText}>Table of Contents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleAddBookmark}
          >
            <Text style={styles.toolButtonIcon}>🔖</Text>
            <Text style={styles.toolButtonText}>Add Bookmark</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => {
              setShowBookmarks(true);
              setShowToolbar(false);
            }}
          >
            <Text style={styles.toolButtonIcon}>📚</Text>
            <Text style={styles.toolButtonText}>Bookmarks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => {
              setShowAnnotations(true);
              setShowToolbar(false);
            }}
          >
            <Text style={styles.toolButtonIcon}>✨</Text>
            <Text style={styles.toolButtonText}>Annotations</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading chapter...</Text>
          </View>
        )}
        {chapterContent && (
          <WebView
            ref={webViewRef}
            source={{ html: chapterContent }}
            style={styles.webview}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => setLoading(false)}
            showsVerticalScrollIndicator={true}
            bounces={true}
          />
        )}
      </View>

      {/* Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentChapter === 0 && styles.navButtonDisabled,
          ]}
          onPress={goToPreviousChapter}
          disabled={currentChapter === 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {currentChapter + 1} / {epubParser?.getChapterCount() || 0}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            epubParser && currentChapter >= epubParser.getChapterCount() - 1 &&
              styles.navButtonDisabled,
          ]}
          onPress={goToNextChapter}
          disabled={
            epubParser && currentChapter >= epubParser.getChapterCount() - 1
          }
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Bookmark List Modal */}
      <BookmarkList
        visible={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookId={book.id}
        onBookmarkSelect={handleBookmarkSelect}
      />

      {/* Annotation List Modal */}
      <AnnotationList
        visible={showAnnotations}
        onClose={() => setShowAnnotations(false)}
        bookId={book.id}
        onAnnotationSelect={handleAnnotationSelect}
      />

      {/* Table of Contents Modal */}
      <Modal
        visible={showTOC}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTOC(false)}
      >
        <View style={styles.tocContainer}>
          <View style={styles.tocHeader}>
            <Text style={styles.tocHeaderTitle}>
              Table of Contents ({epubParser?.getChapterCount() || 0})
            </Text>
            <TouchableOpacity onPress={() => setShowTOC(false)}>
              <Text style={styles.tocCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={epubParser?.getAllChapters() || []}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.tocItem,
                  index === currentChapter && styles.tocItemActive,
                ]}
                onPress={() => {
                  setCurrentChapter(index);
                  setShowTOC(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.tocItemNumber}>{index + 1}</Text>
                <View style={styles.tocItemContent}>
                  <Text
                    style={[
                      styles.tocItemTitle,
                      index === currentChapter && styles.tocItemTitleActive,
                    ]}
                    numberOfLines={2}
                  >
                    {item.path?.split('/').pop()?.replace('.xhtml', '').replace('.html', '') || `Chapter ${index + 1}`}
                  </Text>
                  {index === currentChapter && (
                    <Text style={styles.tocItemBadge}>正在阅读</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `chapter-${index}`}
            contentContainerStyle={styles.tocListContainer}
          />
        </View>
      </Modal>

      {/* Create Annotation Modal */}
      <Modal
        visible={showAnnotationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnnotationModal(false)}
      >
        <View style={styles.annotationModalOverlay}>
          <View style={styles.annotationModal}>
            <Text style={styles.annotationModalTitle}>Create Annotation</Text>

            {/* Selected Text */}
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedTextLabel}>Selected Text:</Text>
              <ScrollView style={styles.selectedTextScroll}>
                <Text style={styles.selectedTextContent}>"{selectedText}"</Text>
              </ScrollView>
            </View>

            {/* Color Picker */}
            <Text style={styles.colorPickerLabel}>Highlight Color:</Text>
            <View style={styles.colorPicker}>
              {HIGHLIGHT_COLORS.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: item.color },
                    selectedColor === item.color && styles.selectedColorOption,
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
            <Text style={styles.noteLabel}>Add Note (Optional):</Text>
            <TextInput
              style={styles.noteInput}
              value={annotationNote}
              onChangeText={setAnnotationNote}
              placeholder="Type your note here..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Buttons */}
            <View style={styles.annotationModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAnnotationModal(false);
                  setSelectedText('');
                  setAnnotationNote('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveAnnotation}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toolButton: {
    alignItems: 'center',
    marginRight: 20,
  },
  toolButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  toolButtonText: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressIndicator: {
    padding: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  annotationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  annotationModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  annotationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  selectedTextContainer: {
    marginBottom: 16,
  },
  selectedTextLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  selectedTextScroll: {
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  selectedTextContent: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#333',
  },
  checkMark: {
    color: '#fff',
    fontSize: 24,
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
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 16,
  },
  annotationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Table of Contents styles
  tocContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tocHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tocCloseButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  tocListContainer: {
    padding: 12,
  },
  tocItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  tocItemActive: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tocItemNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginRight: 16,
    minWidth: 35,
  },
  tocItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tocItemTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  tocItemTitleActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tocItemBadge: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default ReaderScreen;
