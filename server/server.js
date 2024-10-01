const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const app = express();

// MIDDLEWARES ======================================================
// Middleware to parse JSON bodies and Cookies
app.use(express.json());
app.use(cookieParser());

// Middleware to apply CORS
const corsOptions = {
    origin: 'http://localhost:5173',  // Your React app's URL
    credentials: true  // Allow credentials (cookies, authorization headers)
};
app.use(cors(corsOptions));

// Middleware to apply csrf protection
app.use(csrfProtection);

// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

const keyHMAC = crypto.randomBytes(64);  // HMAC key for JWT signing
// const secureRandom = crypto.randomBytes; // For random user fingerprint

// Utility to generate a secure random string
const generateRandomFingerprint = () => {
    return crypto.randomBytes(50).toString('hex');
};

// Utility to hash the fingerprint using SHA-256
const hashFingerprint = (fingerprint) => {
    return crypto.createHash('sha256').update(fingerprint, 'utf-8').digest('hex');
};

// Middleware to verify JWT and fingerprint match
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    const fingerprintCookie = req.cookies.__Secure_Fgp;

    if (!token || !fingerprintCookie) {
        return res.status(401).json({
            status: 401,
            message: "Error: Unauthorized",
            desc: "Token expired"
        });  // Unauthorized
    }

    jwt.verify(token, keyHMAC, (err, payload) => {
        if (err) return res.status(403).json({
            status: 403,
            message: "Error: Forbidden",
            desc: "Token malformed or modified"
        });  // Forbidden

        const fingerprintHash = hashFingerprint(fingerprintCookie);

        // Compare the hashed fingerprint in the JWT with the hash of the cookie value
        if (payload.userFingerprint !== fingerprintHash) {
            return res.status(403).json({
                status: 403,
                message: "Forbidden",
                desc: "Fingerprint mismatch"
            });  // Forbidden - fingerprint mismatch
        }

        /* `req.user = payload;` is assigning the decoded payload from the JWT token to the `user`
        property of the `req` object. This allows the subsequent middleware or route handlers to
        access the user information stored in the JWT token. By setting `req.user`, the user
        information becomes available throughout the request lifecycle for further processing or
        authorization checks. */
        req.user = payload;
        next();
    });
};

// Middleware to check user agent
// const userAgentCheck = (req, res, next) => {
//     const userAgent = req.headers['user-agent'];
//     const isBrowser = /Chrome|Firefox|Safari|Edge|Mozilla/i.test(userAgent);

//     if (!isBrowser) {
//         return res.status(403).json({ message: 'Access forbidden: non-browser requests are not allowed.' });
//     }
//     next();
// };

// MIDDLEWARES =======================================================



// API ============================================================
app.get('/csrf-token', (req, res) => { // Generate a CSRF token
    res.cookie('XSRF-TOKEN', req.csrfToken(), { // Sends token as a cookie
        httpOnly: false,
        secure: true,
        sameSite: 'Strict'
    });
    res.json({ csrfToken: req.csrfToken() });
});

// Login route to generate JWT and set fingerprint
app.post('/login', csrfProtection, (req, res) => {
    const { username, password } = req.body;

    // Mock data from the database
    const userId = crypto.randomUUID();
    const user = {
        'id': userId,
        'username': username,
        'password': password,
    }
    const userFingerprint = generateRandomFingerprint();  // Generate random fingerprint
    const userFingerprintHash = hashFingerprint(userFingerprint);  // Hash fingerprint

    // Set the fingerprint in a hardened cookie
    res.cookie('__Secure_Fgp', userFingerprint, {
        httpOnly: true,
        secure: true,  // Send only over HTTPS
        sameSite: 'Strict',  // Prevent cross-site request
        maxAge: 15 * 60 * 1000  // Cookie expiration (15 minutes)
    });

    const token = jwt.sign(
        {
            sub: userId,  // User info (e.g., ID)
            username: username,
            password: password,
            userFingerprint: userFingerprintHash,  // Store the hashed fingerprint in the JWT
            exp: Math.floor(Date.now() / 1000) + 60 * 15  // Token expiration time (15 minutes)
        },
        keyHMAC // Signed jwt key
    );

    // Send JWT as a cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000
    });

    res.status(200).json({
        message: 'Logged in successfully!',
        user: user
    });
});

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Start the Express server
app.listen(3000, () => {
    console.log('Server running on https://localhost:3000');
});