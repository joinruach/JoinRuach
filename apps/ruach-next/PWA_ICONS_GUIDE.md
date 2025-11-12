# PWA Icon Generation Guide

This guide explains how to generate all required PWA icons for the Ruach Ministries app.

## Required Icons

- `icon-192.png` - 192x192px standard icon
- `icon-512.png` - 512x512px standard icon
- `icon-maskable-192.png` - 192x192px maskable icon (with safe zone)
- `icon-maskable-512.png` - 512x512px maskable icon (with safe zone)
- `apple-touch-icon.png` - 180x180px Apple touch icon
- `screenshot-wide.png` - 1920x1080px wide screenshot
- `screenshot-narrow.png` - 1080x1920px narrow (mobile) screenshot

## Option 1: Use PWA Asset Generator (Recommended)

Install the PWA Asset Generator globally:

\`\`\`bash
npm install -g pwa-asset-generator
\`\`\`

Generate all icons from a single source image:

\`\`\`bash
pwa-asset-generator logo.png public/ --manifest public/manifest.json --index public/index.html
\`\`\`

## Option 2: Use Online Tool

Visit [PWA Manifest Generator](https://www.simicart.com/manifest-generator.html/) and upload your logo to automatically generate all required icons.

## Option 3: Manual Generation with ImageMagick

If you have ImageMagick installed:

\`\`\`bash
# Standard icons
convert logo.png -resize 192x192 public/icon-192.png
convert logo.png -resize 512x512 public/icon-512.png

# Maskable icons (add 20% safe zone padding)
convert logo.png -resize 154x154 -background "#fbbf24" -gravity center -extent 192x192 public/icon-maskable-192.png
convert logo.png -resize 410x410 -background "#fbbf24" -gravity center -extent 512x512 public/icon-maskable-512.png

# Apple touch icon
convert logo.png -resize 180x180 public/apple-touch-icon.png
\`\`\`

## Icon Design Guidelines

### Standard Icons
- Use a simple, recognizable logo
- Ensure good contrast against both light and dark backgrounds
- Avoid text that's too small to read at 192px

### Maskable Icons
- Keep important content within the center 80% of the canvas
- The outer 20% may be cropped on different devices
- Use a solid background color matching your theme color (#fbbf24)

### Screenshots
- Capture representative screens from the app
- Show key features and functionality
- Use high-quality, crisp images
- Wide screenshot: Desktop or tablet view
- Narrow screenshot: Mobile phone view

## Temporary Placeholders

If you don't have icons ready yet, you can use solid color placeholders:

\`\`\`bash
# Create solid color placeholders
convert -size 192x192 xc:"#fbbf24" public/icon-192.png
convert -size 512x512 xc:"#fbbf24" public/icon-512.png
convert -size 192x192 xc:"#fbbf24" public/icon-maskable-192.png
convert -size 512x512 xc:"#fbbf24" public/icon-maskable-512.png
convert -size 180x180 xc:"#fbbf24" public/apple-touch-icon.png
convert -size 1920x1080 xc:"#0a0a0a" public/screenshot-wide.png
convert -size 1080x1920 xc:"#0a0a0a" public/screenshot-narrow.png
\`\`\`

## Testing Icons

After generating icons:

1. Build the app: `pnpm build`
2. Serve the production build: `pnpm start`
3. Open Chrome DevTools → Application tab → Manifest
4. Verify all icons load correctly
5. Test installation on mobile device

## Updating Manifest

If you change icon names or sizes, update `public/manifest.json` accordingly.
