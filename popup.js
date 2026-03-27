async function extractTextFromPage(currentUrl) {
  function waitForSelector(selectors, timeout = 3000) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    return new Promise((resolve) => {
      for (const sel of list) {
        const el = document.querySelector(sel);
        if (el) return resolve(el);
      }
      const observer = new MutationObserver(() => {
        for (const sel of list) {
          const el = document.querySelector(sel);
          if (el) {
            observer.disconnect();
            resolve(el);
            return;
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  function getVisibleText(el) {
    if (!el) return '';
    const hidden = el.querySelector('[class*="HiddenMeasure"]');
    if (hidden) {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[class*="HiddenMeasure"]').forEach((h) => h.remove());
      return clone.textContent?.trim() || '';
    }
    return el.textContent?.trim() || '';
  }

  function detectSystem(url) {
    if (url.includes('pureservice.com')) return 'pureservice';
    if (url.includes('hubspot.com') && url.includes('/help-desk/')) return 'hubspot-helpdesk';
    if (url.includes('hubspot.com')) return 'hubspot-ticket';
    return null;
  }

  const SYSTEMS = {
    pureservice: {
      name: 'Pureservice',
      selectors: {
        ticketId: '.request-number',
        contact: '.c-user-popover button',
        subject: '.ember-text-field.subject.ember-view'
      },
      getTicketId: () => {
        const el = document.querySelector('.request-number');
        return el?.textContent?.trim() || '';
      },
      getContact: (el) => el?.textContent?.trim() || '',
      getSubject: (el) => (el?.value || el?.textContent || '').trim()
    },
    'hubspot-ticket': {
      name: 'HubSpot',
      selectors: {
        contact: [
          '[data-test-id="contact-chicklet-title-link"]',
          '[data-test-id="contact-chicklet-title"] a',
          '[data-test-id="email-sender"] strong'
        ],
        subject: '[data-test-id="highlight-property-display-subject"]'
      },
      getTicketId: () => {
        const match = window.location.href.match(/\/record\/[^/]+\/(\d+)/);
        return match?.[1] || '';
      },
      getContact: (el) => getVisibleText(el),
      getSubject: (el) => getVisibleText(el)
    },
    'hubspot-helpdesk': {
      name: 'HubSpot',
      selectors: {
        contact: '[data-test-id="ticket-header-contact-detail-link"] a',
        subject: '[data-test-id="ticket-header-name-link"] a'
      },
      getTicketId: () => {
        const match = window.location.href.match(/\/ticket\/(\d+)/);
        return match?.[1] || '';
      },
      getContact: (el) => getVisibleText(el),
      getSubject: (el) => getVisibleText(el)
    }
  };

  const systemKey = detectSystem(currentUrl);
  if (!systemKey) return 'Error: Unknown ticketing system';

  const system = SYSTEMS[systemKey];
  const ticketId = system.getTicketId();

  const contactEl = await waitForSelector(system.selectors.contact);
  const subjectEl = await waitForSelector(system.selectors.subject);

  const contact = system.getContact(contactEl);
  const subject = system.getSubject(subjectEl);

  return `${system.name}: ${ticketId} - ${contact} - ${subject}`;
}

const SUPPORTED_DOMAINS = ['pureservice.com', 'hubspot.com'];

function getSystemLabel(url) {
  if (url.includes('pureservice.com')) return 'Pureservice Extractor';
  if (url.includes('hubspot.com')) return 'HubSpot Extractor';
  return 'Ticket Extractor';
}

document.getElementById('extractBtn').addEventListener('click', async () => {
  const button = document.getElementById('extractBtn');
  const statusDiv = document.getElementById('status');
  const previewDiv = document.getElementById('preview');
  const titleEl = document.getElementById('systemTitle');

  button.disabled = true;
  statusDiv.className = '';
  previewDiv.className = '';
  previewDiv.textContent = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!SUPPORTED_DOMAINS.some((d) => tab.url.includes(d))) {
      throw new Error('Please navigate to a supported ticketing system (Pureservice or HubSpot)');
    }

    titleEl.textContent = getSystemLabel(tab.url);

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

    statusDiv.textContent = '\u2713 Text copied to clipboard!';
    statusDiv.className = 'success';
    previewDiv.textContent = extractedText;
    previewDiv.className = 'visible';

    setTimeout(() => {
      statusDiv.className = '';
    }, 3000);
  } catch (error) {
    statusDiv.textContent = `\u2717 Error: ${error.message}`;
    statusDiv.className = 'error';
  } finally {
    button.disabled = false;
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  document.getElementById('systemTitle').textContent = getSystemLabel(tab.url);
});
