class TextOptimizer {
    static extractRelevantContent(scrapedData, maxTokens = 2000) {
        // Filter and rank content by relevance
        const relevantContent = scrapedData
            .filter(item => item.content && item.content.length > 30)
            .map(item => ({
                ...item,
                score: this.calculateRelevanceScore(item)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10 most relevant

        // Concatenate until we hit token limit
        let totalTokens = 0;
        const selectedContent = [];
        
        for (const item of relevantContent) {
            const tokenCount = this.estimateTokens(item.content);
            if (totalTokens + tokenCount > maxTokens) break;
            
            totalTokens += tokenCount;
            selectedContent.push(item);
        }

        return selectedContent;
    }

    static calculateRelevanceScore(item) {
        let score = 0;
        
        // Higher score for more upvotes/comments
        score += Math.log(item.score || 1) * 2;
        score += Math.log(item.comments || 1);
        
        // Boost for technical terms
        const techTerms = ['impedance', 'watts', 'ohm', 'sensitivity', 'frequency', 'hz', 'db', 'amp', 'power'];
        const content = item.content.toLowerCase();
        techTerms.forEach(term => {
            if (content.includes(term)) score += 5;
        });
        
        // Boost for comparison words
        const comparisonWords = ['vs', 'versus', 'compare', 'better', 'worse', 'pairing', 'match'];
        comparisonWords.forEach(word => {
            if (content.includes(word)) score += 3;
        });
        
        // Penalty for very long or very short content
        if (item.content.length < 100) score -= 5;
        if (item.content.length > 2000) score -= 2;
        
        return score;
    }

    static estimateTokens(text) {
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    static createOptimizedPrompt(productName, contentSummary) {
        // Much shorter, focused prompts
        return `Analyze "${productName}" from this data:
${contentSummary}

Return JSON:
{
  "specs": {"impedance": "X ohms", "sensitivity": "X dB", "power": "X watts"},
  "sound": {"signature": "warm/neutral/bright", "bass": "description", "treble": "description"},
  "pros": ["key strength 1", "key strength 2"],
  "cons": ["limitation 1", "limitation 2"]
}`;
    }

    static createPairingPrompt(speaker, amp, prefs) {
        return `Rate pairing: ${speaker.productName} + ${amp.productName}

Speaker: ${JSON.stringify(speaker.specs || {})}
Amp: ${JSON.stringify(amp.specs || {})}
User wants: ${prefs.soundSignature || 'balanced'} sound

JSON response:
{
  "score": 85,
  "summary": "brief assessment",
  "match": {"impedance": "good/fair/poor", "power": "good/fair/poor"},
  "sound": "expected sound signature",
  "pros": ["strength 1", "strength 2"],
  "cons": ["weakness 1"] 
}`;
    }
}

module.exports = TextOptimizer;