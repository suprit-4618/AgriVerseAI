# BHOOMI — FULL REBUILD DIRECTIVE (for Antigravity)

Give this to the agent together with `bhoomi_system_prompt.md`. This file covers the *engineering* spec; the other file covers the *persona/behavior* spec. Both are needed — one without the other reproduces the old bugs.

---

## 1. RESET INSTRUCTION

> Delete the entire existing Bhoomi assistant implementation: the old system prompt/persona logic, the chat-handling code, and the voice/TTS integration code. Do not adapt, patch, or reuse any of it. Rebuild from scratch against the spec below. Keep existing env vars / API key setup and any unrelated app infrastructure (auth, database, UI shell) untouched.

---

## 2. TEXT GENERATION LAYER

- Use a current Gemini flash-tier text model for the conversational reply (check your Gemini API access for the latest available flash model id — do not hardcode an old/deprecated one).
- Set the persona prompt (`bhoomi_system_prompt.md`) as the `system_instruction` for this model — not as a prepended user message.
- **Use streaming** (`generateContentStream` or the SDK's streaming equivalent), not a single blocking call. The UI should start showing text the moment the first tokens arrive, not after the full response completes.
- Don't resend the full raw chat history forever — trim or summarize older turns once the conversation gets long, or every turn gets slower as the conversation grows.

---

## 3. VOICE / TTS LAYER — THIS IS WHERE THE CURRENT BUG LIVES

**Required:** the actual Gemini TTS model, called the correct way.

- Model: `gemini-2.5-flash-preview-tts`
- Called via `generateContent` (same Gemini API family, not a separate Cloud Text-to-Speech product) with:
  - `responseModalities: ["AUDIO"]`
  - `speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName: "Kore"`
- The response comes back as **raw PCM audio** (typically 24kHz, 16-bit, base64-encoded inline data) — it is NOT a ready-to-play MP3/WAV file. You must wrap it in a WAV header (or feed it directly into the Web Audio API as PCM) before playback. If the old code expected a standard audio file format and got raw PCM instead, playback may have silently failed and fallen back to something else — which would explain the robotic voice.

**Explicitly check for and remove, anywhere in the codebase:**
- `window.speechSynthesis` / `SpeechSynthesisUtterance` (browser's built-in TTS — this produces exactly the flat, robotic voice you're hearing, and is a very common leftover placeholder).
- Any call to the older `texttospeech.googleapis.com` REST endpoint — that's Google's separate Cloud TTS product, not Gemini's TTS, and sounds noticeably more robotic than Kore.
- Any silent `catch` block that swallows a TTS error and falls back to a default/system voice without surfacing the failure. If the Gemini TTS call is failing, you want to see that error in logs, not have it quietly replaced by a worse voice.

---

## 4. LATENCY — PIPELINE THE TWO CALLS, DON'T CHAIN THEM FULLY SEQUENTIALLY

The biggest perceived-speed win: don't wait for the entire text reply before starting audio generation.

- As the text model streams its response, **buffer it into sentence-sized chunks** (split on `. ` `? ` `! ` or Kannada equivalents `। ` if relevant).
- As soon as one sentence is complete, send *that sentence* to the TTS model and begin playback of its audio while the next sentence is still being generated/converted.
- Queue and play audio chunks back-to-back in order, rather than waiting for one giant audio blob covering the whole reply.
- Make sure TTS isn't accidentally being triggered twice per turn (e.g., once for a "preview" and once for "final") — that doubles both cost and latency.
- Make sure nothing unrelated is blocking the critical path (e.g., a moderation call, a translation call, an analytics call) before the first audio chunk can start.

---

## 5. HOW TO VERIFY THE REBUILD ACTUALLY WORKS

- **Voice check:** the audio should sound like natural, expressive speech with real intonation — distinctly *not* flat or monotone. If it still sounds like classic robotic TTS, the Gemini TTS call still isn't being hit; check for a silent fallback.
- **Latency check:** the first word of audio should start within roughly 1–3 seconds of sending a message, not after the full multi-sentence reply has been generated and converted. If you're seeing many seconds of total silence first, the sentence-level pipelining in Section 4 isn't wired up yet.
- **Language check:** test with English, Kannada script, and romanized Kannada ("Nimma hesaru enu?") input to confirm the persona prompt's language detection is behaving as specified.
