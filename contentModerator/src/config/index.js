const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'meta/llama-3.1-405b-instruct',
};
