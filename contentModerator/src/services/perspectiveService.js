const axios = require('axios');
const config = require('../config');

class PerspectiveService {
  constructor() {
    this.apiKey = config.perspectiveApiKey;
    this.baseURL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
    
    // Perspective API attributes for analysis
    this.attributes = {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
      SEXUALLY_EXPLICIT: {},
      FLIRTATION: {},
      ATTACK_ON_AUTHOR: {},
      ATTACK_ON_COMMENTER: {},
      INCOHERENT: {},
      INFLAMMATORY: {},
      LIKELY_TO_REJECT: {},
      OBSCENE: {},
      SPAM: {},
      UNSUBSTANTIAL: {}
    };
  }

  async analyzeComment(text, requestedAttributes = null) {
    if (!this.apiKey) {
      throw new Error('Perspective API key not configured');
    }

    // Use provided attributes or default ones
    const analyzeAttributes = requestedAttributes || this.attributes;

    const analyzeRequest = {
      comment: { text },
      requestedAttributes: analyzeAttributes,
      languages: ['en'],
      doNotStore: true
    };

    try {
      const response = await axios.post(`${this.baseURL}?key=${this.apiKey}`, analyzeRequest, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return this.processAnalysisResponse(response.data);
    } catch (error) {
      console.error('Perspective API error:', error.response?.data || error.message);
      throw new Error(`Perspective API analysis failed: ${error.message}`);
    }
  }

  processAnalysisResponse(data) {
    const results = {
      scores: {},
      summary: {
        hasAbusiveContent: false,
        overallRisk: 'low',
        highestRiskCategory: null,
        highestRiskScore: 0
      },
      detectedIssues: [],
      recommendations: []
    };

    // Process attribute scores
    for (const [attribute, attributeData] of Object.entries(data.attributeScores || {})) {
      const score = attributeData.summaryScore.value;
      results.scores[attribute] = {
        score: score,
        threshold: this.getThresholdForAttribute(attribute),
        isProblematic: score > this.getThresholdForAttribute(attribute)
      };

      // Track highest risk
      if (score > results.summary.highestRiskScore) {
        results.summary.highestRiskScore = score;
        results.summary.highestRiskCategory = attribute;
      }

      // Check if content is problematic
      if (score > this.getThresholdForAttribute(attribute)) {
        results.summary.hasAbusiveContent = true;
        results.detectedIssues.push({
          category: attribute,
          score: score,
          severity: this.getSeverityLevel(score),
          description: this.getAttributeDescription(attribute)
        });
      }
    }

    // Determine overall risk level based on actual violations, not raw scores
    results.summary.overallRisk = this.determineOverallRisk(results.summary.hasAbusiveContent, results.detectedIssues);
    
    // Generate recommendations
    results.recommendations = this.generateRecommendations(results.detectedIssues);

    return results;
  }

  getThresholdForAttribute(attribute) {
    // Different thresholds for different attributes
    const thresholds = {
      TOXICITY: 0.7,
      SEVERE_TOXICITY: 0.5,
      IDENTITY_ATTACK: 0.6,
      INSULT: 0.7,
      PROFANITY: 0.8,
      THREAT: 0.5,
      SEXUALLY_EXPLICIT: 0.7,
      FLIRTATION: 0.8,
      ATTACK_ON_AUTHOR: 0.6,
      ATTACK_ON_COMMENTER: 0.6,
      INCOHERENT: 0.8,
      INFLAMMATORY: 0.7,
      LIKELY_TO_REJECT: 0.7, // Reverted to default threshold
      OBSCENE: 0.7,
      SPAM: 0.8,
      UNSUBSTANTIAL: 0.8
    };
    return thresholds[attribute] || 0.7;
  }

  getSeverityLevel(score) {
    if (score >= 0.9) return 'critical';
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    if (score >= 0.4) return 'low';
    return 'minimal';
  }

  determineOverallRisk(hasAbusiveContent, detectedIssues) {
    // If no actual violations detected (after threshold filtering), it's minimal risk
    if (!hasAbusiveContent || detectedIssues.length === 0) {
      return 'minimal';
    }
    
    // Determine risk based on the severity of detected issues
    const hasCritical = detectedIssues.some(issue => issue.severity === 'critical');
    const hasHigh = detectedIssues.some(issue => issue.severity === 'high');
    const hasMedium = detectedIssues.some(issue => issue.severity === 'medium');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  getAttributeDescription(attribute) {
    const descriptions = {
      TOXICITY: 'General toxic behavior',
      SEVERE_TOXICITY: 'Very hateful, aggressive, or disrespectful content',
      IDENTITY_ATTACK: 'Attacks based on identity or demographics',
      INSULT: 'Insulting, inflammatory, or negative content',
      PROFANITY: 'Swear words, curse words, or other obscene language',
      THREAT: 'Describes an intention to inflict pain, injury, or violence',
      SEXUALLY_EXPLICIT: 'Contains sexually explicit content',
      FLIRTATION: 'Pickup lines, complimenting appearance, or sexual advances',
      ATTACK_ON_AUTHOR: 'Attack on the author of an article or post',
      ATTACK_ON_COMMENTER: 'Attack on fellow commenter',
      INCOHERENT: 'Difficult to understand, nonsensical',
      INFLAMMATORY: 'Intending to provoke or inflame',
      LIKELY_TO_REJECT: 'Overall measure of comment quality',
      OBSCENE: 'Obscene or vulgar language',
      SPAM: 'Irrelevant or unsolicited content',
      UNSUBSTANTIAL: 'Lacking substance or meaning'
    };
    return descriptions[attribute] || 'Content analysis category';
  }

  generateRecommendations(detectedIssues) {
    const recommendations = [];
    
    if (detectedIssues.length === 0) {
      recommendations.push('Content appears to be appropriate for publication.');
      return recommendations;
    }

    // Group by severity
    const critical = detectedIssues.filter(issue => issue.severity === 'critical');
    const high = detectedIssues.filter(issue => issue.severity === 'high');
    const medium = detectedIssues.filter(issue => issue.severity === 'medium');

    if (critical.length > 0) {
      recommendations.push('❌ CRITICAL: Content should be rejected - contains severe violations.');
      critical.forEach(issue => {
        recommendations.push(`  • Remove ${issue.category.toLowerCase()} content (severity: ${issue.severity})`);
      });
    }

    if (high.length > 0) {
      recommendations.push('⚠️ HIGH RISK: Significant content issues detected.');
      high.forEach(issue => {
        recommendations.push(`  • Address ${issue.category.toLowerCase()} concerns`);
      });
    }

    if (medium.length > 0) {
      recommendations.push('📝 MODERATE: Consider revising the following areas:');
      medium.forEach(issue => {
        recommendations.push(`  • Review ${issue.category.toLowerCase()} content`);
      });
    }

    // General recommendations
    recommendations.push('💡 General suggestions:');
    recommendations.push('  • Use more respectful language');
    recommendations.push('  • Focus on constructive communication');
    recommendations.push('  • Consider your audience and context');

    return recommendations;
  }

  async getSuggestedCleanText(text, detectedIssues) {
    // This is a simple implementation - you could integrate with OpenAI or other services
    // for more sophisticated text cleaning
    let cleanedText = text;
    
    // Basic cleaning based on detected issues
    detectedIssues.forEach(issue => {
      switch (issue.category) {
        case 'PROFANITY':
        case 'OBSCENE':
          cleanedText = this.replaceProfanity(cleanedText);
          break;
        case 'THREAT':
          cleanedText = this.softenThreats(cleanedText);
          break;
        case 'INSULT':
          cleanedText = this.removeInsults(cleanedText);
          break;
        case 'TOXICITY':
        case 'SEVERE_TOXICITY':
          cleanedText = this.reduceToxicity(cleanedText);
          break;
      }
    });

    return {
      originalText: text,
      suggestedText: cleanedText,
      changesApplied: cleanedText !== text,
      cleaningNote: cleanedText !== text ? 
        'Text has been automatically cleaned. Please review the suggestions.' :
        'No automatic cleaning suggestions available. Manual review recommended.'
    };
  }

  replaceProfanity(text) {
    // Simple profanity replacement - in production, use a comprehensive list
    const profanityWords = ['damn', 'hell', 'crap', 'shit', 'fuck', 'ass', 'bitch'];
    let cleanedText = text;
    
    profanityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
    });
    
    return cleanedText;
  }

  softenThreats(text) {
    // Replace threatening language with milder alternatives
    return text
      .replace(/\bkill\b/gi, 'stop')
      .replace(/\bdestroy\b/gi, 'change')
      .replace(/\battack\b/gi, 'address')
      .replace(/\bhurt\b/gi, 'concern');
  }

  removeInsults(text) {
    // Remove common insults - this is a basic implementation
    const insults = ['stupid', 'idiot', 'moron', 'dumb', 'loser'];
    let cleanedText = text;
    
    insults.forEach(insult => {
      const regex = new RegExp(`\\b${insult}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, '[removed]');
    });
    
    return cleanedText;
  }

  reduceToxicity(text) {
    // Basic toxic language reduction
    return text
      .replace(/YOU ARE\s+/gi, 'You seem ')
      .replace(/\bHATE\b/gi, 'dislike')
      .replace(/\bTERRIBLE\b/gi, 'not great')
      .replace(/\bAWFUL\b/gi, 'not ideal');
  }
}

module.exports = new PerspectiveService();
