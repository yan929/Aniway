// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Location Routes
const locationRoutes = require('./routes/locationRoutes');
app.use('/api/locations', locationRoutes);

// GMap Routes
const gmapRoutes = require('./routes/GMapRoutes');
app.use('/api/gmap', gmapRoutes);

// Root
app.get('/', (req, res) => {
    res.send('AniWay backend is running 🚀');
});

// Error handling middleware
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '::', () => console.log(`Server running on port ${PORT}`));

