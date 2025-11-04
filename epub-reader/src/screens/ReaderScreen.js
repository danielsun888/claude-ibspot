import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EpubParser from '../utils/epubParser';

const READING_PROGRESS_KEY = '@epub_reader_progress_';

const ReaderScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const [loading, setLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [epubParser, setEpubParser] = useState(null);
  const [chapterContent, setChapterContent] = useState('');
  const [bookInfo, setBookInfo] = useState({ title: book.title, author: book.author });
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
    if (!epubParser) return;

    try {
      const chapter = epubParser.getChapter(chapterIndex);
      if (chapter) {
        // Wrap content in HTML with styling
        const html = generateHtmlContent(chapter.content);
        setChapterContent(html);

        // Save progress
        await AsyncStorage.setItem(
          READING_PROGRESS_KEY + book.id,
          chapterIndex.toString()
        );
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading chapter:', error);
      setLoading(false);
    }
  };

  /**
   * Generate HTML content with styling
   */
  const generateHtmlContent = (content) => {
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
        </style>
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
      </View>

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
});

export default ReaderScreen;
