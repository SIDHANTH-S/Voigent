import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default female voice (Sarah)

/**
 * Convert text to speech using 11Labs API
 * @param {string} text - The text to convert to speech
 * @returns {Promise<Buffer>} - Audio buffer
 */
export async function textToSpeech(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: text,
        model_id: 'eleven_turbo_v2_5',  // Updated to new model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error generating speech:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Stream text to speech using 11Labs WebSocket API
 * This is better for real-time conversational AI
 * @param {string} text - The text to convert to speech
 * @returns {Promise<Stream>} - Audio stream
 */
export async function textToSpeechStream(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: 'stream'
    });

    return response.data;
  } catch (error) {
    console.error('Error streaming speech:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get available voices from 11Labs
 */
export async function getVoices() {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.elevenlabs.io/v1/voices',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    return response.data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error.response?.data || error.message);
    throw error;
  }
}
