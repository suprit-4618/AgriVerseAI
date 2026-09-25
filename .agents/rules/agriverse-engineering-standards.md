# AgriVerseAI Engineering & Architectural Standards

## 1. 100% Free-Tier Stack Principle
* **Database & Authentication**: Firebase Spark Plan (Firebase Auth + Cloud Firestore). Free reads/writes, real-time WebSocket subscriptions (`onSnapshot`).
* **AI & Vision Engine**: Google AI Studio Gemini 2.5 Flash free tier for text streaming and sub-second multimodal plant disease diagnosis.
* **Voice & Speech Engine**: Single-stream Web Audio API + Gemini Flash Audio output. Zero paid subscriptions or third-party paid voice keys.
* **Market & Commodity Rates**: Open/Free APIs (data.gov.in / Agmarknet) or dynamic market models.
* **Rule**: Never introduce paid API keys, paid credits, or paid services into the codebase.

## 2. Engineering Standards (Zero AI Slop)
* Build features **modularly and end-to-end**:
  1. Strict TypeScript contracts and schemas in `types.ts`.
  2. Real database CRUD operations and real-time state listeners (`onSnapshot`).
  3. UI components bound directly to live state with optimistic updates, loading skeletons, and error boundaries.
* Never use hardcoded fake mocks disguised as functioning features.

## 3. Strict Agricultural Domain Guardrails for Bhoomi Assistant
* System prompt must enforce strict domain boundaries:
  * Only answer queries related to agriculture, crops, soil health, plant disease diagnostics, weather, farming machinery, market rates, and government schemes.
  * Politely refuse out-of-domain requests (e.g. coding, entertainment, general chit-chat) and redirect the user back to farming.

## 4. Single Audio Pipeline & Voice Sync
* All speech output must flow through a centralized, single-instance Web Audio queue.
* When a new speech request begins or the user cancels, immediately invalidate prior audio session tokens and call `.stop()` on any active `AudioBufferSourceNode`.
* Never trigger `window.speechSynthesis` and Gemini Web Audio at the same time.

## 5. Multi-Role Realtime State Synchronization
* Collections: `users`, `crops_market`, `orders`, `disease_logs`, `market_rates`.
* Changes made by **Admin** (approvals, price ceilings, flags) must propagate in real time to **Farmer** and **Buyer** dashboards via Firestore listeners.
