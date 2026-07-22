import { MockSocialAdapter } from "../mock-adapter";

/**
 * X (Twitter) adapter — posts/threads, interactions, analytics.
 *
 * Real implementation: X API v2.
 * Required env vars: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN,
 * X_ACCESS_TOKEN_SECRET. Docs: https://developer.x.com/en/docs
 * // TODO: connect real API here.
 */
export class XAdapter extends MockSocialAdapter {
  constructor() {
    super("X_TWITTER");
  }
}
