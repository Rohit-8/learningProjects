const perspectiveService = require('../services/perspectiveService');
const analysisService = require('../services/analysisService');
const responseBuilder = require('../services/responseBuilder');
const batchProcessor = require('../services/batchProcessor');
const validationService = require('../services/validationService');
const errorHandlingService = require('../services/errorHandlingService');
const config = require('../config');

class ContentControllerV2 {
  constructor() {
    this.analyzeContent = this.analyzeContent.bind(this);
    this.cleanContent = this.cleanContent.bind(this);
    this.hybridAnalysis = this.hybridAnalysis.bind(this);
    this.batchAnalysis = this.batchAnalysis.bind(this);
    this.getAnalysisHistory = this.getAnalysisHistory.bind(this);
  }

  async analyzeContent(req, res) {
    try {
      const validation = validationService.validateContentRequest(req);
      if (!validation.isValid) {
        return errorHandlingService.handleValidationError(validation, 'v2', res);
      }

      const { 
        text, 
        attributes, 
        includeRecommendations = true,
        useMultilingual = true,
        platform,
        ageGroup,
        strictMode
      } = req.body;

      const lengthValidation = validationService.validateTextLength(text, config.content.maxTextLength);
      if (!lengthValidation.isValid) {
        return errorHandlingService.handleTextLengthError(lengthValidation, 'v2', res);
      }

      const { perspectiveResult, multilingualResult } = await analysisService.performHybridAnalysis(text, {
        attributes,
        useMultilingual,
        platform,
        ageGroup,
        strictMode
      });
      
      const response = responseBuilder.buildAnalysisResponse(perspectiveResult, multilingualResult, {
        text,
        includeRecommendations,
        useMultilingual
      });

      const startTime = Date.now();
      response.metadata.processingTime = Date.now() - startTime;

      res.json(response);
    } catch (error) {
      errorHandlingService.handleControllerError(error, 'v2', 'analyze content', res);
    }
  }

  async cleanContent(req, res) {
    try {
      const validation = validationService.validateContentRequest(req);
      if (!validation.isValid) {
        return errorHandlingService.handleValidationError(validation, 'v2', res);
      }

      const { text, cleaningLevel = 'moderate', preserveLength = false } = req.body;

      const analysis = await perspectiveService.analyzeComment(text);
      const cleaningResult = await perspectiveService.getSuggestedCleanText(text, analysis.detectedIssues);
      
      const response = {
        version: 'v2',
        timestamp: new Date().toISOString(),
        cleaning: {
          original: {
            text: text,
            length: text.length,
            wordCount: text.split(/\s+/).length
          },
          cleaned: {
            text: cleaningResult.suggestedText,
            length: cleaningResult.suggestedText.length,
            wordCount: cleaningResult.suggestedText.split(/\s+/).length
          },
          changes: {
            applied: cleaningResult.changesApplied,
            note: cleaningResult.cleaningNote,
            charactersChanged: Math.abs(text.length - cleaningResult.suggestedText.length),
            preservedMeaning: this.assessMeaningPreservation(text, cleaningResult.suggestedText)
          }
        },
        issuesDetected: analysis.detectedIssues.map(issue => ({
          category: issue.category,
          severity: issue.severity,
          description: issue.description,
          addressed: true
        })),
        qualityScore: {
          original: Math.round((1 - analysis.summary.highestRiskScore) * 100),
          cleaned: this.calculateCleanedQualityScore(analysis.detectedIssues, cleaningResult.changesApplied)
        },
        recommendations: [
          'Review the cleaned text for context and meaning',
          'Consider additional manual editing if needed',
          'Test the cleaned content with your target audience'
        ]
      };

      res.json(response);
    } catch (error) {
      errorHandlingService.handleControllerError(error, 'v2', 'clean content', res);
    }
  }

