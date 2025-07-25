const express = require('express');
const cors = require('cors');
const config = require('./config');
const contentRoutes = require('./routes/contentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/content', contentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message
  });
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
