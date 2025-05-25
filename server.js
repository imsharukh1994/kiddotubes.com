const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Twilio credentials - commented out for now
// In a production environment, these should be stored as environment variables
// const twilio = require('twilio');
// const accountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
// const authToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER';
// const client = twilio(accountSid, authToken);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Route to send PIN via SMS
app.post('/api/send-pin', async (req, res) => {
    try {
        const { phoneNumber, pin, childName } = req.body;
        
        if (!phoneNumber || !pin) {
            return res.status(400).json({ error: 'Phone number and PIN are required' });
        }
        
        const message = `Your Kiddotubes PIN for ${childName || 'your child'} is: ${pin}. Use this PIN to allow your child to watch videos.`;
        
        // In a production environment, this would send an SMS via Twilio
        // For now, we'll simulate a successful SMS send
        console.log(`[SIMULATED SMS] To: ${phoneNumber}, Message: ${message}`);
        
        // Simulate a slight delay as if we're actually sending an SMS
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return success response
        res.json({ 
            success: true, 
            sid: 'SIMULATED_SID_' + Math.random().toString(36).substring(2, 15),
            message: 'PIN would be sent via SMS in production environment'
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
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
