import { MockIntegrationProvider } from "../mock-provider";

/** WhatsApp Business adapter. Real implementation would use the WhatsApp Cloud API via WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID. */
export class WhatsAppProvider extends MockIntegrationProvider {
  constructor() {
    super("WHATSAPP_BUSINESS", "WhatsApp Business");
  }
}
