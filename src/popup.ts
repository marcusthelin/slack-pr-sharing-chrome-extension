export interface Settings {
  webhookUrl: string;
  username?: string;
}

class PopupManager {
  private webhookInput: HTMLInputElement;
  private usernameInput: HTMLInputElement;
  private saveButton: HTMLButtonElement;
  private shareButton: HTMLButtonElement;
  private statusDiv: HTMLDivElement;

  constructor() {
    this.webhookInput = document.getElementById('slack-webhook') as HTMLInputElement;
    this.usernameInput = document.getElementById('slack-username') as HTMLInputElement;
    this.saveButton = document.getElementById('save-settings') as HTMLButtonElement;
    this.shareButton = document.getElementById('share-pr') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;

    this.loadSettings();
    this.setupEventListeners();
  }

  private async loadSettings() {
    const settings = await chrome.storage.sync.get(['webhookUrl', 'username']) as Settings;
    if (settings.webhookUrl) this.webhookInput.value = settings.webhookUrl;
    if (settings.username) this.usernameInput.value = settings.username;
  }

  private setupEventListeners() {
    this.saveButton.addEventListener('click', () => this.saveSettings());
    this.shareButton.addEventListener('click', () => this.sharePR());
  }

  private async saveSettings() {
    const settings: Settings = {
      webhookUrl: this.webhookInput.value,
      username: this.usernameInput.value.trim()
    };

    await chrome.storage.sync.set(settings);
    this.showStatus('Settings saved!', 'success');
  }

  private async sharePR() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const settings = await chrome.storage.sync.get(['webhookUrl']) as Settings;
      if (!settings.webhookUrl) {
        throw new Error('Please save your Slack webhook URL first');
      }

      await chrome.tabs.sendMessage(tab.id, { 
        type: 'SHARE_PR',
        webhookUrl: settings.webhookUrl
      });

      this.showStatus('PR shared successfully!', 'success');
    } catch (error) {
      this.showStatus(error instanceof Error ? error.message : 'Failed to share PR', 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} p-3 rounded-md text-sm`;
    this.statusDiv.style.display = 'block';
    setTimeout(() => {
      this.statusDiv.style.display = 'none';
      this.statusDiv.className = 'hidden mt-3 p-3 rounded-md text-sm';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
