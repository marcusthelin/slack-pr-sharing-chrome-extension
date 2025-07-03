import { Settings } from "./popup";

interface PRInfo {
  title: string;
  url: string;
  author: string;
  description: string;
  reviewers: string[];
  repository: string;
}

class PRExtractor {
  private observer!: MutationObserver;

  constructor() {
    this.setupMessageListener();
    this.injectShareButton();
  }


  private injectShareButton() {
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

    // Create the button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'discussion-sidebar-item';
    buttonContainer.setAttribute('data-slack-share-button', 'true');

    // Create the button with GitHub's button styles
    const shareButton = document.createElement('button');
    shareButton.className = 'btn btn-sm btn-block mt-2';
    shareButton.style.backgroundColor = '#2ea44f';
    shareButton.style.color = 'white';
    shareButton.style.border = 'none';
    shareButton.textContent = 'Share to Slack';
    shareButton.addEventListener('click', () => this.handleButtonClick());

    // Add the button to the page
    buttonContainer.appendChild(shareButton);
    targetContainer.parentNode?.insertBefore(buttonContainer, targetContainer.nextSibling);
  }

  private async handleButtonClick() {
    try {
      let settings;
      try {
        settings = await chrome.storage.sync.get(['webhookUrl', 'username']) as Settings;
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

      const prInfo = this.getPRInfo();
      const message = this.formatSlackMessage(prInfo, settings.username);
      await this.sendToSlack(settings.webhookUrl, message);
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'flash flash-success mt-2';
      successMsg.textContent = 'PR shared to Slack successfully!';
      
      const button = document.querySelector('[data-slack-share-button]');
      if (button) {
        button.parentNode?.insertBefore(successMsg, button.nextSibling);
        setTimeout(() => successMsg.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to share PR:', error);
      
      // More specific error message
      const errorMessage = error instanceof Error 
        ? `Failed to share PR: ${error.message}` 
        : 'Failed to share PR. Please try reloading the page.';
      
      alert(errorMessage);
    }
  }

  private getPRInfo(): PRInfo {
    const title = document.querySelector('.js-issue-title')?.textContent?.trim() || '';
    const url = window.location.href;
    const author = document.querySelector('.author')?.textContent?.trim() || '';
    const description = document.querySelector('.comment-body')?.textContent?.trim() || '';
    
    const reviewers = Array.from(document.querySelectorAll('.js-issue-sidebar-form .participant-avatar'))
      .map(el => (el as HTMLElement).getAttribute('aria-label') || '')
      .filter(name => name && name !== author);

    const [owner, repo] = window.location.pathname.split('/').filter(Boolean).slice(0, 2);
    const repository = `${owner}/${repo}`;

    return {
      title,
      url,
      author,
      description,
      reviewers,
      repository
    };
  }

  private formatSlackMessage(prInfo: PRInfo, userId?: string) {
    if (userId) {
      return {
        text: `PR from <@${userId}>: <${prInfo.url}|${prInfo.title}>`,
      }
    }
    return {
      text: `PR: <${prInfo.url}|${prInfo.title}>`,
    };
  }

  private async sendToSlack(webhookUrl: string, message: object): Promise<void> {
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_TO_SLACK',
      webhookUrl,
      payload: message
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to send message to Slack');
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SHARE_PR') {
        this.handleButtonClick()
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Required for async response
      }
    });
  }
}

// Initialize the PR extractor when the content script loads
new PRExtractor();
