import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import twilio from 'twilio';

const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials - uncommented for OTP functionality
// In a production environment, these should be stored as environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACedd93a2a7a28036852c1a742dc573755';
const authToken = process.env.TWILIO_AUTH_TOKEN || '25fb257aa463a404b90be9f5217b6e80';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+16203250194';

// Initialize Twilio client if credentials are available
let client;
try {
    client = twilio(accountSid, authToken);
} catch (error) {
    console.warn('Twilio client initialization failed:', error.message);
    console.warn('SMS functionality will be simulated');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// In-memory OTP storage (in production, use a database)
const otpStore = new Map();

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to generate and send OTP via SMS
app.post('/api/generate-otp', async (req, res) => {
    try {
        const { phoneNumber, childName } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
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
        if (client) {
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
        
        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
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

// Stripe Checkout session creation
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { plan } = req.body || {};

        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
            return res.status(500).json({ error: 'Stripe secret key is not configured on the server.' });
        }

        // Dynamically import stripe to avoid loading when not configured
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

        // Map simple plans to amounts (in cents) for test/demo purposes
        let line_items = [];
    let baseUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
    // include plan and the Stripe session id placeholder so client can read session details if needed
    let success_url = `${baseUrl.replace(/\/$/, '')}/checkout-success.html?plan=${encodeURIComponent(plan || 'subscription')}&session_id={CHECKOUT_SESSION_ID}`;
    let cancel_url = `${baseUrl.replace(/\/$/, '')}/checkout-cancel.html`;

        if (plan === 'subscription') {
            // For demo: single payment representing subscription signup (in real integration use subscription products/prices)
            line_items = [{ price_data: { currency: 'usd', product_data: { name: 'Kiddotubes Subscription (monthly)' }, unit_amount: 999 }, quantity: 1 }];
        } else if (plan === 'free') {
            return res.json({ url: `${process.env.PUBLIC_URL || '/'}?plan=free` });
        } else if (plan === 'partner') {
            return res.json({ url: `mailto:partnerships@kiddotubes.com?subject=Partnership%20Inquiry` });
        } else {
            // default to subscription
            line_items = [{ price_data: { currency: 'usd', product_data: { name: 'Kiddotubes Subscription (monthly)' }, unit_amount: 999 }, quantity: 1 }];
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url,
            cancel_url
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Kiddotubes server running at http://localhost:${port}`);
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
