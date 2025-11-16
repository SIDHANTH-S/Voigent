import requests
import json

# Your 11Labs API Key
API_KEY = "sk_19418894f070c149ed7799e383c4a5a953a1752cb33e645c"

print("🔍 Testing 11Labs API Key...\n")

# Test 1: Get available voices
print("=" * 60)
print("TEST 1: Fetching available voices")
print("=" * 60)

headers = {
    "xi-api-key": API_KEY
}

try:
    response = requests.get("https://api.elevenlabs.io/v1/voices", headers=headers)
    
    if response.status_code == 200:
        voices = response.json()
        print(f"✅ API Key is valid! Found {len(voices.get('voices', []))} voices\n")
        
        print("Available voices for FREE tier:\n")
        for voice in voices.get('voices', []):
            # Check if voice is available for free tier
            labels = voice.get('labels', {})
            category = voice.get('category', 'unknown')
            
            print(f"📢 Name: {voice['name']}")
            print(f"   ID: {voice['voice_id']}")
            print(f"   Category: {category}")
            print(f"   Description: {voice.get('description', 'N/A')}")
            
            # Check if it's a premade voice (usually free)
            if category == 'premade':
                print(f"   ✅ FREE TIER COMPATIBLE")
            elif 'use_case' in labels:
                print(f"   Use case: {labels['use_case']}")
            
            print()
    else:
        print(f"❌ API Error: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Try to generate speech with different voices
print("\n" + "=" * 60)
print("TEST 2: Testing speech generation")
print("=" * 60 + "\n")

test_voices = [
    ("Rachel", "21m00Tcm4TlvDq8ikWAM"),
    ("Adam", "pNInz6obpgDQGcFmaJgB"),
    ("Bella", "EXAVITQu4vr4xnSDxMaL"),
    ("Antoni", "ErXwobaYiN019PkySvjV"),
    ("Elli", "MF3mGyEYCl7XYWbV9V6O"),
    ("Josh", "TxGEqnHWrfWFTfGW9XjX"),
    ("Arnold", "VR6AewLTigWG4xSOukaG"),
    ("Domi", "AZnzlk1XvdvUeBnXmlld"),
    ("Sam", "yoZ06aMxZJJ28mfd3POQ")
]

test_text = "Hello, this is a test of the voice synthesis."

for name, voice_id in test_voices:
    print(f"Testing {name} (ID: {voice_id})...")
    
    try:
        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": API_KEY
            },
            json={
                "text": test_text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
        )
        
        if tts_response.status_code == 200:
            print(f"   ✅ {name} - WORKS! Audio size: {len(tts_response.content)} bytes")
        else:
            error_data = tts_response.text
            try:
                error_json = json.loads(error_data)
                error_msg = error_json.get('detail', {}).get('status', error_data)
                print(f"   ❌ {name} - Error: {error_msg}")
            except:
                print(f"   ❌ {name} - Error {tts_response.status_code}: {error_data[:100]}")
    
    except Exception as e:
        print(f"   ❌ {name} - Exception: {e}")
    
    print()

print("\n" + "=" * 60)
print("✅ Test Complete!")
print("=" * 60)
print("\n💡 Use one of the voices marked '✅ WORKS!' in your .env file")
print("   Update: ELEVENLABS_VOICE_ID=<voice_id>")
