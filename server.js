import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import twilio from 'twilio';

const app = express();
const port = 3000;

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
