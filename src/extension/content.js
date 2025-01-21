// content.js

// Global variables
let scrapedProperties = [];
let parentContainer;
let scrapeButton;
let isMinimized = false;
let allCheckbox; // New global variable
let pageInput;   // New global variable
let interceptedRequest = {}; // Store intercepted request details

const SWITCH_PAGE_RESULTS_DELAY = 3000;
const BASE_URL_PATTERN = "*://www.zillow.com/async-create-search-page-state*";

// Handlers for request interception
const onBeforeRequestHandler = (details) => {
  if (details.method === "PUR") {
    const requestBody = details.requestBody?.raw?.[0]?.bytes;
    interceptedRequest.body = requestBody ? new TextDecoder().decode(requestBody) : null;
  }
};

const onBeforeSendHeadersHandler = (details) => {
  interceptedRequest.headers = details.requestHeaders;
  interceptedRequest.method = details.method;
  interceptedRequest.url = details.url;
};

// Start intercepting network requests
async function startInterceptPageData() {
  console.log("Starting interception...");
  chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestHandler,
    { urls: [BASE_URL_PATTERN] },
    ["requestBody"]
  );

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersHandler,
    { urls: [BASE_URL_PATTERN] },
    ["requestHeaders"]
  );
}

// Stop intercepting network requests
async function stopInterceptPageData() {
  console.log("Stopping interception...");
  chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestHandler);
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersHandler);
}

// Toggle interception via the extension icon
chrome.action.onClicked.addListener(async () => {
  const isIntercepting = chrome.webRequest.onBeforeRequest.hasListener(onBeforeRequestHandler);
  if (isIntercepting) {
    await stopInterceptPageData();
    console.log("Interceptor stopped.");
  } else {
    await startInterceptPageData();
    console.log("Interceptor started.");
  }
});

// Function to replay the intercepted request and handle response
async function fetchAndStorePageData() {
  try {
    const { url, method, headers, body } = interceptedRequest;
    if (!url) {
      console.error("No intercepted request found.");
      return;
    }

    // Prepare headers for the fetch request
    const headersObject = headers.reduce((acc, header) => {
      acc[header.name] = header.value;
      return acc;
    }, {});

    // Make the same request using fetch
    const response = await fetch(url, {
      method,
      headers: headersObject,
      body: body ? body : undefined, // Only include body if present
    });

    const data = await response.json();
    console.log("Fetched data:", data);

    // Extract properties from the response
    const properties = data?.cat1?.searchResults?.listResults || [];
    const scrapedProperties = properties.map((property) => ({
      zpid: property.zpid,
      price: property.price,
      address: property.address,
      beds: property.beds,
      baths: property.baths,
      area: property.area,
      link: property.detailUrl,
      imgSrc: property.imgSrc || property.carouselPhotos?.[0]?.url || "",
      fullData: property, // Store entire property data
    }));

    // Store the scraped properties in Chrome storage
    chrome.storage.local.set({ properties: scrapedProperties }, () => {
      console.log("Properties saved successfully.");
    });
  } catch (error) {
    console.error("Error replaying the request:", error);
  }
}

// Add a click listener to the extension's icon to trigger replay
chrome.action.onClicked.addListener(() => {
  console.log("Replaying intercepted request...");
  fetchAndStorePageData();
});

// Helper to get the current page from the URL query param
function getCurrentPageFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get("currentPage")) || 1;
}

// Function to update the page in the URL
function updatePageInUrl(pageNumber) {
  const url = new URL(window.location.href);
  url.searchParams.set("currentPage", pageNumber);
  window.history.pushState({}, "", url); // Update URL without reloading
}

