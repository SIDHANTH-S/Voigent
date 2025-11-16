import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Make an outbound call using Twilio
 * @param {string} toPhoneNumber - The phone number to call
 * @param {string} callbackUrl - The URL Twilio will request for call instructions
 * @returns {Promise<Object>} - Call details
 */
export async function makeCall(toPhoneNumber, callbackUrl) {
  try {
    const call = await client.calls.create({
      url: callbackUrl,
      to: toPhoneNumber,
      from: twilioPhoneNumber,
      record: true, // Optional: record the call
      statusCallback: `${callbackUrl}/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    console.log(`Call initiated: ${call.sid}`);
    return call;
  } catch (error) {
    console.error('Error making call:', error);
    throw error;
  }
}

/**
 * Generate TwiML for text-to-speech
 * @param {string} text - The text to speak
 * @param {string} gatherUrl - URL to send user input (if gathering input)
 * @returns {string} - TwiML XML
 */
export function generateTwiML(text, gatherUrl = null) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (gatherUrl) {
    // Gather user speech input
    const gather = response.gather({
      input: 'speech',
      action: gatherUrl,
      speechTimeout: 'auto',
      language: 'en-US',
      enhanced: true
    });
    gather.say({ voice: 'Polly.Joanna' }, text);
  } else {
    // Just speak the text
    response.say({ voice: 'Polly.Joanna' }, text);
  }

  return response.toString();
}

/**
 * Generate TwiML to play audio from URL
 * @param {string} audioUrl - URL of the audio file to play
 * @param {string} gatherUrl - URL to send user input (if gathering input)
 * @returns {string} - TwiML XML
 */
export function generateTwiMLWithAudio(audioUrl, gatherUrl = null) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (gatherUrl) {
    const gather = response.gather({
      input: 'speech',
      action: gatherUrl,
      speechTimeout: 'auto',
      language: 'en-US',
      enhanced: true
    });
    gather.play(audioUrl);
  } else {
    response.play(audioUrl);
  }

  return response.toString();
}

/**
 * End call with goodbye message
 * @param {string} text - Goodbye message
 * @returns {string} - TwiML XML
 */
export function generateGoodbyeTwiML(text) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  response.say({ voice: 'Polly.Joanna' }, text);
  response.hangup();

  return response.toString();
}
