export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display';
  source: 'web-safe' | 'google' | 'system';
  weights?: string[];
  preview: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Web-safe fonts
  {
    id: 'system-default',
    name: 'System Default',
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    category: 'sans-serif',
    source: 'system',
    preview: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'arial',
    name: 'Arial',
    family: 'Arial, sans-serif',
    category: 'sans-serif',
    source: 'web-safe',
    preview: 'Clean and professional sans-serif.',
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    family: 'Helvetica, Arial, sans-serif',
    category: 'sans-serif',
    source: 'web-safe',
    preview: 'Classic Swiss sans-serif design.',
  },
  {
    id: 'times',
    name: 'Times New Roman',
    family: 'Times, "Times New Roman", serif',
    category: 'serif',
    source: 'web-safe',
    preview: 'Traditional serif for formal writing.',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: 'Georgia, serif',
    category: 'serif',
    source: 'web-safe',
    preview: 'Readable serif designed for screens.',
  },
  
  // Google Fonts - Popular sans-serif
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter, sans-serif',
    category: 'sans-serif',
    source: 'google',
    weights: ['300', '400', '500', '600', '700'],
    preview: 'Modern and highly readable interface font.',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    source: 'google',
    weights: ['300', '400', '500', '700'],
    preview: 'Clean, natural, and friendly design.',
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    family: '"Open Sans", sans-serif',
    category: 'sans-serif',
    source: 'google',
    weights: ['300', '400', '600', '700'],
    preview: 'Optimized for print, web, and mobile.',
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato, sans-serif',
    category: 'sans-serif',
    source: 'google',
    weights: ['300', '400', '700'],
    preview: 'Warm and approachable humanist sans.',
  },
  {
    id: 'nunito',
    name: 'Nunito',
    family: 'Nunito, sans-serif',
    category: 'sans-serif',
    source: 'google',
    weights: ['300', '400', '600', '700'],
    preview: 'Rounded and friendly character shapes.',
  },
  {
    id: 'source-sans-pro',
    name: 'Source Sans Pro',
    family: '"Source Sans Pro", sans-serif',
    category: 'sans-serif',
    source: 'google',
    weights: ['300', '400', '600', '700'],
    preview: 'Professional and versatile sans-serif.',
  },
  
  // Google Fonts - Serif
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: 'Merriweather, serif',
    category: 'serif',
    source: 'google',
    weights: ['300', '400', '700'],
    preview: 'Designed for optimal readability.',
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: '"Playfair Display", serif',
    category: 'serif',
    source: 'google',
    weights: ['400', '700'],
    preview: 'Elegant and distinctive serif.',
  },
  {
    id: 'libre-baskerville',
    name: 'Libre Baskerville',
    family: '"Libre Baskerville", serif',
    category: 'serif',
    source: 'google',
    weights: ['400', '700'],
    preview: 'Classic book typography style.',
  },
  
  // Display fonts
  {
    id: 'quicksand',
    name: 'Quicksand',
    family: 'Quicksand, sans-serif',
    category: 'display',
    source: 'google',
    weights: ['300', '400', '500', '600', '700'],
    preview: 'Friendly and modern rounded sans.',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    category: 'display',
    source: 'google',
    weights: ['300', '400', '500', '600', '700'],
    preview: 'Geometric sans with perfect circles.',
  },
];

export class FontManager {
  private loadedFonts = new Set<string>();
  
  /**
   * Load a Google Font dynamically
   */
  async loadGoogleFont(font: FontOption): Promise<void> {
    if (font.source !== 'google' || this.loadedFonts.has(font.id)) {
      return;
    }
    
    const weights = font.weights?.join(';') || '400';
    const fontName = font.family.split(',')[0].replace(/"/g, '');
    const url = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@${weights}&display=swap`;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    
    return new Promise((resolve, reject) => {
      link.onload = () => {
        this.loadedFonts.add(font.id);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  
  /**
   * Apply font to the document
   */
  async applyFont(fontId: string): Promise<void> {
    const font = AVAILABLE_FONTS.find(f => f.id === fontId);
    if (!font) {
      throw new Error(`Font ${fontId} not found`);
    }
    
    // Load Google Font if needed
    if (font.source === 'google') {
      await this.loadGoogleFont(font);
    }
    
    // Apply CSS variable
    document.documentElement.style.setProperty('--user-font-family', font.family);
    
    // Store in localStorage for immediate persistence
    localStorage.setItem('userFontPreference', fontId);
    
    // Sync to database if user is logged in
    this.syncToDatabase(fontId);
  }
  
  /**
   * Sync font preference to database
   */
  private async syncToDatabase(fontId: string): Promise<void> {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: {
            fontFamily: fontId,
          },
        }),
      });
      
      if (!response.ok) {
        console.log('User not logged in or unable to sync font preference to database');
      }
    } catch (error) {
      console.log('Unable to sync font preference to database:', error);
    }
  }
  
  /**
   * Load font preference from database
   */
  private async loadFromDatabase(): Promise<string | null> {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const { preferences } = await response.json();
        return preferences.fontFamily || null;
      }
    } catch (error) {
      console.log('Unable to load font preference from database:', error);
    }
    return null;
  }
  
  /**
   * Get current font preference (database > localStorage > default)
   */
  async getCurrentFont(): Promise<string> {
    // Try database first (for logged-in users)
    const dbFont = await this.loadFromDatabase();
    if (dbFont) {
      return dbFont;
    }
    
    // Fall back to localStorage
    const localFont = localStorage.getItem('userFontPreference');
    if (localFont) {
      return localFont;
    }
    
    // Default font
    return 'system-default';
  }
  
  /**
   * Get current font preference synchronously (for components)
   */
  getCurrentFontSync(): string {
    return localStorage.getItem('userFontPreference') || 'system-default';
  }
  
  /**
   * Initialize font system
   */
  async initialize(): Promise<void> {
    const currentFont = await this.getCurrentFont();
    
    // Update localStorage if database had different preference
    const localFont = localStorage.getItem('userFontPreference');
    if (localFont !== currentFont) {
      localStorage.setItem('userFontPreference', currentFont);
    }
    
    await this.applyFont(currentFont);
  }
}

export const fontManager = new FontManager(); 