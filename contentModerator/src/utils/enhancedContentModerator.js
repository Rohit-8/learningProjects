const fs = require('fs');
const path = require('path');
const config = require('../config');

class EnhancedContentModerator {
  constructor() {
    this.rules = this.loadEnhancedRules();
    this.maxChunkSize = config.content.chunkSize;
    this.maxTextLength = config.content.maxTextLength;
    this.transliterationMap = this.initializeTransliteration();
    this.cache = new Map();
    this.cacheMaxSize = config.content.cacheMaxSize;
  }

  loadEnhancedRules() {
    try {
      const rulesPath = path.join(__dirname, '../data/enhanced-content-rules.json');
      return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } catch (error) {
      console.error('Error loading enhanced rules:', error);
      throw new Error('Enhanced content rules file not found or invalid');
    }
  }

  initializeTransliteration() {
    return {
      hindi: {
        'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
        'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
        'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
        'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
        'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
        'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
        'ष': 'sh', 'स': 's', 'ह': 'h',
        'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u',
        'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au'
      },
      punjabi: {
        'ਕ': 'k', 'ਖ': 'kh', 'ਗ': 'g', 'ਘ': 'gh',
        'ਚ': 'ch', 'ਛ': 'chh', 'ਜ': 'j', 'ਝ': 'jh',
        'ਟ': 't', 'ਠ': 'th', 'ਡ': 'd', 'ਢ': 'dh',
        'ਤ': 't', 'ਥ': 'th', 'ਦ': 'd', 'ਧ': 'dh', 'ਨ': 'n',
        'ਪ': 'p', 'ਫ': 'ph', 'ਬ': 'b', 'ਭ': 'bh', 'ਮ': 'm',
        'ਯ': 'y', 'ਰ': 'r', 'ਲ': 'l', 'ਵ': 'v', 'ਸ': 's', 'ਹ': 'h'
      }
    };
  }

  async analyzeContent(text, options = {}) {
    const startTime = Date.now();
    
    if (!text || typeof text !== 'string') {
      throw new Error('Valid text input is required');
    }

    if (text.length > this.maxTextLength) {
      throw new Error(`Text too large. Maximum length allowed: ${this.maxTextLength} characters`);
    }

    const cacheKey = this.generateCacheKey(text, options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const results = text.length > this.maxChunkSize ? 
      await this.analyzeInChunks(text, options) : 
      await this.analyzeSingleText(text, options);

    this.addToCache(cacheKey, results);

    results.metadata = {
      processingTime: Date.now() - startTime,
      textLength: text.length,
      chunked: text.length > this.maxChunkSize,
      languages: this.detectLanguages(text),
      timestamp: new Date().toISOString()
    };

    return results;
  }

  async analyzeInChunks(text, options) {
    const chunks = this.splitIntoChunks(text);
    const chunkResults = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = await this.analyzeSingleText(chunks[i], {
        ...options,
        chunkIndex: i,
        totalChunks: chunks.length
      });
      chunkResults.push(chunkResult);
    }

    return this.consolidateChunkResults(chunkResults, text);
  }

  async analyzeSingleText(text, options = {}) {
    const normalizedText = this.normalizeText(text);
    const languageResults = {};
    const detectedLanguages = this.detectLanguages(text);
    
    for (const lang of detectedLanguages) {
      languageResults[lang] = await this.analyzeForLanguage(normalizedText, lang, options);
    }

    const evasionDetection = this.detectEvasionAttempts(normalizedText);
    const contextAnalysis = this.performContextAnalysis(text, options);
    
    return this.combineAnalysisResults(languageResults, evasionDetection, contextAnalysis, text);
  }

