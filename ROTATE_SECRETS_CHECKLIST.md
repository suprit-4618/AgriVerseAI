# AgriVerseAI Security Rotation Checklist

Following the Vercel security alert on August 31, 2026, all secrets configured in Vercel for this project must be rotated immediately.

## 1. Google Gemini API Key
- **Where used:** Plant disease analysis, Gemini Vision, Gemini TTS, Soil analysis (pp/frontend/services/geminiService.ts, pp/backend/api.py).
- **Action:**
  1. Open [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Create a new API Key.
  3. Delete/revoke the previously active key.
  4. Update GEMINI_API_KEY / VITE_GEMINI_API_KEY in your local .env and in the Vercel Project Settings.

## 2. Groq AI API Key
- **Where used:** Groq LLM fallback & chat (pp/frontend/services/groqService.ts).
- **Action:**
  1. Open [Groq Console](https://console.groq.com/keys).
  2. Create a new API key.
  3. Delete/revoke the old key.
  4. Update GROQ_API_KEY / VITE_GROQ_API_KEY in local .env and Vercel.

## 3. Supabase Database & Auth
- **Where used:** Backend database operations (pp/backend/.env.template).
- **Action:**
  1. Open [Supabase Dashboard](https://app.supabase.com/).
  2. Go to **Project Settings** > **API**.
  3. Rotate the Database Password and Anon / Service Role Keys if exposed.
  4. Update SUPABASE_URL and SUPABASE_KEY.

## 4. JWT Secret Key
- **Where used:** Backend user authentication (pp/backend/jwt_auth.py).
- **Action:**
  1. Generate a new high-entropy string (e.g. openssl rand -hex 32 or random 64-char string).
  2. Update JWT_SECRET in pp/backend/.env and production settings.

## 5. Firebase / Service Account Key
- **Where used:** Client auth and Firestore (pp/frontend/services/firebaseClient.ts, pp/backend/serviceAccountKey.json).
- **Action:**
  1. If serviceAccountKey.json was set in any environment variable, generate a new private key in [Firebase Console](https://console.firebase.google.com/) > **Project Settings** > **Service accounts** and delete the old one.

## 6. Vercel Project Settings
- **Action:**
  1. Open [Vercel Dashboard](https://vercel.com/dashboard).
  2. Open project **agri-verse-ai** > **Settings** > **Environment Variables**.
  3. Update all variables with the new values.
  4. Toggle the **\"Sensitive\"** option for each secret to ensure values cannot be read in plaintext via UI/API.
