import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system';

/**
 * Parse EPUB file and extract content
 */
export class EpubParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.zip = null;
    this.metadata = {};
    this.chapters = [];
    this.spine = [];
  }

  /**
   * Load and parse the EPUB file
   */
  async load() {
    try {
      // Read the file as base64
      const fileContent = await FileSystem.readAsStringAsync(this.filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Load the zip file
      this.zip = await JSZip.loadAsync(fileContent, { base64: true });

      // Parse container.xml to find the content.opf file
      const containerXml = await this.zip.file('META-INF/container.xml').async('string');
      const contentOpfPath = this.extractContentOpfPath(containerXml);

      // Parse content.opf
      const contentOpf = await this.zip.file(contentOpfPath).async('string');
      await this.parseContentOpf(contentOpf, contentOpfPath);

      return true;
    } catch (error) {
      console.error('Error loading EPUB:', error);
      throw error;
    }
  }

  /**
   * Extract the path to content.opf from container.xml
   */
  extractContentOpfPath(containerXml) {
    const match = containerXml.match(/full-path="([^"]+)"/);
    return match ? match[1] : 'OEBPS/content.opf';
  }

  /**
   * Parse content.opf file
   */
  async parseContentOpf(contentOpf, contentOpfPath) {
    // Extract metadata
    const titleMatch = contentOpf.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
    const authorMatch = contentOpf.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/);

    this.metadata = {
      title: titleMatch ? titleMatch[1] : 'Unknown Title',
      author: authorMatch ? authorMatch[1] : 'Unknown Author',
    };

    // Extract manifest items
    const manifest = {};
    const manifestRegex = /<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"[^>]*>/g;
    let match;
    while ((match = manifestRegex.exec(contentOpf)) !== null) {
      manifest[match[1]] = match[2];
    }

    // Extract spine (reading order)
    const spineRegex = /<itemref[^>]+idref="([^"]+)"/g;
    const basePath = contentOpfPath.substring(0, contentOpfPath.lastIndexOf('/') + 1);

    while ((match = spineRegex.exec(contentOpf)) !== null) {
      const itemId = match[1];
      if (manifest[itemId]) {
        this.spine.push(basePath + manifest[itemId]);
      }
    }

    // Load chapter contents
    await this.loadChapters();
  }

  /**
   * Load all chapters content
   */
  async loadChapters() {
    this.chapters = [];

    for (let i = 0; i < this.spine.length; i++) {
      const chapterPath = this.spine[i];
      try {
        const chapterContent = await this.zip.file(chapterPath).async('string');
        this.chapters.push({
          index: i,
          path: chapterPath,
          content: chapterContent,
        });
      } catch (error) {
        console.error(`Error loading chapter ${chapterPath}:`, error);
      }
    }
  }

  /**
   * Get chapter content by index
   */
  getChapter(index) {
    return this.chapters[index] || null;
  }

  /**
   * Get all chapters
   */
  getAllChapters() {
    return this.chapters;
  }

  /**
   * Get metadata
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Get total number of chapters
   */
  getChapterCount() {
    return this.chapters.length;
  }

  /**
   * Extract images from EPUB
   */
  async extractImage(imagePath) {
    try {
      const imageData = await this.zip.file(imagePath).async('base64');
      return `data:image/jpeg;base64,${imageData}`;
    } catch (error) {
      console.error('Error extracting image:', error);
      return null;
    }
  }
}

export default EpubParser;