  splitIntoChunks(text) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + this.maxChunkSize;
      
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastSpace, lastNewline);
        
        if (breakPoint > start + this.maxChunkSize * 0.8) {
          end = breakPoint;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end;
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  normalizeText(text) {
    let normalized = text.toLowerCase();
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    const substitutions = this.rules.patterns.substitution_chars;
    for (const [char, replacements] of Object.entries(substitutions)) {
      for (const replacement of replacements) {
        normalized = normalized.replace(new RegExp(replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), char);
      }
    }

    normalized = this.transliterate(normalized);
    return normalized;
  }

  transliterate(text) {
    let transliterated = text;
    
    for (const [devanagari, roman] of Object.entries(this.transliterationMap.hindi)) {
      transliterated = transliterated.replace(new RegExp(devanagari, 'g'), roman);
    }
    
    for (const [gurmukhi, roman] of Object.entries(this.transliterationMap.punjabi)) {
      transliterated = transliterated.replace(new RegExp(gurmukhi, 'g'), roman);
    }
    
    return transliterated;
  }

  detectLanguages(text) {
    const languages = ['english'];
    
    if (/[\u0900-\u097F]/.test(text)) languages.push('hindi');
    if (/[\u0A00-\u0A7F]/.test(text)) languages.push('punjabi');
    
    const hinglishPatterns = [
      /\b(kar|hai|hain|kya|kuch|nahi|yaar|bhai|dude|bc|mc)\b/i,
      /\b(chutiya|madarchod|behenchod|gandu|saala)\b/i
    ];
    
    if (hinglishPatterns.some(pattern => pattern.test(text))) {
      languages.push('hinglish');
    }
    
    return [...new Set(languages)];
  }

  async analyzeForLanguage(text, language, options) {
    const languageRules = this.rules[language];
    if (!languageRules) {
      return { hasIssues: false, categories: {}, confidence: 0 };
    }

    const issues = {
      abusive: this.findMatches(text, languageRules.abusive),
      sexual: this.findMatches(text, languageRules.sexual),
      threats: this.findMatches(text, languageRules.threats),
      hate_speech: this.findMatches(text, languageRules.hate_speech),
      cyberbullying: this.findMatches(text, languageRules.cyberbullying),
      drugs: this.findMatches(text, languageRules.drugs),
      violence: this.findMatches(text, languageRules.violence),
      extremism: this.findMatches(text, languageRules.extremism)
    };

    // Calculate severity and confidence
    const severity = this.calculateSeverity(issues);
    const confidence = this.calculateConfidence(issues, text);

    return {
      language,
      hasIssues: Object.values(issues).some(category => category.matches.length > 0),
      categories: issues,
      severity,
      confidence,
      recommendation: this.getRecommendation(severity, language)
    };
  }

  findMatches(text, categoryRules) {
    if (!categoryRules) return { matches: [], count: 0, severity: 'none' };
    
    const matches = [];
    
    if (categoryRules.single_words && Array.isArray(categoryRules.single_words)) {
      for (const word of categoryRules.single_words) {
        if (!word || typeof word !== 'string') continue;
        try {
          const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const wordMatches = [...text.matchAll(regex)];
          matches.push(...wordMatches.map(match => ({
            type: 'word',
            match: match[0],
            position: match.index,
            severity: this.getWordSeverity(word)
          })));
        } catch (error) {
          console.error(`Error processing word "${word}":`, error);
        }
      }
    }
    
    if (categoryRules.phrases && Array.isArray(categoryRules.phrases)) {
      for (const phrase of categoryRules.phrases) {
        if (!phrase || typeof phrase !== 'string') continue;
        try {
          const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const phraseMatches = [...text.matchAll(regex)];
          matches.push(...phraseMatches.map(match => ({
            type: 'phrase',
            match: match[0],
            position: match.index,
            severity: this.getPhraseSeverity(phrase)
          })));
        } catch (error) {
          console.error(`Error processing phrase "${phrase}":`, error);
        }
      }
    }
    
    return {
      matches: matches || [],
      count: (matches || []).length,
      severity: this.getHighestSeverity(matches || []),
      uniqueMatches: [...new Set((matches || []).map(m => m && m.match ? m.match.toLowerCase() : ''))]
    };
  }

  detectEvasionAttempts(text) {
    const evasions = this.rules.patterns.common_evasions || [];
    const detected = [];
    
    for (const evasion of evasions) {
      const regex = new RegExp(evasion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = [...text.matchAll(regex)];
      detected.push(...matches.map(match => ({
        original: match[0],
        likely_intended: this.guessIntendedWord(match[0]),
        position: match.index,
        confidence: 0.8
      })));
    }
    
    return {
      detected,
      count: detected.length,
      hasEvasion: detected.length > 0
    };
  }

  performContextAnalysis(text, options) {
    const context = {
      platform: options.platform || 'general',
      ageGroup: options.ageGroup || 'adults',
      strictMode: options.strictMode || false
    };
    
    const rules = this.rules.context_rules;
    let applicableRules = {};
    
    // Apply age-group specific rules
    if (rules.age_groups && rules.age_groups[context.ageGroup]) {
      applicableRules.ageGroup = rules.age_groups[context.ageGroup];
    }
    
    // Apply platform-specific rules
    if (rules.platforms && rules.platforms[context.platform]) {
      applicableRules.platform = rules.platforms[context.platform];
    }
    
    return {
      context,
      applicableRules,
      recommendations: this.generateContextualRecommendations(applicableRules)
    };
  }

  combineAnalysisResults(languageResults, evasionDetection, contextAnalysis, originalText) {
    // Find the most problematic language result
    const primaryResult = Object.values(languageResults).reduce((prev, current) => 
      (current.confidence > prev.confidence) ? current : prev
    );

    // Aggregate all issues
    const allIssues = Object.values(languageResults).reduce((acc, result) => {
      Object.keys(result.categories).forEach(category => {
        if (!acc[category]) acc[category] = { matches: [], count: 0 };
        acc[category].matches.push(...result.categories[category].matches);
        acc[category].count += result.categories[category].count;
      });
      return acc;
    }, {});

    // Calculate overall metrics
    const totalIssues = Object.values(allIssues).reduce((sum, cat) => sum + cat.count, 0);
    const overallSeverity = this.calculateOverallSeverity(languageResults);
    
    return {
      hasAbusiveContent: totalIssues > 0 || evasionDetection.hasEvasion,
      severity: overallSeverity,
      confidence: this.calculateOverallConfidence(languageResults, evasionDetection),
      primaryLanguage: primaryResult.language,
      languageResults,
      categories: allIssues,
      evasionDetection,
      contextAnalysis,
      summary: {
        totalIssues,
        uniqueIssues: this.countUniqueIssues(allIssues),
        riskLevel: this.assessRiskLevel(overallSeverity, totalIssues),
        recommendation: this.getFinalRecommendation(overallSeverity, contextAnalysis, evasionDetection)
      },
      textMetrics: {
        length: originalText.length,
        wordCount: originalText.split(/\s+/).length,
        sentenceCount: originalText.split(/[.!?]+/).length,
        avgWordsPerSentence: Math.round(originalText.split(/\s+/).length / originalText.split(/[.!?]+/).length)
      }
    };
  }

  // Enhanced cleaning function
  async cleanContent(text, options = {}) {
    const analysis = await this.analyzeContent(text, options);
    
    if (!analysis.hasAbusiveContent) {
      return {
        originalText: text,
        cleanedText: text,
        wasModified: false,
        changes: [],
        analysis
      };
    }

    let cleanedText = text;
    const changes = [];

    // Clean based on detected issues in all languages
    for (const [language, result] of Object.entries(analysis.languageResults)) {
      if (!result.hasIssues) continue;

      for (const [category, categoryData] of Object.entries(result.categories)) {
        for (const match of categoryData.matches) {
          const replacement = this.generateReplacement(match, options.cleaningLevel);
          cleanedText = cleanedText.replace(
            new RegExp(match.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
            replacement
          );
          
          changes.push({
            category,
            language,
            original: match.match,
            replacement,
            position: match.position,
            severity: match.severity
          });
        }
      }
    }

    // Handle evasion attempts
    for (const evasion of analysis.evasionDetection.detected) {
      const replacement = this.generateReplacement(
        { match: evasion.original, severity: 'medium' }, 
        options.cleaningLevel
      );
      cleanedText = cleanedText.replace(
        new RegExp(evasion.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        replacement
      );
      
      changes.push({
        category: 'evasion',
        original: evasion.original,
        replacement,
        likelyIntended: evasion.likely_intended
      });
    }

    return {
      originalText: text,
      cleanedText: cleanedText.trim(),
      wasModified: changes.length > 0,
      changes,
      analysis,
      cleaningLevel: options.cleaningLevel || 'moderate',
      qualityScore: this.calculateCleaningQuality(text, cleanedText, changes)
    };
  }

  generateReplacement(match, cleaningLevel = 'moderate') {
    const levels = {
      mild: () => match.match.charAt(0) + '*'.repeat(Math.max(1, match.match.length - 1)),
      moderate: () => '[censored]',
      strict: () => '[removed]',
      asterisk: () => '*'.repeat(match.match.length)
    };
    
    return (levels[cleaningLevel] || levels.moderate)();
  }

  calculateSeverity(issues) {
    const severityWeights = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
    let maxSeverity = 0;
    
    Object.values(issues).forEach(category => {
      category.matches.forEach(match => {
        const weight = severityWeights[match.severity] || 0;
        maxSeverity = Math.max(maxSeverity, weight);
      });
    });
    
    return Object.keys(severityWeights).find(key => severityWeights[key] === maxSeverity) || 'none';
  }

  calculateConfidence(issues, text) {
    const totalMatches = Object.values(issues).reduce((sum, cat) => sum + cat.count, 0);
    const textLength = text.length;
    
    const density = totalMatches / (textLength / 100);
    let confidence = Math.min(0.5 + density * 0.3, 1.0);
    
    Object.values(issues).forEach(category => {
      if (category.matches.some(match => match.type === 'phrase')) {
        confidence = Math.min(confidence + 0.2, 1.0);
      }
    });
    
    return Math.round(confidence * 100) / 100;
  }

  generateCacheKey(text, options) {
    return `${text.length}_${JSON.stringify(options)}_${text.slice(0, 50)}`;
  }

  addToCache(key, result) {
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, result);
  }

  getWordSeverity(word) {
    return 'medium';
  }

  getPhraseSeverity(phrase) {
    return 'high';
  }

  getHighestSeverity(matches) {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return 'none';
    }
    
    const severities = matches
      .filter(m => m && m.severity)
      .map(m => m.severity);
    
    const order = ['critical', 'high', 'medium', 'low', 'none'];
    return order.find(s => severities.includes(s)) || 'none';
  }

  guessIntendedWord(evasion) {
    // Simple mapping for common evasions
    const mapping = {
      'f*ck': 'fuck', 'f**k': 'fuck', 'sh!t': 'shit', 'b!tch': 'bitch'
    };
    return mapping[evasion.toLowerCase()] || 'unknown';
  }

  assessRiskLevel(severity, totalIssues) {
    if (severity === 'critical' || totalIssues > 10) return 'very_high';
    if (severity === 'high' || totalIssues > 5) return 'high';
    if (severity === 'medium' || totalIssues > 2) return 'medium';
    if (totalIssues > 0) return 'low';
    return 'minimal';
  }

  countUniqueIssues(allIssues) {
    const uniqueMatches = new Set();
    Object.values(allIssues).forEach(category => {
      category.matches.forEach(match => {
        uniqueMatches.add(match.match.toLowerCase());
      });
    });
    return uniqueMatches.size;
  }

  calculateOverallSeverity(languageResults) {
    const severities = Object.values(languageResults).map(r => r.severity);
    const order = ['critical', 'high', 'medium', 'low', 'none'];
    return order.find(s => severities.includes(s)) || 'none';
  }

  calculateOverallConfidence(languageResults, evasionDetection) {
    const confidences = Object.values(languageResults).map(r => r.confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    
    // Boost confidence if evasion detected
    const evasionBoost = evasionDetection.hasEvasion ? 0.1 : 0;
    
    return Math.min(avgConfidence + evasionBoost, 1.0);
  }

  generateContextualRecommendations(applicableRules) {
    const recommendations = [];
    
    if (applicableRules.ageGroup && applicableRules.ageGroup.strict_mode) {
      recommendations.push('Apply strict filtering due to age-sensitive audience');
    }
    
    if (applicableRules.platform && applicableRules.platform.zero_tolerance) {
      recommendations.push('Zero tolerance policy in effect for this platform');
    }
    
    return recommendations;
  }

  getRecommendation(severity, language) {
    const recommendations = {
      critical: `IMMEDIATE ACTION: Critical ${language} content detected`,
      high: `REVIEW REQUIRED: High-risk ${language} content found`,
      medium: `MODERATE: ${language} content needs attention`,
      low: `MONITOR: Minor ${language} issues detected`,
      none: `APPROVED: No ${language} issues found`
    };
    
    return recommendations[severity] || recommendations.none;
  }

  getFinalRecommendation(severity, contextAnalysis, evasionDetection) {
    let recommendation = this.getRecommendation(severity, 'overall');
    
    if (evasionDetection.hasEvasion) {
      recommendation += ' | Evasion attempts detected';
    }
    
    if (contextAnalysis.applicableRules.ageGroup && contextAnalysis.applicableRules.ageGroup.strict_mode) {
      recommendation += ' | Apply strict age-appropriate filtering';
    }
    
    return recommendation;
  }

  calculateCleaningQuality(originalText, cleanedText, changes) {
    const changeRatio = changes.length / originalText.split(' ').length;
    const preservationRatio = cleanedText.length / originalText.length;
    
    let quality = 100;
    quality -= changeRatio * 20; // Penalize many changes
    quality += preservationRatio * 10; // Reward text preservation
    
    return Math.max(0, Math.min(100, Math.round(quality)));
  }

  consolidateChunkResults(chunkResults, originalText) {
    // Combine results from all chunks
    const combined = {
      hasAbusiveContent: chunkResults.some(r => r.hasAbusiveContent),
      severity: this.getHighestSeverity(chunkResults.map(r => ({ severity: r.severity }))),
      confidence: chunkResults.reduce((sum, r) => sum + r.confidence, 0) / chunkResults.length,
      languageResults: {},
      categories: {},
      summary: {
        totalChunks: chunkResults.length,
        issuesPerChunk: chunkResults.map((r, i) => ({ chunk: i, issues: r.summary?.totalIssues || 0 }))
      }
    };

    // Merge language results
    chunkResults.forEach(result => {
      Object.keys(result.languageResults || {}).forEach(lang => {
        if (!combined.languageResults[lang]) {
          combined.languageResults[lang] = {
            hasIssues: false,
            categories: {},
            confidence: 0,
            severity: 'none'
          };
        }
        
        // Merge this chunk's results for this language
        const langResult = result.languageResults[lang];
        combined.languageResults[lang].hasIssues = combined.languageResults[lang].hasIssues || langResult.hasIssues;
        combined.languageResults[lang].confidence = Math.max(combined.languageResults[lang].confidence, langResult.confidence);
        
        // Merge categories
        Object.keys(langResult.categories || {}).forEach(category => {
          if (!combined.languageResults[lang].categories[category]) {
            combined.languageResults[lang].categories[category] = { matches: [], count: 0 };
          }
          combined.languageResults[lang].categories[category].matches.push(...langResult.categories[category].matches);
          combined.languageResults[lang].categories[category].count += langResult.categories[category].count;
        });
      });
    });

    return combined;
  }
}

module.exports = new EnhancedContentModerator();
