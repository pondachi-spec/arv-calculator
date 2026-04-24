require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arv-calculator';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

app.use('/api/arv', require('./routes/arv'));
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve built frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`AI ARV Calculator running on http://localhost:${PORT}`));
