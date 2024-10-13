document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get('authenticated', function(data) {
    if (data.authenticated) {
      // User is authenticated, show the post-login message
      document.getElementById('post-login').style.display = 'block';

      // Add event listener for the "Go to Zillow.com" button
      document.getElementById('open-zillow-btn').addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://www.zillow.com/' });
      });

      // Add event listener for logout button
      document.getElementById('logout-btn').addEventListener('click', function() {
        chrome.storage.sync.set({ authenticated: false }, function() {
          // Reload the popup to show the login form
          location.reload();
        });
      });

    } else {
      // User is not authenticated, show the login form
      document.getElementById('login-form').style.display = 'block';

      // Add event listener for the login form
      document.querySelector('#login-form form').addEventListener('submit', function(e) {
        e.preventDefault();

        // Simulate a successful login
        chrome.storage.sync.set({ authenticated: true }, function() {
          // Hide the login form and show the post-login message
          document.getElementById('login-form').style.display = 'none';
          document.getElementById('post-login').style.display = 'block';
        });
      });
    }
  });
});
