import { Settings } from "./types";

export async function loadSettings() {
  const settings = await chrome.storage.sync.get<Settings>(['webhookUrl', 'memberId', 'regex']);
  if (!settings.webhookUrl) {
    throw new Error('Webhook URL is not set. Please configure it in the extension settings.');
  }
  return {
    webhookUrl: settings.webhookUrl,
    memberId: settings.memberId || '',
    regex: settings.regex || "^[a-zA-Z]{3}-[0-9]+"
  };
}
