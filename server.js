const stripe = require('stripe')('sk_test_51Qa9uwKDFjdgEMB7hoam2Tswsgy25OVPlhL7X4uoI58JylfQ6IsXcUSRo8aU1jw39oR0duCdCNJ55gGMIrptSehd00XItzal7e');
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

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: 'price_1Qa9oyQ5DPPArad12tf4aezM',
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
});

  res.redirect(303, session.url);
});