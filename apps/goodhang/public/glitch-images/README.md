# Good Hang - Glitch Image Library

## Image Guidelines

All images should be:
- **Heavily processed**: Blur, grain, color distortion, VHS artifacts
- **Partial/corrupted**: Not fully clear, partially obscured
- **Skewed/distorted**: Rotated, warped, chromatic aberration
- **Uncomfortable but not graphic**: Unsettling, not horrifying

## Categories

### /tech (Surveillance & Technology Horror)
- Static TV screens
- Old security camera footage
- CRT monitor glitches
- Corrupted terminal screens
- VHS tracking errors
- Old computer interfaces
- Broken screens
- Digital noise patterns

### /macabre (Retro Horror Aesthetic)
**Vintage Americana Horror:**
- Broken mirrors (fragmented reflections)
- Old polaroids (faded, distorted)
- Doll parts (vintage dolls, dismembered)
- Care Bears (distorted, corrupted)
- Old toys (unsettling angles)
- Empty rooms (vintage furniture)
- Doorways/thresholds
- Shadows on walls

**Iconic Horror References:**
- The Shining references (carpets, twins, room 237 vibes)
- Twin Peaks aesthetic (red rooms, curtains)
- Vintage horror movie stills (processed)

### /social (Distorted Social Gatherings)
**Vintage Cocktail Culture:**
- Famous cocktail lounges from 60s-80s
  - The Carousel Bar, New Orleans
  - Rainbow Room, NYC
  - Tiki bars, vintage photos
- Old cocktail hour photos (faded, faces blurred)
- Vintage party polaroids
- 70s/80s social gatherings (distorted)
- Faceless crowds (faces obscured/blurred)
- Isolated figures in social settings
- Empty bar stools, abandoned glasses

## Processing Requirements

Every image MUST be processed with:

1. **VHS Degradation**:
   - Scanlines overlay
   - Color bleeding
   - Tracking errors
   - Chromatic aberration

2. **Distortion**:
   - Skew/rotation (3-15 degrees)
   - Warp/bend effects
   - Perspective distortion

3. **Obscuration**:
   - Blur (gaussian, 20-40%)
   - Noise/grain overlay
   - Partial masking
   - Low opacity (30-50% when displayed)

4. **Color Grading**:
   - Desaturate or oversaturate
   - Hue shifts (cyan/magenta bias)
   - High contrast or washed out
   - Vintage color cast

## Image Specs

- **Format**: JPG or WebP
- **Size**: 800x600px max (will be scaled down)
- **File size**: < 100KB each
- **Naming**: descriptive-lowercase-dashes.jpg

## Example Filenames

```
tech/
├── static-screen-01.jpg
├── crt-glitch-blue.jpg
├── surveillance-grain.jpg
├── terminal-corrupted.jpg
└── vhs-tracking-error.jpg

macabre/
├── broken-mirror-fragments.jpg
├── polaroid-faded-party.jpg
├── doll-parts-vintage.jpg
├── care-bear-corrupted.jpg
├── empty-room-chair.jpg
├── doorway-shadow.jpg
└── twins-carpet-shining.jpg

social/
├── carousel-bar-vintage.jpg
├── rainbow-room-blur.jpg
├── tiki-bar-polaroid.jpg
├── cocktail-hour-70s.jpg
├── faceless-crowd-party.jpg
├── empty-bar-stools.jpg
└── isolated-figure-gathering.jpg
```

## Sourcing Images

**Public Domain / Creative Commons:**
- Library of Congress archives
- Unsplash (vintage collections)
- Pexels (retro/vintage)
- Internet Archive
- Wikimedia Commons

**Royalty-Free:**
- Pixabay
- Burst by Shopify
- Reshot

**AI Generation:**
- Midjourney/Stable Diffusion prompts:
  - "vintage polaroid of cocktail lounge, distorted, VHS artifacts, grainy"
  - "broken doll parts, 1970s aesthetic, chromatic aberration, corrupted"
  - "empty hotel corridor, the shining style, VHS tape degradation"

## Processing Tools

- **Photoshop/GIMP**: Filters, distortion, color grading
- **Online**: Photopea, Pixlr
- **CLI**: ImageMagick for batch processing
- **CSS**: Additional distortion applied in-browser

## Current Status

📁 Directories created, ready for images
🎨 CSS distortion effects ready
🔄 Component will cycle through available images
⚡ Images flash for 900-1200ms in designated zones
