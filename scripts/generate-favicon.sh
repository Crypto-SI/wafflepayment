#!/bin/bash

# This script converts the wafflelogo.webp to various favicon formats
# Requires ImageMagick to be installed

# Create favicon directory if it doesn't exist
mkdir -p public/favicon

# Convert webp to png in various sizes
convert public/images/wafflelogo.webp -resize 16x16 public/favicon/favicon-16x16.png
convert public/images/wafflelogo.webp -resize 32x32 public/favicon/favicon-32x32.png
convert public/images/wafflelogo.webp -resize 48x48 public/favicon/favicon-48x48.png
convert public/images/wafflelogo.webp -resize 192x192 public/favicon/android-chrome-192x192.png
convert public/images/wafflelogo.webp -resize 512x512 public/favicon/android-chrome-512x512.png
convert public/images/wafflelogo.webp -resize 180x180 public/favicon/apple-touch-icon.png

# Create favicon.ico (multi-size)
convert public/favicon/favicon-16x16.png public/favicon/favicon-32x32.png public/favicon/favicon-48x48.png public/favicon/favicon.ico

# Copy to root directory for default favicon
cp public/favicon/favicon.ico public/favicon.ico

echo "Favicon generation complete!"