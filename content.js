// Content script for Multi-System Ticket Extractor
// This runs on every supported ticketing system page

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    const currentUrl = window.location.href;
    const extractedText = extractTextFromPage(currentUrl);
    sendResponse({ text: extractedText });
  }
});

function extractTextFromPage(currentUrl) {
  // Detect which system we're on
  let systemConfig = null;

  if (currentUrl.includes('pureservice.com')) {
    systemConfig = {
      name: 'Pureservice',
      selectors: {
        ticketId: '.request-number',
        username: '.c-user-popover button',
        subject: '.ember-text-field.subject.ember-view'
      },
      extractors: {
        ticketId: (selector) => {
          const el = document.querySelector(selector);
          return el?.textContent?.trim() || '';
        },
        username: (el) => el?.textContent?.trim() || '',
        subject: (el) => (el?.value || el?.textContent || '').trim()
      }
    };
  } else if (currentUrl.includes('hubspot.com')) {
    systemConfig = {
      name: 'HubSpot',
      selectors: {
        ticketId: null, // Not needed - we extract from URL
        username: '[data-test-id="email-sender"] strong',
        subject: '[data-test-id="highlight-property-display-subject"]'
      },
      extractors: {
        ticketId: () => {
          // Extract ticket ID from URL
          // URL format: https://app-eu1.hubspot.com/contacts/6252589/record/0-5/377059183860/
          const url = window.location.href;
          const match = url.match(/\/record\/[^\/]+\/(\d+)/);
          if (match && match[1]) {
            return match[1];
          }
          return '';
        },
        username: (el) => el?.textContent?.trim() || '',
        subject: (el) => el?.textContent?.trim() || ''
      }
    };
  }

  if (!systemConfig) {
    return 'Error: Unknown ticketing system';
  }

  const { name, selectors, extractors } = systemConfig;

  // Extract ticket ID (may use selector or URL depending on system)
  const ticketId = selectors.ticketId
    ? extractors.ticketId(selectors.ticketId)
    : extractors.ticketId();

  const usernameEl = document.querySelector(selectors.username);
  const subjectEl = document.querySelector(selectors.subject);

  const username = extractors.username(usernameEl);
  const subject = extractors.subject(subjectEl);

  return `${name}: ${ticketId} - ${username} - ${subject}`;
}
