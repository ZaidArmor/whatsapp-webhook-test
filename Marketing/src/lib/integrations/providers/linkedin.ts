import { MockSocialAdapter } from "../mock-adapter";

/**
 * LinkedIn adapter — organization page publishing + B2B analytics.
 *
 * Real implementation: LinkedIn Marketing Developer Platform.
 * Required env vars: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET,
 * LINKEDIN_ORGANIZATION_ID. Docs: https://developer.linkedin.com
 * // TODO: connect real API here.
 */
export class LinkedInAdapter extends MockSocialAdapter {
  constructor() {
    super("LINKEDIN");
  }
}