  async hybridAnalysis(req, res) {
    try {
      const { 
        text, 
        includeV1Analysis = true,
        useEnhancedMultilingual = true,
        platform,
        ageGroup,
        strictMode
      } = req.body;

      if (!text) {
        return res.status(400).json({ 
          error: 'Text content is required',
          version: 'v2-hybrid'
        });
      }

      // Check text length limits
      if (text.length > config.content.maxTextLength) {
        return res.status(400).json({
          error: `Text too large for hybrid analysis. Maximum ${config.content.maxTextLength} characters allowed.`,
          version: 'v2-hybrid',
          suggestion: 'Use batch analysis for larger texts'
        });
      }

      // Run all analyses in parallel for optimal performance
      const analysisPromises = [
        perspectiveService.analyzeComment(text)
      ];

      if (includeV1Analysis) {
        if (useEnhancedMultilingual) {
          const options = { platform, ageGroup, strictMode };
          analysisPromises.push(enhancedContentModerator.analyzeContent(text, options));
        } else {
          analysisPromises.push(Promise.resolve(await enhancedContentModerator.analyzeContent(text, { 
            platform: 'general', 
            ageGroup: 'adults', 
            strictMode: false 
          })));
        }
      }

      const results = await Promise.all(analysisPromises);
      const perspectiveResult = results[0];
      const v1Result = results[1] || null;

      // Create hybrid response combining both analyses
      const response = {
        version: 'v2-hybrid',
        timestamp: new Date().toISOString(),
        analyses: {
          perspective: {
            provider: 'Google Perspective API',
            hasIssues: perspectiveResult.summary.hasAbusiveContent,
            overallRisk: perspectiveResult.summary.overallRisk,
            topIssue: perspectiveResult.summary.highestRiskCategory,
            confidence: this.calculateConfidence(perspectiveResult.summary.highestRiskScore),
            detectedIssues: perspectiveResult.detectedIssues.length
          },
          custom: includeV1Analysis ? {
            provider: 'Custom Rules Engine',
            hasIssues: v1Result.hasAbusiveContent,
            severity: v1Result.severity,
            categories: {
              abusive: v1Result.categories.abusive.words.length + v1Result.categories.abusive.phrases.length,
              sexual: v1Result.categories.sexual.words.length + v1Result.categories.sexual.phrases.length,
              threats: v1Result.categories.threats.words.length + v1Result.categories.threats.phrases.length
            }
          } : null
        },
        consolidatedResult: {
          finalRecommendation: this.getFinalRecommendation(perspectiveResult, v1Result),
          combinedRiskLevel: this.getCombinedRiskLevel(perspectiveResult, v1Result),
          consensusIssues: this.findConsensusIssues(perspectiveResult, v1Result),
          conflictingResults: this.identifyConflicts(perspectiveResult, v1Result)
        },
        detailedBreakdown: {
          perspectiveScores: Object.entries(perspectiveResult.scores).reduce((acc, [key, value]) => {
            acc[key] = Math.round(value.score * 100);
            return acc;
          }, {}),
          customRulesMatched: includeV1Analysis ? v1Result.categories : null
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in hybrid analysis:', error);
      res.status(500).json({
        error: 'Failed to perform hybrid analysis',
        details: error.message,
        version: 'v2-hybrid',
        timestamp: new Date().toISOString()
      });
    }
  }

  async batchAnalysis(req, res) {
    try {
      const validation = validationService.validateBatchRequest(req);
      if (!validation.isValid) {
        return errorHandlingService.handleValidationError(validation, 'v2-batch', res);
      }

      const { texts, maxConcurrent = 5 } = req.body;

      const results = await batchProcessor.processBatch(texts, maxConcurrent);
      const summary = batchProcessor.generateSummary(results);

      const response = {
        version: 'v2-batch',
        timestamp: new Date().toISOString(),
        batch: {
          totalTexts: texts.length,
          processed: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length
        },
        summary,
        results
      };

      res.json(response);
    } catch (error) {
      errorHandlingService.handleControllerError(error, 'v2-batch', 'perform batch analysis', res);
    }
  }

  async getAnalysisHistory(req, res) {
    res.json({
      version: 'v2',
      message: 'Analysis history feature not implemented yet',
      suggestion: 'This would typically connect to a database to track analysis history',
      timestamp: new Date().toISOString()
    });
  }
}

const controllerV2 = new ContentControllerV2();
module.exports = controllerV2;
