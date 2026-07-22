import { MockIntegrationProvider } from "../mock-provider";

/** GA4 adapter. Real implementation would use the Google Analytics Data API with GA4_PROPERTY_ID. */
export class GA4Provider extends MockIntegrationProvider {
  constructor() {
    super("GA4", "Google Analytics 4");
  }
}
