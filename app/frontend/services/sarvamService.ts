import { Language } from '../types';

const getSarvamKey = (): string => {
  return (import.meta as any).env?.VITE_SARVAM_API_KEY || 
         (typeof process !== 'undefined' ? process.env.SARVAM_API_KEY : '') || 
         '';
};

/**
 * Generates natural Indian voice speech using Sarvam AI Bulbul:v3
 * @param text The text string to synthesize into speech
 * @param language The current language (Language.KN or Language.EN)
 * @returns Base64 encoded audio string (WAV format) or null on failure
 */
export const generateSarvamSpeech = async (
  text: string,
  language: Language
): Promise<string | null> => {
  const apiKey = getSarvamKey();
  if (!apiKey) {
    return null;
  }

  const cleanText = text.trim();
  if (!cleanText) return null;

  const target_language_code = language === Language.KN ? 'kn-IN' : 'en-IN';
  const urls = ['/api/sarvam/text-to-speech', 'https://api.sarvam.ai/text-to-speech'];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: [cleanText],
          target_language_code,
          speaker: 'kavya',
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          speech_sample_rate: 22050,
          enable_preprocessing: true,
          model: 'bulbul:v3'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audios?.[0]) return data.audios[0];
      }
    } catch (error) {
      // try next url
    }
  }

  return null;
};

/**
 * Transcribes spoken audio into accurate text using Sarvam AI Saaras:v3 (Specialized Indian & Kannada STT)
 * @param audioBlob The audio recording captured from the microphone
 * @param language The target language
 * @returns Transcribed text string
 */
export const transcribeSarvamAudio = async (
  audioBlob: Blob,
  language: Language
): Promise<string> => {
  const apiKey = getSarvamKey();
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY_MISSING');
  }

  const urls = ['/api/sarvam/speech-to-text', 'https://api.sarvam.ai/speech-to-text'];
  let lastError = '';

  for (const url of urls) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'speech.wav');
      formData.append('model', 'saaras:v3');
      formData.append('language_code', language === Language.KN ? 'kn-IN' : 'en-IN');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return (data.transcript || '').trim();
      } else {
        lastError = await response.text();
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  throw new Error(`Sarvam STT failed: ${lastError}`);
};
