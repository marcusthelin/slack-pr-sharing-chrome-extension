import './popup.css'
import { Settings } from './types';

class PopupManager {
  private webhookInput: HTMLInputElement;
  private usernameInput: HTMLInputElement;
  private regexInput: HTMLInputElement;
  private saveButton: HTMLButtonElement;
  private statusDiv: HTMLDivElement;

  constructor() {
    this.webhookInput = document.getElementById('slack-webhook') as HTMLInputElement;
    this.usernameInput = document.getElementById('slack-username') as HTMLInputElement;
    this.regexInput = document.getElementById('regex') as HTMLInputElement;
    this.saveButton = document.getElementById('save-settings') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;

    this.loadSettings();
    this.setupEventListeners();
  }

  private async loadSettings() {
    try {
      // Load settings directly from storage for the popup, not using the runtime loadSettings
      // which throws an error if webhook URL is not set
      const settings = await chrome.storage.sync.get(['webhookUrl', 'username', 'regex']);
      this.webhookInput.value = settings.webhookUrl || '';
      this.usernameInput.value = settings.username || '';
      this.regexInput.value = settings.regex || '^[a-zA-Z]{3}-[0-9]+';
    } catch (error) {
      // Set default values if loading fails
      this.webhookInput.value = '';
      this.usernameInput.value = '';
      this.regexInput.value = '^[a-zA-Z]{3}-[0-9]+';
    }
  }

  private setupEventListeners() {
    this.saveButton.addEventListener('click', () => this.saveSettings());
  }

  private async saveSettings() {
    const settings: Settings = {
      webhookUrl: this.webhookInput.value,
      username: this.usernameInput.value.trim(),
      regex: this.regexInput.value.trim()
    };

    await chrome.storage.sync.set(settings);
    this.showStatus('Settings saved!', 'success');
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
