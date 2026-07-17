import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Google Drive sharing URL into a direct image display URL.
 * Supports these formats:
 *   - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   - https://drive.google.com/open?id=FILE_ID
 *   - https://drive.google.com/uc?id=FILE_ID
 *   - https://lh3.googleusercontent.com/d/FILE_ID (already direct — no-op)
 * Returns the original URL if it's not a recognized Google Drive URL.
 */
export function toDirectImageUrl(url: string): string {
  if (!url) return url

  // Already a direct lh3 URL
  if (url.includes('lh3.googleusercontent.com')) return url

  // Already a direct uc?export=view URL
  if (url.includes('google.com') && url.includes('export=view')) return url

  // /file/d/FILE_ID pattern
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`
  }

  // open?id=FILE_ID pattern
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`
  }

  // /d/FILE_ID pattern (shorter form)
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (dMatch) {
    return `https://lh3.googleusercontent.com/d/${dMatch[1]}`
  }

  return url
}