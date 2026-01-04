// Image manifest for glitch intro
export interface GlitchImage {
  path: string;
  type: 'tech' | 'macabre' | 'social';
}

export const GLITCH_IMAGES: GlitchImage[] = [
  // Macabre - doll parts, horror aesthetic
  { path: '/glitch-images/macabre/1500.avif', type: 'macabre' },
  { path: '/glitch-images/macabre/4346.avif', type: 'macabre' },
  { path: '/glitch-images/macabre/abandoned-porcelain-doll-stockcake.jpg', type: 'macabre' },
  { path: '/glitch-images/macabre/macabre3.jpg', type: 'macabre' },
  { path: '/glitch-images/macabre/maxresdefault.jpg', type: 'macabre' },

  // Tech - VHS glitch, synthwave, CRT effects
  { path: '/glitch-images/tech/background-landscape-80s-style-synthwave-260nw-1395810956.webp', type: 'tech' },
  { path: '/glitch-images/tech/glitch-texture-pixel-noise-test-tv-screen-digital-vhs-backgroun-background-error-computer-video-abstract-problem-black-damage-133512757.webp', type: 'tech' },
  { path: '/glitch-images/tech/glitch-texture-pixel-noise-test-tv-screen-digital-vhs-background-error-computer-video-abstract-black-damage-magic-poster-R6DBXF.jpg', type: 'tech' },
  { path: '/glitch-images/tech/images.jpg', type: 'tech' },
  { path: '/glitch-images/tech/motion-array-1300267-PaKnkfbybf-high_0008.avif', type: 'tech' },
  { path: '/glitch-images/tech/purple-pixel-skyline-stockcake.jpg', type: 'tech' },
  { path: '/glitch-images/tech/The_80s_Tron_Still_Shift.jpeg', type: 'tech' },

  // Social - vintage cocktail parties, prohibition era
  { path: '/glitch-images/social/1950s-cocktail-suggestions.jpg', type: 'social' },
  { path: '/glitch-images/social/1950s-vintage-photo-of-1950s-cocktail-party-featuring-stylish-women-standing-around-the-punch-bowl-and-food-in-1950s-cocktail-party-dresses.jpg', type: 'social' },
  { path: '/glitch-images/social/after_end_of_prohibition_new_york_times_1933_3.webp', type: 'social' },
  { path: '/glitch-images/social/c4ee377612656244d1f9a3ecbe910aad.jpg', type: 'social' },
  { path: '/glitch-images/social/images.jpg', type: 'social' },
  { path: '/glitch-images/social/OldFashioned_HERO_020520_619.webp', type: 'social' },
  { path: '/glitch-images/social/prohibitionbooze.jpg', type: 'social' },
];

// Get random image of specific type
export function getRandomImage(type: 'tech' | 'macabre' | 'social'): GlitchImage {
  const filtered = GLITCH_IMAGES.filter(img => img.type === type);
  const randomImage = filtered[Math.floor(Math.random() * filtered.length)];
  if (!randomImage) throw new Error(`No images found for type: ${type}`);
  return randomImage;
}

// Get random image path
export function getRandomImagePath(type: 'tech' | 'macabre' | 'social'): string {
  return getRandomImage(type).path;
}
