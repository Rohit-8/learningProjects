# Content Moderation API

An AI-powered content moderation API that can verify and clean text content for inappropriate or abusive content.

## Features

- Check text content for abusive or inappropriate content
- Clean and sanitize text content while maintaining original meaning
- RESTful API endpoints
- Easy to integrate

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` file with your OpenAI API key and other configurations

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Check Content
- **POST** `/api/content/check`
- Request body:
  ```json
  {
    "text": "Content to check for abuse"
  }
  ```
- Response:
  ```json
  {
    "hasAbusiveContent": true|false,
    "reason": "Explanation if abusive, null if clean"
  }
  ```

### Clean Content
- **POST** `/api/content/clean`
- Request body:
  ```json
  {
    "text": "Content to clean"
  }
  ```
- Response:
  ```json
  {
    "originalText": "Original content",
    "cleanedText": "Cleaned content",
    "modificationsExplanation": "Explanation of changes made"
  }
  ```

## Error Handling

The API returns appropriate HTTP status codes:
- 400: Bad Request (missing or invalid input)
- 500: Internal Server Error (processing error)
