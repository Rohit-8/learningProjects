class ResponseBuilder {
  buildAnalysisResponse(perspectiveResult, multilingualResult, options = {}) {
    const { 
      text, 
      includeRecommendations = true, 
      useMultilingual = true 
    } = options;

    return {
      version: 'v2',
      analysisProvider: useMultilingual ? 'Hybrid (Google Perspective + Multilingual)' : 'Google Perspective API',
      timestamp: new Date().toISOString(),
      input: this.buildInputSummary(text),
      perspectiveAnalysis: this.buildPerspectiveSection(perspectiveResult),
      multilingualAnalysis: multilingualResult ? this.buildMultilingualSection(multilingualResult) : null,
      consolidatedResult: this.buildConsolidatedSection(perspectiveResult, multilingualResult),
      recommendations: includeRecommendations ? this.generateRecommendations(perspectiveResult, multilingualResult) : undefined,
      metadata: this.buildMetadata(text, useMultilingual)
    };
  }

  buildInputSummary(text) {
    return {
      text: text.length > 200 ? text.substring(0, 200) + '...' : text,
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    };
  }

  buildPerspectiveSection(perspectiveResult) {
    return {
      hasAbusiveContent: perspectiveResult.summary.hasAbusiveContent,
      overallRisk: perspectiveResult.summary.overallRisk,
      highestRiskCategory: perspectiveResult.summary.highestRiskCategory,
      highestRiskScore: Math.round(perspectiveResult.summary.highestRiskScore * 100),
      detectedIssues: perspectiveResult.detectedIssues.map(issue => ({
        category: issue.category,
        score: Math.round(issue.score * 100),
        severity: issue.severity,
        description: issue.description
      })),
      scores: this.buildScoresSection(perspectiveResult.scores)
    };
  }

  buildScoresSection(scores) {
    return Object.entries(scores).reduce((acc, [key, value]) => {
      acc[key] = {
        score: Math.round(value.score * 100),
        threshold: Math.round(value.threshold * 100),
        isProblematic: value.isProblematic,
        status: value.isProblematic ? 'VIOLATION' : 'SAFE'
      };
      return acc;
    }, {});
  }

  buildMultilingualSection(multilingualResult) {
    return {
      hasAbusiveContent: multilingualResult.hasAbusiveContent,
      severity: multilingualResult.severity,
      confidence: multilingualResult.confidence,
      primaryLanguage: multilingualResult.primaryLanguage,
      detectedLanguages: Object.keys(multilingualResult.languageResults),
      evasionDetected: multilingualResult.evasionDetection.hasEvasion,
      summary: multilingualResult.summary,
      categories: this.buildCategoriesSection(multilingualResult.categories)
    };
  }

  buildCategoriesSection(categories) {
    return Object.keys(categories).reduce((acc, category) => {
      const cat = categories[category];
      acc[category] = {
        count: cat.count || 0,
        matches: cat.uniqueMatches || []
      };
      return acc;
    }, {});
  }

  buildConsolidatedSection(perspectiveResult, multilingualResult) {
    const analysisService = require('./analysisService');
    
    return {
      hasIssues: analysisService.smartConsolidatedDetection(perspectiveResult, multilingualResult),
      overallRisk: analysisService.calculateConsolidatedRisk(perspectiveResult, multilingualResult),
      confidence: this.calculateConsolidatedConfidence(perspectiveResult, multilingualResult),
      primaryConcerns: analysisService.identifyPrimaryConcerns(perspectiveResult, multilingualResult),
      actionRequired: this.determineActionRequired(
        analysisService.calculateConsolidatedRisk(perspectiveResult, multilingualResult), 
        multilingualResult
      )
    };
  }

  buildMetadata(text, useMultilingual) {
    return {
      processingTime: 0,
      apiVersion: 'v2.0-enhanced',
      analysisTypes: useMultilingual ? ['perspective', 'multilingual'] : ['perspective'],
      textComplexity: this.assessTextComplexity(text)
    };
  }

  generateRecommendations(perspectiveResult, multilingualResult) {
    const recommendations = [...(perspectiveResult.recommendations || [])];
    
    if (multilingualResult) {
      if (multilingualResult.evasionDetection.hasEvasion) {
        recommendations.push('Evasion attempts detected - implement stricter pattern matching');
      }
      
      if (Object.keys(multilingualResult.languageResults).length > 1) {
        recommendations.push('Multiple languages detected - consider language-specific moderation rules');
      }
    }
    
    return recommendations;
  }

  calculateConsolidatedConfidence(perspectiveResult, multilingualResult) {
    let confidence = this.calculateConfidence(perspectiveResult.summary.highestRiskScore);
    
    if (multilingualResult) {
      const multilingualConfidence = multilingualResult.confidence;
      confidence = (confidence + multilingualConfidence) / 2;
      
      if (perspectiveResult.summary.hasAbusiveContent === multilingualResult.hasAbusiveContent) {
        confidence = Math.min(confidence + 0.15, 1.0);
      }
    }
    
    return confidence;
  }

  calculateConfidence(highestScore) {
    if (highestScore >= 0.8) return 'high';
    if (highestScore >= 0.6) return 'medium';
    if (highestScore >= 0.3) return 'low';
    return 'very-low';
  }

  determineActionRequired(riskLevel, multilingualResult = null) {
    const baseActions = {
      'minimal': 'APPROVE - Content is safe for publication',
      'low': 'REVIEW - Minor concerns, consider editorial review',
      'medium': 'MODERATE - Requires moderation before publication',
      'high': 'REJECT - Content violates guidelines, should not be published',
      'critical': 'IMMEDIATE_ACTION - Critical violation detected, escalate immediately'
    };
    
    let action = baseActions[riskLevel] || 'REVIEW - Unknown risk level';
    
    if (multilingualResult) {
      if (multilingualResult.evasionDetection.hasEvasion) {
        action += ' | Evasion detected - apply strict filtering';
      }
      
      if (multilingualResult.summary.riskLevel === 'very_high') {
        action = action.replace('APPROVE', 'REVIEW').replace('REVIEW', 'MODERATE');
      }
    }
    
    return action;
  }

  assessTextComplexity(text) {
    const metrics = {
      length: text.length,
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      avgWordsPerSentence: text.split(/\s+/).length / Math.max(1, text.split(/[.!?]+/).filter(s => s.trim().length > 0).length)
    };
    
    if (metrics.length > 5000 || metrics.avgWordsPerSentence > 25) {
      return 'complex';
    } else if (metrics.length > 1000 || metrics.avgWordsPerSentence > 15) {
      return 'moderate';
    }
    
    return 'simple';
  }
}

module.exports = new ResponseBuilder();
