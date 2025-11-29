/**
 * PresentationExportService
 *
 * Exports presentation artifacts to PowerPoint (.pptx) format
 * using pptxgenjs library.
 *
 * Features:
 * - Generate PPTX from presentation slides
 * - Supports all slide types (title, metrics, highlights, recommendations, next-steps)
 * - Professional styling with InHerSight branding
 * - Download locally or upload to Google Drive
 */

import pptxgen from 'pptxgenjs';
import type { PresentationSlide } from '@/components/artifacts/PresentationArtifact';

// Brand colors
const COLORS = {
  primary: '2563EB',      // Blue-600
  secondary: '7C3AED',    // Purple-600
  success: '22C55E',      // Green-500
  warning: 'F59E0B',      // Amber-500
  danger: 'EF4444',       // Red-500
  dark: '1F2937',         // Gray-800
  light: 'F3F4F6',        // Gray-100
  white: 'FFFFFF',
  muted: '6B7280',        // Gray-500
};

// Slide dimensions (16:9 widescreen)
const SLIDE_WIDTH = 10;
const SLIDE_HEIGHT = 5.625;

export interface ExportOptions {
  fileName?: string;
  customerName?: string;
  includeDate?: boolean;
  author?: string;
}

export class PresentationExportService {
  private pres: pptxgen;
  private customerName: string;

  constructor(customerName: string = 'Customer') {
    this.pres = new pptxgen();
    this.customerName = customerName;

    // Set presentation properties
    this.pres.author = 'Renubu by InHerSight';
    this.pres.title = `${customerName} - Performance Review`;
    this.pres.subject = 'Quarterly Business Review';
    this.pres.company = 'InHerSight';

    // Set default layout (16:9)
    this.pres.layout = 'LAYOUT_16x9';
  }

  /**
   * Generate PowerPoint from presentation slides
   */
  async generatePptx(slides: PresentationSlide[], options: ExportOptions = {}): Promise<Blob> {
    // Process each slide
    for (const slide of slides) {
      switch (slide.type) {
        case 'title':
          this.addTitleSlide(slide);
          break;
        case 'metrics':
          this.addMetricsSlide(slide);
          break;
        case 'highlights':
          this.addHighlightsSlide(slide);
          break;
        case 'recommendations':
          this.addRecommendationsSlide(slide);
          break;
        case 'next-steps':
          this.addNextStepsSlide(slide);
          break;
        default:
          console.warn(`Unknown slide type: ${slide.type}`);
      }
    }

    // Generate and return blob
    const blob = await this.pres.write({ outputType: 'blob' }) as Blob;
    return blob;
  }

  /**
   * Download PPTX file
   */
  async downloadPptx(slides: PresentationSlide[], options: ExportOptions = {}): Promise<void> {
    const fileName = options.fileName || `${this.customerName.replace(/\s+/g, '-')}_QBR_${new Date().toISOString().split('T')[0]}.pptx`;

    // Process slides
    for (const slide of slides) {
      switch (slide.type) {
        case 'title':
          this.addTitleSlide(slide);
          break;
        case 'metrics':
          this.addMetricsSlide(slide);
          break;
        case 'highlights':
          this.addHighlightsSlide(slide);
          break;
        case 'recommendations':
          this.addRecommendationsSlide(slide);
          break;
        case 'next-steps':
          this.addNextStepsSlide(slide);
          break;
      }
    }

    // Download file
    await this.pres.writeFile({ fileName });
  }

  // ============================================
  // SLIDE GENERATORS
  // ============================================

  private addTitleSlide(slideData: PresentationSlide): void {
    const slide = this.pres.addSlide();
    const content = slideData.content as any;

    // Blue gradient background
    slide.background = { color: COLORS.primary };

    // Logo placeholder
    slide.addText('IHS', {
      x: 4.25,
      y: 0.8,
      w: 1.5,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: COLORS.white,
      align: 'center',
      valign: 'middle',
    });

    // Company name (main title)
    slide.addText(slideData.title || this.customerName, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 0.8,
      fontSize: 44,
      bold: true,
      color: COLORS.white,
      align: 'center',
    });

