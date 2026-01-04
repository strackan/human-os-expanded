#!/usr/bin/env python3
"""
Aggressively optimize remaining large images
"""

from PIL import Image
import os

def get_file_size(filepath):
    """Get file size in bytes"""
    return os.path.getsize(filepath)

def format_size(size_bytes):
    """Format bytes to KB"""
    return f"{size_bytes / 1024:.1f}KB"

def aggressive_optimize(input_path, target_size_kb=100):
    """Aggressively optimize an image"""
    original_size = get_file_size(input_path)
    print(f"\n[>] {input_path}")
    print(f"  Original: {format_size(original_size)}")

    img = Image.open(input_path)

    # Get extension
    ext = os.path.splitext(input_path)[1].lower()

    # Try progressively smaller sizes and lower quality
    scales = [0.85, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5]
    qualities = [70, 65, 60, 55, 50]

    for scale in scales:
        new_width = int(img.width * scale)
        new_height = int(img.height * scale)
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        for quality in qualities:
            # Try saving with current settings
            if ext in ['.webp']:
                resized.save(input_path, 'WEBP', quality=quality, method=6)
            elif ext in ['.jpg', '.jpeg']:
                resized.save(input_path, 'JPEG', quality=quality, optimize=True)
            elif ext == '.png':
                # Convert PNG to JPEG for better compression
                if resized.mode == 'RGBA':
                    rgb_img = Image.new('RGB', resized.size, (0, 0, 0))
                    rgb_img.paste(resized)
                    resized = rgb_img
                jpeg_path = input_path.replace('.png', '.jpg')
                resized.save(jpeg_path, 'JPEG', quality=quality, optimize=True)
                new_size = get_file_size(jpeg_path)
                if new_size <= target_size_kb * 1024:
                    if os.path.exists(input_path):
                        os.remove(input_path)
                    print(f"  [+] Converted to JPEG: {format_size(original_size)} -> {format_size(new_size)} ({new_width}x{new_height}, q={quality})")
                    return True
                continue

            new_size = get_file_size(input_path)
            if new_size <= target_size_kb * 1024:
                print(f"  [+] Optimized: {format_size(original_size)} -> {format_size(new_size)} ({new_width}x{new_height}, q={quality})")
                return True

    final_size = get_file_size(input_path)
    print(f"  [!] Best effort: {format_size(original_size)} -> {format_size(final_size)}")
    return False

def main():
    print("Aggressive Image Optimization")
    print("=" * 50)

    # Problem images from first run
    problem_images = [
        'public/glitch-images/social/OldFashioned_HERO_020520_619.webp',
        'public/glitch-images/social/1950s-cocktail-suggestions.jpg',
        'public/glitch-images/tech/glitch-texture-pixel-noise-test-tv-screen-digital-vhs-background-error-computer-video-abstract-black-damage-magic-poster-R6DBXF.jpg',
        'public/glitch-images/tech/The_80s_Tron_Still_Shift.jpeg',
        'public/icon-512.png',
    ]

    for image_path in problem_images:
        full_path = os.path.join(os.getcwd(), image_path)
        if os.path.exists(full_path):
            aggressive_optimize(full_path, 100)
        else:
            print(f"[X] Not found: {image_path}")

    print("\n" + "=" * 50)
    print("[+] Aggressive optimization complete!")

if __name__ == '__main__':
    main()
