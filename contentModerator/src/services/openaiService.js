const { OpenAI } = require('openai');
const config = require('../config');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl,
    });
  }

  async checkContentModeration(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation expert. Analyze the following text and determine if it contains any abusive content. Return a JSON response with format: { "hasAbusiveContent": boolean, "reason": "string if abusive, else null" }'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
        max_tokens: 15000
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error in content moderation:', error);
      throw new Error('Failed to check content moderation');
    }
  }

  async cleanContent(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation expert. Clean the following text by removing any abusive or inappropriate content while maintaining the original meaning as much as possible. Return a JSON response with format: { "originalText": "string", "cleanedText": "string", "modificationsExplanation": "string" }'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error in content cleaning:', error);
      throw new Error('Failed to clean content');
    }
  }
}

module.exports = new OpenAIService();
