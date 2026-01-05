# Good Hang - SEO Setup Guide

## Overview
This guide covers the complete SEO setup for Good Hang, including search console configuration, verification, and ongoing maintenance.

---

## Table of Contents
1. [Files Created](#files-created)
2. [Google Search Console Setup](#google-search-console-setup)
3. [Bing Webmaster Tools Setup](#bing-webmaster-tools-setup)
4. [Image Optimization](#image-optimization)
5. [Ongoing Maintenance](#ongoing-maintenance)

---

## Files Created

### Core SEO Files
- **`public/llms.txt`** - LLM content guidelines and project information
- **`app/robots.ts`** - Crawling directives for search engines
- **`app/sitemap.ts`** - Dynamic sitemap with all public routes
- **`public/manifest.json`** - PWA manifest with app metadata

### Meta Tags & Structured Data
- **`app/layout.tsx`** - Enhanced with comprehensive metadata:
  - Open Graph tags for social sharing
  - Twitter Card tags
  - Schema.org JSON-LD markup (Organization, WebSite, WebPage)
  - Icons configuration
  - Theme colors and viewport settings
  - Robot directives

### Visual Assets
- **Favicons:**
  - `app/icon.svg` - Vector icon
  - `app/favicon.ico` - Multi-size ICO file
  - `public/apple-touch-icon.png` - 180x180px
  - `public/icon-{16,32,180,192,512}.png` - Various sizes

- **Social Sharing Images:**
  - `app/opengraph-image.png` - 1200x630px for Open Graph
  - `app/twitter-image.png` - 1200x630px for Twitter Cards

---

## Google Search Console Setup

### Step 1: Create/Access Your Account
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account
3. Click "Add Property"

### Step 2: Choose Property Type
- **Domain Property** (Recommended): Covers all subdomains and protocols
  - Enter: `goodhang.club`
  - Requires DNS verification

- **URL Prefix Property**: Covers specific URL
  - Enter: `https://goodhang.club`
  - Multiple verification methods available

### Step 3: Verification Methods

#### Method 1: DNS Verification (Recommended for Domain Property)
1. Copy the TXT record provided by Google
2. Log into your DNS provider (e.g., Cloudflare, Namecheap, etc.)
3. Add a new TXT record:
   - **Name/Host**: `@` or your domain
   - **Value**: The verification string from Google
   - **TTL**: Auto or 3600
4. Wait for DNS propagation (can take up to 48 hours, usually minutes)
5. Click "Verify" in Search Console

#### Method 2: HTML Meta Tag (For URL Prefix Property)
1. Copy the meta tag provided by Google
2. Add to `app/layout.tsx` in the metadata object:
```typescript
export const metadata: Metadata = {
  // ... existing metadata
  verification: {
    google: 'your-verification-code-here',
  },
}
```
3. Deploy your changes
4. Click "Verify" in Search Console

#### Method 3: HTML File Upload
1. Download the verification file from Google
2. Add to `public/` folder in your project
3. Deploy your changes
4. Verify the file is accessible at `https://goodhang.club/google[verification-code].html`
5. Click "Verify" in Search Console

### Step 4: Submit Sitemap
1. Once verified, go to "Sitemaps" in the left menu
2. Enter: `https://goodhang.club/sitemap.xml`
3. Click "Submit"
4. Google will start crawling your site

### Step 5: Configure Settings
1. **URL Parameters**: Review any dynamic parameters
2. **International Targeting**: Set to United States
3. **Change of Address**: Only if migrating from another domain
4. **Users and Permissions**: Add team members if needed

---

## Bing Webmaster Tools Setup

### Step 1: Create/Access Your Account
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sign in with Microsoft account
3. Click "Add Site"

### Step 2: Add Your Site
1. Enter: `https://goodhang.club`
2. Add sitemap: `https://goodhang.club/sitemap.xml`

### Step 3: Verification Methods

#### Method 1: Import from Google Search Console (Easiest)
1. Click "Import from Google Search Console"
2. Sign in to your Google account
3. Select your verified property
4. Bing will automatically verify

#### Method 2: XML File Verification
1. Download the XML verification file
2. Add to `public/` folder
3. Deploy your changes
4. Verify file is accessible
5. Click "Verify"

#### Method 3: Meta Tag Verification
1. Copy the meta tag provided by Bing
2. Add to `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  // ... existing metadata
  verification: {
    google: 'your-google-code',
    bing: 'your-bing-code-here',
  },
}
```
3. Deploy and verify

### Step 4: Configure Settings
1. Review crawl settings
2. Set geographic targeting to United States
3. Configure mobile-friendliness settings

---

## Image Optimization

### Current Status
Based on the image audit, several optimizations are needed:

#### Critical Issues (Fix Immediately)
1. **Social sharing images** (opengraph-image.png, twitter-image.png)
   - Current: 1.8MB each
   - Target: 200-300KB
   - Fix: Re-generate with lower quality settings

2. **Large glitch images** in `public/glitch-images/`
   - Several images exceed 100KB guideline
   - Compress using tools like:
     - [Squoosh](https://squoosh.app/) - Online, high quality
     - [ImageOptim](https://imageoptim.com/) - Mac
     - [TinyPNG](https://tinypng.com/) - Online, good for PNG

3. **icon-512.png**
   - Current: 370KB
   - Target: 50-100KB

### Optimization Commands

#### Using Next.js Built-in Optimization
```bash
# Ensure images use Next.js Image component
# Check components/GlitchIntroV2.tsx and components/MemberGrid.tsx
```

#### Manual Compression (Python)
```bash
# Install Pillow if not already installed
pip install Pillow

# Run optimization script (create if needed)
python optimize_images.py
```

### Best Practices
- Always use `next/image` component for user-facing images
- Provide descriptive `alt` text for accessibility
- Use `sizes` attribute for responsive images
- Set `priority` for above-fold images
- Use empty `alt=""` for decorative images
- Keep file sizes under 100KB for glitch images
- Keep social sharing images under 300KB

---

## Ongoing Maintenance

### Weekly Tasks
- [ ] Monitor Google Search Console for crawl errors
- [ ] Check new pages are being indexed
- [ ] Review search queries and CTR

### Monthly Tasks
- [ ] Update sitemap if new pages added
- [ ] Review and update meta descriptions
- [ ] Check for broken links
- [ ] Analyze top-performing pages
- [ ] Review mobile usability reports

### Quarterly Tasks
- [ ] Audit all page titles and descriptions
- [ ] Review and update Schema.org markup
- [ ] Analyze backlink profile
- [ ] Update social sharing images if branding changes
- [ ] Review and optimize Core Web Vitals

### Important URLs to Monitor
- Homepage: `https://goodhang.club`
- About: `https://goodhang.club/about`
- Events: `https://goodhang.club/events`
- Launch: `https://goodhang.club/launch`
- Apply: `https://goodhang.club/apply`

### Key Metrics to Track
1. **Organic Traffic** - Total visits from search engines
2. **Click-Through Rate (CTR)** - How often people click your results
3. **Average Position** - Where you rank for target keywords
4. **Core Web Vitals** - Page speed and user experience metrics
5. **Mobile Usability** - Mobile-friendliness issues
6. **Index Coverage** - Pages successfully indexed

### Target Keywords
- tech social club raleigh
- tech professionals networking raleigh nc
- exclusive social club raleigh
- tech noir
- raleigh tech community
- tech events raleigh
- curated tech events
- tech culture raleigh

---

## Verification Checklist

After completing setup, verify everything is working:

- [ ] Site appears in Google Search Console
- [ ] Sitemap submitted and processing
- [ ] No crawl errors in GSC
- [ ] Site appears in Bing Webmaster Tools
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Favicon displays correctly in browser
- [ ] Social sharing images display when sharing links
- [ ] All meta tags present in page source
- [ ] Schema.org markup validates at [Schema Markup Validator](https://validator.schema.org/)
- [ ] Mobile-friendly test passes at [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [ ] Page speed acceptable at [PageSpeed Insights](https://pagespeed.web.dev/)

---

## Support Resources

### Google Search Console
- [Official Documentation](https://support.google.com/webmasters)
- [Search Central Blog](https://developers.google.com/search/blog)
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

### Bing Webmaster Tools
- [Official Documentation](https://www.bing.com/webmasters/help/help-center-661b2d18)
- [Webmaster Guidelines](https://www.bing.com/webmasters/help/webmasters-guidelines-30fba23a)

### Schema.org
- [Schema.org Documentation](https://schema.org/)
- [Schema Markup Validator](https://validator.schema.org/)

### Next.js SEO
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

## Notes

- Domain: `goodhang.club`
- Primary Location: Raleigh, NC, USA
- Target Audience: Tech professionals
- Site Type: Social club / Community platform
- Framework: Next.js 16 (App Router)
