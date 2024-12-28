const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;
const YOUR_DOMAIN = `http://localhost:${PORT}`;

// Serve static files from the 'build' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.debug(`Server is running on port ${PORT}`);
});