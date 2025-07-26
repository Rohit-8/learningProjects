const perspectiveService = require('./perspectiveService');
const enhancedContentModerator = require('../utils/enhancedContentModerator');

class AnalysisService {
  async performHybridAnalysis(text, options = {}) {
    const { 
      attributes, 
      useMultilingual = true,
      platform,
      ageGroup,
      strictMode
    } = options;

    const analysisPromises = [
      perspectiveService.analyzeComment(text, attributes)
    ];

    if (useMultilingual) {
      const mlOptions = { platform, ageGroup, strictMode };
      analysisPromises.push(enhancedContentModerator.analyzeContent(text, mlOptions));
    }

    const results = await Promise.all(analysisPromises);
    return {
      perspectiveResult: results[0],
      multilingualResult: results[1] || null
    };
  }

  smartConsolidatedDetection(perspectiveResult, multilingualResult) {
    const perspectiveHasIssues = perspectiveResult.summary.hasAbusiveContent;
    const multilingualHasIssues = multilingualResult && multilingualResult.hasAbusiveContent;
    
    if (perspectiveHasIssues && multilingualHasIssues) return true;
    if (!perspectiveHasIssues && !multilingualHasIssues) return false;
    
    if (perspectiveHasIssues && !multilingualHasIssues) {
      const onlyLikelyToReject = perspectiveResult.detectedIssues.length === 1 && 
                                perspectiveResult.detectedIssues[0].category === 'LIKELY_TO_REJECT';
      
      if (onlyLikelyToReject && multilingualResult && multilingualResult.severity === 'none') {
        return false;
      }
      return true;
    }
    
    if (!perspectiveHasIssues && multilingualHasIssues) {
      return true;
    }
    
    return perspectiveHasIssues || multilingualHasIssues;
  }

  calculateConsolidatedRisk(perspectiveResult, multilingualResult) {
    const perspectiveRisk = perspectiveResult.summary.hasAbusiveContent ? 
      perspectiveResult.summary.overallRisk : 'minimal';
    const multilingualRisk = multilingualResult ? multilingualResult.severity : 'none';
    
    const riskLevels = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'minimal': 0.5, 'none': 0 };
    const perspectiveLevel = riskLevels[perspectiveRisk] || 0;
    const multilingualLevel = riskLevels[multilingualRisk] || 0;
    
    const maxLevel = Math.max(perspectiveLevel, multilingualLevel);
    return Object.keys(riskLevels).find(key => riskLevels[key] === maxLevel) || 'minimal';
  }

  identifyPrimaryConcerns(perspectiveResult, multilingualResult) {
    const concerns = [];
    
    if (perspectiveResult.summary.hasAbusiveContent) {
      concerns.push({
        source: 'perspective',
        category: perspectiveResult.summary.highestRiskCategory,
        score: perspectiveResult.summary.highestRiskScore,
        description: `High ${perspectiveResult.summary.highestRiskCategory} detected`
      });
    }
    
    if (multilingualResult && multilingualResult.hasAbusiveContent) {
      const topCategories = Object.entries(multilingualResult.categories)
        .filter(([_, data]) => data.count > 0)
        .sort(([_, a], [__, b]) => b.count - a.count)
        .slice(0, 3);
      
      topCategories.forEach(([category, data]) => {
        concerns.push({
          source: 'multilingual',
          category: category,
          count: data.count,
          languages: multilingualResult.primaryLanguage,
          description: `${category} content in ${multilingualResult.primaryLanguage}`
        });
      });
    }
    
    return concerns;
  }
}

module.exports = new AnalysisService();
