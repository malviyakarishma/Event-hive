const { verify } = require("jsonwebtoken");

// Helper function for sending error responses
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
};

const validateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    // Check if Authorization header is present
    if (!authHeader) {
        console.warn("Authorization header missing");
        return sendError(res, 401, "Authorization header missing");
    }

    // Extract token from the header
    const token = authHeader.split(" ")[1];
    console.debug("Received Token:", token); // Log the token for debugging

    // Check if token exists
    if (!token) {
        console.warn("Token missing from authorization header");
        return sendError(res, 401, "Token missing from authorization header");
    }

    try {
        // Validate the token using JWT's verify method
        const validToken = verify(token, process.env.JWT_SECRET);
        console.debug("Decoded Token:", validToken); // Log decoded token for debugging

        // Check if the token contains valid user data
        if (!validToken.id || !validToken.username) {
            console.warn("Invalid token: Missing required user information");
            return sendError(res, 401, "Invalid token: Missing required user information");
        }

        // Attach user data and admin status to the request object
        req.user = {
            id: validToken.id,
            username: validToken.username,
            isAdmin: validToken.isAdmin === true, // Ensure isAdmin is a boolean
        };

        console.info(`User authenticated: ${validToken.username}, Admin status: ${req.user.isAdmin}`);
        
        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return sendError(res, 403, "Invalid or expired token");
    }
};

module.exports = { validateToken };
