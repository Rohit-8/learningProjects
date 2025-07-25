const contentRules = require('../data/content-rules.json');

class ContentModerator {
  constructor() {
    this.rules = contentRules;
  }

  findAbusiveContent(text) {
    // Convert text to lowercase and normalize it by replacing hyphens and underscores with spaces
    const lowercaseText = text.toLowerCase().replace(/[-_]/g, ' ');
    // Split into words, handling multiple types of separators
    const words = lowercaseText.split(/[\s,.!?;:]+/).filter(word => word.length > 0);
    const foundIssues = {
      hasAbusiveContent: false,
      foundWords: [],
      foundPhrases: [],
      categories: {
        abusive: { words: [], phrases: [] },
        sexual: { words: [], phrases: [] },
        threats: { words: [], phrases: [] }
      },
      severity: 'none',
      detailedFindings: []
    };

    // Check abusive slang
    this._checkCategory(lowercaseText, words, 'abusive_slang', foundIssues.categories.abusive, foundIssues);

    // Check sexual slang
    this._checkCategory(lowercaseText, words, 'sexual_slang', foundIssues.categories.sexual, foundIssues);

    // Check threats
    this._checkCategory(lowercaseText, words, 'threats', foundIssues.categories.threats, foundIssues);

    // Determine if any abusive content was found
    foundIssues.hasAbusiveContent = Object.values(foundIssues.categories).some(
      category => category.words.length > 0 || category.phrases.length > 0
    );

    // Determine severity
    if (foundIssues.hasAbusiveContent) {
      foundIssues.severity = this._determineSeverity(foundIssues.categories);
    }

    return foundIssues;
  }

  _checkCategory(text, words, categoryName, resultCategory, foundIssues) {
    const category = this.rules[categoryName];
    if (!category) return;

    // Check single words and variations
    if (category.single_words) {
      category.single_words.forEach(word => {
        const lowercaseWord = word.toLowerCase();
        // First check for exact word matches
        if (words.includes(lowercaseWord)) {
          resultCategory.words.push(word);
          foundIssues.foundWords.push(word);
          foundIssues.detailedFindings.push({
            type: 'word',
            category: categoryName,
            content: word
          });
        }
        // Then check for words that might be part of compound words or have variations
        else {
          // This regex will match:
          // 1. The word as-is
          // 2. Word with hyphen before or after
          // 3. Word as part of a compound (e.g., father-fucker, mother-fucker)
          const regex = new RegExp(
            `\\b${this._escapeRegExp(lowercaseWord)}\\b|` +
            `${this._escapeRegExp(lowercaseWord)}[-_]|` +
            `[-_]${this._escapeRegExp(lowercaseWord)}\\b|` +
            `\\w+[-_]${this._escapeRegExp(lowercaseWord)}\\b|` +
            `\\b${this._escapeRegExp(lowercaseWord)}[-_]\\w+`,
            'i'
          );
          if (regex.test(text)) {
            resultCategory.words.push(word);
            foundIssues.foundWords.push(word);
            foundIssues.detailedFindings.push({
              type: 'word',
              category: categoryName,
              content: word
            });
          }
        }
      });
    }

    // Check phrases
    if (category.phrases) {
      category.phrases.forEach(phrase => {
        const lowercasePhrase = phrase.toLowerCase();
        if (text.includes(lowercasePhrase)) {
          resultCategory.phrases.push(phrase);
          foundIssues.foundPhrases.push(phrase);
          foundIssues.detailedFindings.push({
            type: 'phrase',
            category: categoryName,
            content: phrase
          });
        }
      });
    }
  }

  _determineSeverity(categories) {
    const { threats, sexual, abusive } = categories;

    // Check for threats first (highest severity)
    if ((threats?.words?.length || 0) > 0 || (threats?.phrases?.length || 0) > 0) {
      return 'high';
    }

    // Check for sexual content next
    if ((sexual?.words?.length || 0) > 0 || (sexual?.phrases?.length || 0) > 0) {
      return 'high';
    }

    // Check for abusive content
    if ((abusive?.words?.length || 0) > 0 || (abusive?.phrases?.length || 0) > 0) {
      return 'medium';
    }

    return 'low';
  }

  cleanContent(text) {
    let cleanedText = text;
    const issues = this.findAbusiveContent(text);
    const modifications = [];

    Object.entries(issues.categories).forEach(([categoryName, category]) => {
      // Replace words
      category.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const replacement = this._getReplacementWord(word) || '*'.repeat(word.length);
        cleanedText = cleanedText.replace(regex, replacement);
        modifications.push(`Replaced ${categoryName} word: "${word}"`);
      });

      // Replace phrases
      category.phrases.forEach(phrase => {
        const regex = new RegExp(this._escapeRegExp(phrase), 'gi');
        cleanedText = cleanedText.replace(regex, '*'.repeat(phrase.length));
        modifications.push(`Replaced ${categoryName} phrase: "${phrase}"`);
      });
    });

    return {
      originalText: text,
      cleanedText,
      modifications,
      severity: issues.severity
    };
  }

  _getReplacementWord(word) {
    const suggestions = this.rules.replacement_suggestions;
    for (const category in suggestions) {
      if (suggestions[category][word.toLowerCase()]) {
        const replacements = suggestions[category][word.toLowerCase()];
        return replacements[Math.floor(Math.random() * replacements.length)];
      }
    }
    return null;
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new ContentModerator();
