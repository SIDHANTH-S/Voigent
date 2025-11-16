import requests
import json

API_KEY = "sk_19418894f070c149ed7799e383c4a5a953a1752cb33e645c"

# New free tier voices from the API
new_voices = [
    ("Sarah", "EXAVITQu4vr4xnSDxMaL"),
    ("Laura", "FGY2WhTYpPnrIDTdsKH5"),
    ("Alice", "Xb7hH8MSUJpSbSDYk0k2"),
    ("Matilda", "XrExE9yKIg1WjnnlVkGX"),
    ("Jessica", "cgSgspJ2msm6clMCkdW9"),
    ("Lily", "pFZP5JQG7iQjIQuC4Bku"),
    ("Eric", "cjVigY5qzO86Huf0OWal"),
    ("Brian", "nPczCjzI2devNBz1zQrb"),
    ("George", "JBFqnCBsd6RMkjVDRZzb"),
]

test_text = "Hello! I'm your AI business assistant. How can I help you today?"

print("🔍 Testing NEW 11Labs voices with TURBO v2.5 model...\n")
print("=" * 60)

for name, voice_id in new_voices:
    print(f"Testing {name} ({voice_id})...")
    
    try:
        # Try with the new turbo model
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": API_KEY
            },
            json={
                "text": test_text,
                "model_id": "eleven_turbo_v2_5",  # Updated model
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
        )
        
        if response.status_code == 200:
            audio_size = len(response.content)
            print(f"   ✅ {name} - WORKS PERFECTLY! Audio: {audio_size:,} bytes")
            
            # Save a sample
            with open(f"test_{name.lower()}.mp3", "wb") as f:
                f.write(response.content)
            print(f"      Saved to: test_{name.lower()}.mp3")
        else:
            try:
                error = response.json()
                print(f"   ❌ {name} - Error: {error}")
            except:
                print(f"   ❌ {name} - Status {response.status_code}")
    
    except Exception as e:
        print(f"   ❌ {name} - Exception: {e}")
    
    print()

print("=" * 60)
print("✅ Test Complete! Check the test_*.mp3 files to hear samples")
print("\n💡 RECOMMENDED VOICES FOR BUSINESS:")
print("   Female: Sarah, Matilda, Alice, Jessica")
print("   Male: Eric, Brian, George")
