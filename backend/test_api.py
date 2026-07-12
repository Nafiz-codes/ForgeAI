from dotenv import load_dotenv
from openai import OpenAI
import os

# Load environment variables from .env
load_dotenv()

# Get API key
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env")

print("✅ API Key Loaded")
print(f"Starts with: {api_key[:8]}")
print(f"Length: {len(api_key)}")

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

try:
    response = client.responses.create(
        model="gpt-4.1-mini",
        input="Reply with exactly: ForgeAI is online."
    )

    print("\n✅ API Connection Successful!")
    print("Response:")
    print(response.output_text)

except Exception as e:
    print("\n❌ API Connection Failed")
    print(type(e).__name__)
    print(e)