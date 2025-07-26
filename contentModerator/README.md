# Content Moderator API v2.0

Advanced multilingual content moderation API with AI integration, supporting 5 languages and hybrid analysis combining custom rules with Google Perspective API.

## Features

- **Multilingual Support**: English, Hindi, Hinglish, Punjabi
- **AI-Powered Analysis**: Google Perspective API integration
- **Hybrid Analysis**: Custom rules + AI for optimal accuracy
- **High Performance**: Caching, chunking, and rate limiting
- **Production Ready**: Security headers, compression, logging
- **Comprehensive API**: RESTful endpoints with Swagger documentation

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file:

```env
PORT=5000
PERSPECTIVE_API_KEY=your_google_api_key_here
MAX_TEXT_LENGTH=50000
CHUNK_SIZE=5000
CACHE_MAX_SIZE=1000
```

### Development

```bash
npm run dev
```

### Production

```bash
# Using PM2
npm run pm2:start

# Or direct
npm start
```

## API Endpoints

### V1 - Custom Rules
- `POST /api/v1/content/check` - Analyze content
- `POST /api/v1/content/clean` - Clean content

### V2 - AI Enhanced
- `POST /api/v2/content/analyze` - AI analysis
- `POST /api/v2/content/hybrid-analysis` - Hybrid analysis
- `POST /api/v2/content/batch-analysis` - Batch processing

### Documentation
- `GET /api-docs` - Swagger UI
- `GET /health` - Health check

## Example Usage

```javascript
// V1 - Custom Rules
const response = await fetch('/api/v1/content/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Your content here",
    useEnhanced: true
  })
});

// V2 - AI Enhanced
const response = await fetch('/api/v2/content/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Your content here",
    requestedAttributes: ['TOXICITY', 'SEVERE_TOXICITY']
  })
});
```

## Performance

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Caching**: Intelligent caching for repeated content
- **Chunking**: Handles large texts up to 50KB
- **Compression**: Gzip compression enabled

## Security

- Helmet.js security headers
- CORS protection
- Input validation and sanitization
- Rate limiting protection

## Monitoring

Access logs are handled by Morgan and stored in `/logs` directory when using PM2.

## License

MIT
