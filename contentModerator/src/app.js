const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { swaggerUi, specs } = require('./config/swaggerDocs');
const contentRoutesV1 = require('./routes/contentRoutesV1');
const contentRoutesV2 = require('./routes/contentRoutesV2');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Content Moderation API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
}));

app.use('/api/v1/content', contentRoutesV1);
app.use('/api/v2/content', contentRoutesV2);

app.get('/', (req, res) => {
  res.json({
    name: 'Content Moderation API',
    version: '2.0.0',
    description: 'Advanced multilingual content moderation with AI integration',
    endpoints: {
      v1: {
        description: 'Custom rules-based multilingual moderation',
        check: 'POST /api/v1/content/check',
        clean: 'POST /api/v1/content/clean'
      },
      v2: {
        description: 'Google Perspective API with hybrid analysis',
        analyze: 'POST /api/v2/content/analyze',
        clean: 'POST /api/v2/content/clean',
        hybridAnalysis: 'POST /api/v2/content/hybrid-analysis',
        batchAnalysis: 'POST /api/v2/content/batch-analysis',
        history: 'GET /api/v2/content/history'
      }
    },
    documentation: '/api-docs',
    features: [
      'Multilingual support (English, Hindi, Hinglish, Punjabi)',
      'AI-powered toxicity detection',
      'Hybrid analysis combining custom rules and AI',
      'Batch processing capabilities',
      'Advanced content cleaning',
      'Real-time analysis'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      customRules: 'operational',
      perspectiveAPI: config.perspectiveApiKey ? 'configured' : 'not_configured',
      multilingual: 'operational'
    }
  });
});

app.use((err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.message);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Content Moderation API v2.0 running on port ${PORT}`);
  console.log(`📚 Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 API Overview: http://localhost:${PORT}/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});