    // Subtitle
    if (content.subtitle) {
      slide.addText(content.subtitle, {
        x: 0.5,
        y: 2.9,
        w: 9,
        h: 0.5,
        fontSize: 24,
        color: COLORS.white,
        align: 'center',
      });
    }

    // Date and author
    const footerText = [
      content.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      content.preparedBy ? `Prepared by ${content.preparedBy}` : '',
    ].filter(Boolean).join(' • ');

    slide.addText(footerText, {
      x: 0.5,
      y: 4.8,
      w: 9,
      h: 0.4,
      fontSize: 12,
      color: COLORS.white,
      align: 'center',
    });
  }

  private addMetricsSlide(slideData: PresentationSlide): void {
    const slide = this.pres.addSlide();
    const content = slideData.content as any;

    // Header
    slide.addText(slideData.title || 'Brand Performance', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: COLORS.dark,
    });

    // Reporting period
    if (content.reportingPeriod) {
      slide.addText(content.reportingPeriod, {
        x: 0.5,
        y: 0.85,
        w: 9,
        h: 0.3,
        fontSize: 12,
        color: COLORS.muted,
      });
    }

    // Metrics grid (2x2)
    const metrics = [
      { key: 'impressions', label: 'Brand Impressions', data: content.impressions },
      { key: 'profileViews', label: 'Profile Views', data: content.profileViews },
      { key: 'applyClicks', label: 'Apply Clicks', data: content.applyClicks },
      { key: 'newRatings', label: 'New Ratings', data: content.newRatings },
    ];

    const gridPositions = [
      { x: 0.5, y: 1.4 },
      { x: 5, y: 1.4 },
      { x: 0.5, y: 3.3 },
      { x: 5, y: 3.3 },
    ];

    metrics.forEach((metric, idx) => {
      if (!metric.data) return;
      const pos = gridPositions[idx];

      // Metric card background
      slide.addShape('rect', {
        x: pos.x,
        y: pos.y,
        w: 4.3,
        h: 1.6,
        fill: { color: COLORS.light },
        line: { color: 'E5E7EB', width: 1 },
      });

      // Label
      slide.addText(metric.label, {
        x: pos.x + 0.2,
        y: pos.y + 0.15,
        w: 3.9,
        h: 0.3,
        fontSize: 11,
        color: COLORS.muted,
      });

      // Value
      slide.addText(String(metric.data.value || '—'), {
        x: pos.x + 0.2,
        y: pos.y + 0.5,
        w: 3.9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: COLORS.dark,
      });

      // Trend
      if (metric.data.trendValue) {
        const trendColor = metric.data.trend === 'up' ? COLORS.success :
                          metric.data.trend === 'down' ? COLORS.danger : COLORS.muted;
        slide.addText(metric.data.trendValue, {
          x: pos.x + 0.2,
          y: pos.y + 1.15,
          w: 3.9,
          h: 0.3,
          fontSize: 11,
          color: trendColor,
        });
      }
    });
  }

  private addHighlightsSlide(slideData: PresentationSlide): void {
    const slide = this.pres.addSlide();
    const content = slideData.content as any;

    // Header with icon
    slide.addText('🏆 ' + (slideData.title || 'Key Wins'), {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: COLORS.dark,
    });

    // Highlights list
    const items = content.items || [];
    items.forEach((item: string, idx: number) => {
      const yPos = 1.2 + (idx * 0.85);

      // Green check background
      slide.addShape('rect', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.7,
        fill: { color: 'DCFCE7' },
        line: { color: 'BBF7D0', width: 1 },
      });

      // Check mark
      slide.addText('✓', {
        x: 0.7,
        y: yPos + 0.1,
        w: 0.4,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: COLORS.success,
      });

      // Item text
      slide.addText(item, {
        x: 1.2,
        y: yPos + 0.15,
        w: 8,
        h: 0.5,
        fontSize: 14,
        color: COLORS.dark,
      });
    });
  }

  private addRecommendationsSlide(slideData: PresentationSlide): void {
    const slide = this.pres.addSlide();
    const content = slideData.content as any;

    // Purple gradient header
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: 10,
      h: 1,
      fill: { color: 'F3E8FF' },
    });

    // Header
    slide.addText('💡 ' + (slideData.title || 'Strategic Recommendations'), {
      x: 0.5,
      y: 0.25,
      w: 9,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: COLORS.secondary,
    });

    // Recommendations list
    const items = content.items || [];
    items.forEach((item: any, idx: number) => {
      const yPos = 1.2 + (idx * 1.1);
      const rec = typeof item === 'string' ? { title: item } : item;

      // Priority color
      const priorityColors: Record<string, string> = {
        high: 'FEF2F2',
        medium: 'FFFBEB',
        low: 'EFF6FF',
      };
      const bgColor = priorityColors[rec.priority] || priorityColors.medium;

      // Card background
      slide.addShape('rect', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.9,
        fill: { color: bgColor },
        line: { color: 'E5E7EB', width: 1 },
      });

      // Arrow
      slide.addText('→', {
        x: 0.7,
        y: yPos + 0.2,
        w: 0.3,
        h: 0.5,
        fontSize: 14,
        color: COLORS.muted,
      });

      // Title
      slide.addText(rec.title, {
        x: 1.1,
        y: yPos + 0.1,
        w: 7,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: COLORS.dark,
      });

      // Description
      if (rec.description) {
        slide.addText(rec.description, {
          x: 1.1,
          y: yPos + 0.5,
          w: 7,
          h: 0.3,
          fontSize: 11,
          color: COLORS.muted,
        });
      }

      // Priority badge
      if (rec.priority) {
        const badgeColors: Record<string, string> = {
          high: COLORS.danger,
          medium: COLORS.warning,
          low: COLORS.primary,
        };
        slide.addText(rec.priority.toUpperCase(), {
          x: 8.5,
          y: yPos + 0.3,
          w: 0.8,
          h: 0.3,
          fontSize: 8,
          bold: true,
          color: badgeColors[rec.priority] || COLORS.muted,
          align: 'center',
        });
      }
    });
  }

  private addNextStepsSlide(slideData: PresentationSlide): void {
    const slide = this.pres.addSlide();
    const content = slideData.content as any;

    // Header
    slide.addText('✅ ' + (slideData.title || 'Next Steps'), {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: COLORS.dark,
    });

    // Action items list
    const items = content.items || [];
    items.forEach((item: any, idx: number) => {
      const yPos = 1.1 + (idx * 0.95);
      const step = typeof item === 'string' ? { title: item } : item;

      // Card background
      const bgColor = step.completed ? COLORS.light : 'EFF6FF';
      slide.addShape('rect', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.8,
        fill: { color: bgColor },
        line: { color: 'E5E7EB', width: 1 },
      });

      // Checkbox
      const checkSymbol = step.completed ? '☑' : '☐';
      slide.addText(checkSymbol, {
        x: 0.7,
        y: yPos + 0.2,
        w: 0.4,
        h: 0.4,
        fontSize: 16,
        color: step.completed ? COLORS.success : COLORS.primary,
      });

      // Title
      slide.addText(step.title, {
        x: 1.2,
        y: yPos + 0.15,
        w: 6,
        h: 0.35,
        fontSize: 13,
        bold: !step.completed,
        color: step.completed ? COLORS.muted : COLORS.dark,
      });

      // Owner and due date
      const metadata = [
        step.owner ? `👤 ${step.owner}` : '',
        step.dueDate ? `📅 ${step.dueDate}` : '',
      ].filter(Boolean).join('  •  ');

      if (metadata) {
        slide.addText(metadata, {
          x: 1.2,
          y: yPos + 0.5,
          w: 6,
          h: 0.25,
          fontSize: 10,
          color: COLORS.muted,
        });
      }
    });
  }
}

/**
 * Export presentation to PowerPoint and download
 */
export async function exportToPptx(
  slides: PresentationSlide[],
  customerName: string,
  options: ExportOptions = {}
): Promise<void> {
  const service = new PresentationExportService(customerName);
  await service.downloadPptx(slides, options);
}

/**
 * Generate PowerPoint blob for upload
 */
export async function generatePptxBlob(
  slides: PresentationSlide[],
  customerName: string,
  options: ExportOptions = {}
): Promise<Blob> {
  const service = new PresentationExportService(customerName);
  return service.generatePptx(slides, options);
}

export default PresentationExportService;
