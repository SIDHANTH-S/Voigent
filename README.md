# Business Voice Agent 📞🤖

AI-powered voice agent that makes outbound calls to provide business updates using Twilio and 11Labs.

## Features

- 🎙️ **Natural Voice Conversations**: Uses 11Labs for high-quality female voice synthesis
- 📞 **Outbound Calls**: Automatically calls store owners with business updates via Twilio
- 💼 **Business Intelligence**: Provides insights on revenue, expenses, inventory, and customers
- 🤖 **AI-Powered Responses**: Intelligent conversational AI that understands business queries
- 📊 **Real-time Data**: Synced with complete business data from your database

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher)
2. **Twilio Account** - [Sign up here](https://www.twilio.com/try-twilio)
   - Get Account SID and Auth Token
   - Purchase a phone number with voice capabilities
3. **11Labs Account** - [Sign up here](https://elevenlabs.io/)
   - Get API Key
   - Choose a female voice ID (default: Sarah)
4. **ngrok** (for local development) - [Download here](https://ngrok.com/)

## Setup Instructions

### 1. Install Dependencies

```bash
cd VoiceAgent
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# 11Labs API Key
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# Server Configuration
PORT=3000
BASE_URL=https://your-ngrok-url.ngrok.io

# Target Phone Number
TARGET_PHONE_NUMBER=+
```

### 3. Expose Your Server with ngrok

In a separate terminal, run:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update `BASE_URL` in your `.env` file.

### 4. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Usage

### Making an Outbound Call

#### Option 1: Call Default Number (from .env)

```bash
curl http://localhost:3000/make-call
```

Or visit in browser: `http://localhost:3000/make-call`

#### Option 2: Call Custom Number

```bash
curl -X POST http://localhost:3000/make-call \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

### Testing the Agent

Once the call is connected, try asking:

- "How's business?"
- "Am I low on anything?"
- "Who's my best customer?"
- "What are my expenses?"
- "Show me revenue"
- "Tell me about profit"

## Project Structure

```
VoiceAgent/
├── index.js              # Main Express server
├── twilioService.js      # Twilio integration (calls, TwiML)
├── elevenLabsService.js  # 11Labs voice synthesis
├── aiService.js          # AI conversation logic
├── businessData.js       # Complete business knowledge base
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md            # This file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info and available endpoints |
| GET | `/make-call` | Initiate call to default number |
| POST | `/make-call` | Initiate call to custom number |
| POST | `/voice` | Twilio webhook for call initiation |
| POST | `/voice/gather` | Handle user speech input |
| POST | `/voice/status` | Call status updates |
| GET | `/health` | Health check |
| GET | `/business-data` | View business data (debug) |

## How It Works

1. **Initiate Call**: You trigger `/make-call` endpoint
2. **Twilio Connects**: Twilio dials the target number
3. **Opening Greeting**: Agent says: "Hey! I'm all synced up with your latest business data..."
4. **Conversation Loop**:
   - User speaks → Twilio transcribes
   - AI processes query → Generates response
   - 11Labs converts to speech (optional upgrade)
   - Response played to user
   - Loop continues until goodbye
5. **Call Ends**: Session cleaned up

## Upgrading to 11Labs Voice

The current implementation uses Twilio's built-in text-to-speech (Polly.Joanna voice). To upgrade to 11Labs:

1. Modify `twilioService.js` to use `generateTwiMLWithAudio()`
2. Generate audio with 11Labs and host it (or stream it)
3. Pass audio URL to TwiML

Example enhancement in `index.js`:

```javascript
import { textToSpeech } from './elevenLabsService.js';

// In /voice/gather route:
const audioBuffer = await textToSpeech(aiResponse);
// Host audio and get URL
const audioUrl = await uploadAudio(audioBuffer);
const twiml = generateTwiMLWithAudio(audioUrl, `${BASE_URL}/voice/gather`);
```

## Business Data

The agent has access to:

- **Revenue**: ₹7,45,031 (all-time), ₹2,92,183 (recent)
- **Profit**: ₹4,37,256 (all-time), ₹1,92,933 (recent)
- **Expenses**: ₹99,250 (recent period)
- **9 Customers**: From High to Low value segments
- **Inventory**: 16+ products with 2 out-of-stock items
- **Expense Categories**: Rent, Salaries, Marketing, Utilities, etc.

All data is defined in `businessData.js` and can be easily updated.

## Troubleshooting

### Call not connecting?
- Verify Twilio phone number is voice-enabled
- Check target number format (E.164: +[country][number])
- Ensure ngrok is running and BASE_URL is updated

### Voice not working?
- Verify 11Labs API key is valid
- Check voice ID exists
- For Twilio voices, use standard Polly voices

### Webhook errors?
- Ensure ngrok URL is HTTPS
- Check server logs for errors
- Verify POST endpoints are accessible

## Cost Considerations

- **Twilio**: ~$0.013/min for outbound calls (US)
- **11Labs**: ~$0.30 per 1000 characters (paid plans)
- **ngrok**: Free tier available

## Next Steps

1. **Integrate with Real Database**: Replace static `businessData.js` with Supabase queries
2. **Add OpenAI/Claude**: Use advanced LLM for better conversation
3. **Scheduled Calls**: Add cron jobs for daily/weekly updates
4. **Multi-language Support**: Add Hindi voice support
5. **Call Recording**: Store and analyze conversations

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Twilio, 11Labs, and Node.js
