class ValidationService {
  validateContentRequest(req) {
    const { text } = req.body;
    
    if (!text) {
      return {
        isValid: false,
        error: 'Text content is required'
      };
    }

    if (typeof text !== 'string') {
      return {
        isValid: false,
        error: 'Text must be a string'
      };
    }

    if (text.trim().length === 0) {
      return {
        isValid: false,
        error: 'Text cannot be empty'
      };
    }

    return { isValid: true };
  }

  validateBatchRequest(req) {
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return {
        isValid: false,
        error: 'Array of texts is required'
      };
    }

    if (texts.length === 0) {
      return {
        isValid: false,
        error: 'At least one text is required'
      };
    }

    if (texts.length > 50) {
      return {
        isValid: false,
        error: 'Maximum 50 texts allowed per batch'
      };
    }

    return { isValid: true };
  }

  validateTextLength(text, maxLength) {
    if (text.length > maxLength) {
      return {
        isValid: false,
        error: `Text too large. Maximum ${maxLength} characters allowed`,
        textLength: text.length,
        maxLength
      };
    }
    return { isValid: true };
  }
}

module.exports = new ValidationService();
