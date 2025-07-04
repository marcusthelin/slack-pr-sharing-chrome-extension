/// <reference types="chrome" />

// Listen for messages from content script
chrome.runtime.onMessage.addListener((
  message: { type: string; webhookUrl: string; payload: object },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: { success: boolean; error?: string }) => void
) => {
  if (message.type === 'SEND_TO_SLACK') {
    sendToSlack(message.webhookUrl, message.payload)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

async function sendToSlack(webhookUrl: string, message: object): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} - ${await response.text()}`);
  }
}
