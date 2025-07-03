import { Settings } from "./types";

export async function loadSettings() {
  const settings = await chrome.storage.sync.get<Settings>(['webhookUrl', 'username', 'regex']);
  if (!settings.webhookUrl) {
    throw new Error('Webhook URL is not set. Please configure it in the extension settings.');
  }
  return {
    webhookUrl: settings.webhookUrl,
    username: settings.username || '',
    regex: settings.regex || "^[a-zA-Z]{3}-[0-9]+"
  };
}
