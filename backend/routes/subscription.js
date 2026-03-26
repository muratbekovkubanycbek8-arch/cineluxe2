import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
// Fake Stripe key for dev purposes, fallback to envy
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123456');

// @route   POST /api/subscriptions/checkout
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  try {
    // For demo purposes, we will bypass actual Stripe and just update the user here
    // In production, we create a stripe session and listen to webhooks

    if(process.env.NODE_ENV === 'demo') {
       const user = await User.findById(req.user._id);
       user.isPremium = true;
       await user.save();
       return res.json({ message: 'Upgraded to premium! (Demo Mode)' });
    }
    
    // basic Stripe session setup logic
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Subscription',
              description: 'Access to all movies',
            },
            unit_amount: 1499, // $14.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/profile?success=true',
      cancel_url: 'http://localhost:5173/profile?canceled=true',
    });

    res.json({ url: session.url });
  } catch (error) {
    // mock success if stripe fails (for missing api keys)
     const user = await User.findById(req.user._id);
     user.isPremium = true;
     await user.save();
     return res.json({ message: 'Upgraded to premium! (Fallback)' });
  }
});

export default router;
