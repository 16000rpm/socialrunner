require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const apiKeyRoutes = require('./routes/apiKeys');
const proxyRoutes = require('./routes/proxy');
const facebookAdsRoutes = require('./routes/facebookAds');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://socialgirl-app-nu.vercel.app',
      'https://socialrunner.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST']
  }
});

// Track online users with their info
const onlineUsers = new Map(); // socketId -> { name, picture, id }

io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  // User joins with their info
  socket.on('userJoin', (userData) => {
    onlineUsers.set(socket.id, {
      id: userData.id,
      name: userData.name || 'Anonymous',
      picture: userData.picture || null
    });
    console.log(`[Socket] User joined: ${userData.name}. Online: ${onlineUsers.size}`);

    // Broadcast updated user list to all clients
    io.emit('onlineUsers', {
      count: onlineUsers.size,
      users: Array.from(onlineUsers.values())
    });
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    console.log(`[Socket] User disconnected: ${user?.name || 'Unknown'}. Online: ${onlineUsers.size}`);

    io.emit('onlineUsers', {
      count: onlineUsers.size,
      users: Array.from(onlineUsers.values())
    });
  });
});

// Trust proxy for Render/production (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://socialgirl-app-nu.vercel.app',
  'https://socialrunner.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Social Runner API is running', onlineUsers });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/facebook', facebookAdsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
