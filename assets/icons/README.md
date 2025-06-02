# Icon Generation

The icons in this directory are used for the Progressive Web App (PWA) functionality. The SVG source file is provided, and you'll need to generate PNG versions in the following sizes as specified in the manifest:

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

You can use tools like Inkscape, GIMP, or online SVG-to-PNG converters to create these files.

For convenience, you can also use the following command if you have ImageMagick installed:

```bash
# Example for converting the SVG to a 144x144 PNG
magick convert icon-144x144.svg -resize 144x144 icon-144x144.png
```

## Favicon

For browser compatibility, it's also recommended to create a favicon.ico file in the root directory:

```bash
# Create a multi-resolution favicon
magick convert icon-144x144.svg -resize 16x16 favicon-16.png
magick convert icon-144x144.svg -resize 32x32 favicon-32.png
magick convert icon-144x144.svg -resize 48x48 favicon-48.png
magick convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
```

Then move the favicon.ico file to the project root.