// Listen to network requests and intercept the Zillow API response
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    try {
      const response = await fetch(details.url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

      const data = await response.json();
      const properties = data?.cat1?.searchResults?.listResults || [];

      if (properties.length === 0) {
        console.log("No properties found in this response.");
        return;
      }

      // Extract and save property data
      const scrapedProperties = await Promise.all(
        properties.map(async (property) => {
          const imageBase64 = await fetchImageAsBase64(property.imgSrc || property.carouselPhotos[0]?.url || "");
          return {
            zpid: property.zpid,
            price: property.price,
            address: property.address,
            beds: property.beds,
            baths: property.baths,
            area: property.area,
            link: property.detailUrl,
            imageBase64,
          };
        })
      );

      console.log("Scraped properties:", scrapedProperties);

      // Store the data in Chrome's local storage
      chrome.storage.local.set({ properties: scrapedProperties }, () => {
        console.log("Properties stored successfully.");
      });
    } catch (error) {
      console.error("Error processing Zillow API response:", error);
    }
  },
  { urls: [BASE_URL_PATTERN] }
);

// Function to fetch and parse property data via network requests
async function fetchPropertyData(pageNumber = 1) {
  const url = `${BASE_URL}?searchQueryState=%7B%22pagination%22%3A%7B%22currentPage%22%3A${pageNumber}%7D%7D`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);

    const data = await response.json();
    const properties = data?.cat1?.searchResults?.listResults || [];

    if (properties.length === 0) {
      console.log("Empty results. Trying async-create-search-page-state.");
      return [];
    }

    return properties.map((property) => ({
      zpid: property.zpid,
      price: property.price,
      address: property.address,
      beds: property.beds,
      baths: property.baths,
      area: property.area,
      link: property.detailUrl,
      image: property.carouselPhotos?.[0]?.url || property.imgSrc || "",
    }));
  } catch (error) {
    console.error("Error fetching property data:", error);
    return [];
  }
}

