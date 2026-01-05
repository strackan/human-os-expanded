// Procedural 8-bit token art generator
// Creates unique coin visuals based on visual_seed and signature_pattern

// Color palettes for different coin ages/patinas
const COIN_PALETTES = [
  // Gold
  { base: '#FFD700', highlight: '#FFF8DC', shadow: '#B8860B', patina: '#8B7355' },
  // Silver
  { base: '#C0C0C0', highlight: '#E8E8E8', shadow: '#808080', patina: '#696969' },
  // Bronze
  { base: '#CD7F32', highlight: '#DEB887', shadow: '#8B4513', patina: '#556B2F' },
  // Copper
  { base: '#B87333', highlight: '#DAA520', shadow: '#8B4513', patina: '#2E8B57' },
  // Ancient gold
  { base: '#CFB53B', highlight: '#E6BE8A', shadow: '#8B7355', patina: '#4A4A4A' },
];

// Seeded random for deterministic generation
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return function() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

interface TokenVisualParams {
  visualSeed: string;
  signaturePattern: string;
  size?: number;
}

/**
 * Generates token visual parameters from seeds
 */
export function getTokenVisualParams(visualSeed: string, signaturePattern: string) {
  const random = seededRandom(visualSeed);
  const sigRandom = seededRandom(signaturePattern);

  // Choose palette
  const paletteIndex = Math.floor(random() * COIN_PALETTES.length);
  const palette = COIN_PALETTES[paletteIndex]!;

  // Patina intensity (0-1)
  const patinaIntensity = random() * 0.4 + 0.1;

  // Edge wear (number of wear spots)
  const wearSpots = Math.floor(random() * 8) + 3;

  // Signature glyph pattern (8x8 grid)
  const glyphPattern: boolean[][] = [];
  for (let y = 0; y < 8; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 8; x++) {
      // Mirror horizontally for symmetry
      if (x < 4) {
        row.push(sigRandom() > 0.5);
      } else {
        row.push(row[7 - x]!);
      }
    }
    glyphPattern.push(row);
  }

  return {
    palette,
    patinaIntensity,
    wearSpots,
    glyphPattern,
  };
}

/**
 * Renders a token to a canvas element
 */
export function renderTokenToCanvas(
  canvas: HTMLCanvasElement,
  params: TokenVisualParams
): void {
  const { visualSeed, signaturePattern, size = 128 } = params;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  const visual = getTokenVisualParams(visualSeed, signaturePattern);
  const random = seededRandom(visualSeed);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.45;
  const innerRadius = radius * 0.85;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw outer ring (edge)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = visual.palette.shadow;
  ctx.fill();

  // Draw main coin body
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = visual.palette.base;
  ctx.fill();

  // Draw inner circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = visual.palette.highlight;
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw signature glyph in center
  const glyphSize = size * 0.4;
  const pixelSize = glyphSize / 8;
  const glyphStartX = centerX - glyphSize / 2;
  const glyphStartY = centerY - glyphSize / 2;

  ctx.fillStyle = visual.palette.shadow;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (visual.glyphPattern[y]?.[x]) {
        ctx.fillRect(
          glyphStartX + x * pixelSize,
          glyphStartY + y * pixelSize,
          pixelSize - 1,
          pixelSize - 1
        );
      }
    }
  }

  // Add patina spots
  ctx.fillStyle = visual.palette.patina;
  ctx.globalAlpha = visual.patinaIntensity;
  for (let i = 0; i < 15; i++) {
    const angle = random() * Math.PI * 2;
    const distance = random() * radius * 0.8;
    const spotSize = random() * 8 + 3;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    ctx.beginPath();
    ctx.arc(x, y, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Add edge wear (lighter spots on edge)
  ctx.fillStyle = visual.palette.highlight;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < visual.wearSpots; i++) {
    const angle = (i / visual.wearSpots) * Math.PI * 2 + random() * 0.3;
    const x = centerX + Math.cos(angle) * (radius - 3);
    const y = centerY + Math.sin(angle) * (radius - 3);
    const wearSize = random() * 4 + 2;

    ctx.beginPath();
    ctx.arc(x, y, wearSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Add subtle highlight on top-left
  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.3,
    centerY - radius * 0.3,
    0,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add pixelation effect for 8-bit look
  applyPixelation(ctx, size, 4);
}

/**
 * Applies pixelation effect to canvas for 8-bit aesthetic
 */
function applyPixelation(ctx: CanvasRenderingContext2D, size: number, pixelSize: number): void {
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y += pixelSize) {
    for (let x = 0; x < size; x += pixelSize) {
      // Get average color for this block
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let py = 0; py < pixelSize && y + py < size; py++) {
        for (let px = 0; px < pixelSize && x + px < size; px++) {
          const i = ((y + py) * size + (x + px)) * 4;
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          a += data[i + 3]!;
          count++;
        }
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);

      // Apply to all pixels in block
      for (let py = 0; py < pixelSize && y + py < size; py++) {
        for (let px = 0; px < pixelSize && x + px < size; px++) {
          const i = ((y + py) * size + (x + px)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Generates a data URL for a token image
 */
export function generateTokenDataUrl(
  visualSeed: string,
  signaturePattern: string,
  size = 128
): string {
  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  renderTokenToCanvas(canvas, { visualSeed, signaturePattern, size });
  return canvas.toDataURL('image/png');
}

/**
 * Generates visual seed for a new token
 */
export function generateVisualSeed(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `v-${timestamp}-${randomPart}`;
}

/**
 * Generates signature pattern for a new token
 */
export function generateSignaturePattern(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 12);
  return `s-${timestamp}-${randomPart}`;
}
