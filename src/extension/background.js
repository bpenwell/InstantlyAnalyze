const BASE_URL_PATTERN = "*://www.zillow.com/async-create-search-page-state*";
let interceptionActive = false; // Track if interception is active

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_INTERCEPTION") {
    console.log("Interception started.");
    interceptionActive = true; // Enable interception
  } else if (message.type === "STOP_INTERCEPTION") {
    console.log("Interception stopped.");
    interceptionActive = false; // Disable interception
  }
});

// Intercept network requests only when interception is active
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (!interceptionActive) return; // Ignore requests if interception isn't active

    console.log(`Intercepted request: ${details.url}`);
    try {
      const response = await fetch(details.url);
      const data = await response.json();
      const properties = data?.cat1?.searchResults?.listResults || [];

      console.log(`Fetched ${properties.length} properties.`);

      // Save the properties in local storage
      chrome.storage.local.set({ properties }, () => {
        console.log("Properties saved successfully.");
      });

      // Notify the content script that data has been scraped
      chrome.runtime.sendMessage({ type: "DATA_SCRAPED" });
    } catch (error) {
      console.error("Failed to fetch intercepted request:", error);
    }
  },
  { urls: [BASE_URL_PATTERN] }
);