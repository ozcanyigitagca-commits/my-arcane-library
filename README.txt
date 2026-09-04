MY ARCANE LIBRARY v12 — GEMINI / SMART LIBRARIAN

V12 includes:
- Arcane AI 2.0 chat using Gemini through Supabase Edge Function
- AI Health Check with real Gemini connectivity diagnostics
- AI-powered personalized 5-book recommendations with add-to-shelf buttons
- Local library insight profile
- Advanced statistics: genres, last 14 days, top-rated books, completion rate
- Existing Supabase Auth, books sync, friends, friend requests and reviews preserved
- JSON backup/restore updated to v12
- Gemini API key remains server-side as GEMINI_API_KEY

SUPABASE
Project: khmcgiklbnogsamvqjrj
Edge Function: arcane-ai (deployed separately)

SECRET
Create Supabase Edge Function Secret:
GEMINI_API_KEY = your Google AI Studio API key
Optional:
GEMINI_MODEL = gemini-2.5-flash

IMPORTANT
Never put GEMINI_API_KEY into index.html.
If AI fails, open Arcane AI and press “AI Bağlantısını Test Et”; V12 shows the real Gemini HTTP/error message.
