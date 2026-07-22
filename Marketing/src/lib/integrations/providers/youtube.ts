import { MockSocialAdapter } from "../mock-adapter";

/**
 * YouTube adapter — channel uploads + channel analytics.
 *
 * Real implementation: YouTube Data API v3 (+ YouTube Analytics API).
 * Required env vars: YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID (uploads also need
 * the Google OAuth client above). Docs: https://developers.google.com/youtube
 * // TODO: connect real API here.
 */
export class YouTubeAdapter extends MockSocialAdapter {
  constructor() {
    super("YOUTUBE");
  }
}
