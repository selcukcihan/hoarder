// YouTube video metadata and transcription fetcher

export interface YouTubeMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoId: string;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch YouTube video metadata using oEmbed API (no API key required)
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Use oEmbed API for basic metadata (no API key needed)
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube metadata: ${response.status}`);
    }

    const data = await response.json();

    return {
      title: data.title || 'Untitled Video',
      description: data.description || '',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoId,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    throw error;
  }
}

/**
 * Fetch YouTube video transcription
 * Note: This is a simplified implementation. For production, you may want to:
 * 1. Use YouTube Data API v3 with transcripts endpoint (requires API key)
 * 2. Use a third-party service
 * 3. Fall back to video description if transcription unavailable
 */
export async function fetchYouTubeTranscription(
  videoId: string,
  apiKey?: string
): Promise<string | null> {
  // Option 1: Try YouTube Data API v3 (if API key provided)
  if (apiKey) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${apiKey}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        const captions = data.items;

        // Find English caption track
        const englishCaption = captions.find(
          (caption: any) => caption.snippet.language === 'en'
        );

        if (englishCaption) {
          // Download the actual transcript
          // Note: This requires additional API call to download the transcript
          // For now, we'll return null and use description as fallback
          // You would need to implement the download endpoint call here
          return null; // Placeholder - implement full transcript download
        }
      }
    } catch (error) {
      console.warn('YouTube Data API error, falling back to description:', error);
    }
  }

  // Option 2: Fallback - return null (will use description in main flow)
  return null;
}

/**
 * Get video description as fallback content
 */
export async function getVideoDescription(url: string): Promise<string> {
  try {
    const metadata = await fetchYouTubeMetadata(url);
    return metadata.description || '';
  } catch (error) {
    console.error('Error fetching video description:', error);
    return '';
  }
}

