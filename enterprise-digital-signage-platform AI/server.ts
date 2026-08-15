import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = createServer(app);

  app.use(express.json());

  // WebSocket Server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log('[WebSocket] Client connected. Total clients:', connectedClients.size);

    ws.send(JSON.stringify({
      type: 'INIT_CONNECTED',
      timestamp: new Date().toISOString(),
      message: 'Connected to Enterprise Digital Signage Realtime Hub'
    }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log('[WebSocket] Received:', msg);

        // Broadcast messages to all connected clients (e.g. Player <-> Admin sync)
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      } catch (err) {
        console.error('[WebSocket] Invalid JSON payload:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('[WebSocket] Client disconnected. Total clients:', connectedClients.size);
    });
  });

  // Helper to broadcast WS event
  function broadcastWSEvent(type: string, payload: any) {
    const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Gemini AI API Route
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'GEMINI_API_KEY environment variable is not configured.' 
        });
      }

      const { mode, prompt, systemInstruction } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      if (mode === 'image') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: prompt || 'Modern digital signage announcement poster banner high quality' }]
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9'
            }
          }
        });

        let imageUrl = '';
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        return res.json({ success: true, imageUrl });
      }

      // Default text generation mode (gemini-3.6-flash)
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt || 'Provide a professional digital signage announcement',
        config: {
          systemInstruction: systemInstruction || 'You are an enterprise Digital Signage AI assistant. Return concise, impactful, professional content.'
        }
      });

      const text = response.text || '';
      return res.json({ success: true, text });
    } catch (err: any) {
      console.error('[Gemini API Error]:', err);
      return res.status(500).json({ 
        error: err?.message || 'Failed to generate content with Gemini AI' 
      });
    }
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Enterprise Digital Signage Engine',
      uptime: process.uptime(),
      connectedClients: connectedClients.size,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/emergency/trigger', (req, res) => {
    const { title, message, type, severity, targetScreenIds } = req.body;
    const alert = {
      id: 'emg-' + Date.now(),
      title: title || 'CRITICAL EMERGENCY BROADCAST',
      message: message || 'ATTENTION: Immediate safety procedure active.',
      type: type || 'custom',
      severity: severity || 'critical',
      targetScreenIds: targetScreenIds || [],
      active: true,
      triggeredAt: new Date().toISOString()
    };

    broadcastWSEvent('EMERGENCY_TRIGGERED', alert);
    res.json({ success: true, alert });
  });

  app.post('/api/emergency/clear', (req, res) => {
    const { alertId } = req.body;
    broadcastWSEvent('EMERGENCY_CLEARED', { alertId });
    res.json({ success: true, alertId });
  });

  app.post('/api/control/command', (req, res) => {
    const { screenId, command, payload } = req.body;
    broadcastWSEvent('SCREEN_COMMAND', { screenId, command, payload });
    res.json({ success: true, screenId, command, payload });
  });

  app.post('/api/telemetry/heartbeat', (req, res) => {
    const { screenId, status, storageUsageMb, uptimeSeconds } = req.body;
    broadcastWSEvent('SCREEN_HEARTBEAT', { screenId, status, storageUsageMb, uptimeSeconds });
    res.json({ success: true, receivedAt: new Date().toISOString() });
  });

  // Serve static assets or mount Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Signage Engine] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
