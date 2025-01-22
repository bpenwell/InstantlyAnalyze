// background.js

const BASE_URL_PATTERN = "*://www.zillow.com/async-create-search-page-state*";

let requestDetailsMap = {}; // Store request details
let latestProperties = [];
let totalResultCount = 0;
let isPopupOpen = false;

// Intercept and store request bodies
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.requestId) return;
    if (!requestDetailsMap[details.requestId]) {
      requestDetailsMap[details.requestId] = {};
    }
    requestDetailsMap[details.requestId].method = details.method;
    requestDetailsMap[details.requestId].url = details.url;

    if (details.requestBody) {
      if (details.requestBody.raw) {
        const arr = new Uint8Array(details.requestBody.raw[0].bytes);
        requestDetailsMap[details.requestId].body = arr;
      } else if (details.requestBody.formData) {
        requestDetailsMap[details.requestId].body = new URLSearchParams(details.requestBody.formData).toString();
      }
    }
  },
  { urls: [BASE_URL_PATTERN] },
  ["requestBody"]
);

// Intercept headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!details.requestId) return;
    if (!requestDetailsMap[details.requestId]) {
      requestDetailsMap[details.requestId] = {};
    }
    requestDetailsMap[details.requestId].headers = details.requestHeaders;
  },
  { urls: [BASE_URL_PATTERN] },
  ["requestHeaders"]
);

// Handle request completion and fetch the data
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (!details.requestId) return;
    const requestInfo = requestDetailsMap[details.requestId];
    if (!requestInfo) return;

    try {
      const headers = {};
      requestInfo.headers.forEach(header => {
        headers[header.name] = header.value;
      });

      const fetchOptions = {
        method: requestInfo.method,
        headers: headers,
        credentials: 'include',
      };
      if (requestInfo.body) {
        fetchOptions.body = requestInfo.body;
      }

      const response = await fetch(requestInfo.url, fetchOptions);
      const data = await response.json();

      latestProperties = data?.cat1?.searchResults?.listResults || [];
      totalResultCount = data?.cat1?.searchList?.totalResultCount || 0;

      chrome.tabs.query({ url: "*://www.zillow.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: "DATA_SCRAPED", latestProperties, totalResultCount });
        });
      });
    } catch (error) {
      console.error("Failed to fetch intercepted request:", error);
    } finally {
      delete requestDetailsMap[details.requestId];
    }
  },
  { urls: [BASE_URL_PATTERN] }
);

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_LATEST_DATA") {
    sendResponse({ latestProperties, totalResultCount });
  } else if (message.type === "OPEN_POPUP") {
    openPopup();
    sendResponse({ success: true });
  }
});
function openPopup() {
  if (isPopupOpen) return;

  const popupWidth = 400;
  const popupHeight = 600;

  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: popupWidth,
    height: popupHeight,
    left: 100, // Default fallback position
    top: 100,
  }, (newWindow) => {
    isPopupOpen = true;
    chrome.windows.onRemoved.addListener(function onRemoved(windowId) {
      if (windowId === newWindow.id) {
        isPopupOpen = false;
        notifyPopupClosed();
        chrome.windows.onRemoved.removeListener(onRemoved);
      }
    });
  });
}

// Notify content scripts that the popup was closed
function notifyPopupClosed() {
  chrome.tabs.query({ url: "*://www.zillow.com/*" }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: "POPUP_CLOSED" });
    });
  });
}

// Add a UI border when the popup is closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("zillow.com") && !isPopupOpen) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: injectUIBorder,
    });
  }
});

// Inject a top-center UI border on Zillow
function injectUIBorder() {
  if (document.getElementById('scraper-ui-border')) return;

  const border = document.createElement('div');
  border.id = 'scraper-ui-border';
  border.innerText = "Open Scraper UI";
  border.style.position = 'fixed';
  border.style.top = '10px';
  border.style.left = '50%';
  border.style.transform = 'translateX(-50%)';
  border.style.backgroundColor = '#6200ee';
  border.style.color = 'white';
  border.style.padding = '10px 20px';
  border.style.borderRadius = '8px';
  border.style.cursor = 'pointer';
  border.style.zIndex = '9999';
  border.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
  
  border.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
  });

  document.body.appendChild(border);
}