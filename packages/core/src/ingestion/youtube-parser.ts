/**
 * YouTube URL and Caption Segment Parser
 */

export interface YouTubeCaptionSegment {
  text: string;
  startSec: number;
  durationSec: number;
}

/**
 * Extract standard YouTube video ID from various URL formats
 * (e.g. youtube.com/watch?v=XYZ, youtu.be/XYZ, youtube.com/embed/XYZ)
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] || null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] || null;
      }
    }
  } catch {
    // Malformed URL
  }
  return null;
}

/**
 * Format caption segments into structured text with timestamp markers for card citations
 */
export function formatCaptionsWithTimestamps(segments: YouTubeCaptionSegment[]): string {
  return segments
    .map((seg) => {
      const minutes = Math.floor(seg.startSec / 60);
      const seconds = Math.floor(seg.startSec % 60);
      const timestamp = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
      return `${timestamp} ${seg.text}`;
    })
    .join('\n');
}