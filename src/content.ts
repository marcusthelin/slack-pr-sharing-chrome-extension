import './content.css'
import  { Settings } from "./types";
import { PRInfo } from './types';
import slackLogo from './slack-new-logo.svg'
class PRExtractor {

  constructor() {
    this.setupMessageListener();
    this.injectShareButton();

    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.injectShareButton();
      } else {
        // Check if our button still exists, if not, re-inject it
        const existingButton = document.querySelector('[data-slack-share-button]');
        if (!existingButton && this.isPRPage()) {
          this.injectShareButton();
        }
      }
    }).observe(document.body, { subtree: true, childList: true })
  }

  private isPRPage(): boolean {
    return window.location.pathname.includes('/pull/');
  }


  private injectShareButton() {
    // Only inject on PR pages
    if (!this.isPRPage()) {
      return;
    }

    // Remove any existing share buttons first
    const existingButton = document.querySelector('[data-slack-share-button]');
    if (existingButton) {
      existingButton.remove();
    }

    // Find the right sidebar section where we want to add our button
    const targetContainer = document.querySelector('.discussion-sidebar-item');
    if (!targetContainer) {
      // If we can't find the container, try again in a moment
      // This helps with GitHub's dynamic loading
      setTimeout(() => this.injectShareButton(), 1000);
      return;
    }

    // Create the root container for scoped styles
    const rootContainer = document.createElement('div');
    rootContainer.id = 'slack-pr-sharing-root';

    // Create the button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'discussion-sidebar-item';
    buttonContainer.setAttribute('data-slack-share-button', 'true');

    // Create the button with GitHub's button styles combined with our scoped styles
    const shareButton = document.createElement('button');
    shareButton.className = 'btn btn-sm btn-block text-white pt-2 pb-2 d-flex gap-2';
    // shareButton.style.display = 'flex';
    // shareButton.style.width = '100%';
    // shareButton.style.alignItems = 'center';
    // shareButton.style.gap = '8px';
    shareButton.style.justifyContent = 'center';
    shareButton.innerHTML = `Share in Slack <img src="${slackLogo}" alt="Slack Logo" style="width: 16px; height: 16px;">`;
    shareButton.addEventListener('click', () => this.handleButtonClick());

    // Add the button to the root container
    buttonContainer.appendChild(shareButton);
    rootContainer.appendChild(buttonContainer);
    
    // Insert the root container into the page
    targetContainer.appendChild(rootContainer);
  }

  private async handleButtonClick() {
    try {
      let settings;
      try {
        settings = await chrome.storage.sync.get<Settings>(['webhookUrl', 'username', 'regex']);
      } catch (error) {
        // Handle extension context invalidation
        console.error('Extension context error:', error);
        // Reload the extension context
        window.location.reload();
        return;
      }
      
      if (!settings.webhookUrl) {
        alert('Please configure your Slack webhook URL first by clicking the extension icon.');
        return;
      }

      const prInfo = this.getPRTitle();
      const message = this.formatSlackMessage(prInfo, settings);
      await this.sendToSlack(settings.webhookUrl, message);
      
      this.reportStatus('PR shared in Slack successfully!');
    } catch (error) {
      console.error('Failed to share PR:', error);
      
      // More specific error message
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Unknown error. Please try reloading the page.';
      
      this.reportStatus(errorMessage, true);
    }
  }

  private getPRTitle(): PRInfo {
    const title = document.querySelector('.js-issue-title')?.textContent?.trim() || '';
    const url = window.location.href;

    return {
      title,
      url,
    };
  }

  private getRepositoryName(): string {
    // Extract repository name from GitHub URL
    // URL format: https://github.com/owner/repo/pull/123
    const pathname = window.location.pathname;
    const parts = pathname.split('/');
    
    if (parts.length >= 3) {
      // parts[1] is owner, parts[2] is repo name
      return parts[2];
    }
    
    return '';
  }

  private formatSlackMessage(prInfo: PRInfo, settings: Settings) {
    const repoName = this.getRepositoryName();
    const prefix = repoName ? `${repoName} - ` : '';
    
    if (settings.regex) {
      const regex = new RegExp(settings.regex);
      prInfo.title = prInfo.title.replace(regex, "")
    }
    
    if (settings.username) {
      return {
        text: `PR from <@${settings.username}>: <${prInfo.url}|${prefix}${prInfo.title}>`,
      }
    }
    return {
      text: `PR: <${prInfo.url}|${prefix}${prInfo.title}>`,
      unfurl_links: false
    };
  }

  private async sendToSlack(webhookUrl: string, message: object): Promise<void> {
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_TO_SLACK',
      webhookUrl,
      payload: message
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to send message to Slack');
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === 'SHARE_PR') {
        this.handleButtonClick()
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Required for async response
      }
    });
  }

  private reportStatus(message: string, isError = false) {
    const existingStatus = document.querySelector('[data-slack-status]');
    if (existingStatus) {
      existingStatus.remove();
    }

    const statusMsg = document.createElement('div');
    statusMsg.className = `flash ${isError ? 'flash-error' : 'flash-success'} mt-2 text-center text-sm`;
    statusMsg.setAttribute('data-slack-status', 'true');
    statusMsg.textContent = message;
    
    const button = document.querySelector('[data-slack-share-button]');
    if (button) {
      button.parentNode?.insertBefore(statusMsg, button.nextSibling);
      if (!isError) {
        setTimeout(() => statusMsg.remove(), 7000);
      }
    }
  }
}

// Initialize the PR extractor when the content script loads
new PRExtractor();
