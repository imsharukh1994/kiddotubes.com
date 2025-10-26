# Twilio Integration for Kiddotubes

This guide explains how to set up and use Twilio with the Kiddotubes application to send SMS notifications to parents.

## Prerequisites

1. A Twilio account - [Sign up for free](https://www.twilio.com/try-twilio)
2. Node.js installed on your computer
3. npm (Node Package Manager) installed

## Step 1: Get Your Twilio Credentials

1. Sign up for a Twilio account at [twilio.com](https://www.twilio.com/try-twilio)
2. Once logged in, navigate to your [Twilio Console Dashboard](https://www.twilio.com/console)
3. Note down your **Account SID** and **Auth Token**
4. Get a Twilio phone number from the [Phone Numbers section](https://www.twilio.com/console/phone-numbers/incoming)

## Step 2: Configure the Kiddotubes Server

1. Open the `server.js` file in the Kiddotubes project
2. Replace the placeholder values with your actual Twilio credentials:

```javascript
// Twilio credentials - replace with your own
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // Replace with your Account SID
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';   // Replace with your Auth Token
const twilioPhoneNumber = 'YOUR_TWILIO_PHONE_NUMBER'; // Replace with your Twilio phone number
```

## Step 3: Install Dependencies and Start the Server

1. Open a terminal/command prompt
2. Navigate to the Kiddotubes project directory
3. Run the following commands:

```bash
npm install
npm start
```

4. You should see a message: `Kiddotubes server running at http://localhost:3000`

## Step 4: Test the Twilio Integration

1. Keep the Node.js server running
2. In a separate terminal, start the HTTP server for the frontend:

```bash
python -m http.server 8080
```

3. Open a web browser and navigate to `http://localhost:8080`
4. Click on "Register" and fill out the registration form with a valid phone number
5. Upon submission, a 6-digit PIN will be sent to the provided phone number via SMS
6. When a child watches a video, a notification will be sent to the parent's phone

## Troubleshooting

### SMS Not Being Sent

1. Verify your Twilio credentials are correct
2. Check that your Twilio account has sufficient balance
3. If using a trial account, verify the recipient phone number is confirmed in your Twilio account
4. Check the server console for error messages

### Server Connection Issues

1. Ensure the Node.js server is running on port 3000
2. Check for any error messages in the server console
3. Verify that there are no firewall or network restrictions blocking the connection

## Production Considerations

For a production environment, consider the following:

1. Use environment variables for Twilio credentials instead of hardcoding them
2. Implement proper error handling and logging
3. Add rate limiting to prevent abuse
4. Use HTTPS for secure communication
5. Consider implementing a message queue for handling high volumes of SMS messages

## Additional Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Node.js Helper Library](https://www.twilio.com/docs/libraries/node)
- [Express.js Documentation](https://expressjs.com/)
