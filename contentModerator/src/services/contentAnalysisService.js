const enhancedContentModerator = require('../utils/enhancedContentModerator');

class ContentAnalysisService {
  async performEnhancedAnalysis(text, options = {}) {
    const { platform, ageGroup, strictMode } = options;
    const analysisOptions = { platform, ageGroup, strictMode };
    
    return await enhancedContentModerator.analyzeContent(text, analysisOptions);
  }

  async performClassicAnalysis(text) {
    return await enhancedContentModerator.analyzeContent(text, { 
      platform: 'general',
      ageGroup: 'adults',
      strictMode: false 
    });
  }

  async performEnhancedCleaning(text, options = {}) {
    const { 
      cleaningLevel = 'moderate', 
      platform, 
      ageGroup, 
      strictMode, 
      preserveLength = false 
    } = options;
    
    const cleaningOptions = { 
      cleaningLevel, 
      platform, 
      ageGroup, 
      strictMode, 
      preserveLength 
    };
    
    return await enhancedContentModerator.cleanContent(text, cleaningOptions);
  }

  async performClassicCleaning(text) {
    return await enhancedContentModerator.cleanContent(text, {
      cleaningLevel: 'moderate',
      platform: 'general',
      ageGroup: 'adults'
    });
  }
}

module.exports = new ContentAnalysisService();
