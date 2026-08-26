const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect Database (with automatic graceful fallback)
connectDB();

// API Routes (supports both direct and /api prefixed routes)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/cars', carRoutes);
app.use('/cars', carRoutes);

app.use('/api/seller', sellerRoutes);
app.use('/seller', sellerRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/rentals', rentalRoutes);
app.use('/rentals', rentalRoutes);

app.use('/api/chat', chatRoutes);
app.use('/chat', chatRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.get(['/api/health', '/health', '/api', '/api/'], (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), service: 'CarHub Unified Portal API' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 CarHub Backend Server running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
