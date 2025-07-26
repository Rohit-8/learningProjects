class DataTransformService {
  formatEnhancedCategories(categories) {
    const formatted = {};
    
    Object.keys(categories).forEach(category => {
      const categoryData = categories[category];
      formatted[category] = {
        count: categoryData.count || 0,
        severity: categoryData.severity || 'none',
        matches: categoryData.matches || [],
        uniqueMatches: categoryData.uniqueMatches || []
      };
    });
    
    return formatted;
  }

  groupChangesByCategory(changes) {
    const grouped = {};
    
    changes.forEach(change => {
      const category = change.category || 'unknown';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(change);
    });
    
    return grouped;
  }

  groupChangesByLanguage(changes) {
    const grouped = {};
    
    changes.forEach(change => {
      const language = change.language || 'unknown';
      if (!grouped[language]) {
        grouped[language] = [];
      }
      grouped[language].push(change);
    });
    
    return grouped;
  }

  buildEnhancedAnalysisResponse(result) {
    return {
      hasAbusiveContent: result.hasAbusiveContent,
      severity: result.severity,
      confidence: result.confidence,
      primaryLanguage: result.primaryLanguage,
      detectedLanguages: Object.keys(result.languageResults),
      summary: result.summary,
      categories: this.formatEnhancedCategories(result.categories),
      evasionDetected: result.evasionDetection.hasEvasion,
      textMetrics: result.textMetrics,
      recommendations: result.summary.recommendation,
      metadata: result.metadata
    };
  }

  buildClassicAnalysisResponse(result, userMessage) {
    return {
      hasAbusiveContent: result.hasAbusiveContent,
      severity: result.severity,
      confidence: 1,
      details: {
        abusive: result.categories.abusive,
        sexual: result.categories.sexual,
        threats: result.categories.threats
      },
      message: userMessage
    };
  }

  buildEnhancedCleaningResponse(result) {
    return {
      originalText: result.originalText,
      cleanedText: result.cleanedText,
      wasModified: result.wasModified,
      cleaningLevel: result.cleaningLevel,
      qualityScore: result.qualityScore,
      changes: {
        totalChanges: result.changes.length,
        byCategory: this.groupChangesByCategory(result.changes),
        byLanguage: this.groupChangesByLanguage(result.changes),
        details: result.changes
      },
      analysis: {
        hasAbusiveContent: result.analysis.hasAbusiveContent,
        severity: result.analysis.severity,
        detectedLanguages: Object.keys(result.analysis.languageResults),
        textMetrics: result.analysis.textMetrics
      },
      recommendations: [
        'Review cleaned content for context preservation',
        'Test with target audience if needed',
        result.qualityScore > 80 ? 'High quality cleaning achieved' : 'Manual review recommended'
      ]
    };
  }

  buildClassicCleaningResponse(result) {
    return {
      originalText: result.originalText,
      cleanedText: result.cleanedText,
      wasModified: result.wasModified,
      removedWords: result.removedWords || [],
      message: result.message || 'Content cleaning completed'
    };
  }
}

module.exports = new DataTransformService();
