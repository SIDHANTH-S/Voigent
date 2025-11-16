import express from 'express';
import dotenv from 'dotenv';
import { makeCall, generateTwiML, generateGoodbyeTwiML } from './twilioService.js';
import { AIService } from './aiService.js';
import { businessData } from './businessData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TARGET_PHONE = process.env.TARGET_PHONE_NUMBER;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Store active call sessions
const callSessions = new Map();

/**
 * Route to initiate an outbound call
 * GET /make-call
 */
app.get('/make-call', async (req, res) => {
  try {
    if (!TARGET_PHONE) {
      return res.status(400).json({ 
        error: 'TARGET_PHONE_NUMBER not configured in .env file' 
      });
    }

    const callbackUrl = `${BASE_URL}/voice`;
    const call = await makeCall(TARGET_PHONE, callbackUrl);

    res.json({
      success: true,
      message: 'Call initiated successfully',
      callSid: call.sid,
      to: TARGET_PHONE,
      status: call.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route for manual call initiation with custom number
 * POST /make-call
 */
app.post('/make-call', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        error: 'Phone number is required' 
      });
    }

    const callbackUrl = `${BASE_URL}/voice`;
    const call = await makeCall(phoneNumber, callbackUrl);

    res.json({
      success: true,
      message: 'Call initiated successfully',
      callSid: call.sid,
      to: phoneNumber,
      status: call.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Voice webhook - handles incoming call and initial greeting
 * POST /voice
 */
app.post('/voice', (req, res) => {
  const callSid = req.body.CallSid;
  
  // Create new AI service instance for this call
  const aiService = new AIService();
  callSessions.set(callSid, aiService);

  // Get opening message
  const greeting = aiService.getOpeningMessage();

  // Generate TwiML with speech gathering
  const twiml = generateTwiML(greeting, `${BASE_URL}/voice/gather`);

  res.type('text/xml');
  res.send(twiml);

  console.log(`📞 Call started: ${callSid}`);
  console.log(`🎙️ AI: ${greeting}`);
});

/**
 * Gather user speech input and respond
 * POST /voice/gather
 */
app.post('/voice/gather', async (req, res) => {
  const callSid = req.body.CallSid;
  const userSpeech = req.body.SpeechResult || '';

  console.log(`🗣️ User: ${userSpeech}`);

  // Get AI service for this call
  const aiService = callSessions.get(callSid);

  if (!aiService) {
    const twiml = generateGoodbyeTwiML('Sorry, there was an error. Goodbye!');
    res.type('text/xml');
    res.send(twiml);
    return;
  }

  try {
    // Generate AI response
    const aiResponse = await aiService.generateResponse(userSpeech);
    console.log(`🤖 AI: ${aiResponse}`);

    // Check if user wants to end call
    if (aiService.isGoodbye(userSpeech.toLowerCase())) {
      const twiml = generateGoodbyeTwiML(aiResponse);
      callSessions.delete(callSid);
      res.type('text/xml');
      res.send(twiml);
      console.log(`📴 Call ended: ${callSid}`);
      return;
    }

    // Continue conversation
    const twiml = generateTwiML(aiResponse, `${BASE_URL}/voice/gather`);
    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('Error processing speech:', error);
    const twiml = generateGoodbyeTwiML('Sorry, I encountered an error. Goodbye!');
    callSessions.delete(callSid);
    res.type('text/xml');
    res.send(twiml);
  }
});

/**
 * Call status webhook
 * POST /voice/status
 */
app.post('/voice/status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;

  console.log(`📊 Call ${callSid} status: ${callStatus}`);

  // Clean up session when call ends
  if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
    callSessions.delete(callSid);
    console.log(`🗑️ Cleaned up session for call: ${callSid}`);
  }

  res.sendStatus(200);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeCalls: callSessions.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get business data (for debugging)
 */
app.get('/business-data', (req, res) => {
  res.json(businessData);
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Business Voice Agent',
    version: '1.0.0',
    endpoints: {
      makeCall: 'GET /make-call',
      makeCallCustom: 'POST /make-call (body: { phoneNumber: "+1234567890" })',
      health: 'GET /health',
      businessData: 'GET /business-data'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Business Voice Agent Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📞 Ready to make calls to: ${TARGET_PHONE || 'Not configured'}`);
  console.log('\n📋 Available endpoints:');
  console.log(`   GET  ${BASE_URL}/make-call - Initiate call to default number`);
  console.log(`   POST ${BASE_URL}/make-call - Initiate call to custom number`);
  console.log(`   GET  ${BASE_URL}/health - Health check`);
  console.log(`   GET  ${BASE_URL}/business-data - View business data`);
  console.log('\n⚠️  Make sure to expose this server with ngrok for Twilio webhooks!');
});

export default app;
