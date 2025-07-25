const contentModerator = require('../utils/contentModerator');

class ContentController {
  constructor() {
    // Bind methods to the instance
    this.checkContent = this.checkContent.bind(this);
    this.cleanContent = this.cleanContent.bind(this);
  }

  static createUserMessage(result) {
    if (!result.hasAbusiveContent) {
      return "No inappropriate content found.";
    }

    const messages = [];
    const { categories } = result;

    // Check for threats (highest priority)
    if (categories.threats.words.length > 0 || categories.threats.phrases.length > 0) {
      const words = categories.threats.words;
      const phrases = categories.threats.phrases;
      if (words.length > 0) messages.push(`Found threatening word(s): "${words.join('", "')}"`);
      if (phrases.length > 0) messages.push(`Found threatening phrase(s): "${phrases.join('", "')}"`);
    }

    // Check for sexual content
    if (categories.sexual.words.length > 0 || categories.sexual.phrases.length > 0) {
      const words = categories.sexual.words;
      const phrases = categories.sexual.phrases;
      if (words.length > 0) messages.push(`Found inappropriate word(s): "${words.join('", "')}"`);
      if (phrases.length > 0) messages.push(`Found inappropriate phrase(s): "${phrases.join('", "')}"`);
    }

    // Check for abusive content
    if (categories.abusive.words.length > 0 || categories.abusive.phrases.length > 0) {
      const words = categories.abusive.words;
      const phrases = categories.abusive.phrases;
      if (words.length > 0) messages.push(`Found abusive word(s): "${words.join('", "')}"`);
      if (phrases.length > 0) messages.push(`Found abusive phrase(s): "${phrases.join('", "')}"`);
    }

    messages.push(`Content severity level: ${result.severity}`);
    return messages.join('. ');
  }

  async checkContent(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text content is required' });
      }

      const result = contentModerator.findAbusiveContent(text);
      
      // Create a user-friendly response
      const response = {
        hasAbusiveContent: result.hasAbusiveContent,
        severity: result.severity,
        details: {
          abusive: result.categories.abusive,
          sexual: result.categories.sexual,
          threats: result.categories.threats
        },
        message: ContentController.createUserMessage(result)
      };

      res.json(response);
    } catch (error) {
      console.error('Error in content check:', error);
      res.status(500).json({
        error: 'Failed to check content',
        details: error.message
      });
    }
  }

  async cleanContent(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text content is required' });
      }

      const result = contentModerator.cleanContent(text);
      res.json(result);
    } catch (error) {
      console.error('Error in content cleaning:', error);
      res.status(500).json({
        error: 'Failed to clean content',
        details: error.message
      });
    }
  }

  _createUserMessage(result) {
    if (!result.hasAbusiveContent) {
      return "No inappropriate content found.";
    }

    const messages = [];
    const { categories } = result;

    // Check for threats (highest priority)
    if (categories.threats.words.length > 0 || categories.threats.phrases.length > 0) {
      const words = categories.threats.words;
      const phrases = categories.threats.phrases;
      if (words.length > 0) messages.push(`Found threatening word(s): "${words.join('", "')}"`);
      if (phrases.length > 0) messages.push(`Found threatening phrase(s): "${phrases.join('", "')}"`);
    }

    // Check for sexual content
    if (categories.sexual.words.length > 0 || categories.sexual.phrases.length > 0) {
      const words = categories.sexual.words;
      const phrases = categories.sexual.phrases;
      if (words.length > 0) messages.push(`Found inappropriate word(s): "${words.join('", "')}"`);
      if (phrases.length > 0) messages.push(`Found inappropriate phrase(s): "${phrases.join('", "')}"`);
    }

    // Check for abusive content
    if (categories.abusive.words.length > 0 || categories.abusive.phrases.length > 0) {
      const words = categories.abusive.words;
      const phrases = categories.abusive.phrases;
      if (words.length > 0) messages.push(`Found abusive word(s): "${words.join('", "')}"`);
      if (phrases.length > 0) messages.push(`Found abusive phrase(s): "${phrases.join('", "')}"`);
    }

    messages.push(`Content severity level: ${result.severity}`);

    return messages.join('. ');
  }
}

// Export a new instance of the controller
const controller = new ContentController();
module.exports = controller;
