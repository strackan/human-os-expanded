#!/usr/bin/env python3
"""
Generate Good Hang favicon following Neon Decay design philosophy
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import random

# Good Hang brand colors
DARK_BG = (10, 10, 15)  # #0a0a0f
CYAN = (0, 204, 221)  # #00ccdd
MAGENTA = (187, 0, 170)  # #bb00aa
PURPLE = (119, 0, 204)  # #7700cc

def add_noise(img, intensity=0.05):
    """Add VHS-style grain"""
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, intensity * 255, arr.shape)
    arr = np.clip(arr + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def create_glitch_effect(draw, x, y, width, height, color, offset=2):
    """Create horizontal glitch displacement"""
    segments = random.randint(3, 5)
    seg_height = height // segments

    for i in range(segments):
        y_pos = y + (i * seg_height)
        x_offset = random.randint(-offset, offset)
        draw.rectangle(
            [x + x_offset, y_pos, x + x_offset + width, y_pos + seg_height],
            fill=color + (180,)  # Add alpha
        )

def create_favicon_base(size=512):
    """Create the main favicon design"""
    # Create base image with alpha channel
    img = Image.new('RGBA', (size, size), DARK_BG + (255,))
    draw = ImageDraw.Draw(img, 'RGBA')

    center = size // 2

    # Create geometric composition inspired by "GH" but abstract
    # Main geometric forms - overlapping circles/rectangles creating interference

    # Layer 1: Cyan circle (left, representing G)
    circle1_x = center - size // 6
    circle1_r = size // 3
    draw.ellipse(
        [circle1_x - circle1_r, center - circle1_r,
         circle1_x + circle1_r, center + circle1_r],
        fill=CYAN + (200,)
    )

    # Layer 2: Magenta rectangle (right, representing H)
    rect_width = size // 3
    rect_height = size // 2
    rect_x = center + size // 12
    draw.rectangle(
        [rect_x, center - rect_height // 2,
         rect_x + rect_width, center + rect_height // 2],
        fill=MAGENTA + (200,)
    )

    # Layer 3: Purple accent - horizontal bar (like H crossbar)
    bar_height = size // 12
    bar_y = center - bar_height // 2
    bar_x_start = center - size // 4
    bar_x_end = center + size // 3
    draw.rectangle(
        [bar_x_start, bar_y, bar_x_end, bar_y + bar_height],
        fill=PURPLE + (240,)
    )

    # Add scan line effect
    for y in range(0, size, 4):
        draw.line([(0, y), (size, y)], fill=(0, 0, 0, 40))

    # Add chromatic aberration effect
    # Split into RGB channels and offset slightly
    r, g, b, a = img.split()

    # Offset red channel
    r_offset = Image.new('L', (size, size), 0)
    r_offset.paste(r, (2, 0))

    # Offset blue channel
    b_offset = Image.new('L', (size, size), 0)
    b_offset.paste(b, (-2, 0))

    # Recombine with offset channels
    img = Image.merge('RGBA', (r_offset, g, b_offset, a))

    # Add subtle grain
    img = add_noise(img, intensity=0.03)

    # Add slight blur to soften (neon glow effect)
    img = img.filter(ImageFilter.GaussianBlur(radius=1))

    return img

def create_icon_svg(output_path):
    """Create SVG version of the icon"""
    svg_content = f'''<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Dark background -->
  <rect width="512" height="512" fill="rgb{DARK_BG}"/>

  <!-- Cyan circle (G) -->
  <circle cx="213" cy="256" r="170" fill="rgb{CYAN}" opacity="0.8" filter="url(#glow)"/>

  <!-- Magenta rectangle (H) -->
  <rect x="298" y="128" width="170" height="256" fill="rgb{MAGENTA}" opacity="0.8" filter="url(#glow)"/>

  <!-- Purple bar (H crossbar) -->
  <rect x="128" y="234" width="298" height="42" fill="rgb{PURPLE}" opacity="0.9" filter="url(#glow)"/>

  <!-- Scan lines -->
  <g opacity="0.15">
    {''.join(f'<line x1="0" y1="{y}" x2="512" y2="{y}" stroke="black" stroke-width="1"/>' for y in range(0, 512, 4))}
  </g>
</svg>'''

    with open(output_path, 'w') as f:
        f.write(svg_content)

def main():
    print("Generating Good Hang favicon suite...")
    print("Following Neon Decay design philosophy...")

    # Create base high-res version
    print("\n1. Creating base 512x512 icon...")
    base_img = create_favicon_base(512)

    # Optimize by reducing to 8-bit palette for smaller file size
    base_img_optimized = base_img.convert('P', palette=Image.ADAPTIVE, colors=256)
    base_img_optimized.save('public/icon-512.png', 'PNG', optimize=True, compress_level=9)

    # Create SVG version
    print("2. Creating icon.svg...")
    create_icon_svg('app/icon.svg')

    # Create various PNG sizes
    sizes = {
        'public/icon-192.png': 192,
        'public/icon-180.png': 180,  # Apple touch icon
        'public/apple-touch-icon.png': 180,
        'public/icon-32.png': 32,
        'public/icon-16.png': 16,
    }

    print("3. Creating sized variants...")
    for path, size in sizes.items():
        resized = base_img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(path, 'PNG', optimize=True)
        print(f"   + {path}")

    # Create ICO file with multiple sizes
    print("4. Creating favicon.ico...")
    ico_img = base_img.resize((32, 32), Image.Resampling.LANCZOS)
    ico_img.save('app/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])

    print("\n+ Favicon suite generated successfully!")
    print("\nFiles created:")
    print("  - app/icon.svg (vector)")
    print("  - app/favicon.ico (multi-size ICO)")
    print("  - public/apple-touch-icon.png (180x180)")
    print("  - public/icon-*.png (various sizes)")

if __name__ == '__main__':
    main()
