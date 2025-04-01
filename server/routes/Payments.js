// server/routes/Payments.js
const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/AuthMiddleware');
const { Events, Registrations } = require('../models');

// Placeholder route for future Stripe integration
router.post('/create-intent', validateToken, async (req, res) => {
  try {
    const { eventId, amount, email } = req.body;
    
    // Verify the event exists
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Placeholder for Stripe payment intent
    // This will be implemented when Stripe is integrated
    res.json({ 
      clientSecret: 'placeholder_for_future_stripe_integration',
      message: 'Payment system coming soon'
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to process payment request' });
  }
});

// Update registration payment status
router.put('/:registrationId/update', validateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;
    
    const registration = await Registrations.findByPk(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    await registration.update({
      paymentStatus,
      paymentMethod,
      paymentDate: new Date()
    });
    
    res.json({ 
      message: 'Payment status updated',
      registration: {
        id: registration.id,
        paymentStatus: registration.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

module.exports = router;