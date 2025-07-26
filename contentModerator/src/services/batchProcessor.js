const perspectiveService = require('../services/perspectiveService');

class BatchProcessor {
  async processBatch(texts, maxConcurrent = 5) {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new Error('Array of texts is required');
    }

    if (texts.length > 50) {
      throw new Error('Maximum 50 texts allowed per batch');
    }

    const results = [];
    const batchSize = Math.min(maxConcurrent, texts.length);
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map((text, index) => 
        this.processSingleText(text, i + index)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  async processSingleText(text, index) {
    try {
      const analysis = await perspectiveService.analyzeComment(text);
      return {
        index,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        status: 'success',
        hasIssues: analysis.summary.hasAbusiveContent,
        riskLevel: analysis.summary.overallRisk,
        topIssue: analysis.summary.highestRiskCategory,
        score: Math.round(analysis.summary.highestRiskScore * 100)
      };
    } catch (error) {
      return {
        index,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        status: 'error',
        error: error.message
      };
    }
  }

  generateSummary(results) {
    const successful = results.filter(r => r.status === 'success');
    const withIssues = successful.filter(r => r.hasIssues);
    
    const riskDistribution = successful.reduce((acc, result) => {
      acc[result.riskLevel] = (acc[result.riskLevel] || 0) + 1;
      return acc;
    }, {});

    return {
      overallStatus: withIssues.length === 0 ? 'clean' : withIssues.length < successful.length ? 'mixed' : 'problematic',
      issueRate: successful.length > 0 ? Math.round((withIssues.length / successful.length) * 100) : 0,
      riskDistribution,
      mostCommonIssue: this.getMostCommonIssue(successful),
      averageScore: successful.length > 0 ? Math.round(successful.reduce((sum, r) => sum + (r.score || 0), 0) / successful.length) : 0
    };
  }

  getMostCommonIssue(results) {
    const issues = results.filter(r => r.topIssue).map(r => r.topIssue);
    const issueCount = issues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(issueCount).length > 0 ? 
      Object.entries(issueCount).sort(([,a], [,b]) => b - a)[0][0] : 
      'none';
  }
}

module.exports = new BatchProcessor();
