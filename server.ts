import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client if API key exists
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mascot: 'Valerie', course: 'Power Electronics' });
  });

  // Valerie AI Assistant API
  app.post('/api/valerie-ai', async (req, res) => {
    try {
      const { prompt, topic, context } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured. Valerie is using off-line standard manual mode!',
        });
      }

      const systemInstruction = `You are Valerie (瓦莉莉), the cute, enthusiastic purple alien mascot for Professor Katherine A. Kim's Power Electronics courses!
Your appearance: Bright purple alien with two tall eye stalks, a round cute body, wide feet, and a passion for electrical engineering and power converters.
Your mission: Help student pilots repair and design spaceship power electronics systems (Buck Converters, Boost Converters, Buck-Boost, MPPT solar controllers, DC-AC Inverters, Duty Cycle D, Inductor current ripple ΔIL, Capacitor voltage ripple ΔVc, Efficiency, CCM/DCM modes).

Tone and style:
- Friendly, warm, encouraging, and clear.
- Express excitement using emojis like ⚡, 🚀, 💜, 🔋, 🛰️, 🔌.
- When explaining formulas or concepts, break them down clearly into physical intuitive steps.
- Reply in Traditional Chinese (繁體中文) or English depending on user input language (default to Traditional Chinese if user writes Chinese).
- Always stay in character as Valerie the Power Electronics alien!`;

      const userMessage = `[Current Context: ${topic || 'General Power Electronics'}] ${context ? `[Circuit Parameters: ${JSON.stringify(context)}]` : ''}\n\nStudent Question: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Valerie AI Error:', error);
      res.status(500).json({ error: error.message || 'Failed to communicate with Valerie AI' });
    }
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Valerie's Power Electronics Spaceship Workshop running on http://localhost:${PORT}`);
  });
}

startServer();
