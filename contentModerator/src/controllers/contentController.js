const validationService = require('../services/validationService');
const messageService = require('../services/messageService');
const dataTransformService = require('../services/dataTransformService');
const contentAnalysisService = require('../services/contentAnalysisService');
const errorHandlingService = require('../services/errorHandlingService');

class ContentController {
  constructor() {
    this.checkContent = this.checkContent.bind(this);
    this.cleanContent = this.cleanContent.bind(this);
  }

  async checkContent(req, res) {
    try {
      const validation = validationService.validateContentRequest(req);
      if (!validation.isValid) {
        return errorHandlingService.handleValidationError(validation, 'v1', res);
      }

      const { text, useEnhanced = false, platform, ageGroup, strictMode } = req.body;
      
      let result, responseData;

      if (useEnhanced) {
        result = await contentAnalysisService.performEnhancedAnalysis(text, { platform, ageGroup, strictMode });
        responseData = dataTransformService.buildEnhancedAnalysisResponse(result);
        responseData.version = 'v1-enhanced';
      } else {
        result = await contentAnalysisService.performClassicAnalysis(text);
        const userMessage = messageService.createUserMessage(result);
        responseData = dataTransformService.buildClassicAnalysisResponse(result, userMessage);
        responseData.version = 'v1-classic';
      }

      res.json(responseData);
    } catch (error) {
      errorHandlingService.handleControllerError(error, 'v1', 'check content', res);
    }
  }

  async cleanContent(req, res) {
    try {
      const validation = validationService.validateContentRequest(req);
      if (!validation.isValid) {
        return errorHandlingService.handleValidationError(validation, 'v1', res);
      }

      const { 
        text, 
        useEnhanced = false, 
        cleaningLevel = 'moderate',
        platform, 
        ageGroup, 
        strictMode,
        preserveLength = false
      } = req.body;

      let result, responseData;

      if (useEnhanced) {
        result = await contentAnalysisService.performEnhancedCleaning(text, {
          cleaningLevel, 
          platform, 
          ageGroup, 
          strictMode, 
          preserveLength 
        });
        responseData = dataTransformService.buildEnhancedCleaningResponse(result);
        responseData.version = 'v1-enhanced';
      } else {
        result = await contentAnalysisService.performClassicCleaning(text);
        responseData = dataTransformService.buildClassicCleaningResponse(result);
        responseData.version = 'v1-classic';
      }

      res.json(responseData);
    } catch (error) {
      errorHandlingService.handleControllerError(error, 'v1', 'clean content', res);
    }
  }
}

const controller = new ContentController();
module.exports = controller;
