import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import roomsRouter from './routes/rooms.js';
import { initWebSocketServer } from './websocket/server.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1/rooms', roomsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Money Guesser backend running on port ${PORT}`);
  console.log(`📡 HTTP API: http://localhost:${PORT}/v1`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/rooms/{roomCode}?token={token}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
