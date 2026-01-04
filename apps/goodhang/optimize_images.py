#!/usr/bin/env python3
"""
Optimize large images in the Good Hang project to meet <100KB guideline
"""

from PIL import Image
import os
import shutil

# Target size in bytes (100KB = 100 * 1024 bytes)
TARGET_SIZE = 100 * 1024

def get_file_size(filepath):
    """Get file size in bytes"""
    return os.path.getsize(filepath)

def format_size(size_bytes):
    """Format bytes to KB"""
    return f"{size_bytes / 1024:.1f}KB"

def optimize_image(input_path, target_size_kb=100):
    """
    Optimize an image to be under target size
    Returns True if optimization was needed, False if already under target
    """
    original_size = get_file_size(input_path)

    if original_size <= target_size_kb * 1024:
        print(f"  [OK] Already optimized: {format_size(original_size)}")
        return False

    # Backup original
    backup_path = input_path + '.backup'
    if not os.path.exists(backup_path):
        shutil.copy2(input_path, backup_path)

    # Open image
    img = Image.open(input_path)

    # Convert RGBA to RGB if saving as JPEG
    if img.mode == 'RGBA':
        # Check if image actually uses transparency
        if input_path.lower().endswith(('.jpg', '.jpeg')):
            # Convert RGBA to RGB for JPEG
            rgb_img = Image.new('RGB', img.size, (0, 0, 0))
            rgb_img.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
            img = rgb_img

    # Get file extension
    ext = os.path.splitext(input_path)[1].lower()

    # Optimize based on file type
    if ext in ['.jpg', '.jpeg']:
        # Try different quality levels
        for quality in [85, 80, 75, 70, 65, 60]:
            img.save(input_path, 'JPEG', quality=quality, optimize=True)
            new_size = get_file_size(input_path)

            if new_size <= target_size_kb * 1024:
                print(f"  [+] Optimized: {format_size(original_size)} -> {format_size(new_size)} (quality={quality})")
                return True

        # If still too large, resize
        scale = 0.9
        while get_file_size(input_path) > target_size_kb * 1024 and scale > 0.5:
            new_width = int(img.width * scale)
            new_height = int(img.height * scale)
            resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            resized.save(input_path, 'JPEG', quality=75, optimize=True)
            new_size = get_file_size(input_path)
            print(f"  [+] Resized and optimized: {format_size(original_size)} -> {format_size(new_size)} ({new_width}x{new_height})")
            return True

    elif ext == '.png':
        # For PNG, try saving with optimization
        img.save(input_path, 'PNG', optimize=True, compress_level=9)
        new_size = get_file_size(input_path)

        if new_size <= target_size_kb * 1024:
            print(f"  [+] Optimized: {format_size(original_size)} -> {format_size(new_size)}")
            return True

        # If still too large, convert to JPEG if no transparency
        if img.mode != 'RGBA' or not img.getchannel('A').getextrema()[0] < 255:
            jpeg_path = input_path.replace('.png', '.jpg')
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (0, 0, 0))
                rgb_img.paste(img)
                img = rgb_img

            img.save(jpeg_path, 'JPEG', quality=85, optimize=True)
            jpeg_size = get_file_size(jpeg_path)

            if jpeg_size < original_size:
                os.remove(input_path)
                print(f"  [+] Converted to JPEG: {format_size(original_size)} -> {format_size(jpeg_size)}")
                return True

    elif ext == '.webp':
        # Try different quality levels for WebP
        for quality in [85, 80, 75, 70]:
            img.save(input_path, 'WEBP', quality=quality, method=6)
            new_size = get_file_size(input_path)

            if new_size <= target_size_kb * 1024:
                print(f"  [+] Optimized: {format_size(original_size)} -> {format_size(new_size)} (quality={quality})")
                return True

    elif ext == '.avif':
        print(f"  [i] AVIF already optimized at {format_size(original_size)}")
        return False

    print(f"  [!] Could not optimize below {target_size_kb}KB: {format_size(get_file_size(input_path))}")
    return True

def main():
    print("Good Hang Image Optimization")
    print("=" * 50)
    print(f"Target: <100KB per image\n")

    # Images to optimize (from audit)
    images_to_optimize = [
        # Social images (critical)
        ('public/glitch-images/social/OldFashioned_HERO_020520_619.webp', 100),
        ('public/glitch-images/social/prohibitionbooze.jpg', 100),
        ('public/glitch-images/social/1950s-cocktail-suggestions.jpg', 100),

        # Tech images (high priority)
        ('public/glitch-images/tech/glitch-texture-pixel-noise-test-tv-screen-digital-vhs-background-error-computer-video-abstract-black-damage-magic-poster-R6DBXF.jpg', 100),
        ('public/glitch-images/tech/The_80s_Tron_Still_Shift.jpeg', 100),

        # Macabre images (medium priority)
        ('public/glitch-images/macabre/maxresdefault.jpg', 100),
        ('public/glitch-images/macabre/macabre3.jpg', 100),

        # Icon optimization
        ('public/icon-512.png', 100),
    ]

    optimized_count = 0
    skipped_count = 0

    for image_path, target_kb in images_to_optimize:
        full_path = os.path.join(os.getcwd(), image_path)

        if not os.path.exists(full_path):
            print(f"[X] Not found: {image_path}")
            continue

        print(f"\n[>] {image_path}")
        original_size = get_file_size(full_path)
        print(f"  Original: {format_size(original_size)}")

        if optimize_image(full_path, target_kb):
            optimized_count += 1
        else:
            skipped_count += 1

    print("\n" + "=" * 50)
    print(f"[+] Complete!")
    print(f"  Optimized: {optimized_count} images")
    print(f"  Skipped: {skipped_count} images (already optimized)")
    print(f"\n[*] Backup files saved with .backup extension")
    print(f"   To restore: remove .backup extension")

if __name__ == '__main__':
    main()
