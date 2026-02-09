// Configuration for different ticketing systems
const SYSTEMS = {
  pureservice: {
    name: 'Pureservice',
    domain: 'pureservice.com',
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
  },
  hubspot: {
    name: 'HubSpot',
    domain: 'hubspot.com',
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
  }
};

// Detect which system we're on based on URL
function detectSystem(url) {
  for (const [key, system] of Object.entries(SYSTEMS)) {
    if (url.includes(system.domain)) {
      return { key, ...system };
    }
  }
  return null;
}

// Extract text from page based on system configuration
function extractText(systemConfig) {
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SYSTEMS, detectSystem, extractText };
}
