// YouTube video metadata and transcription fetcher

import { google } from "googleapis";
import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";

export interface YouTubeMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoId: string;
}

interface YouTubeOEmbedResponse {
  title?: string;
  description?: string;
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
 * Fetch YouTube video metadata
 * Uses YouTube Data API v3 if API key is provided, otherwise falls back to oEmbed API
 */
export async function fetchYouTubeMetadata(
  url: string,
  apiKey?: string
): Promise<YouTubeMetadata> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  // Use YouTube Data API v3 if API key is provided
  if (apiKey) {
    try {
      const youtube = google.youtube({
        version: "v3",
        auth: apiKey,
      });

      const response = await youtube.videos.list({
        part: ["snippet", "contentDetails"],
        id: [videoId],
      });

      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        const snippet = video.snippet;

        return {
          title: snippet?.title || "Untitled Video",
          description: snippet?.description || "",
          thumbnailUrl:
            snippet?.thumbnails?.maxres?.url ||
            snippet?.thumbnails?.high?.url ||
            `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          videoId,
        };
      }
    } catch (error) {
      console.warn("YouTube Data API error, falling back to oEmbed:", error);
      // Fall through to oEmbed API
    }
  }

  // Fallback to oEmbed API (no API key required)
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url
    )}&format=json`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube metadata: ${response.status}`);
    }

    const data = (await response.json()) as YouTubeOEmbedResponse;

    return {
      title: data.title || "Untitled Video",
      description: data.description || "",
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoId,
    };
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    throw error;
  }
}

/**
 * Fetch YouTube video transcription using youtube-transcript library
 * This library doesn't require API keys or OAuth2 authentication.
 * It works by directly accessing YouTube's transcript endpoints.
 */
export async function fetchYouTubeTranscription(
  videoId: string
): Promise<string | null> {
  console.log("Fetching YouTube transcription for video ID:", videoId);

  try {
    // Fetch transcript using youtube-transcript library
    // This automatically handles language selection (prefers English)
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en", // Prefer English, but will fallback to available language
    });

    if (!transcriptItems || transcriptItems.length === 0) {
      console.log("No captions available for this video");
      return null;
    }

    // Combine all transcript items into a single text
    // The transcript items have format: { text: string, offset: number, duration: number }
    const transcriptText = transcriptItems
      .map((item) => item.text)
      .join(" ")
      .trim();

    if (!transcriptText) {
      console.log("Transcript is empty");
      return null;
    }

    console.log(
      `Successfully fetched transcript (${transcriptItems.length} segments)`
    );
    return transcriptText;
  } catch (error: any) {
    // Handle specific error types from youtube-transcript
    if (error instanceof YoutubeTranscriptDisabledError) {
      console.log("Transcripts are disabled for this video");
    } else if (error instanceof YoutubeTranscriptNotAvailableError) {
      console.log("No transcript found for this video");
    } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      console.log("Video is unavailable or doesn't exist");
    } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      console.log(
        `Transcript not available in requested language: ${error.message}`
      );
    } else {
      console.warn(
        "Error fetching YouTube transcription:",
        error.message || error
      );
    }
    return null;
  }
}

/**
 * Get video description as fallback content
 */
export async function getVideoDescription(
  url: string,
  apiKey?: string
): Promise<string> {
  try {
    const metadata = await fetchYouTubeMetadata(url, apiKey);
    return metadata.description || "";
  } catch (error) {
    console.error("Error fetching video description:", error);
    return "";
  }
}
