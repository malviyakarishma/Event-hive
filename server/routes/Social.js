const express = require("express");
const router = express.Router();
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Users } = require("../models");
require("dotenv").config();

// Initialize Passport
const initializePassport = (app) => {
  app.use(passport.initialize());
  
  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3001'}/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user with Facebook profile
      let user = await Users.findOne({ where: { facebookId: profile.id } });
      
      if (!user) {
        // Check if user exists with the same email
        if (profile.emails && profile.emails.length > 0) {
          user = await Users.findOne({ where: { email: profile.emails[0].value } });
          
          if (user) {
            // Link Facebook to existing account
            user.facebookId = profile.id;
            await user.save();
          }
        }
        
        // No user found, we don't create one in this case
        // User must register first through the app
      }
      
      return done(null, {
        id: user ? user.id : null,
        profile,
        accessToken,
        provider: 'facebook'
      });
    } catch (error) {
      return done(error);
    }
  }));
  
  // LinkedIn Strategy
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3001'}/auth/linkedin/callback`,
    scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user with LinkedIn profile
      let user = await Users.findOne({ where: { linkedinId: profile.id } });
      
      if (!user) {
        // Check if user exists with the same email
        if (profile.emails && profile.emails.length > 0) {
          user = await Users.findOne({ where: { email: profile.emails[0].value } });
          
          if (user) {
            // Link LinkedIn to existing account
            user.linkedinId = profile.id;
            await user.save();
          }
        }
        
        // No user found, we don't create one in this case
        // User must register first through the app
      }
      
      return done(null, {
        id: user ? user.id : null,
        profile,
        accessToken,
        provider: 'linkedin'
      });
    } catch (error) {
      return done(error);
    }
  }));
  
  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

// Routes for Facebook authentication
router.get("/facebook", passport.authenticate("facebook", { 
  scope: ["email", "public_profile"], 
  session: false 
}));

router.get("/facebook/callback", (req, res, next) => {
  passport.authenticate("facebook", { session: false }, (err, user) => {
    if (err) {
      return res.send(`
        <script>
          window.opener.postMessage(
            { type: 'oauth-callback', provider: 'facebook', success: false, error: 'Authentication failed' },
            '${process.env.CLIENT_URL || 'http://localhost:3000'}'
          );
          window.close();
        </script>
      `);
    }
    
    if (!user) {
      return res.send(`
        <script>
          window.opener.postMessage(
            { type: 'oauth-callback', provider: 'facebook', success: false, error: 'Authentication failed' },
            '${process.env.CLIENT_URL || 'http://localhost:3000'}'
          );
          window.close();
        </script>
      `);
    }
    
    // Create JWT token with provider and social access token
    const token = jwt.sign(
      { 
        provider: 'facebook',
        socialId: user.profile.id,
        userId: user.id,
        accessToken: user.accessToken
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    // Send token back to client via postMessage
    return res.send(`
      <script>
        window.opener.postMessage(
          { type: 'oauth-callback', provider: 'facebook', success: true, token: '${token}' },
          '${process.env.CLIENT_URL || 'http://localhost:3000'}'
        );
        window.close();
      </script>
    `);
  })(req, res, next);
});

// Routes for LinkedIn authentication
router.get("/linkedin", passport.authenticate("linkedin", { session: false }));

router.get("/linkedin/callback", (req, res, next) => {
  passport.authenticate("linkedin", { session: false }, (err, user) => {
    if (err) {
      return res.send(`
        <script>
          window.opener.postMessage(
            { type: 'oauth-callback', provider: 'linkedin', success: false, error: 'Authentication failed' },
            '${process.env.CLIENT_URL || 'http://localhost:3000'}'
          );
          window.close();
        </script>
      `);
    }
    
    if (!user) {
      return res.send(`
        <script>
          window.opener.postMessage(
            { type: 'oauth-callback', provider: 'linkedin', success: false, error: 'Authentication failed' },
            '${process.env.CLIENT_URL || 'http://localhost:3000'}'
          );
          window.close();
        </script>
      `);
    }
    
    // Create JWT token with provider and social access token
    const token = jwt.sign(
      { 
        provider: 'linkedin',
        socialId: user.profile.id,
        userId: user.id,
        accessToken: user.accessToken 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    // Send token back to client via postMessage
    return res.send(`
      <script>
        window.opener.postMessage(
          { type: 'oauth-callback', provider: 'linkedin', success: true, token: '${token}' },
          '${process.env.CLIENT_URL || 'http://localhost:3000'}'
        );
        window.close();
      </script>
    `);
  })(req, res, next);
});

module.exports = { router, initializePassport };