# GitHub PR to Slack Sharing

A Chrome extension that allows you to share GitHub Pull Requests to Slack with a predefined template.

## Features

- Share GitHub PRs to Slack with a single click
- Customizable Slack webhook URL and channel
- Beautiful message formatting in Slack
- Includes PR title, description, author, and reviewers
- Settings are saved locally

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the extension:
   ```bash
   pnpm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. Create a Slack Incoming Webhook:
   - Go to your Slack workspace's App Directory
   - Create a new app or use an existing one
   - Enable Incoming Webhooks
   - Create a new webhook URL for your desired channel

2. Configure the extension:
   - Click the extension icon in Chrome
   - Enter your Slack webhook URL
   - Enter the target channel (e.g., #pull-requests)
   - Click "Save Settings"

3. Share a PR:
   - Navigate to any GitHub Pull Request
   - Click the extension icon
   - Click "Share PR"

## Development

To work on the extension:

1. Run the watch script:
   ```bash
   pnpm run watch
   ```
2. Make your changes in the `src` directory
3. The extension will be automatically rebuilt when files change
4. Reload the extension in Chrome to see your changes

## File Structure

- `src/manifest.json` - Extension manifest
- `src/popup.html` - Extension popup UI
- `src/popup.ts` - Popup functionality
- `src/content.ts` - Content script for extracting PR information
- `src/styles.css` - Popup styles
