document.addEventListener('DOMContentLoaded', async function () {
  // Initialize subscription buttons
  initializeSubscriptionButtons();

  // Check if the extension is pinned and show the reminder if not
  const isPinned = await checkIfPinned();
  if (!isPinned) {
    const pinReminder = document.getElementById('pin-reminder');
    pinReminder.style.display = 'flex';

    if (!localStorage.getItem('pinReminderDismissed')) {
      pinReminder.style.display = 'flex';
    }

    const dismissButton = document.getElementById('dismiss-reminder');
    dismissButton.addEventListener('click', () => {
      pinReminder.style.display = 'none';
      localStorage.setItem('pinReminderDismissed', 'true');
    });
  }

  const menuItems = document.querySelectorAll('.menu-item');
  const contentArea = document.getElementById('content-area');

  // Load the home page by default
  loadPage('home.html');

  menuItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent page reload
      menuItems.forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      const url = item.getAttribute('href');
      loadPage(url);
    });
  });
});

// Load content pages dynamically into the content area
function loadPage(url) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Page not found');
      }
      return response.text();
    })
    .then((html) => {
      document.getElementById('content-area').innerHTML = html;
    })
    .catch((error) => {
      document.getElementById('content-area').innerHTML = `<p>Error loading page: ${error.message}</p>`;
    });
}

// Initialize subscription button selections
function initializeSubscriptionButtons() {
  const buttons = document.querySelectorAll('.subscription-btn');
  buttons.forEach((button) => {
    button.addEventListener('click', function () {
      buttons.forEach((btn) => btn.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}

// Handle subscription based on selected period
function handleSubscribe() {
  const selectedButton = document.querySelector('.subscription-btn.selected');
  const period = selectedButton ? selectedButton.getAttribute('data-period') : 'yearly';
  alert(`Subscribed successfully for the ${capitalize(period)} plan!`);
  window.close();
}

// Capitalize the first letter of a string
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Detect if the extension is pinned
async function checkIfPinned() {
  return new Promise((resolve) => {
    chrome.action.getUserSettings((settings) => {
      resolve(settings.isOnToolbar);
    });
  });
}

// Start the extraction process
function startExtraction() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) {
      alert('No active tab found.');
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { type: 'START_SCRAPING' }, function (response) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        alert('Failed to communicate with content script.');
      } else if (response && response.success) {
        alert('Scraping started successfully.');
      } else {
        alert('Failed to start scraping.');
      }
    });
  });
}