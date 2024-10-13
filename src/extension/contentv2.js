// Global variables
let scrapedProperties = [];
let parentContainer;
let scrapeButton;
let isMinimized = false;
let allCheckbox; // New global variable
let pageInput;   // New global variable
let interceptedRequest = {}; // Store intercepted request details

const BASE_URL_PATTERN = "*://www.zillow.com/async-create-search-page-state*";

const SWITCH_PAGE_RESULTS_DELAY = 3000; // Delay between page switches

// Start the interception process by sending a message to the background script
function startInterceptPageData() {
    chrome.runtime.sendMessage({ type: "START_INTERCEPTION" }, () => {
      console.log("Interception initiated.");
    });
}
  
// Stop the interception process
function stopInterceptPageData() {
    chrome.runtime.sendMessage({ type: "STOP_INTERCEPTION" }, () => {
      console.log("Interception stopped.");
    });
}
  
// Navigate to a specific page by triggering the same events as the pagination button
function goToPage(pageNumber) {
    console.log(`Navigating to page ${pageNumber}...`);
  
    // Find the pagination button that corresponds to the target page number
    const pageButton = document.querySelector(`a[title="Page ${pageNumber}"]`);
  
    if (pageButton) {
      if (pageButton.getAttribute('aria-disabled') === 'false' || !pageButton.getAttribute('aria-disabled')) {
        console.log(`Found page button for page ${pageNumber}. Simulating click...`);
  
        // Create a new MouseEvent
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
  
        // Dispatch the event on the pagination button
        pageButton.dispatchEvent(event);
      } else {
        console.error(`Pagination button for page ${pageNumber} is disabled.`);
      }
    } else {
      console.error(`Pagination button for page ${pageNumber} not found.`);
    }
}

// Scrape multiple pages in sequence
async function scrapeMultiplePages(maxPages = 1) {
    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
      console.log(`Scraping page ${currentPage}...`);
  
      // Start interception for this page
      startInterceptPageData();
  
      // Go to the target page
      goToPage(currentPage);
  
      // Wait for the background script to confirm data scraping
      await new Promise((resolve) => {
        const listener = (message) => {
          if (message.type === "DATA_SCRAPED") {
            console.log(`Data scraped for page ${currentPage}.`);
            chrome.runtime.onMessage.removeListener(listener); // Clean up the listener
            resolve(); // Proceed to the next page
          }
        };
        chrome.runtime.onMessage.addListener(listener);
      });
  
      // Stop interception after scraping the page
      stopInterceptPageData();
    }
  
    console.log("All pages scraped. Scraping complete.");
    alert("Scraping completed and data saved!");
    resetUI();
}

// Reset UI and state
function resetUI() {
  scrapedProperties = [];
  scrapeButton.innerText = "Scrape Properties";
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
      let maxPages = 1000;
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
  

// Create the parent container UI
function createParentComponent() {
  parentContainer = document.createElement("div");
  parentContainer.style = `
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f0f0f0;
    padding: 10px;
    border: 2px solid #009B77;
    border-radius: 0 0 8px 8px;
    z-index: 9999;
    display: flex;
    align-items: center;
    min-width: 200px;
  `;

  const minimizeButton = document.createElement("button");
  minimizeButton.innerText = "×";
  minimizeButton.style = "margin-left: auto; background: none; border: none; cursor: pointer;";
  minimizeButton.addEventListener("click", () => (parentContainer.style.display = "none"));

  scrapeButton = document.createElement("button");
  scrapeButton.innerText = "Scrape Properties";
  scrapeButton.style = `
    padding: 8px 16px;
    background-color: #009B77;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  `;
  scrapeButton.addEventListener("click", showScrapeOptions);

  parentContainer.append(scrapeButton, minimizeButton);
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