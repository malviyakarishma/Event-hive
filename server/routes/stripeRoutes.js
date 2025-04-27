// stripeRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Make sure to use env variable

// Create checkout session for admin registration
router.post("/create-checkout-session", async (req, res) => {
  try {
    // Get data from request
    const { username, email, password, callbackUrl } = req.body;
    
    // Store registration data in session metadata for later retrieval
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd", // Using INR for India
            product_data: {
              name: "Admin Registration Fee",
              description: "One-time fee for registering as an admin on EventHive",
            },
            unit_amount: 500, // ₹500.00 (amount in paise)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${callbackUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${callbackUrl}/cancel`,
      metadata: {
        username: username,
        email: email,
        password: password, // Note: In production, avoid storing raw passwords in metadata
        isAdmin: "true"
      },
    });

    console.log("Stripe session created:", session.id);
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ message: error.message });
  }
});


router.get("/verify-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      // Extract user data from session metadata
      const { username, email } = session.metadata;
      
      // Return success with user info (don't include password)
      res.json({
        success: true,
        username,
        email,
        isAdmin: true
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Payment has not been completed" 
      });
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error verifying payment session" 
    });
  }
});

module.exports = router;