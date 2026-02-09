# Multi-System Ticket Extractor Chrome Extension

Extract ticket information from multiple ticketing systems with one click and copy to clipboard.

## Supported Systems

- **Pureservice** (`*.pureservice.com` - any subdomain)
- **HubSpot** (`*.hubspot.com` - any subdomain)

## Features

- Automatically detects which ticketing system you're using
- Extracts ticket ID, username, and subject
- Formats as: `[System]: [ticket-id] - [username] - [subject]`
- Copies formatted text to clipboard automatically
- Shows preview of extracted text
- Dynamic popup title based on current system

## Installation

1. **Create extension icons** (required before loading):
   - Create an `icons` folder in this directory
   - Add three icon files: `icon16.png`, `icon48.png`, `icon128.png`
   - You can use any simple icon or generate them online

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select this project folder

3. **Use the extension**:
   - Navigate to a ticket page on Pureservice or HubSpot
   - Click the extension icon in the toolbar
   - The popup title will show which system you're on
   - Click "Extract & Copy Text"
   - Text is automatically copied to clipboard

## Output Format

The extension outputs text in this format:
```
[System]: [ticket-id] - [username] - [subject]
```

Examples:
- `Pureservice: 12345 - John Doe - Invoice request`
- `HubSpot: 377059183860 - Jane Smith - Product feed issue`

## Adding More Systems

To add support for additional ticketing systems:

1. Edit `systems-config.js` and add a new system configuration
2. Update `manifest.json` to include the new domain in `host_permissions` and `content_scripts.matches`
3. Define the CSS selectors for ticket ID, username, and subject fields
4. Reload the extension in Chrome

## Technical Details

### Pureservice Selectors
- **Ticket ID**: `.request-number`
- **Username**: `.c-user-popover button`
- **Subject**: `.ember-text-field.subject.ember-view`

### HubSpot Selectors
- **Ticket ID**: Extracted from URL pattern `/record/[type]/[id]/`
- **Username**: `[data-test-id="email-sender"] strong`
- **Subject**: `[data-test-id="highlight-property-display-subject"]`
