# Ticket Extractor

Chrome extension that extracts ticket information from support systems and copies it to clipboard.

## Supported Systems

- **Pureservice** - Ticket record view
- **HubSpot** - Ticket record view and Helpdesk Conversations

## Output Format

```
[System]: [ticket-id] - [contact-name] - [subject]

[ticket-url]
```

Example:

```
HubSpot: 377059183 - Jane Smith - Product feed issue

https://app-eu1.hubspot.com/contacts/6252589/record/0-5/377059183
```

The URL is the tab's address at the moment of extraction, so it works for Pureservice, HubSpot ticket records and HubSpot Helpdesk alike.

## Installation

### From Chrome Web Store
Search for "Ticket Extractor" in the [Chrome Web Store](https://chrome.google.com/webstore) and click Install.

### Manual (Developer Mode)
1. Download or clone this repository
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this folder

## Usage

1. Navigate to a ticket in Pureservice or HubSpot
2. Click the extension icon
3. Click "Extract & Copy Text"
4. Formatted text is copied to clipboard

## How It Works

The extension uses `chrome.scripting.executeScript` to inject a function into the active tab. It detects the system from the URL, waits for DOM elements to render (using MutationObserver), and extracts ticket ID, contact name and subject using system-specific selectors.

### HubSpot Views

HubSpot has two distinct views with different DOM structures:

- **Ticket record** (`/record/...`) - Contact name from sidebar chicklet, subject from property panel, ticket ID from URL
- **Helpdesk Conversations** (`/help-desk/...`) - All fields from the header bar, ticket ID from URL

## Adding Systems

To add support for a new ticketing system:
1. Add an entry to the `SYSTEMS` object in `popup.js` with selectors and extractor functions
2. Add the domain to `SUPPORTED_DOMAINS`
3. Update `detectSystem()` and `getSystemLabel()`
4. Add the domain to `host_permissions` in `manifest.json`

## Author

Created by Morten Mouritzen
