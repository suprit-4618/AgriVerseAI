import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/sarvam': {
            target: 'https://api.sarvam.ai',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/sarvam/, ''),
            secure: false
          },
          '/api/groq': {
            target: 'https://api.groq.com/openai/v1',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/groq/, ''),
            secure: false
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
        'process.env.SARVAM_API_KEY': JSON.stringify(env.SARVAM_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
