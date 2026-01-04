/**
 * Presentation Template Types
 *
 * Defines the structure for customer-uploaded presentation templates.
 * These templates are derived from customer's own PowerPoint decks
 * and enable native presentation generation.
 */

/**
 * Slide layout types available in presentations
 */
export type SlideLayoutType =
  | 'title'           // Title slide with company branding
  | 'title-content'   // Title with bullet points
  | 'two-column'      // Two column layout
  | 'image-left'      // Image on left, content on right
  | 'image-right'     // Image on right, content on left
  | 'full-image'      // Full bleed image with overlay text
  | 'chart'           // Chart/graph focused slide
  | 'comparison'      // Side-by-side comparison
  | 'quote'           // Quote or testimonial
  | 'section-divider' // Section break slide
  | 'agenda'          // Agenda/table of contents
  | 'custom';         // Custom layout

/**
 * Color scheme extracted from customer's brand
 */
export interface BrandColorScheme {
  primary: string;      // Primary brand color (hex)
  secondary: string;    // Secondary brand color (hex)
  accent: string;       // Accent color (hex)
  background: string;   // Background color (hex)
  text: string;         // Primary text color (hex)
  textLight: string;    // Light text color (hex)
}

/**
 * Typography settings from customer's brand
 */
export interface BrandTypography {
  headingFont: string;     // Font family for headings
  bodyFont: string;        // Font family for body text
  headingSizes: {
    h1: number;
    h2: number;
    h3: number;
  };
  bodySizes: {
    large: number;
    normal: number;
    small: number;
  };
}

/**
 * Individual slide template within a presentation template
 */
export interface SlideTemplate {
  id: string;
  name: string;
  layoutType: SlideLayoutType;
  thumbnail?: string;           // URL to thumbnail preview
  placeholders: {
    id: string;
    type: 'title' | 'subtitle' | 'body' | 'image' | 'chart' | 'logo';
    position: { x: number; y: number; width: number; height: number };
    defaultText?: string;
    required: boolean;
  }[];
  backgroundImage?: string;     // URL to background image
  backgroundColor?: string;     // Background color override
}

/**
 * Presentation template - a collection of slide templates
 * derived from a customer's PowerPoint deck
 */
export interface PresentationTemplate {
  id: string;
  name: string;
  description?: string;

  // Ownership
  companyId: string;           // Company that owns this template
  customerId?: string;         // Optional: specific customer template
  createdBy: string;           // User who created/uploaded
  createdAt: string;
  updatedAt: string;

  // Source information
  sourceFile?: {
    filename: string;
    uploadedAt: string;
    fileSize: number;
    mimeType: string;
    storageUrl: string;
  };

  // Brand elements
  branding: {
    logoUrl?: string;
    logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    colors: BrandColorScheme;
    typography: BrandTypography;
  };

  // Slide templates
  slides: SlideTemplate[];

  // Template metadata
  category: 'renewal' | 'qbr' | 'proposal' | 'general' | 'custom';
  tags?: string[];
  isDefault: boolean;          // Is this the default template for this company?
  isActive: boolean;           // Is this template available for use?

  // Usage stats
  usageCount: number;
  lastUsedAt?: string;
}

/**
 * Template creation request (for future upload feature)
 */
export interface CreatePresentationTemplateRequest {
  name: string;
  description?: string;
  companyId: string;
  customerId?: string;
  category: PresentationTemplate['category'];
  sourceFile: File;
}

/**
 * Template query filters
 */
export interface PresentationTemplateFilters {
  companyId?: string;
  customerId?: string;
  category?: PresentationTemplate['category'];
  isActive?: boolean;
  isDefault?: boolean;
}

/**
 * Result of checking for available templates
 */
export interface TemplateAvailability {
  hasTemplates: boolean;
  defaultTemplate?: PresentationTemplate;
  availableTemplates: PresentationTemplate[];
  suggestedAction: 'use_default' | 'select_template' | 'create_template';
}
