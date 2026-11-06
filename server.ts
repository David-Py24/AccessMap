/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  STOREFRONT_ANALYSIS_SYSTEM_INSTRUCTION,
  STOREFRONT_ANALYSIS_USER_PROMPT,
} from './src/prompts/storefrontPrompt.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Increase payload size for base64 storefront photo uploads
  app.use(express.json({ limit: '20mb' }));

  // Helper to get Gemini client
  const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Route: Multimodal Storefront Accessibility Analyzer
  app.post('/api/analyze-storefront', async (req, res) => {
    try {
      const { image, imageUrl } = req.body;

      if (!image && !imageUrl) {
        return res.status(400).json({
          error: 'Please provide a storefront image (base64 data or image URL).',
        });
      }

      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (image && typeof image === 'string') {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.replace(/^data:[^;]+;base64,/, '');
        }
      } else if (imageUrl && typeof imageUrl === 'string') {
        // Fetch remote image and convert to buffer
        try {
          const fetchRes = await fetch(imageUrl);
          if (!fetchRes.ok) {
            throw new Error(`Failed to fetch image from URL: ${fetchRes.statusText}`);
          }
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Data = buffer.toString('base64');
          const contentType = fetchRes.headers.get('content-type');
          if (contentType) mimeType = contentType;
        } catch (fetchErr: any) {
          return res.status(400).json({
            error: `Unable to download image: ${fetchErr.message || 'Network error'}`,
          });
        }
      }

      const ai = getAIClient();

      if (!ai) {
        // Return informative simulated response when API key is not configured in local environment
        console.warn('GEMINI_API_KEY is not set. Returning demo-ready simulated analysis.');
        return res.json({
          detected_features: [
            {
              tag: 'Wheelchair-accessible entrance',
              confidence: 0.94,
              evidence: 'Visual inspection shows wide double entry doors with zero-threshold ground clearance.',
            },
            {
              tag: 'Ramp available',
              confidence: 0.88,
              evidence: 'Continuous low-incline concrete access ramp visible alongside the main sidewalk.',
            },
            {
              tag: 'Wide aisles / pathways',
              confidence: 0.82,
              evidence: 'Unobstructed clearance of at least 1.2 meters at the vestibule foyer.',
            },
          ],
          possible_barriers: [
            'Exterior pavement shows mild surface wear; check for slip hazards during rain.',
          ],
          summary:
            'Storefront exhibits strong physical accessibility with step-free entrance and visible ramp access.',
          suggested_tags: [
            'Wheelchair-accessible entrance',
            'Ramp available',
            'Wide aisles / pathways',
          ],
          source: 'simulation_fallback',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: STOREFRONT_ANALYSIS_USER_PROMPT,
            },
          ],
        },
        config: {
          systemInstruction: STOREFRONT_ANALYSIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detected_features: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tag: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    evidence: { type: Type.STRING },
                  },
                  required: ['tag', 'confidence', 'evidence'],
                },
              },
              possible_barriers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              summary: { type: Type.STRING },
              suggested_tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['detected_features', 'possible_barriers', 'summary', 'suggested_tags'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response. The photo might be unclear or occluded.');
      }

      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Storefront analysis error:', err);
      return res.status(500).json({
        error:
          err.message ||
          'Failed to analyze storefront photo. Please ensure the image is clear and shows the entrance.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AccessMap server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
