import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@epub_reader_bookmarks_';
const ANNOTATIONS_KEY = '@epub_reader_annotations_';

/**
 * Bookmark Manager - 书签管理器
 */
export class BookmarkManager {
  /**
   * 添加书签
   */
  static async addBookmark(bookId, bookmark) {
    try {
      const bookmarks = await this.getBookmarks(bookId);
      const newBookmark = {
        id: Date.now().toString(),
        chapterIndex: bookmark.chapterIndex,
        chapterTitle: bookmark.chapterTitle,
        scrollPosition: bookmark.scrollPosition || 0,
        createdAt: new Date().toISOString(),
        note: bookmark.note || '',
      };

      bookmarks.push(newBookmark);
      await AsyncStorage.setItem(
        BOOKMARKS_KEY + bookId,
        JSON.stringify(bookmarks)
      );

      return newBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * 获取所有书签
   */
  static async getBookmarks(bookId) {
    try {
      const data = await AsyncStorage.getItem(BOOKMARKS_KEY + bookId);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  /**
   * 删除书签
   */
  static async deleteBookmark(bookId, bookmarkId) {
    try {
      const bookmarks = await this.getBookmarks(bookId);
      const filtered = bookmarks.filter(b => b.id !== bookmarkId);
      await AsyncStorage.setItem(
        BOOKMARKS_KEY + bookId,
        JSON.stringify(filtered)
      );
      return true;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  /**
   * 更新书签
   */
  static async updateBookmark(bookId, bookmarkId, updates) {
    try {
      const bookmarks = await this.getBookmarks(bookId);
      const index = bookmarks.findIndex(b => b.id === bookmarkId);

      if (index !== -1) {
        bookmarks[index] = {
          ...bookmarks[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(
          BOOKMARKS_KEY + bookId,
          JSON.stringify(bookmarks)
        );
        return bookmarks[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }
}

/**
 * Annotation Manager - 注释/标注管理器
 */
export class AnnotationManager {
  /**
   * 添加注释
   */
  static async addAnnotation(bookId, annotation) {
    try {
      const annotations = await this.getAnnotations(bookId);
      const newAnnotation = {
        id: Date.now().toString(),
        chapterIndex: annotation.chapterIndex,
        selectedText: annotation.selectedText,
        note: annotation.note || '',
        color: annotation.color || '#FFEB3B', // 默认黄色高亮
        startOffset: annotation.startOffset,
        endOffset: annotation.endOffset,
        createdAt: new Date().toISOString(),
      };

      annotations.push(newAnnotation);
      await AsyncStorage.setItem(
        ANNOTATIONS_KEY + bookId,
        JSON.stringify(annotations)
      );

      return newAnnotation;
    } catch (error) {
      console.error('Error adding annotation:', error);
      throw error;
    }
  }

  /**
   * 获取所有注释
   */
  static async getAnnotations(bookId, chapterIndex = null) {
    try {
      const data = await AsyncStorage.getItem(ANNOTATIONS_KEY + bookId);
      const annotations = data ? JSON.parse(data) : [];

      // 如果指定了章节，只返回该章节的注释
      if (chapterIndex !== null) {
        return annotations.filter(a => a.chapterIndex === chapterIndex);
      }

      return annotations;
    } catch (error) {
      console.error('Error getting annotations:', error);
      return [];
    }
  }

  /**
   * 删除注释
   */
  static async deleteAnnotation(bookId, annotationId) {
    try {
      const annotations = await this.getAnnotations(bookId);
      const filtered = annotations.filter(a => a.id !== annotationId);
      await AsyncStorage.setItem(
        ANNOTATIONS_KEY + bookId,
        JSON.stringify(filtered)
      );
      return true;
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }

  /**
   * 更新注释
   */
  static async updateAnnotation(bookId, annotationId, updates) {
    try {
      const annotations = await this.getAnnotations(bookId);
      const index = annotations.findIndex(a => a.id === annotationId);

      if (index !== -1) {
        annotations[index] = {
          ...annotations[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(
          ANNOTATIONS_KEY + bookId,
          JSON.stringify(annotations)
        );
        return annotations[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw error;
    }
  }

  /**
   * 更改注释颜色
   */
  static async changeAnnotationColor(bookId, annotationId, color) {
    return this.updateAnnotation(bookId, annotationId, { color });
  }
}

export default { BookmarkManager, AnnotationManager };
