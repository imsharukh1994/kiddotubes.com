
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import Stripe from 'stripe';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const port = process.env.PORT || 3000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS = {
    basic: {
        id: 'basic',
        name: 'Basic Plan',
        price: 499, // $4.99 in cents
        features: [
            'Ad-free viewing',
            'Basic parental controls',
            '1 profile',
            'SD quality'
        ],
        stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID
    },
    family: {
        id: 'family',
        name: 'Family Plan',
        price: 999, // $9.99 in cents
        features: [
            'Everything in Basic',
            'Up to 3 profiles',
            'Advanced parental controls',
            'HD quality',
            'Offline downloads'
        ],
        stripeProductId: process.env.STRIPE_FAMILY_PRODUCT_ID
    },
    premium: {
        id: 'premium',
        name: 'Premium Plan',
        price: 1299, // $12.99 in cents
        features: [
            'Everything in Family',
            'Up to 6 profiles',
            'Premium content access',
            '4K Ultra HD quality',
            'Priority support',
            'Early access to new features'
        ],
        stripeProductId: process.env.STRIPE_PREMIUM_PRODUCT_ID
    }
};

// Twilio credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client if credentials are available
let client;
try {
    client = twilio(accountSid, authToken);
} catch (error) {
    console.warn('Twilio client initialization failed:', error.message);
    console.warn('SMS functionality will be simulated');
}

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
}));
app.use(helmet());
app.use(compression());
app.use(bodyParser.json({ limit: '200kb' }));
// Serve only the public directory
app.use(express.static('public'));

// In-memory OTP storage (in production, use a database)
const otpStore = new Map();

// Basic in-memory rate limiting for OTP endpoints
// Limits: max 5 OTP generations per phone per hour, 10 per IP per hour
const otpRateStore = new Map(); // key => { count, resetAt }
function rateKey(prefix, id) { return `${prefix}:${id}`; }
function isRateLimited(key, limit, windowMs) {
    const now = Date.now();
    let entry = otpRateStore.get(key);
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        otpRateStore.set(key, entry);
    }
    entry.count += 1;
    return entry.count > limit;
}

// Stripe webhook with signature verification (raw body for this route)
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    try {
        let event = req.body;
        if (stripeWebhookSecret) {
            const sig = req.headers['stripe-signature'];
            event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log('Subscription successful:', session && session.id);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                console.log('Subscription cancelled:', subscription && subscription.id);
                break;
            }
            default:
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook signature verification failed' });
    }
});

// After raw handler, restore JSON parsing for other routes
app.use(bodyParser.json({ limit: '200kb' }));

// Subscription endpoints
app.post('/api/create-subscription', async (req, res) => {
    try {
        const { email, name, plan, customerInfo } = req.body;
        
        // Validate plan
        const planConfig = SUBSCRIPTION_PLANS[plan];
        if (!planConfig) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Create or retrieve customer
        let customer;
        const existingCustomers = await stripe.customers.list({ email });
        
        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            // Update customer information
            await stripe.customers.update(customer.id, {
                name: customerInfo.name,
                address: customerInfo.address
            });
        } else {
            customer = await stripe.customers.create({
                email,
                name: customerInfo.name,
                address: customerInfo.address
            });
        }

        try {
            // Create Subscription
            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: planConfig.name,
                                description: planConfig.features.join(', ')
                            },
                            unit_amount: planConfig.price,
                            recurring: {
                                interval: 'month'
                            }
                        }
                    }
                ],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            });

            res.json({
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                customerId: customer.id
            });
        } catch (error) {
            console.error('Error creating subscription:', error);
            res.status(500).json({ error: 'Failed to create subscription' });
        }
    } catch (error) {
        console.error('Error in create-subscription:', error);
        res.status(500).json({ error: 'Failed to process subscription request' });
    }
});

// (webhook moved above with signature verification)

app.get('/api/subscription-plans', (req, res) => {
    res.json(SUBSCRIPTION_PLANS);
});

