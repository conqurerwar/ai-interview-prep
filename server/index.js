const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });

const mongoose = require('mongoose');

const cvRoutes = require('./routes/cvRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.set('bufferTimeoutMS', 30000);
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4 // Force IPv4
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Connection Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error('Mongoose runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected');
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/interview', interviewRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
