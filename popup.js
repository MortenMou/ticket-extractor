document.getElementById('extractBtn').addEventListener('click', async () => {
  const button = document.getElementById('extractBtn');
  const statusDiv = document.getElementById('status');
  const previewDiv = document.getElementById('preview');
  const titleEl = document.getElementById('systemTitle');

  button.disabled = true;
  statusDiv.className = '';
  statusDiv.style.display = 'none';
  previewDiv.className = '';
  previewDiv.textContent = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if we're on a supported system
    const supportedDomains = ['pureservice.com', 'hubspot.com'];
    const isSupported = supportedDomains.some(domain => tab.url.includes(domain));

    if (!isSupported) {
      throw new Error('Please navigate to a supported ticketing system (Pureservice or HubSpot)');
    }

    // Update title based on current system
    if (tab.url.includes('pureservice.com')) {
      titleEl.textContent = 'Pureservice Extractor';
    } else if (tab.url.includes('hubspot.com')) {
      titleEl.textContent = 'HubSpot Extractor';
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractTextFromPage,
      args: [tab.url]
    });

    const extractedText = results[0].result;

    if (!extractedText || extractedText.trim() === '' || extractedText.startsWith('Error:')) {
      throw new Error(extractedText || 'No text found. Make sure the page has loaded completely.');
    }

    await navigator.clipboard.writeText(extractedText);

    statusDiv.textContent = '✓ Text copied to clipboard!';
    statusDiv.className = 'success';
    previewDiv.textContent = extractedText;
    previewDiv.className = 'visible';

    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);

  } catch (error) {
    statusDiv.textContent = `✗ Error: ${error.message}`;
    statusDiv.className = 'error';
  } finally {
    button.disabled = false;
  }
});

// Initialize popup with current system name
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const titleEl = document.getElementById('systemTitle');
  if (tab.url.includes('pureservice.com')) {
    titleEl.textContent = 'Pureservice Extractor';
  } else if (tab.url.includes('hubspot.com')) {
    titleEl.textContent = 'HubSpot Extractor';
  } else {
    titleEl.textContent = 'Ticket Extractor';
  }
});

function extractTextFromPage(currentUrl) {
  // This function runs in the context of the page
  // We need to redefine the systems config here since we can't import modules in executeScript

  const SYSTEMS = {
    pureservice: {
      name: 'Pureservice',
      domain: 'mestergruppen.pureservice.com',
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
      domain: 'app-eu1.hubspot.com',
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

  // Detect which system we're on
  let systemConfig = null;
  for (const [key, system] of Object.entries(SYSTEMS)) {
    if (currentUrl.includes(system.domain)) {
      systemConfig = system;
      break;
    }
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