app.post('/api/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

        res.json({ success: true, subscription });
    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to generate and send OTP via SMS
app.post('/api/generate-otp', async (req, res) => {
    try {
        const { phoneNumber, childName } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        // Rate limits
        if (isRateLimited(rateKey('phone', phoneNumber), 5, 60 * 60 * 1000)) {
            return res.status(429).json({ error: 'Too many OTP requests for this number. Please try later.' });
        }
        if (isRateLimited(rateKey('ip', ip), 10, 60 * 60 * 1000)) {
            return res.status(429).json({ error: 'Too many OTP requests from this IP. Please try later.' });
        }

        // Generate a new OTP
        const otp = generateOTP();
        
        // Store OTP with expiration time (30 minutes)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        
        otpStore.set(phoneNumber, {
            otp,
            expiresAt: expiresAt.getTime(),
            attempts: 0
        });
        
        const message = `Your Kiddotubes access code for ${childName || 'your child'} is: ${otp}. Enter this code to allow your child to watch videos. This code will expire in 30 minutes.`;
        
        // Try to send SMS via Twilio if client is available
        if (client && accountSid && authToken && twilioPhoneNumber) {
            try {
                const twilioMessage = await client.messages.create({
                    body: message,
                    from: twilioPhoneNumber,
                    to: phoneNumber
                });
                
                console.log(`SMS sent with SID: ${twilioMessage.sid}`);
                
                res.json({
                    success: true,
                    sid: twilioMessage.sid,
                    message: 'OTP sent successfully'
                });
            } catch (twilioError) {
                console.error('Twilio error:', twilioError);
                // Fall back to simulation if Twilio fails
                simulateOtpSend(phoneNumber, message, res);
            }
        } else {
            // Simulate SMS if Twilio client is not available
            simulateOtpSend(phoneNumber, message, res);
        }
    } catch (error) {
        console.error('Error generating OTP:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to simulate OTP sending
function simulateOtpSend(phoneNumber, message, res) {
    console.log(`[SIMULATED SMS] To: ${phoneNumber}, Message: ${message}`);
    
    // Simulate a slight delay
    setTimeout(() => {
        res.json({
            success: true,
            sid: 'SIMULATED_SID_' + Math.random().toString(36).substring(2, 15),
            message: 'OTP would be sent via SMS in production environment',
            simulated: true
        });
    }, 500);
}

// Route to verify OTP
app.post('/api/verify-otp', (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }
        // Basic brute-force protection: limit verifications per IP
        if (isRateLimited(rateKey('verify-ip', ip), 30, 60 * 60 * 1000)) {
            return res.status(429).json({ error: 'Too many verification attempts. Please wait and try again.' });
        }

        const otpData = otpStore.get(phoneNumber);
        
        // Check if OTP exists for this phone number
        if (!otpData) {
            return res.status(400).json({ error: 'No OTP found for this phone number. Please request a new OTP.' });
        }
        
        // Check if OTP has expired
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
        }
        
        // Increment attempt counter
        otpData.attempts += 1;
        
        // Check if max attempts reached (3 attempts)
        if (otpData.attempts > 3) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
        }
        
        // Check if OTP matches
        if (otpData.otp !== otp) {
            return res.status(400).json({ 
                error: 'Invalid OTP. Please try again.',
                attemptsLeft: 3 - otpData.attempts
            });
        }
        
        // OTP is valid, remove it from store
        otpStore.delete(phoneNumber);
        
        // Return success response
        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to send video watch notification
app.post('/api/send-notification', async (req, res) => {
    try {
        const { phoneNumber, childName, videoTitle } = req.body;
        
        if (!phoneNumber || !videoTitle) {
            return res.status(400).json({ error: 'Phone number and video title are required' });
        }
        
        const message = `${childName || 'Your child'} watched: ${videoTitle} on Kiddotubes.com`;
        
        // In a production environment, this would send an SMS via Twilio
        // For now, we'll simulate a successful SMS send
        console.log(`[SIMULATED NOTIFICATION] To: ${phoneNumber}, Message: ${message}`);
        
        // Simulate a slight delay as if we're actually sending an SMS
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return success response
        res.json({ 
            success: true, 
            sid: 'SIMULATED_SID_' + Math.random().toString(36).substring(2, 15),
            message: 'Notification would be sent via SMS in production environment'
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to send login notification (email + logout link). Does NOT include passwords.
app.post('/api/send-login-notification', async (req, res) => {
    try {
        const { phoneNumber, email } = req.body;

        if (!phoneNumber || !email) {
            return res.status(400).json({ error: 'Phone number and email are required' });
        }

        // Build a logout link pointing at the app. Allow override via PUBLIC_URL env var.
        const publicUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
        const logoutUrl = `${publicUrl.replace(/\/$/, '')}/login.html`;

        // Do NOT include passwords in SMS. Instead include email and a logout link.
        const message = `New login to your Kiddotubes account (email: ${email}). If this wasn't you, visit ${logoutUrl} to logout immediately.`;

        if (client) {
            try {
                const twilioMessage = await client.messages.create({
                    body: message,
                    from: twilioPhoneNumber,
                    to: phoneNumber
                });

                console.log(`Login SMS sent with SID: ${twilioMessage.sid}`);

                res.json({
                    success: true,
                    sid: twilioMessage.sid,
                    message: 'Login notification sent successfully'
                });
            } catch (twilioError) {
                console.error('Twilio error sending login notification:', twilioError);
                // Fall back to simulation using the existing helper
                simulateOtpSend(phoneNumber, message, res);
            }
        } else {
            // Simulate SMS if Twilio client is not available
            simulateOtpSend(phoneNumber, message, res);
        }
    } catch (error) {
        console.error('Error sending login notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy YouTube Data API using server-side key from .env
app.get('/api/youtube/search', async (req, res) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'YOUTUBE_API_KEY is not set in environment' });
        }

        const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        // Forward all query params from client
        Object.entries(req.query || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => ytUrl.searchParams.append(key, String(v)));
            } else if (value !== undefined) {
                ytUrl.searchParams.set(key, String(value));
            }
        });
        // Ensure required parts and safe defaults
        if (!ytUrl.searchParams.get('part')) ytUrl.searchParams.set('part', 'snippet');
        if (!ytUrl.searchParams.get('maxResults')) ytUrl.searchParams.set('maxResults', '20');
        if (!ytUrl.searchParams.get('type')) ytUrl.searchParams.set('type', 'video');
        if (!ytUrl.searchParams.get('safeSearch')) ytUrl.searchParams.set('safeSearch', 'strict');
        ytUrl.searchParams.set('key', apiKey);

        const ytResp = await fetch(ytUrl.toString());
        if (!ytResp.ok) {
            const text = await ytResp.text();
            return res.status(ytResp.status).json({ error: 'YouTube API error', details: text });
        }
        const data = await ytResp.json();
        res.json(data);
    } catch (err) {
        console.error('YouTube proxy error:', err);
        res.status(500).json({ error: 'Failed to fetch YouTube data' });
    }
});

// Create subscription checkout session endpoint

// (Removed invalid block; see /api/create-checkout-session endpoint below for correct implementation)

// Simple checkout session endpoint for one-time payments
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { plan } = req.body;
        const baseUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
        let success_url = `${baseUrl}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`;
        let cancel_url = `${baseUrl}/checkout-cancel.html`;

        let lineItem;
        if (plan === 'basic') {
            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Basic Plan',
                        description: 'Monthly basic plan access'
                    },
                    unit_amount: 499 // $4.99
                },
                quantity: 1
            };
        } else if (plan === 'family') {
            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Family Plan',
                        description: 'Monthly family plan access'
                    },
                    unit_amount: 999 // $9.99
                },
                quantity: 1
            };
        } else {
            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Premium Plan',
                        description: 'Monthly premium plan access'
                    },
                    unit_amount: 1299 // $12.99
                },
                quantity: 1
            };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [lineItem],
            mode: 'payment',
            success_url,
            cancel_url
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Kiddotubes server running at http://localhost:${port}`);
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'present' : 'missing');
    console.log('PUBLIC_URL:', process.env.PUBLIC_URL || `http://localhost:${port}`);
    console.log('Static dir:', 'public');
});

// Client-side fetch example (to be used in your front-end code)
/*
fetch('http://localhost:3000/api/generate-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        phoneNumber: '+919920180194', // get this from your form
        childName: 'zaki' // get this from your form
    })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        alert('OTP sent to your phone. Please check your SMS.');
    } else {
        alert('Error: ' + (data.error || 'Could not send OTP'));
    }
});
*/

// For WhatsApp - Commented out as it's not properly implemented
// const whatsappMessage = `Your Kiddotubes access code for ${childName || 'your child'} is: ${otp}. Enter this code to allow your child to watch videos. This code will expire in 30 minutes.`;
// await client.messages.create({
//     body: whatsappMessage,
//     from: 'whatsapp:+14155238886', // Twilio WhatsApp sandbox number
//     to: 'whatsapp:' + phoneNumber   // e.g., 'whatsapp:+919920180194'
// });