// Function to convert an image to Base64
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Failed to fetch image: ${imageUrl}`, error);
    return null;
  }
}

// Function to scrape multiple pages
async function scrapeMultiplePages(maxPages = 1) {
  let scrapedProperties = [];

  for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
    console.log(`Fetching page ${currentPage}...`);
    const properties = await fetchPropertyData(currentPage);

    for (const property of properties) {
      const imageBase64 = await fetchImageAsBase64(property.image);
      property.imageBase64 = imageBase64;
      console.log("Property scraped:", property);
      scrapedProperties.push(property);
    }
  }

  console.log("Scraping completed. Storing data...");

  // Store scraped properties in Chrome storage (without images for compact storage)
  const compactData = scrapedProperties.map(({ imageBase64, ...rest }) => rest);
  chrome.storage.local.set({ properties: compactData }, () => {
    console.log("Data stored successfully.");
    alert("Scraping completed and data saved!");
    resetUI();
  });
}

// Function to reset the UI to the initial state
function resetUI() {
  // Reset scraped data
  scrapedProperties = [];
  scrapeButton.innerText = 'Scrape Properties';
  scrapeButton.disabled = false;
  createParentComponent();
}

// Function to handle the scraping options menu
function showScrapeOptions() {
  if (isMinimized) return; // Do not show options if minimized

  // Hide the parent container when options are shown
  parentContainer.style.display = 'none';

  // Create the options container
  const optionsContainer = document.createElement('div');
  optionsContainer.style.position = 'fixed';
  optionsContainer.style.top = '0'; // Anchored at the top
  optionsContainer.style.left = '50%';
  optionsContainer.style.transform = 'translateX(-50%)';
  optionsContainer.style.backgroundColor = '#ffffff';
  optionsContainer.style.padding = '20px';
  optionsContainer.style.border = '2px solid #009B77'; // Updated border color
  optionsContainer.style.borderRadius = '0 0 8px 8px'; // Rounded bottom corners
  optionsContainer.style.zIndex = '10000';
  optionsContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  optionsContainer.style.boxSizing = 'border-box';
  optionsContainer.style.minWidth = '300px';

  // Create the form elements
  const form = document.createElement('div');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.alignItems = 'flex-start';

  const label = document.createElement('label');
  label.innerText = 'How many pages of results do you want to parse?';
  label.style.display = 'block';
  label.style.marginBottom = '10px';

  const checkboxContainer = document.createElement('div');
  checkboxContainer.style.display = 'flex';
  checkboxContainer.style.alignItems = 'center';
  checkboxContainer.style.marginBottom = '10px';

  // Define `allCheckbox` globally
  allCheckbox = document.createElement('input');
  allCheckbox.type = 'checkbox';
  allCheckbox.id = 'all-pages-checkbox';
  allCheckbox.checked = true;
  allCheckbox.style.marginRight = '5px';

  const allLabel = document.createElement('label');
  allLabel.innerText = 'All';
  allLabel.htmlFor = 'all-pages-checkbox';
  allLabel.style.margin = '0';

  checkboxContainer.appendChild(allCheckbox);
  checkboxContainer.appendChild(allLabel);

  // Define `pageInput` globally
  pageInput = document.createElement('input');
  pageInput.type = 'number';
  pageInput.id = 'page-number-input';
  pageInput.min = '1';
  pageInput.placeholder = 'Enter number of pages';
  pageInput.style.display = 'none';
  pageInput.style.marginTop = '10px';
  pageInput.style.width = '100%';
  pageInput.style.padding = '8px';
  pageInput.style.boxSizing = 'border-box';

  // Event listener for the checkbox
  allCheckbox.addEventListener('change', function () {
    pageInput.style.display = this.checked ? 'none' : 'block';
  });

  // Buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.marginTop = '15px';
  buttonsContainer.style.width = '100%';

  // Start extracting button
  const startButton = document.createElement('button');
  startButton.innerText = 'Start extracting';
  startButton.style.flex = '1';
  startButton.style.padding = '10px 20px';
  startButton.style.backgroundColor = '#009B77'; // Updated background color
  startButton.style.color = '#ffffff';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '5px';
  startButton.style.cursor = 'pointer';
  startButton.style.marginRight = '10px';

  // Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.innerText = 'Cancel';
  cancelButton.style.flex = '1';
  cancelButton.style.padding = '10px 20px';
  cancelButton.style.backgroundColor = '#cccccc';
  cancelButton.style.color = '#333333';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '5px';
  cancelButton.style.cursor = 'pointer';

  // Event listener for the start button
  startButton.addEventListener('click', async function () {
    // Validate input
    let maxPages = 'all';
    if (!allCheckbox.checked) {
      const pageValue = pageInput.value;
      if (!pageValue || isNaN(pageValue) || Number(pageValue) < 1) {
        alert('Please enter a valid number of pages.');
        return;
      }
      maxPages = Number(pageValue);
    }
    
    // Find the Page 1 button
    const pageOneButton = document.querySelector('a[title="Page 1"]');

    //If we aren't on the first page, 
    if (pageOneButton && pageOneButton.getAttribute('aria-disabled') === 'false') {
      console.log('Page 1 button is enabled. Starting in 5 seconds...');

      // Select the button and wait for 5 seconds
      pageOneButton.click();
      await new Promise(resolve => setTimeout(resolve, SWITCH_PAGE_RESULTS_DELAY));
    }

    // Remove the options menu
    document.body.removeChild(optionsContainer);

    // Start scraping
    scrapeMultiplePages(maxPages);
  });

  // Event listener for the cancel button
  cancelButton.addEventListener('click', function () {
    // Remove the options menu
    document.body.removeChild(optionsContainer);
    // Show the parent container again
    parentContainer.style.display = 'flex';
  });

  // Append buttons to the buttons container
  buttonsContainer.appendChild(startButton);
  buttonsContainer.appendChild(cancelButton);

  // Append elements to the form
  form.appendChild(label);
  form.appendChild(checkboxContainer);
  form.appendChild(pageInput);
  form.appendChild(buttonsContainer);

  // Append the form to the options container
  optionsContainer.appendChild(form);

  // Append the options container to the body
  document.body.appendChild(optionsContainer);
}

// Function to minimize the parent component
function minimizeComponent() {
  parentContainer.style.display = 'none';
  isMinimized = true;

  // Create the minimized component
  const minimizedBar = document.createElement('div');
  minimizedBar.id = 'minimized-bar';
  minimizedBar.innerText = 'REI Zillow property scraper';
  minimizedBar.style.position = 'fixed';
  minimizedBar.style.top = '0';
  minimizedBar.style.left = '50%';
  minimizedBar.style.transform = 'translateX(-50%)';
  minimizedBar.style.backgroundColor = '#009B77'; // Updated background color
  minimizedBar.style.color = '#ffffff';
  minimizedBar.style.padding = '10px 20px';
  minimizedBar.style.borderBottomLeftRadius = '8px';
  minimizedBar.style.borderBottomRightRadius = '8px';
  minimizedBar.style.cursor = 'pointer';
  minimizedBar.style.zIndex = '10000';
  minimizedBar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  minimizedBar.style.fontSize = '16px';
  minimizedBar.style.fontWeight = 'bold';
  minimizedBar.style.textAlign = 'center';

  // Event listener to restore the parent component
  minimizedBar.addEventListener('click', function () {
    minimizedBar.remove();
    parentContainer.style.display = 'flex';
    isMinimized = false;
  });

  // Append the minimized bar to the body
  document.body.appendChild(minimizedBar);
}

// Function to create the parent component
function createParentComponent() {
  parentContainer = document.createElement('div');
  parentContainer.style.position = 'fixed';
  parentContainer.style.top = '0';
  parentContainer.style.left = '50%';
  parentContainer.style.transform = 'translateX(-50%)';
  parentContainer.style.backgroundColor = '#f0f0f0';
  parentContainer.style.padding = '10px';
  parentContainer.style.border = '2px solid #009B77'; // Updated border color
  parentContainer.style.borderRadius = '0 0 8px 8px';
  parentContainer.style.zIndex = '9999';
  parentContainer.style.display = 'flex';
  parentContainer.style.alignItems = 'center';
  parentContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  parentContainer.style.minWidth = '200px';

  // Create the minimize button
  const minimizeButton = document.createElement('button');
  minimizeButton.innerText = '×';
  minimizeButton.style.background = 'none';
  minimizeButton.style.border = 'none';
  minimizeButton.style.fontSize = '20px';
  minimizeButton.style.cursor = 'pointer';
  minimizeButton.style.marginLeft = 'auto';
  minimizeButton.style.color = '#009B77'; // Updated text color
  minimizeButton.style.padding = '0';
  minimizeButton.style.lineHeight = '1';

  // Event listener for minimize button
  minimizeButton.addEventListener('click', minimizeComponent);

  // Create the scrape button
  scrapeButton = document.createElement('button');
  scrapeButton.innerText = 'Scrape Properties';

  // Apply styles to the scrape button
  scrapeButton.style.margin = '0 10px 0 0';
  scrapeButton.style.padding = '8px 16px';
  scrapeButton.style.fontSize = '14px';
  scrapeButton.style.backgroundColor = '#009B77'; // Updated background color
  scrapeButton.style.color = '#ffffff';
  scrapeButton.style.border = '2px solid #ffffff'; // White border
  scrapeButton.style.borderRadius = '8px';
  scrapeButton.style.cursor = 'pointer';
  scrapeButton.style.opacity = '0.85';
  scrapeButton.style.transition = 'opacity 0.3s, transform 0.3s';

  // Optional: Add an icon to the button
  let icon = document.createElement('span');
  icon.innerHTML = '&#128269;'; // Unicode for a magnifying glass
  icon.style.marginRight = '5px';
  scrapeButton.prepend(icon);

  // Hover effect
  scrapeButton.addEventListener('mouseover', function() {
    scrapeButton.style.opacity = '1';
    scrapeButton.style.transform = 'scale(1.05)';
  });
  scrapeButton.addEventListener('mouseout', function() {
    scrapeButton.style.opacity = '0.85';
    scrapeButton.style.transform = 'scale(1)';
  });

  // Inside your scrape button click handler
  scrapeButton.addEventListener('click', async function() {
    showScrapeOptions();
  });

  // Append elements to the parent container
  parentContainer.appendChild(scrapeButton);
  parentContainer.appendChild(minimizeButton);

  // Append the parent container to the body
  document.body.appendChild(parentContainer);
}

// Inject the parent component when the page loads
function checkReadyState() {
  if (document.readyState === "interactive" || document.readyState === "complete") {
    createParentComponent();
  } else {
    setTimeout(checkReadyState, 50);
  }
}

checkReadyState();