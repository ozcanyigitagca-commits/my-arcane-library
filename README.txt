MY ARCANE LIBRARY V12 — GEMINI SMART LIBRARIAN FIXED

V12.1 fixes the Arcane AI response quality issue:
- Direct answers: no unwanted greetings unless the user greets first.
- Uses the full library context with concrete stats.
- Chat history is sent to Gemini for continuity.
- No more incomplete one-line generic answers by prompt design.
- Real AI health check performs a tiny Gemini request.
- Personalized recommendations use structured JSON output.
- Recommendation cards are filtered against the user's existing library.
- Gemini 3.6 Flash is the default model and sampling temperature is not sent.
- Detailed API errors are returned to the UI without exposing the API key.

SUPABASE
Project: khmcgiklbnogsamvqjrj
Edge Function: arcane-ai
The function is deployed with JWT verification enabled.

SECRET
Create:
GEMINI_API_KEY = your Google AI Studio API key
Optional:
GEMINI_MODEL = gemini-3.6-flash

Never put GEMINI_API_KEY into index.html.
