#!/usr/bin/env python3
"""
Generate social sharing images for Good Hang following Neon Decay design philosophy
Creates 1200x630px images for OpenGraph and Twitter
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import os

# Good Hang brand colors
DARK_BG = (10, 10, 15)
CYAN = (0, 204, 221)
MAGENTA = (187, 0, 170)
PURPLE = (119, 0, 204)

def add_noise(img, intensity=0.03):
    """Add VHS-style grain"""
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, intensity * 255, arr.shape)
    arr = np.clip(arr + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def add_scanlines(draw, width, height, spacing=3, opacity=30):
    """Add CRT scanline effect"""
    for y in range(0, height, spacing):
        draw.line([(0, y), (width, y)], fill=(0, 0, 0, opacity))

def add_chromatic_aberration(img, offset=3):
    """Add chromatic aberration effect"""
    r, g, b, a = img.split()

    # Offset red channel right
    r_offset = Image.new('L', img.size, 0)
    r_offset.paste(r, (offset, 0))

    # Offset blue channel left
    b_offset = Image.new('L', img.size, 0)
    b_offset.paste(b, (-offset, 0))

    return Image.merge('RGBA', (r_offset, g, b_offset, a))

def create_social_image(width=1200, height=630):
    """Create social sharing image with tech-noir aesthetic"""

    # Create base image
    img = Image.new('RGBA', (width, height), DARK_BG + (255,))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Geometric background elements
    # Large purple rectangle (left side)
    draw.rectangle(
        [0, 0, width // 3, height],
        fill=PURPLE + (100,)
    )

    # Cyan accent bar (top)
    draw.rectangle(
        [0, 0, width, 8],
        fill=CYAN + (255,)
    )

    # Magenta accent bar (bottom)
    draw.rectangle(
        [0, height - 8, width, height],
        fill=MAGENTA + (255,)
    )

    # Diagonal cyan stripe
    points = [
        (width // 3, 0),
        (width // 3 + 80, 0),
        (width // 2 + 80, height),
        (width // 2, height)
    ]
    draw.polygon(points, fill=CYAN + (80,))

    # Geometric shapes overlay
    # Circle
    circle_x = width // 4
    circle_y = height // 2
    circle_r = 120
    draw.ellipse(
        [circle_x - circle_r, circle_y - circle_r,
         circle_x + circle_r, circle_y + circle_r],
        fill=None,
        outline=MAGENTA + (200,),
        width=4
    )

    # Rectangle outline
    rect_x = width - 300
    rect_y = height // 2 - 100
    draw.rectangle(
        [rect_x, rect_y, rect_x + 200, rect_y + 200],
        fill=None,
        outline=CYAN + (200,),
        width=3
    )

    # Add glitch bars (horizontal displacement)
    glitch_positions = [150, 280, 420, 520]
    for y_pos in glitch_positions:
        glitch_height = np.random.randint(5, 15)
        x_offset = np.random.randint(-10, 10)
        draw.rectangle(
            [width // 2 + x_offset, y_pos, width - 50 + x_offset, y_pos + glitch_height],
            fill=MAGENTA + (120,)
        )

    # Try to load and add text
    try:
        # Try to find a suitable monospace font
        font_paths = [
            "C:\\Windows\\Fonts\\consola.ttf",  # Consolas
            "C:\\Windows\\Fonts\\cour.ttf",     # Courier New
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",  # Linux
            "/System/Library/Fonts/Monaco.dfont",  # macOS
        ]

        title_font = None
        subtitle_font = None

        for font_path in font_paths:
            if os.path.exists(font_path):
                title_font = ImageFont.truetype(font_path, 80)
                subtitle_font = ImageFont.truetype(font_path, 32)
                tagline_font = ImageFont.truetype(font_path, 24)
                break

        if not title_font:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            tagline_font = ImageFont.load_default()

        # Main text
        text_x = width // 2 + 50

        # Title "GOOD HANG"
        title_y = height // 2 - 80
        draw.text((text_x, title_y), "GOOD HANG", fill=CYAN + (255,), font=title_font)

        # Subtitle
        subtitle_y = title_y + 100
        draw.text((text_x, subtitle_y), "TECH NOIR", fill=MAGENTA + (255,), font=subtitle_font)
        draw.text((text_x, subtitle_y + 45), "SOCIAL CLUB", fill=MAGENTA + (255,), font=subtitle_font)

        # Tagline
        tagline_y = subtitle_y + 120
        draw.text((text_x, tagline_y), "RALEIGH, NC", fill=PURPLE + (255,), font=tagline_font)

    except Exception as e:
        print(f"Font loading note: {e}")
        print("Using default font")

    # Add scanlines
    add_scanlines(draw, width, height, spacing=3, opacity=25)

    # Add VHS grain
    img = add_noise(img, intensity=0.04)

    # Add chromatic aberration
    img = add_chromatic_aberration(img, offset=2)

    # Subtle blur for glow effect
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    return img

def main():
    print("Generating Good Hang social sharing images...")
    print("Following Neon Decay design philosophy...")

    # Create the social image
    print("\n1. Creating base social image (1200x630)...")
    social_img = create_social_image(1200, 630)

    # Convert to RGB for JPEG (better compression for photos)
    social_img_rgb = social_img.convert('RGB')

    # Save for OpenGraph with JPEG compression
    print("2. Saving app/opengraph-image.jpg...")
    social_img_rgb.save('app/opengraph-image.jpg', 'JPEG', quality=85, optimize=True)

    # Also save PNG version (optimized)
    print("   Also saving PNG version...")
    social_img.save('app/opengraph-image.png', 'PNG', optimize=True, compress_level=9)

    # Save for Twitter (same image, JPEG)
    print("3. Saving app/twitter-image.jpg...")
    social_img_rgb.save('app/twitter-image.jpg', 'JPEG', quality=85, optimize=True)

    # Also save PNG version
    print("   Also saving PNG version...")
    social_img.save('app/twitter-image.png', 'PNG', optimize=True, compress_level=9)

    print("\n+ Social sharing images generated successfully!")
    print("\nFiles created:")
    print("  - app/opengraph-image.png (1200x630)")
    print("  - app/twitter-image.png (1200x630)")
    print("\nThese images feature:")
    print("  - Tech-noir aesthetic with neon colors")
    print("  - VHS grain and scanline effects")
    print("  - Chromatic aberration")
    print("  - Good Hang branding")

if __name__ == '__main__':
    main()
