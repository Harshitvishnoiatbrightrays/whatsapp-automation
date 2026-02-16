# Assets Guide

Place your image files in this `public` folder. The following files are expected:

## Required Files

### 1. Logo Files
- **`logo.svg`** - Main logo for the left panel (login form)
  - Recommended size: 40px height (width will scale automatically)
  - Format: SVG (preferred) or PNG with transparent background
  - Color: Should work on white background (purple/dark colors recommended)

- **`logo-white.svg`** - Logo for the right panel (promotional section)
  - Recommended size: 40px height (width will scale automatically)
  - Format: SVG (preferred) or PNG with transparent background
  - Color: Should work on dark background (white/light colors recommended)

### 2. Background Image
- **`login-bg.jpg`** - Background image for the right promotional panel
  - Recommended size: 1920x1080px or larger
  - Format: JPG or PNG
  - The image will be covered with a dark overlay, so choose an image that works well with dark overlays
  - The image will be cropped to fit, so ensure important content is centered

### 3. Favicon
- **`favicon.ico`** - Browser tab icon
  - Place in the `public` folder
  - The `index.html` already references `/favicon.ico`

## Alternative File Names

If you prefer different file names, you can update the references in:
- `src/pages/Login.tsx` - Change the `src` attributes for logo images
- `src/pages/Login.css` - Change the `background-image` URL for the background

## File Structure

```
public/
├── logo.svg          (left panel logo)
├── logo-white.svg    (right panel logo)
├── login-bg.jpg      (right panel background)
└── favicon.ico       (browser favicon)
```

## Notes

- All files in the `public` folder are served from the root URL (`/`)
- For example, `public/logo.svg` is accessible as `/logo.svg`
- The code includes fallback placeholders if images are not found
- SVG format is recommended for logos as they scale perfectly at any size
