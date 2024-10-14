// contentv2.js

// Function to create the "Begin Extraction" button
function createBeginExtractionButton() {
  // Check if the button already exists
  if (document.getElementById("begin-extraction-btn")) return;

  const button = document.createElement("button");
  button.id = "begin-extraction-btn";
  button.innerText = "Begin Extraction";
  button.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background-color: #009B77;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-size: 16px;
  `;

  button.addEventListener("click", () => {
    // Send message to background to open popup
    chrome.runtime.sendMessage({ type: "OPEN_POPUP" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        alert("Failed to communicate with the background script.");
        return;
      }

      if (response && response.success) {
        // Hide the button
        button.style.display = "none";
      } else {
        console.error("Failed to open popup.");
      }
    });
  });

  document.body.appendChild(button);
}

// Function to remove the "Begin Extraction" button
function removeBeginExtractionButton() {
  const button = document.getElementById("begin-extraction-btn");
  if (button) {
    button.remove();
  }
}

// Inject the button when the page is ready
function injectButton() {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    createBeginExtractionButton();
  } else {
    document.addEventListener("DOMContentLoaded", createBeginExtractionButton);
  }
}

injectButton();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "POPUP_CLOSED") {
    // Re-display the "Begin Extraction" button
    createBeginExtractionButton();
  } else if (message.type === "DATA_SCRAPED") {
    // Optionally handle data scraped notification
    console.log("Data scraped:", message.properties, "Total Results:", message.totalResultCount);
    // You can implement additional logic here if needed
  }
});