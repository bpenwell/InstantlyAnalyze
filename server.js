const express = require('express');
const httpProxy = require('http-proxy');
const app = express();

// Target CloudFront URL
const targetURL = 'https://d1jfoupk9ttnf8.cloudfront.net';

// Create a proxy server with SSL certificate validation disabled
const proxy = httpProxy.createProxyServer({
    secure: false, // Disable SSL certificate validation
});

// Proxy /api/aiRealEstateAgentAPI requests
app.use('/api/aiRealEstateAgentAPI', (req, res) => {
    proxy.web(req, res, { target: targetURL }, (error) => {
        console.error('Proxy error:', error);
        res.status(500).send('Proxy error');
    });
});

// Port number
const port = 5000;

// Server setup
app.listen(port, () => console.log(`Server running on port ${port}`));
