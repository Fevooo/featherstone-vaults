import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/**
 * One-off site photography that does not belong to a content collection:
 * the premises shot on /about, and anything similar added later.
 *
 * Drop a file into src/assets/ and it is picked up by name at build time.
 * Nothing breaks while the directory is empty, which is how it ships.
 *
 *   src/assets/cotswolds.jpg  ->  siteImage('cotswolds')
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

export function siteImage(name: string): ImageMetadata | undefined {
  const match = Object.keys(files).find((path) => {
    const base = path.split('/').pop() ?? '';
    return base.slice(0, base.lastIndexOf('.')).toLowerCase() === name.toLowerCase();
  });
  return match ? files[match].default : undefined;
}

/**
 * Renders a 1200x630 social card from a supplied photograph. Returns undefined
 * when there is no photograph, so the caller falls back to the brand card.
 */
export async function ogImageFrom(src?: ImageMetadata): Promise<string | undefined> {
  if (!src) return undefined;
  const card = await getImage({
    src,
    width: 1200,
    height: 630,
    fit: 'cover',
    position: 'center',
    format: 'jpeg',
    quality: 82,
  });
  return card.src;
}
