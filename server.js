const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'build' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.debug(`Server is running on port ${PORT}`);
});
