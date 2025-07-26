class ErrorHandlingService {
  handleControllerError(error, version, operation, res) {
    console.error(`Error in ${operation}:`, error);
    
    res.status(500).json({
      error: `Failed to ${operation}`,
      details: error.message,
      version: version,
      timestamp: new Date().toISOString()
    });
  }

  handleValidationError(validation, version, res) {
    res.status(400).json({
      error: validation.error,
      version: version,
      timestamp: new Date().toISOString()
    });
  }

  handleTextLengthError(validation, version, res) {
    res.status(400).json({
      error: validation.error,
      version: version,
      textLength: validation.textLength,
      maxLength: validation.maxLength,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new ErrorHandlingService();
