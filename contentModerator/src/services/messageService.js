class MessageService {
  createUserMessage(result) {
    if (!result || !result.hasAbusiveContent) {
      return "No inappropriate content found.";
    }

    const messages = [];
    const { categories } = result;

    if (categories) {
      this.addThreatMessages(categories, messages);
      this.addSexualMessages(categories, messages);
      this.addAbusiveMessages(categories, messages);
      this.addHateSpeechMessages(categories, messages);
    }

    return messages.length > 0 ? messages.join(' ') : "Potentially inappropriate content detected.";
  }

  addThreatMessages(categories, messages) {
    if (categories.threats && this.hasValidMatches(categories.threats.matches)) {
      const matches = this.extractMatches(categories.threats.matches);
      if (matches.length > 0) {
        messages.push(`Found threatening content: "${matches.join('", "')}"`);
      }
    }
  }

  addSexualMessages(categories, messages) {
    if (categories.sexual && this.hasValidMatches(categories.sexual.matches)) {
      const matches = this.extractMatches(categories.sexual.matches);
      if (matches.length > 0) {
        messages.push(`Found inappropriate content: "${matches.join('", "')}"`);
      }
    }
  }

  addAbusiveMessages(categories, messages) {
    if (categories.abusive && this.hasValidMatches(categories.abusive.matches)) {
      const matches = this.extractMatches(categories.abusive.matches);
      if (matches.length > 0) {
        messages.push(`Found abusive content: "${matches.join('", "')}"`);
      }
    }
  }

  addHateSpeechMessages(categories, messages) {
    if (categories.hate_speech && this.hasValidMatches(categories.hate_speech.matches)) {
      const matches = this.extractMatches(categories.hate_speech.matches);
      if (matches.length > 0) {
        messages.push(`Found hate speech: "${matches.join('", "')}"`);
      }
    }
  }

  hasValidMatches(matches) {
    return matches && Array.isArray(matches) && matches.length > 0;
  }

  extractMatches(matches) {
    return matches
      .filter(m => m && m.match)
      .map(m => m.match);
  }
}

module.exports = new MessageService();
