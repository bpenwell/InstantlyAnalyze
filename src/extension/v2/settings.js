
const allCheckbox = document.getElementById('all-pages-checkbox');
const pageInput = document.getElementById('page-number-input');
const slider = document.getElementById('interval-slider');
const saveButton = document.getElementById('save-button');

// Load saved settings from chrome.storage when the page loads
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['allPages', 'pageCount', 'interval'], (result) => {
    allCheckbox.checked = result.allPages ?? true;
    pageInput.value = result.pageCount ?? '';
    slider.value = result.interval ?? 6;

    // Toggle input display based on the loaded checkbox value
    pageInput.style.display = allCheckbox.checked ? 'none' : 'block';
  });
});

// Show or hide the page input based on the checkbox state
allCheckbox.addEventListener('change', () => {
  pageInput.style.display = allCheckbox.checked ? 'none' : 'block';
});

// Save settings to chrome.storage when the Save button is clicked
saveButton.addEventListener('click', () => {
  const settings = {
    allPages: allCheckbox.checked,
    pageCount: pageInput.value,
    interval: slider.value,
  };

  chrome.storage.sync.set(settings, () => {
    saveButton.innerHTML = `
      <span class="icon"><i class="fa-solid fa-check"></i></span>
      <b>Saved</b>
    `;

    // Revert back to "Save Settings" after 2 seconds
    setTimeout(() => {
      saveButton.innerHTML = `
        <span class="icon"><i class="fa-solid fa-save"></i></span>
        <b>Save Settings</b>
      `;
    }, 2000);
  });
});