const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5174', // Updated frontend URL
  credentials: true
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Stripe key available:', !!process.env.STRIPE_SECRET_KEY);
    
    const { priceId } = req.body;
    
    if (!priceId) {
      console.error('No priceId provided in request');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key is not configured');
      return res.status(500).json({ error: 'Stripe configuration is missing' });
    }

    console.log('Creating checkout session for price:', priceId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/settings?success=true`,
      cancel_url: `${req.headers.origin}/settings?canceled=true`,
    });

    console.log('Checkout session created successfully:', session.id);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Detailed error in create-checkout-session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// Add a test endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stripeConfigured: !!process.env.STRIPE_SECRET_KEY });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment check:', {
    stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
    nodeEnv: process.env.NODE_ENV
  });
}); 